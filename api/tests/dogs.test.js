const request = require('supertest');
const { app, resetStore, createWalkerToken, createOwnerToken, seedOwner, seedDog } = require('./helpers');
const { store } = require('../src/store');

beforeEach(() => resetStore());

describe('Dog routes', () => {
  describe('GET /v1/owners/:ownerId/dogs', () => {
    it('returns dogs for owner', async () => {
      const { token } = await createWalkerToken();
      const owner = seedOwner();
      seedDog(owner.id, { name: 'Rex' });
      seedDog(owner.id, { name: 'Fido' });
      const res = await request(app)
        .get(`/v1/owners/${owner.id}/dogs`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination.total).toBe(2);
    });

    it('returns 404 if owner not found', async () => {
      const { token } = await createWalkerToken();
      const res = await request(app)
        .get('/v1/owners/00000000-0000-0000-0000-000000000000/dogs')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });

    it('owner can only access their own dogs', async () => {
      const { token, user } = await createOwnerToken();
      const otherOwner = seedOwner();
      seedDog(otherOwner.id, { name: 'Rex' });
      const res = await request(app)
        .get(`/v1/owners/${otherOwner.id}/dogs`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });
  });

  describe('POST /v1/owners/:ownerId/dogs', () => {
    it('creates a dog', async () => {
      const { token } = await createWalkerToken();
      const owner = seedOwner();
      const res = await request(app)
        .post(`/v1/owners/${owner.id}/dogs`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Buddy', breed: 'Labrador', dateOfBirth: '2022-01-01' });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.ownerId).toBe(owner.id);
      expect(res.body.name).toBe('Buddy');
    });

    it('creates a dog with optional fields', async () => {
      const { token } = await createWalkerToken();
      const owner = seedOwner();
      const res = await request(app)
        .post(`/v1/owners/${owner.id}/dogs`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Daisy', breed: 'Poodle', dateOfBirth: '2021-06-15',
          sex: 'female', colour: 'white', microchipNumber: '123456789012345',
        });
      expect(res.status).toBe(201);
      expect(res.body.sex).toBe('female');
      expect(res.body.colour).toBe('white');
    });
  });

  describe('GET /v1/owners/:ownerId/dogs/:dogId', () => {
    it('returns a specific dog', async () => {
      const { token } = await createWalkerToken();
      const owner = seedOwner();
      const dog = seedDog(owner.id, { name: 'Charlie' });
      const res = await request(app)
        .get(`/v1/owners/${owner.id}/dogs/${dog.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(dog.id);
      expect(res.body.name).toBe('Charlie');
    });

    it('returns 404 for dog belonging to another owner', async () => {
      const { token } = await createWalkerToken();
      const owner1 = seedOwner();
      const owner2 = seedOwner();
      const dog = seedDog(owner2.id);
      const res = await request(app)
        .get(`/v1/owners/${owner1.id}/dogs/${dog.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /v1/owners/:ownerId/dogs/:dogId', () => {
    it('updates a dog', async () => {
      const { token } = await createWalkerToken();
      const owner = seedOwner();
      const dog = seedDog(owner.id, { name: 'Old' });
      const res = await request(app)
        .put(`/v1/owners/${owner.id}/dogs/${dog.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New', breed: dog.breed, dateOfBirth: dog.dateOfBirth });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('New');
    });
  });

  describe('DELETE /v1/owners/:ownerId/dogs/:dogId', () => {
    it('deletes a dog', async () => {
      const { token } = await createWalkerToken();
      const owner = seedOwner();
      const dog = seedDog(owner.id);
      const res = await request(app)
        .delete(`/v1/owners/${owner.id}/dogs/${dog.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(204);
    });
  });
});

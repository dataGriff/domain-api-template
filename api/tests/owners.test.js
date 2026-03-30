const request = require('supertest');
const { app, resetStore, createWalkerToken, createOwnerToken, seedOwner } = require('./helpers');
const { store } = require('../src/store');

beforeEach(() => resetStore());

describe('Owner routes', () => {
  describe('GET /v1/owners', () => {
    it('requires walker role', async () => {
      const { token } = await createOwnerToken();
      const res = await request(app).get('/v1/owners').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it('returns owner list for walker', async () => {
      const { token } = await createWalkerToken();
      seedOwner({ firstName: 'Alice' });
      seedOwner({ firstName: 'Bob' });
      const res = await request(app).get('/v1/owners').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination.total).toBe(2);
    });

    it('paginates results', async () => {
      const { token } = await createWalkerToken();
      for (let i = 0; i < 5; i++) seedOwner();
      const res = await request(app)
        .get('/v1/owners?pageSize=2&page=1')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination.pageSize).toBe(2);
      expect(res.body.pagination.total).toBe(5);
    });
  });

  describe('POST /v1/owners', () => {
    it('creates an owner', async () => {
      const { token } = await createWalkerToken();
      const res = await request(app).post('/v1/owners').set('Authorization', `Bearer ${token}`)
        .send({ firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '01234' });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.firstName).toBe('John');
      expect(res.body).not.toHaveProperty('password');
    });

    it('creates an owner with optional address', async () => {
      const { token } = await createWalkerToken();
      const res = await request(app).post('/v1/owners').set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', phone: '01234',
          address: { line1: '1 Main St', city: 'Cardiff', postcode: 'CF1 1AA', country: 'GB' },
        });
      expect(res.status).toBe(201);
      expect(res.body.address).toBeDefined();
    });
  });

  describe('GET /v1/owners/:ownerId', () => {
    it('walker can get any owner', async () => {
      const { token } = await createWalkerToken();
      const owner = seedOwner();
      const res = await request(app)
        .get(`/v1/owners/${owner.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(owner.id);
    });

    it('returns 404 for non-existent owner', async () => {
      const { token } = await createWalkerToken();
      const res = await request(app).get('/v1/owners/00000000-0000-0000-0000-000000000000').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });

    it('owner can only access their own profile', async () => {
      const { token, user } = await createOwnerToken();
      const otherOwner = seedOwner();
      // user's owner profile was created by register
      const userOwner = [...store.owners.values()].find(o => o.userId === user.id);
      // access own profile - OK
      const res1 = await request(app)
        .get(`/v1/owners/${userOwner.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res1.status).toBe(200);
      // access other owner - 403
      const res2 = await request(app)
        .get(`/v1/owners/${otherOwner.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res2.status).toBe(403);
    });
  });

  describe('PUT /v1/owners/:ownerId', () => {
    it('updates owner', async () => {
      const { token } = await createWalkerToken();
      const owner = seedOwner({ firstName: 'Old' });
      const res = await request(app)
        .put(`/v1/owners/${owner.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ firstName: 'New', lastName: owner.lastName, email: owner.email, phone: owner.phone });
      expect(res.status).toBe(200);
      expect(res.body.firstName).toBe('New');
    });
  });

  describe('DELETE /v1/owners/:ownerId', () => {
    it('deletes owner', async () => {
      const { token } = await createWalkerToken();
      const owner = seedOwner();
      const res = await request(app)
        .delete(`/v1/owners/${owner.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(204);
    });

    it('returns 404 when deleting non-existent owner', async () => {
      const { token } = await createWalkerToken();
      const res = await request(app)
        .delete('/v1/owners/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });
});

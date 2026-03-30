const request = require('supertest');
const { app, resetStore, createWalkerToken, createOwnerToken, seedWalker } = require('./helpers');

beforeEach(() => resetStore());

describe('Walker routes', () => {
  describe('GET /v1/walkers', () => {
    it('returns walker list for authenticated users', async () => {
      const { token } = await createWalkerToken();
      seedWalker({ firstName: 'Alice' });
      const res = await request(app).get('/v1/walkers').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
    });

    it('returns 401 without token', async () => {
      const res = await request(app).get('/v1/walkers');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /v1/walkers', () => {
    it('creates a walker', async () => {
      const { token } = await createWalkerToken();
      const res = await request(app).post('/v1/walkers').set('Authorization', `Bearer ${token}`)
        .send({ firstName: 'Jane', lastName: 'Smith', email: 'jsmith@example.com', phone: '01234' });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.firstName).toBe('Jane');
    });

    it('creates a walker with walkRates', async () => {
      const { token } = await createWalkerToken();
      const walkRates = [
        { walkType: 'solo_walk', numberOfDogs: 1, durationMinutes: 60, ratePerHour: 15.0 },
      ];
      const res = await request(app).post('/v1/walkers').set('Authorization', `Bearer ${token}`)
        .send({ firstName: 'Jane', lastName: 'Smith', email: 'jsmith2@example.com', phone: '01234', walkRates });
      expect(res.status).toBe(201);
      expect(res.body.walkRates).toHaveLength(1);
    });
  });

  describe('GET /v1/walkers/:walkerId', () => {
    it('returns walker details', async () => {
      const { token } = await createWalkerToken();
      const walker = seedWalker();
      const res = await request(app)
        .get(`/v1/walkers/${walker.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(walker.id);
    });

    it('returns 404 for non-existent walker', async () => {
      const { token } = await createWalkerToken();
      const res = await request(app)
        .get('/v1/walkers/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /v1/walkers/:walkerId', () => {
    it('walker can update their profile', async () => {
      const { token } = await createWalkerToken();
      const walker = seedWalker({ firstName: 'Old' });
      const res = await request(app)
        .put(`/v1/walkers/${walker.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ firstName: 'New', lastName: walker.lastName, email: walker.email, phone: walker.phone });
      expect(res.status).toBe(200);
      expect(res.body.firstName).toBe('New');
    });

    it('owner cannot update walker profile', async () => {
      const { token } = await createOwnerToken();
      const walker = seedWalker();
      const res = await request(app)
        .put(`/v1/walkers/${walker.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ firstName: 'Hacked', lastName: walker.lastName, email: walker.email, phone: walker.phone });
      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /v1/walkers/:walkerId', () => {
    it('walker can delete a walker profile', async () => {
      const { token } = await createWalkerToken();
      const walker = seedWalker();
      const res = await request(app)
        .delete(`/v1/walkers/${walker.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(204);
    });

    it('owner cannot delete walker profile', async () => {
      const { token } = await createOwnerToken();
      const walker = seedWalker();
      const res = await request(app)
        .delete(`/v1/walkers/${walker.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });
  });
});

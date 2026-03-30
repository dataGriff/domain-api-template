const request = require('supertest');
const { app, resetStore, createWalkerToken, createOwnerToken } = require('./helpers');

beforeEach(() => resetStore());

describe('Interest Request routes', () => {
  describe('POST /v1/interest-requests', () => {
    const validPayload = {
      firstName: 'Sarah', lastName: 'Davies', email: 'sarah@example.com',
      phone: '+44 7700 900789', postcode: 'CF10 1AB',
      dogDescription: 'A friendly 2-year-old Golden Retriever.',
    };

    it('creates an interest request and returns public fields only', async () => {
      const res = await request(app).post('/v1/interest-requests').send(validPayload);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('createdAt');
      expect(res.body).not.toHaveProperty('firstName');
      expect(res.body).not.toHaveProperty('email');
    });

    it('returns 409 for duplicate email', async () => {
      await request(app).post('/v1/interest-requests').send(validPayload);
      const res = await request(app).post('/v1/interest-requests').send(validPayload);
      expect(res.status).toBe(409);
      expect(res.body.code).toBe('DUPLICATE_EMAIL');
    });
  });

  describe('GET /v1/interest-requests', () => {
    it('requires walker role', async () => {
      const res = await request(app).get('/v1/interest-requests');
      expect(res.status).toBe(401);
    });

    it('returns 403 for owner role', async () => {
      const { token } = await createOwnerToken();
      const res = await request(app).get('/v1/interest-requests').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it('returns paginated list for walker', async () => {
      const { token } = await createWalkerToken();
      await request(app).post('/v1/interest-requests').send({
        firstName: 'A', lastName: 'B', email: 'a@example.com',
        phone: '0123', postcode: 'CF1', dogDescription: 'Dog',
      });
      const res = await request(app).get('/v1/interest-requests').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination.total).toBe(1);
    });

    it('filters by status', async () => {
      const { token } = await createWalkerToken();
      await request(app).post('/v1/interest-requests').send({
        firstName: 'A', lastName: 'B', email: 'a@example.com',
        phone: '0123', postcode: 'CF1', dogDescription: 'Dog',
      });
      const res = await request(app)
        .get('/v1/interest-requests?status=pending')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].status).toBe('pending');
    });
  });

  describe('GET /v1/interest-requests/:id', () => {
    it('returns interest request for walker', async () => {
      const { token } = await createWalkerToken();
      const createRes = await request(app).post('/v1/interest-requests').send({
        firstName: 'A', lastName: 'B', email: 'ab@example.com',
        phone: '0123', postcode: 'CF1', dogDescription: 'Dog',
      });
      const res = await request(app)
        .get(`/v1/interest-requests/${createRes.body.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(createRes.body.id);
      expect(res.body.firstName).toBe('A');
      expect(res.body.declineReason).toBeNull();
      expect(res.body.notes).toBeNull();
      expect(res.body.ownerId).toBeNull();
    });

    it('returns 404 for non-existent ID', async () => {
      const { token } = await createWalkerToken();
      const res = await request(app)
        .get('/v1/interest-requests/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /v1/interest-requests/:id', () => {
    it('updates notes', async () => {
      const { token } = await createWalkerToken();
      const createRes = await request(app).post('/v1/interest-requests').send({
        firstName: 'A', lastName: 'B', email: 'puttest@example.com',
        phone: '0123', postcode: 'CF1', dogDescription: 'Dog',
      });
      const res = await request(app)
        .put(`/v1/interest-requests/${createRes.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ notes: 'Spoke on phone, great fit.' });
      expect(res.status).toBe(200);
      expect(res.body.notes).toBe('Spoke on phone, great fit.');
    });
  });

  describe('POST /v1/interest-requests/:id/accept', () => {
    it('accepts and creates owner profile', async () => {
      const { token } = await createWalkerToken();
      const createRes = await request(app).post('/v1/interest-requests').send({
        firstName: 'A', lastName: 'B', email: 'accept@example.com',
        phone: '0123', postcode: 'CF1', dogDescription: 'Dog',
      });
      const res = await request(app)
        .post(`/v1/interest-requests/${createRes.body.id}/accept`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('accepted');
      expect(res.body.ownerId).toBeTruthy();
    });

    it('returns 409 if already processed', async () => {
      const { token } = await createWalkerToken();
      const createRes = await request(app).post('/v1/interest-requests').send({
        firstName: 'A', lastName: 'B', email: 'accept2@example.com',
        phone: '0123', postcode: 'CF1', dogDescription: 'Dog',
      });
      await request(app)
        .post(`/v1/interest-requests/${createRes.body.id}/accept`)
        .set('Authorization', `Bearer ${token}`);
      const res = await request(app)
        .post(`/v1/interest-requests/${createRes.body.id}/accept`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(409);
      expect(res.body.code).toBe('ALREADY_PROCESSED');
    });
  });

  describe('POST /v1/interest-requests/:id/decline', () => {
    it('declines with reason', async () => {
      const { token } = await createWalkerToken();
      const createRes = await request(app).post('/v1/interest-requests').send({
        firstName: 'A', lastName: 'B', email: 'decline@example.com',
        phone: '0123', postcode: 'CF1', dogDescription: 'Dog',
      });
      const res = await request(app)
        .post(`/v1/interest-requests/${createRes.body.id}/decline`)
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'Not in service area.' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('declined');
      expect(res.body.declineReason).toBe('Not in service area.');
    });

    it('returns 400 if already declined', async () => {
      const { token } = await createWalkerToken();
      const createRes = await request(app).post('/v1/interest-requests').send({
        firstName: 'A', lastName: 'B', email: 'decline2@example.com',
        phone: '0123', postcode: 'CF1', dogDescription: 'Dog',
      });
      await request(app)
        .post(`/v1/interest-requests/${createRes.body.id}/decline`)
        .set('Authorization', `Bearer ${token}`);
      const res = await request(app)
        .post(`/v1/interest-requests/${createRes.body.id}/decline`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_STATE_TRANSITION');
    });
  });
});

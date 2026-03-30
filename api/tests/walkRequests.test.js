const request = require('supertest');
const { app, resetStore, createWalkerToken, createOwnerToken, seedOwner, seedDog, seedWalker, seedWalkRequest } = require('./helpers');

beforeEach(() => resetStore());

describe('Walk Request routes', () => {
  describe('GET /v1/walk-requests', () => {
    it('returns list for authenticated users', async () => {
      const { token } = await createWalkerToken();
      const res = await request(app).get('/v1/walk-requests').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
    });
  });

  describe('POST /v1/walk-requests', () => {
    it('creates a walk request', async () => {
      const { token } = await createWalkerToken();
      const owner = seedOwner();
      const dog = seedDog(owner.id);
      const res = await request(app).post('/v1/walk-requests').set('Authorization', `Bearer ${token}`)
        .send({
          ownerId: owner.id, dogIds: [dog.id],
          requestedDate: '2026-06-01', requestedStartTime: '09:00:00Z',
          durationMinutes: 60, walkType: 'solo_walk',
        });
      expect(res.status).toBe(201);
      expect(res.body.status).toBe('pending');
      expect(res.body.preferredWalkerId).toBeNull();
      expect(res.body.notes).toBeNull();
      expect(res.body.walkId).toBeNull();
    });
  });

  describe('GET /v1/walk-requests/:requestId', () => {
    it('returns a walk request', async () => {
      const { token } = await createWalkerToken();
      const wr = seedWalkRequest();
      const res = await request(app)
        .get(`/v1/walk-requests/${wr.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(wr.id);
    });

    it('returns 404 for non-existent', async () => {
      const { token } = await createWalkerToken();
      const res = await request(app)
        .get('/v1/walk-requests/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /v1/walk-requests/:requestId', () => {
    it('updates a walk request', async () => {
      const { token } = await createWalkerToken();
      const owner = seedOwner();
      const dog = seedDog(owner.id);
      const wr = seedWalkRequest({ ownerId: owner.id, dogIds: [dog.id] });
      const res = await request(app)
        .put(`/v1/walk-requests/${wr.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          ownerId: owner.id, dogIds: [dog.id],
          requestedDate: '2026-07-01', requestedStartTime: '10:00:00Z',
          durationMinutes: 30, walkType: 'puppy_walk',
        });
      expect(res.status).toBe(200);
      expect(res.body.requestedDate).toBe('2026-07-01');
      expect(res.body.walkType).toBe('puppy_walk');
    });
  });

  describe('DELETE /v1/walk-requests/:requestId', () => {
    it('deletes a walk request', async () => {
      const { token } = await createWalkerToken();
      const wr = seedWalkRequest();
      const res = await request(app)
        .delete(`/v1/walk-requests/${wr.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(204);
    });
  });

  describe('POST /v1/walk-requests/:requestId/accept', () => {
    it('accepts walk request and creates a walk', async () => {
      const { token } = await createWalkerToken();
      const owner = seedOwner();
      const dog = seedDog(owner.id);
      const walker = seedWalker();
      const wr = seedWalkRequest({ ownerId: owner.id, dogIds: [dog.id] });
      const res = await request(app)
        .post(`/v1/walk-requests/${wr.id}/accept`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          walkerId: walker.id, confirmedDate: '2026-06-01', confirmedStartTime: '09:00:00Z',
        });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('requestId', wr.id);
      expect(res.body).toHaveProperty('status', 'scheduled');
      expect(res.body).toHaveProperty('walkerId', walker.id);
    });

    it('returns 400 if walk request not pending', async () => {
      const { token } = await createWalkerToken();
      const wr = seedWalkRequest({ status: 'accepted' });
      const walker = seedWalker();
      const res = await request(app)
        .post(`/v1/walk-requests/${wr.id}/accept`)
        .set('Authorization', `Bearer ${token}`)
        .send({ walkerId: walker.id, confirmedDate: '2026-06-01', confirmedStartTime: '09:00:00Z' });
      expect(res.status).toBe(400);
    });

    it('returns 403 for owner trying to accept', async () => {
      const { token } = await createOwnerToken();
      const wr = seedWalkRequest();
      const walker = seedWalker();
      const res = await request(app)
        .post(`/v1/walk-requests/${wr.id}/accept`)
        .set('Authorization', `Bearer ${token}`)
        .send({ walkerId: walker.id, confirmedDate: '2026-06-01', confirmedStartTime: '09:00:00Z' });
      expect(res.status).toBe(403);
    });
  });

  describe('POST /v1/walk-requests/:requestId/decline', () => {
    it('declines walk request', async () => {
      const { token } = await createWalkerToken();
      const wr = seedWalkRequest();
      const res = await request(app)
        .post(`/v1/walk-requests/${wr.id}/decline`)
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'Schedule full.' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('declined');
      expect(res.body.declineReason).toBe('Schedule full.');
    });
  });
});

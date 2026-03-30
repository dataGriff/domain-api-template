const request = require('supertest');
const { app, resetStore, createWalkerToken, seedOwner, seedDog } = require('./helpers');
const { store } = require('../src/store');

beforeEach(() => resetStore());

function seedRecurringWalk(overrides = {}) {
  const { v4: uuidv4 } = require('uuid');
  const now = new Date().toISOString();
  const rw = {
    id: uuidv4(),
    ownerId: uuidv4(),
    dogIds: [uuidv4()],
    walkType: 'solo_walk',
    durationMinutes: 60,
    recurrence: { frequency: 'weekly', dayOfWeek: 'monday', startTime: '09:00:00Z' },
    startDate: '2026-06-01',
    preferredWalkerId: null,
    status: 'active',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
  store.recurringWalks.set(rw.id, rw);
  return rw;
}

describe('Recurring Walk routes', () => {
  describe('GET /v1/recurring-walks', () => {
    it('returns list for authenticated users', async () => {
      const { token } = await createWalkerToken();
      seedRecurringWalk();
      const res = await request(app).get('/v1/recurring-walks').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination.total).toBe(1);
    });
  });

  describe('POST /v1/recurring-walks', () => {
    it('creates a recurring walk', async () => {
      const { token } = await createWalkerToken();
      const owner = seedOwner();
      const dog = seedDog(owner.id);
      const res = await request(app).post('/v1/recurring-walks').set('Authorization', `Bearer ${token}`)
        .send({
          ownerId: owner.id, dogIds: [dog.id], walkType: 'solo_walk',
          durationMinutes: 60,
          recurrence: { frequency: 'weekly', dayOfWeek: 'monday', startTime: '09:00:00Z' },
          startDate: '2026-06-01',
        });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.status).toBe('active');
      expect(res.body.preferredWalkerId).toBeNull();
    });
  });

  describe('GET /v1/recurring-walks/:recurringWalkId', () => {
    it('returns a recurring walk', async () => {
      const { token } = await createWalkerToken();
      const rw = seedRecurringWalk();
      const res = await request(app)
        .get(`/v1/recurring-walks/${rw.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(rw.id);
    });

    it('returns 404 for non-existent', async () => {
      const { token } = await createWalkerToken();
      const res = await request(app)
        .get('/v1/recurring-walks/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /v1/recurring-walks/:recurringWalkId', () => {
    it('updates a recurring walk', async () => {
      const { token } = await createWalkerToken();
      const rw = seedRecurringWalk();
      const res = await request(app)
        .put(`/v1/recurring-walks/${rw.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ durationMinutes: 90 });
      expect(res.status).toBe(200);
      expect(res.body.durationMinutes).toBe(90);
    });
  });

  describe('POST /v1/recurring-walks/:recurringWalkId/pause', () => {
    it('pauses an active recurring walk', async () => {
      const { token } = await createWalkerToken();
      const rw = seedRecurringWalk({ status: 'active' });
      const res = await request(app)
        .post(`/v1/recurring-walks/${rw.id}/pause`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('paused');
    });

    it('returns 400 if not active', async () => {
      const { token } = await createWalkerToken();
      const rw = seedRecurringWalk({ status: 'paused' });
      const res = await request(app)
        .post(`/v1/recurring-walks/${rw.id}/pause`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_STATE_TRANSITION');
    });
  });

  describe('POST /v1/recurring-walks/:recurringWalkId/resume', () => {
    it('resumes a paused recurring walk', async () => {
      const { token } = await createWalkerToken();
      const rw = seedRecurringWalk({ status: 'paused' });
      const res = await request(app)
        .post(`/v1/recurring-walks/${rw.id}/resume`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('active');
    });

    it('returns 400 if not paused', async () => {
      const { token } = await createWalkerToken();
      const rw = seedRecurringWalk({ status: 'active' });
      const res = await request(app)
        .post(`/v1/recurring-walks/${rw.id}/resume`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });
  });

  describe('POST /v1/recurring-walks/:recurringWalkId/cancel', () => {
    it('cancels an active recurring walk', async () => {
      const { token } = await createWalkerToken();
      const rw = seedRecurringWalk({ status: 'active' });
      const res = await request(app)
        .post(`/v1/recurring-walks/${rw.id}/cancel`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('cancelled');
    });

    it('returns 400 if already cancelled', async () => {
      const { token } = await createWalkerToken();
      const rw = seedRecurringWalk({ status: 'cancelled' });
      const res = await request(app)
        .post(`/v1/recurring-walks/${rw.id}/cancel`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });
  });
});

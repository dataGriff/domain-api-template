const request = require('supertest');
const { app, resetStore, createWalkerToken, seedWalk } = require('./helpers');
const { store } = require('../src/store');

beforeEach(() => resetStore());

describe('Walk routes', () => {
  describe('GET /v1/walks', () => {
    it('returns walk list', async () => {
      const { token } = await createWalkerToken();
      seedWalk();
      const res = await request(app).get('/v1/walks').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination.total).toBe(1);
    });
  });

  describe('GET /v1/walks/:walkId', () => {
    it('returns a walk', async () => {
      const { token } = await createWalkerToken();
      const walk = seedWalk();
      const res = await request(app)
        .get(`/v1/walks/${walk.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(walk.id);
      expect(res.body.routeNotes).toBeNull();
    });

    it('returns 404 for non-existent walk', async () => {
      const { token } = await createWalkerToken();
      const res = await request(app).get('/v1/walks/00000000-0000-0000-0000-000000000000').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /v1/walks/:walkId', () => {
    it('updates a walk', async () => {
      const { token } = await createWalkerToken();
      const walk = seedWalk();
      const res = await request(app)
        .put(`/v1/walks/${walk.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ scheduledDate: '2026-07-15', routeNotes: 'Via park' });
      expect(res.status).toBe(200);
      expect(res.body.scheduledDate).toBe('2026-07-15');
      expect(res.body.routeNotes).toBe('Via park');
    });
  });

  describe('POST /v1/walks/:walkId/start', () => {
    it('starts a scheduled walk', async () => {
      const { token } = await createWalkerToken();
      const walk = seedWalk({ status: 'scheduled' });
      const res = await request(app)
        .post(`/v1/walks/${walk.id}/start`)
        .set('Authorization', `Bearer ${token}`)
        .send({ actualStartTime: '2026-06-01T09:05:00Z' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('in_progress');
      expect(res.body.actualStartTime).toBe('2026-06-01T09:05:00Z');
    });

    it('returns 400 if walk is not scheduled', async () => {
      const { token } = await createWalkerToken();
      const walk = seedWalk({ status: 'in_progress' });
      const res = await request(app)
        .post(`/v1/walks/${walk.id}/start`)
        .set('Authorization', `Bearer ${token}`)
        .send({ actualStartTime: '2026-06-01T09:05:00Z' });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_STATE_TRANSITION');
    });
  });

  describe('POST /v1/walks/:walkId/complete', () => {
    it('completes an in-progress walk', async () => {
      const { token } = await createWalkerToken();
      const walk = seedWalk({ status: 'in_progress' });
      const res = await request(app)
        .post(`/v1/walks/${walk.id}/complete`)
        .set('Authorization', `Bearer ${token}`)
        .send({ actualEndTime: '2026-06-01T10:05:00Z', distanceKm: 3.5 });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('completed');
      expect(res.body.distanceKm).toBe(3.5);
    });

    it('returns 400 if walk is not in progress', async () => {
      const { token } = await createWalkerToken();
      const walk = seedWalk({ status: 'scheduled' });
      const res = await request(app)
        .post(`/v1/walks/${walk.id}/complete`)
        .set('Authorization', `Bearer ${token}`)
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe('POST /v1/walks/:walkId/cancel', () => {
    it('cancels a scheduled walk', async () => {
      const { token } = await createWalkerToken();
      const walk = seedWalk({ status: 'scheduled' });
      const res = await request(app)
        .post(`/v1/walks/${walk.id}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'Bad weather' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('cancelled');
      expect(res.body.cancelReason).toBe('Bad weather');
    });

    it('cancels an in-progress walk', async () => {
      const { token } = await createWalkerToken();
      const walk = seedWalk({ status: 'in_progress' });
      const res = await request(app)
        .post(`/v1/walks/${walk.id}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .send({});
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('cancelled');
    });

    it('returns 400 if walk is already completed', async () => {
      const { token } = await createWalkerToken();
      const walk = seedWalk({ status: 'completed' });
      const res = await request(app)
        .post(`/v1/walks/${walk.id}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe('Walk Updates', () => {
    describe('GET /v1/walks/:walkId/updates', () => {
      it('returns empty list for walk with no updates', async () => {
        const { token } = await createWalkerToken();
        const walk = seedWalk();
        const res = await request(app)
          .get(`/v1/walks/${walk.id}/updates`)
          .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(0);
        expect(res.body.pagination.total).toBe(0);
      });
    });

    describe('POST /v1/walks/:walkId/updates', () => {
      it('creates a note update', async () => {
        const { token } = await createWalkerToken();
        const walk = seedWalk();
        const res = await request(app)
          .post(`/v1/walks/${walk.id}/updates`)
          .set('Authorization', `Bearer ${token}`)
          .field('type', 'note')
          .field('note', 'All going well!');
        expect(res.status).toBe(201);
        expect(res.body.type).toBe('note');
        expect(res.body.note).toBe('All going well!');
        expect(res.body.imageUrl).toBeNull();
        expect(res.body.imageCaption).toBeNull();
      });

      it('creates an image update', async () => {
        const { token } = await createWalkerToken();
        const walk = seedWalk();
        const res = await request(app)
          .post(`/v1/walks/${walk.id}/updates`)
          .set('Authorization', `Bearer ${token}`)
          .field('type', 'image')
          .field('imageCaption', 'Buddy at the park')
          .attach('image', Buffer.from('fake-image-data'), 'photo.jpg');
        expect(res.status).toBe(201);
        expect(res.body.type).toBe('image');
        expect(res.body.imageUrl).toBeTruthy();
        expect(res.body.imageCaption).toBe('Buddy at the park');
      });
    });

    describe('GET /v1/walks/:walkId/updates/:updateId', () => {
      it('returns a specific update', async () => {
        const { token } = await createWalkerToken();
        const walk = seedWalk();
        const createRes = await request(app)
          .post(`/v1/walks/${walk.id}/updates`)
          .set('Authorization', `Bearer ${token}`)
          .field('type', 'note')
          .field('note', 'Test note');
        const res = await request(app)
          .get(`/v1/walks/${walk.id}/updates/${createRes.body.id}`)
          .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.id).toBe(createRes.body.id);
      });
    });

    describe('DELETE /v1/walks/:walkId/updates/:updateId', () => {
      it('deletes a walk update', async () => {
        const { token } = await createWalkerToken();
        const walk = seedWalk();
        const createRes = await request(app)
          .post(`/v1/walks/${walk.id}/updates`)
          .set('Authorization', `Bearer ${token}`)
          .field('type', 'note')
          .field('note', 'To delete');
        const res = await request(app)
          .delete(`/v1/walks/${walk.id}/updates/${createRes.body.id}`)
          .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(204);
      });
    });
  });
});

const request = require('supertest');
const { app, resetStore, createWalkerToken, createOwnerToken, seedOwner, seedWalker, seedDog, seedWalkRequest, seedWalk, seedInvoice } = require('./helpers');

beforeEach(() => resetStore());

describe('Contract Tests - Response Shapes', () => {
  describe('Auth endpoints', () => {
    it('POST /v1/auth/register returns 201 with AuthResponse shape', async () => {
      const res = await request(app)
        .post('/v1/auth/register')
        .send({ email: 'test@example.com', password: 'password123', firstName: 'Test', lastName: 'User', role: 'owner' });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body).toHaveProperty('expiresIn');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user).toHaveProperty('email');
      expect(res.body.user).toHaveProperty('firstName');
      expect(res.body.user).toHaveProperty('lastName');
      expect(res.body.user).toHaveProperty('role');
    });

    it('POST /v1/auth/login returns 200 with AuthResponse shape', async () => {
      await request(app).post('/v1/auth/register')
        .send({ email: 'test2@example.com', password: 'password123', firstName: 'T', lastName: 'U', role: 'walker' });
      const res = await request(app).post('/v1/auth/login')
        .send({ email: 'test2@example.com', password: 'password123' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body).toHaveProperty('expiresIn');
      expect(res.body.user).toHaveProperty('id');
    });

    it('POST /v1/auth/logout returns 204', async () => {
      const { token } = await createWalkerToken();
      const res = await request(app).post('/v1/auth/logout').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(204);
    });

    it('POST /v1/auth/refresh returns 200 with AuthResponse shape', async () => {
      const regRes = await request(app).post('/v1/auth/register')
        .send({ email: 'refresh@example.com', password: 'password123', firstName: 'R', lastName: 'T', role: 'owner' });
      const res = await request(app).post('/v1/auth/refresh')
        .send({ refreshToken: regRes.body.refreshToken });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });
  });

  describe('Interest Request endpoints', () => {
    it('POST /v1/interest-requests returns 201 with InterestRequestPublic shape', async () => {
      const res = await request(app).post('/v1/interest-requests').send({
        firstName: 'Sarah', lastName: 'Davies', email: 'sarah@example.com',
        phone: '+44 7700 900789', postcode: 'CF10 1AB', dogDescription: 'A friendly Labrador.',
      });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('createdAt');
      expect(Object.keys(res.body)).toHaveLength(2);
    });

    it('GET /v1/interest-requests returns 200 with InterestRequestList shape', async () => {
      const { token } = await createWalkerToken();
      const res = await request(app).get('/v1/interest-requests').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.pagination).toHaveProperty('page');
      expect(res.body.pagination).toHaveProperty('pageSize');
      expect(res.body.pagination).toHaveProperty('total');
    });

    it('GET /v1/interest-requests/:id returns full InterestRequest shape', async () => {
      const { token } = await createWalkerToken();
      const createRes = await request(app).post('/v1/interest-requests').send({
        firstName: 'Sarah', lastName: 'Davies', email: 'sarah2@example.com',
        phone: '+44 7700 900789', postcode: 'CF10 1AB', dogDescription: 'A friendly Labrador.',
      });
      const res = await request(app)
        .get(`/v1/interest-requests/${createRes.body.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('firstName');
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('declineReason');
      expect(res.body).toHaveProperty('notes');
      expect(res.body).toHaveProperty('ownerId');
      expect(res.body.declineReason).toBeNull();
      expect(res.body.notes).toBeNull();
      expect(res.body.ownerId).toBeNull();
    });
  });

  describe('Owner endpoints', () => {
    it('POST /v1/owners returns 201 with Owner shape', async () => {
      const { token } = await createWalkerToken();
      const res = await request(app).post('/v1/owners').set('Authorization', `Bearer ${token}`)
        .send({ firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '01234567890' });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('firstName');
      expect(res.body).toHaveProperty('createdAt');
      expect(res.body).toHaveProperty('updatedAt');
    });

    it('GET /v1/owners returns 200 with OwnerList shape', async () => {
      const { token } = await createWalkerToken();
      const res = await request(app).get('/v1/owners').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
    });
  });

  describe('Walker endpoints', () => {
    it('POST /v1/walkers returns 201 with Walker shape', async () => {
      const { token } = await createWalkerToken();
      const res = await request(app).post('/v1/walkers').set('Authorization', `Bearer ${token}`)
        .send({ firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', phone: '01234567891' });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('firstName');
    });

    it('GET /v1/walkers returns 200 with WalkerList shape', async () => {
      const { token } = await createWalkerToken();
      const res = await request(app).get('/v1/walkers').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
    });
  });

  describe('Dog endpoints', () => {
    it('POST /v1/owners/:ownerId/dogs returns 201 with Dog shape', async () => {
      const { token } = await createWalkerToken();
      const owner = seedOwner();
      const res = await request(app)
        .post(`/v1/owners/${owner.id}/dogs`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Rex', breed: 'Labrador', dateOfBirth: '2022-01-01' });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('ownerId', owner.id);
      expect(res.body).toHaveProperty('name', 'Rex');
    });

    it('GET /v1/owners/:ownerId/dogs returns 200 with DogList shape', async () => {
      const { token } = await createWalkerToken();
      const owner = seedOwner();
      const res = await request(app)
        .get(`/v1/owners/${owner.id}/dogs`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
    });
  });

  describe('Walk Request endpoints', () => {
    it('POST /v1/walk-requests returns 201 with WalkRequest shape including nullable fields', async () => {
      const { token } = await createWalkerToken();
      const owner = seedOwner();
      const dog = seedDog(owner.id);
      const res = await request(app).post('/v1/walk-requests').set('Authorization', `Bearer ${token}`)
        .send({
          ownerId: owner.id, dogIds: [dog.id], requestedDate: '2026-06-01',
          requestedStartTime: '09:00:00Z', durationMinutes: 60, walkType: 'solo_walk',
        });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('preferredWalkerId', null);
      expect(res.body).toHaveProperty('notes', null);
      expect(res.body).toHaveProperty('declineReason', null);
      expect(res.body).toHaveProperty('walkId', null);
      expect(res.body).toHaveProperty('recurringWalkId', null);
    });

    it('GET /v1/walk-requests returns 200 with WalkRequestList shape', async () => {
      const { token } = await createWalkerToken();
      const res = await request(app).get('/v1/walk-requests').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
    });
  });

  describe('Walk endpoints', () => {
    it('GET /v1/walks returns 200 with WalkList shape', async () => {
      const { token } = await createWalkerToken();
      const res = await request(app).get('/v1/walks').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
    });

    it('Walk shape includes all nullable fields as null', async () => {
      const { token } = await createWalkerToken();
      const walk = seedWalk();
      const res = await request(app)
        .get(`/v1/walks/${walk.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('routeNotes', null);
      expect(res.body).toHaveProperty('actualStartTime', null);
      expect(res.body).toHaveProperty('actualEndTime', null);
      expect(res.body).toHaveProperty('distanceKm', null);
      expect(res.body).toHaveProperty('summaryNotes', null);
      expect(res.body).toHaveProperty('cancelReason', null);
    });

    it('GET /v1/walks/:walkId/updates returns 200 with WalkUpdateList shape', async () => {
      const { token } = await createWalkerToken();
      const walk = seedWalk();
      const res = await request(app)
        .get(`/v1/walks/${walk.id}/updates`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
    });
  });

  describe('Recurring Walk endpoints', () => {
    it('POST /v1/recurring-walks returns 201 with RecurringWalk shape', async () => {
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
      expect(res.body).toHaveProperty('preferredWalkerId', null);
      expect(res.body).toHaveProperty('status', 'active');
    });

    it('GET /v1/recurring-walks returns 200 with RecurringWalkList shape', async () => {
      const { token } = await createWalkerToken();
      const res = await request(app).get('/v1/recurring-walks').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
    });
  });

  describe('Invoice endpoints', () => {
    it('POST /v1/invoices returns 201 with Invoice shape including nullable fields', async () => {
      const { token } = await createWalkerToken();
      const owner = seedOwner();
      const walker = seedWalker();
      const walk = seedWalk({ ownerId: owner.id, walkerId: walker.id });
      const res = await request(app).post('/v1/invoices').set('Authorization', `Bearer ${token}`)
        .send({
          ownerId: owner.id, walkerId: walker.id,
          lineItems: [{ walkId: walk.id, description: 'Solo walk', quantity: 1, unitPrice: 15.0 }],
          dueDate: '2026-07-01',
        });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('invoiceNumber');
      expect(res.body).toHaveProperty('subtotal');
      expect(res.body).toHaveProperty('taxRate');
      expect(res.body).toHaveProperty('taxAmount');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('notes', null);
      expect(res.body).toHaveProperty('paidAt', null);
      expect(res.body).toHaveProperty('paymentMethod', null);
      expect(res.body).toHaveProperty('paymentReference', null);
    });

    it('GET /v1/invoices returns 200 with InvoiceList shape', async () => {
      const { token } = await createWalkerToken();
      const res = await request(app).get('/v1/invoices').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
    });
  });

  describe('Error responses', () => {
    it('returns 401 when no token provided', async () => {
      const res = await request(app).get('/v1/interest-requests');
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('code');
      expect(res.body).toHaveProperty('message');
    });

    it('returns 403 when owner accesses walker-only endpoint', async () => {
      const { token } = await createOwnerToken();
      const res = await request(app).get('/v1/interest-requests').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('code');
    });

    it('returns 404 for non-existent resources', async () => {
      const { token } = await createWalkerToken();
      const res = await request(app)
        .get('/v1/interest-requests/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('code', 'RESOURCE_NOT_FOUND');
    });

    it('returns 409 for duplicate email on register', async () => {
      await request(app).post('/v1/auth/register')
        .send({ email: 'dup@example.com', password: 'password123', firstName: 'D', lastName: 'U', role: 'owner' });
      const res = await request(app).post('/v1/auth/register')
        .send({ email: 'dup@example.com', password: 'password123', firstName: 'D', lastName: 'U', role: 'owner' });
      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty('code', 'DUPLICATE_EMAIL');
    });
  });
});

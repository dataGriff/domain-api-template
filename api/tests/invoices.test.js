const request = require('supertest');
const { app, resetStore, createWalkerToken, seedOwner, seedWalker, seedWalk, seedInvoice } = require('./helpers');

beforeEach(() => resetStore());

describe('Invoice routes', () => {
  function makeLineItems(walkId) {
    return [{ walkId, description: 'Solo walk 60min', quantity: 1, unitPrice: 15.0 }];
  }

  describe('GET /v1/invoices', () => {
    it('returns invoice list', async () => {
      const { token } = await createWalkerToken();
      seedInvoice();
      const res = await request(app).get('/v1/invoices').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination.total).toBe(1);
    });
  });

  describe('POST /v1/invoices', () => {
    it('creates an invoice with correct calculations', async () => {
      const { token } = await createWalkerToken();
      const owner = seedOwner();
      const walker = seedWalker();
      const walk = seedWalk({ ownerId: owner.id, walkerId: walker.id });
      const res = await request(app).post('/v1/invoices').set('Authorization', `Bearer ${token}`)
        .send({
          ownerId: owner.id, walkerId: walker.id,
          lineItems: makeLineItems(walk.id),
          dueDate: '2026-07-01',
        });
      expect(res.status).toBe(201);
      expect(res.body.subtotal).toBe(15.0);
      expect(res.body.taxRate).toBe(0.0);
      expect(res.body.taxAmount).toBe(0.0);
      expect(res.body.total).toBe(15.0);
      expect(res.body.lineItems[0].total).toBe(15.0);
      expect(res.body.status).toBe('draft');
      expect(res.body.invoiceNumber).toMatch(/^INV-\d{4}-\d{4}$/);
    });

    it('calculates totals for multiple line items', async () => {
      const { token } = await createWalkerToken();
      const owner = seedOwner();
      const walker = seedWalker();
      const walk1 = seedWalk({ ownerId: owner.id, walkerId: walker.id });
      const walk2 = seedWalk({ ownerId: owner.id, walkerId: walker.id });
      const res = await request(app).post('/v1/invoices').set('Authorization', `Bearer ${token}`)
        .send({
          ownerId: owner.id, walkerId: walker.id,
          lineItems: [
            { walkId: walk1.id, description: 'Walk 1', quantity: 1, unitPrice: 15.0 },
            { walkId: walk2.id, description: 'Walk 2', quantity: 2, unitPrice: 10.0 },
          ],
          dueDate: '2026-07-01',
        });
      expect(res.status).toBe(201);
      expect(res.body.subtotal).toBe(35.0);
      expect(res.body.total).toBe(35.0);
    });
  });

  describe('GET /v1/invoices/:invoiceId', () => {
    it('returns an invoice', async () => {
      const { token } = await createWalkerToken();
      const invoice = seedInvoice();
      const res = await request(app)
        .get(`/v1/invoices/${invoice.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(invoice.id);
      expect(res.body.notes).toBeNull();
      expect(res.body.paidAt).toBeNull();
      expect(res.body.paymentMethod).toBeNull();
      expect(res.body.paymentReference).toBeNull();
    });

    it('returns 404 for non-existent', async () => {
      const { token } = await createWalkerToken();
      const res = await request(app)
        .get('/v1/invoices/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /v1/invoices/:invoiceId', () => {
    it('updates an invoice', async () => {
      const { token } = await createWalkerToken();
      const invoice = seedInvoice();
      const walk = seedWalk();
      const res = await request(app)
        .put(`/v1/invoices/${invoice.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ dueDate: '2026-08-01', notes: 'Updated notes' });
      expect(res.status).toBe(200);
      expect(res.body.dueDate).toBe('2026-08-01');
      expect(res.body.notes).toBe('Updated notes');
    });
  });

  describe('POST /v1/invoices/:invoiceId/send', () => {
    it('sends a draft invoice', async () => {
      const { token } = await createWalkerToken();
      const invoice = seedInvoice({ status: 'draft' });
      const res = await request(app)
        .post(`/v1/invoices/${invoice.id}/send`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('sent');
    });

    it('returns 400 if not draft', async () => {
      const { token } = await createWalkerToken();
      const invoice = seedInvoice({ status: 'sent' });
      const res = await request(app)
        .post(`/v1/invoices/${invoice.id}/send`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_STATE_TRANSITION');
    });
  });

  describe('POST /v1/invoices/:invoiceId/pay', () => {
    it('pays a sent invoice', async () => {
      const { token } = await createWalkerToken();
      const invoice = seedInvoice({ status: 'sent' });
      const res = await request(app)
        .post(`/v1/invoices/${invoice.id}/pay`)
        .set('Authorization', `Bearer ${token}`)
        .send({ paymentMethod: 'bank_transfer', paidAt: '2026-07-01T12:00:00Z' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('paid');
      expect(res.body.paymentMethod).toBe('bank_transfer');
      expect(res.body.paidAt).toBe('2026-07-01T12:00:00Z');
    });

    it('returns 400 if not sent', async () => {
      const { token } = await createWalkerToken();
      const invoice = seedInvoice({ status: 'draft' });
      const res = await request(app)
        .post(`/v1/invoices/${invoice.id}/pay`)
        .set('Authorization', `Bearer ${token}`)
        .send({ paymentMethod: 'cash', paidAt: '2026-07-01T12:00:00Z' });
      expect(res.status).toBe(400);
    });
  });
});

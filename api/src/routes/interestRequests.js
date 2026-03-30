const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { store } = require('../store');
const { authenticate, requireRole } = require('../middleware/authenticate');

function paginate(items, page, pageSize) {
  const p = Math.max(1, parseInt(page) || 1);
  const ps = Math.min(100, Math.max(1, parseInt(pageSize) || 20));
  const start = (p - 1) * ps;
  return {
    data: items.slice(start, start + ps),
    pagination: { page: p, pageSize: ps, total: items.length },
  };
}

// GET /interest-requests - walker only
router.get('/', authenticate, requireRole('walker'), (req, res) => {
  let items = [...store.interestRequests.values()];
  if (req.query.status) items = items.filter(ir => ir.status === req.query.status);
  items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(paginate(items, req.query.page, req.query.pageSize));
});

// POST /interest-requests - public
router.post('/', (req, res) => {
  const { firstName, lastName, email, phone, postcode, dogDescription } = req.body;

  const existing = [...store.interestRequests.values()].find(ir => ir.email === email);
  if (existing) {
    return res.status(409).json({
      code: 'DUPLICATE_EMAIL',
      message: 'An interest request with this email already exists.',
    });
  }

  const now = new Date().toISOString();
  const ir = {
    id: uuidv4(),
    firstName,
    lastName,
    email,
    phone,
    postcode,
    dogDescription,
    status: 'pending',
    declineReason: null,
    notes: null,
    ownerId: null,
    createdAt: now,
    updatedAt: now,
  };
  store.interestRequests.set(ir.id, ir);
  res.status(201).json({ id: ir.id, createdAt: ir.createdAt });
});

// GET /interest-requests/:id - walker only
router.get('/:interestRequestId', authenticate, requireRole('walker'), (req, res) => {
  const ir = store.interestRequests.get(req.params.interestRequestId);
  if (!ir) {
    return res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: 'Interest request not found.' });
  }
  res.json(ir);
});

// PUT /interest-requests/:id - walker only
router.put('/:interestRequestId', authenticate, requireRole('walker'), (req, res) => {
  const ir = store.interestRequests.get(req.params.interestRequestId);
  if (!ir) {
    return res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: 'Interest request not found.' });
  }
  if (req.body.notes !== undefined) ir.notes = req.body.notes;
  ir.updatedAt = new Date().toISOString();
  store.interestRequests.set(ir.id, ir);
  res.json(ir);
});

// POST /interest-requests/:id/accept - walker only
router.post('/:interestRequestId/accept', authenticate, requireRole('walker'), (req, res) => {
  const ir = store.interestRequests.get(req.params.interestRequestId);
  if (!ir) {
    return res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: 'Interest request not found.' });
  }
  if (ir.status !== 'pending') {
    return res.status(409).json({
      code: 'ALREADY_PROCESSED',
      message: 'This request has already been accepted or declined.',
    });
  }

  const now = new Date().toISOString();
  const ownerId = uuidv4();
  const userId = uuidv4();

  const owner = {
    id: ownerId,
    userId,
    firstName: ir.firstName,
    lastName: ir.lastName,
    email: ir.email,
    phone: ir.phone,
    createdAt: now,
    updatedAt: now,
  };
  store.owners.set(ownerId, owner);

  ir.status = 'accepted';
  ir.ownerId = ownerId;
  ir.updatedAt = now;
  store.interestRequests.set(ir.id, ir);

  res.json(ir);
});

// POST /interest-requests/:id/decline - walker only
router.post('/:interestRequestId/decline', authenticate, requireRole('walker'), (req, res) => {
  const ir = store.interestRequests.get(req.params.interestRequestId);
  if (!ir) {
    return res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: 'Interest request not found.' });
  }
  if (ir.status !== 'pending') {
    return res.status(400).json({
      code: 'INVALID_STATE_TRANSITION',
      message: 'This action cannot be performed on a resource in its current status.',
    });
  }
  ir.status = 'declined';
  if (req.body && req.body.reason) ir.declineReason = req.body.reason;
  ir.updatedAt = new Date().toISOString();
  store.interestRequests.set(ir.id, ir);
  res.json(ir);
});

module.exports = router;

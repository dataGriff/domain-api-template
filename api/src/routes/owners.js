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

function formatOwner(owner) {
  const result = {
    id: owner.id,
    firstName: owner.firstName,
    lastName: owner.lastName,
    email: owner.email,
    phone: owner.phone,
    createdAt: owner.createdAt,
    updatedAt: owner.updatedAt,
  };
  if (owner.address !== undefined) result.address = owner.address;
  if (owner.notes !== undefined) result.notes = owner.notes;
  return result;
}

// GET /owners - walker only
router.get('/', authenticate, requireRole('walker'), (req, res) => {
  const items = [...store.owners.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const result = paginate(items, req.query.page, req.query.pageSize);
  result.data = result.data.map(formatOwner);
  res.json(result);
});

// POST /owners
router.post('/', authenticate, (req, res) => {
  const { firstName, lastName, email, phone, address, notes } = req.body;
  const now = new Date().toISOString();
  const owner = { id: uuidv4(), firstName, lastName, email, phone, createdAt: now, updatedAt: now };
  if (address !== undefined) owner.address = address;
  if (notes !== undefined) owner.notes = notes;
  store.owners.set(owner.id, owner);
  res.status(201).json(formatOwner(owner));
});

// GET /owners/:ownerId
router.get('/:ownerId', authenticate, (req, res) => {
  const owner = store.owners.get(req.params.ownerId);
  if (!owner) {
    return res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: 'Owner not found.' });
  }
  if (req.user.role === 'owner') {
    const userOwner = [...store.owners.values()].find(o => o.userId === req.user.sub);
    if (!userOwner || userOwner.id !== owner.id) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'You can only access your own records.' });
    }
  }
  res.json(formatOwner(owner));
});

// PUT /owners/:ownerId
router.put('/:ownerId', authenticate, (req, res) => {
  const owner = store.owners.get(req.params.ownerId);
  if (!owner) {
    return res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: 'Owner not found.' });
  }
  if (req.user.role === 'owner') {
    const userOwner = [...store.owners.values()].find(o => o.userId === req.user.sub);
    if (!userOwner || userOwner.id !== owner.id) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'You can only access your own records.' });
    }
  }
  const { firstName, lastName, email, phone, address, notes } = req.body;
  Object.assign(owner, { firstName, lastName, email, phone, updatedAt: new Date().toISOString() });
  if (address !== undefined) owner.address = address;
  if (notes !== undefined) owner.notes = notes;
  store.owners.set(owner.id, owner);
  res.json(formatOwner(owner));
});

// DELETE /owners/:ownerId
router.delete('/:ownerId', authenticate, (req, res) => {
  const owner = store.owners.get(req.params.ownerId);
  if (!owner) {
    return res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: 'Owner not found.' });
  }
  if (req.user.role === 'owner') {
    const userOwner = [...store.owners.values()].find(o => o.userId === req.user.sub);
    if (!userOwner || userOwner.id !== owner.id) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'You can only access your own records.' });
    }
  }
  store.owners.delete(req.params.ownerId);
  res.status(204).send();
});

// Mount dogs router
const dogsRouter = require('./dogs');
router.use('/:ownerId/dogs', dogsRouter);

module.exports = router;

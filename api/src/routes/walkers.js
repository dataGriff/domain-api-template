const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { store } = require('../store');
const { authenticate } = require('../middleware/authenticate');

function paginate(items, page, pageSize) {
  const p = Math.max(1, parseInt(page) || 1);
  const ps = Math.min(100, Math.max(1, parseInt(pageSize) || 20));
  const start = (p - 1) * ps;
  return {
    data: items.slice(start, start + ps),
    pagination: { page: p, pageSize: ps, total: items.length },
  };
}

function formatWalker(walker) {
  const result = {
    id: walker.id,
    firstName: walker.firstName,
    lastName: walker.lastName,
    email: walker.email,
    phone: walker.phone,
    createdAt: walker.createdAt,
    updatedAt: walker.updatedAt,
  };
  if (walker.address !== undefined) result.address = walker.address;
  if (walker.bio !== undefined) result.bio = walker.bio;
  if (walker.walkRates !== undefined) result.walkRates = walker.walkRates;
  return result;
}

// GET /walkers
router.get('/', authenticate, (req, res) => {
  const items = [...store.walkers.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const result = paginate(items, req.query.page, req.query.pageSize);
  result.data = result.data.map(formatWalker);
  res.json(result);
});

// POST /walkers
router.post('/', authenticate, (req, res) => {
  const { firstName, lastName, email, phone, address, bio, walkRates } = req.body;
  const now = new Date().toISOString();
  const walker = { id: uuidv4(), firstName, lastName, email, phone, createdAt: now, updatedAt: now };
  if (address !== undefined) walker.address = address;
  if (bio !== undefined) walker.bio = bio;
  if (walkRates !== undefined) walker.walkRates = walkRates;
  store.walkers.set(walker.id, walker);
  res.status(201).json(formatWalker(walker));
});

// GET /walkers/:walkerId
router.get('/:walkerId', authenticate, (req, res) => {
  const walker = store.walkers.get(req.params.walkerId);
  if (!walker) {
    return res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: 'Walker not found.' });
  }
  res.json(formatWalker(walker));
});

// PUT /walkers/:walkerId
router.put('/:walkerId', authenticate, (req, res) => {
  const walker = store.walkers.get(req.params.walkerId);
  if (!walker) {
    return res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: 'Walker not found.' });
  }
  if (req.user.role === 'owner') {
    return res.status(403).json({
      code: 'FORBIDDEN',
      message: 'Your role does not have permission to perform this action.',
    });
  }
  const { firstName, lastName, email, phone, address, bio, walkRates } = req.body;
  Object.assign(walker, { firstName, lastName, email, phone, updatedAt: new Date().toISOString() });
  if (address !== undefined) walker.address = address;
  if (bio !== undefined) walker.bio = bio;
  if (walkRates !== undefined) walker.walkRates = walkRates;
  store.walkers.set(walker.id, walker);
  res.json(formatWalker(walker));
});

// DELETE /walkers/:walkerId
router.delete('/:walkerId', authenticate, (req, res) => {
  const walker = store.walkers.get(req.params.walkerId);
  if (!walker) {
    return res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: 'Walker not found.' });
  }
  if (req.user.role === 'owner') {
    return res.status(403).json({
      code: 'FORBIDDEN',
      message: 'Your role does not have permission to perform this action.',
    });
  }
  store.walkers.delete(req.params.walkerId);
  res.status(204).send();
});

module.exports = router;

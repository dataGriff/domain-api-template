const router = require('express').Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { store } = require('../store');
const { authenticate } = require('../middleware/authenticate');

const upload = multer({ storage: multer.memoryStorage() });

function paginate(items, page, pageSize) {
  const p = Math.max(1, parseInt(page) || 1);
  const ps = Math.min(100, Math.max(1, parseInt(pageSize) || 20));
  const start = (p - 1) * ps;
  return {
    data: items.slice(start, start + ps),
    pagination: { page: p, pageSize: ps, total: items.length },
  };
}

function formatWalk(walk) {
  return {
    id: walk.id,
    requestId: walk.requestId,
    ownerId: walk.ownerId,
    walkerId: walk.walkerId,
    dogIds: walk.dogIds,
    scheduledDate: walk.scheduledDate,
    scheduledStartTime: walk.scheduledStartTime,
    durationMinutes: walk.durationMinutes,
    walkType: walk.walkType,
    agreedRate: walk.agreedRate,
    status: walk.status,
    routeNotes: walk.routeNotes !== undefined ? walk.routeNotes : null,
    actualStartTime: walk.actualStartTime !== undefined ? walk.actualStartTime : null,
    actualEndTime: walk.actualEndTime !== undefined ? walk.actualEndTime : null,
    distanceKm: walk.distanceKm !== undefined ? walk.distanceKm : null,
    summaryNotes: walk.summaryNotes !== undefined ? walk.summaryNotes : null,
    cancelReason: walk.cancelReason !== undefined ? walk.cancelReason : null,
    createdAt: walk.createdAt,
    updatedAt: walk.updatedAt,
  };
}

function formatWalkUpdate(u) {
  return {
    id: u.id,
    walkId: u.walkId,
    type: u.type,
    note: u.note !== undefined ? u.note : null,
    imageUrl: u.imageUrl !== undefined ? u.imageUrl : null,
    imageCaption: u.imageCaption !== undefined ? u.imageCaption : null,
    createdAt: u.createdAt,
  };
}

// GET /walks
router.get('/', authenticate, (req, res) => {
  let items = [...store.walks.values()];
  if (req.query.status) items = items.filter(w => w.status === req.query.status);
  items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const result = paginate(items, req.query.page, req.query.pageSize);
  result.data = result.data.map(formatWalk);
  res.json(result);
});

// GET /walks/:walkId
router.get('/:walkId', authenticate, (req, res) => {
  const walk = store.walks.get(req.params.walkId);
  if (!walk) {
    return res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: 'Walk not found.' });
  }
  res.json(formatWalk(walk));
});

// PUT /walks/:walkId
router.put('/:walkId', authenticate, (req, res) => {
  const walk = store.walks.get(req.params.walkId);
  if (!walk) {
    return res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: 'Walk not found.' });
  }
  const { scheduledDate, scheduledStartTime, durationMinutes, routeNotes } = req.body;
  if (scheduledDate !== undefined) walk.scheduledDate = scheduledDate;
  if (scheduledStartTime !== undefined) walk.scheduledStartTime = scheduledStartTime;
  if (durationMinutes !== undefined) walk.durationMinutes = durationMinutes;
  if (routeNotes !== undefined) walk.routeNotes = routeNotes;
  walk.updatedAt = new Date().toISOString();
  store.walks.set(walk.id, walk);
  res.json(formatWalk(walk));
});

// POST /walks/:walkId/start
router.post('/:walkId/start', authenticate, (req, res) => {
  const walk = store.walks.get(req.params.walkId);
  if (!walk) {
    return res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: 'Walk not found.' });
  }
  if (walk.status !== 'scheduled') {
    return res.status(400).json({
      code: 'INVALID_STATE_TRANSITION',
      message: 'Walk can only be started when in scheduled status.',
    });
  }
  walk.status = 'in_progress';
  walk.actualStartTime = req.body.actualStartTime || new Date().toISOString();
  walk.updatedAt = new Date().toISOString();
  store.walks.set(walk.id, walk);
  res.json(formatWalk(walk));
});

// POST /walks/:walkId/complete
router.post('/:walkId/complete', authenticate, (req, res) => {
  const walk = store.walks.get(req.params.walkId);
  if (!walk) {
    return res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: 'Walk not found.' });
  }
  if (walk.status !== 'in_progress') {
    return res.status(400).json({
      code: 'INVALID_STATE_TRANSITION',
      message: 'Walk can only be completed when in progress.',
    });
  }
  walk.status = 'completed';
  const body = req.body || {};
  if (body.actualStartTime !== undefined) walk.actualStartTime = body.actualStartTime;
  if (body.actualEndTime !== undefined) walk.actualEndTime = body.actualEndTime;
  if (body.distanceKm !== undefined) walk.distanceKm = body.distanceKm;
  if (body.summaryNotes !== undefined) walk.summaryNotes = body.summaryNotes;
  walk.updatedAt = new Date().toISOString();
  store.walks.set(walk.id, walk);
  res.json(formatWalk(walk));
});

// POST /walks/:walkId/cancel
router.post('/:walkId/cancel', authenticate, (req, res) => {
  const walk = store.walks.get(req.params.walkId);
  if (!walk) {
    return res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: 'Walk not found.' });
  }
  if (walk.status !== 'scheduled' && walk.status !== 'in_progress') {
    return res.status(400).json({
      code: 'INVALID_STATE_TRANSITION',
      message: 'Walk can only be cancelled when scheduled or in progress.',
    });
  }
  walk.status = 'cancelled';
  if (req.body && req.body.reason) walk.cancelReason = req.body.reason;
  walk.updatedAt = new Date().toISOString();
  store.walks.set(walk.id, walk);
  res.json(formatWalk(walk));
});

// GET /walks/:walkId/updates
router.get('/:walkId/updates', authenticate, (req, res) => {
  const walk = store.walks.get(req.params.walkId);
  if (!walk) {
    return res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: 'Walk not found.' });
  }
  const items = [...store.walkUpdates.values()]
    .filter(u => u.walkId === req.params.walkId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const result = paginate(items, req.query.page, req.query.pageSize);
  result.data = result.data.map(formatWalkUpdate);
  res.json(result);
});

// POST /walks/:walkId/updates - multipart/form-data
router.post('/:walkId/updates', authenticate, (req, res) => {
  const walk = store.walks.get(req.params.walkId);
  if (!walk) {
    return res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: 'Walk not found.' });
  }
  const type = req.body.type;
  if (!type) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'type is required.' });
  }
  const now = new Date().toISOString();
  const updateId = uuidv4();
  const update = {
    id: updateId,
    walkId: req.params.walkId,
    type,
    note: type === 'note' ? (req.body.note || null) : null,
    imageUrl: null,
    imageCaption: null,
    createdAt: now,
  };
  if (type === 'image') {
    update.imageUrl = `https://storage.dogwalking.example.com/walks/${req.params.walkId}/${updateId}.jpg`;
    update.imageCaption = req.body.imageCaption || null;
  }
  store.walkUpdates.set(updateId, update);
  res.status(201).json(formatWalkUpdate(update));
});

// GET /walks/:walkId/updates/:updateId
router.get('/:walkId/updates/:updateId', authenticate, (req, res) => {
  const walk = store.walks.get(req.params.walkId);
  if (!walk) {
    return res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: 'Walk not found.' });
  }
  const update = store.walkUpdates.get(req.params.updateId);
  if (!update || update.walkId !== req.params.walkId) {
    return res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: 'Walk update not found.' });
  }
  res.json(formatWalkUpdate(update));
});

// DELETE /walks/:walkId/updates/:updateId
router.delete('/:walkId/updates/:updateId', authenticate, (req, res) => {
  const walk = store.walks.get(req.params.walkId);
  if (!walk) {
    return res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: 'Walk not found.' });
  }
  const update = store.walkUpdates.get(req.params.updateId);
  if (!update || update.walkId !== req.params.walkId) {
    return res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: 'Walk update not found.' });
  }
  store.walkUpdates.delete(req.params.updateId);
  res.status(204).send();
});

module.exports = router;

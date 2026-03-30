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

function formatRecurringWalk(rw) {
  return {
    id: rw.id,
    ownerId: rw.ownerId,
    dogIds: rw.dogIds,
    walkType: rw.walkType,
    durationMinutes: rw.durationMinutes,
    recurrence: rw.recurrence,
    startDate: rw.startDate,
    endDate: rw.endDate !== undefined ? rw.endDate : undefined,
    notes: rw.notes !== undefined ? rw.notes : undefined,
    preferredWalkerId: rw.preferredWalkerId !== undefined ? rw.preferredWalkerId : null,
    status: rw.status,
    createdAt: rw.createdAt,
    updatedAt: rw.updatedAt,
  };
}

// GET /recurring-walks
router.get('/', authenticate, (req, res) => {
  let items = [...store.recurringWalks.values()];
  if (req.query.status) items = items.filter(rw => rw.status === req.query.status);
  items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const result = paginate(items, req.query.page, req.query.pageSize);
  result.data = result.data.map(formatRecurringWalk);
  res.json(result);
});

// POST /recurring-walks
router.post('/', authenticate, (req, res) => {
  const {
    ownerId, dogIds, walkType, durationMinutes, recurrence, startDate,
    preferredWalkerId, endDate, notes,
  } = req.body;
  const now = new Date().toISOString();
  const rw = {
    id: uuidv4(),
    ownerId,
    dogIds,
    walkType,
    durationMinutes,
    recurrence,
    startDate,
    preferredWalkerId: preferredWalkerId !== undefined ? preferredWalkerId : null,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };
  if (endDate !== undefined) rw.endDate = endDate;
  if (notes !== undefined) rw.notes = notes;
  store.recurringWalks.set(rw.id, rw);
  res.status(201).json(formatRecurringWalk(rw));
});

// GET /recurring-walks/:recurringWalkId
router.get('/:recurringWalkId', authenticate, (req, res) => {
  const rw = store.recurringWalks.get(req.params.recurringWalkId);
  if (!rw) {
    return res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: 'Recurring walk not found.' });
  }
  res.json(formatRecurringWalk(rw));
});

// PUT /recurring-walks/:recurringWalkId
router.put('/:recurringWalkId', authenticate, (req, res) => {
  const rw = store.recurringWalks.get(req.params.recurringWalkId);
  if (!rw) {
    return res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: 'Recurring walk not found.' });
  }
  const {
    ownerId, dogIds, walkType, durationMinutes, recurrence, startDate,
    preferredWalkerId, endDate, notes,
  } = req.body;
  if (ownerId !== undefined) rw.ownerId = ownerId;
  if (dogIds !== undefined) rw.dogIds = dogIds;
  if (walkType !== undefined) rw.walkType = walkType;
  if (durationMinutes !== undefined) rw.durationMinutes = durationMinutes;
  if (recurrence !== undefined) rw.recurrence = recurrence;
  if (startDate !== undefined) rw.startDate = startDate;
  if (preferredWalkerId !== undefined) rw.preferredWalkerId = preferredWalkerId;
  if (endDate !== undefined) rw.endDate = endDate;
  if (notes !== undefined) rw.notes = notes;
  rw.updatedAt = new Date().toISOString();
  store.recurringWalks.set(rw.id, rw);
  res.json(formatRecurringWalk(rw));
});

// POST /recurring-walks/:recurringWalkId/pause
router.post('/:recurringWalkId/pause', authenticate, (req, res) => {
  const rw = store.recurringWalks.get(req.params.recurringWalkId);
  if (!rw) {
    return res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: 'Recurring walk not found.' });
  }
  if (rw.status !== 'active') {
    return res.status(400).json({
      code: 'INVALID_STATE_TRANSITION',
      message: 'Recurring walk can only be paused when active.',
    });
  }
  rw.status = 'paused';
  rw.updatedAt = new Date().toISOString();
  store.recurringWalks.set(rw.id, rw);
  res.json(formatRecurringWalk(rw));
});

// POST /recurring-walks/:recurringWalkId/resume
router.post('/:recurringWalkId/resume', authenticate, (req, res) => {
  const rw = store.recurringWalks.get(req.params.recurringWalkId);
  if (!rw) {
    return res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: 'Recurring walk not found.' });
  }
  if (rw.status !== 'paused') {
    return res.status(400).json({
      code: 'INVALID_STATE_TRANSITION',
      message: 'Recurring walk can only be resumed when paused.',
    });
  }
  rw.status = 'active';
  rw.updatedAt = new Date().toISOString();
  store.recurringWalks.set(rw.id, rw);
  res.json(formatRecurringWalk(rw));
});

// POST /recurring-walks/:recurringWalkId/cancel
router.post('/:recurringWalkId/cancel', authenticate, (req, res) => {
  const rw = store.recurringWalks.get(req.params.recurringWalkId);
  if (!rw) {
    return res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: 'Recurring walk not found.' });
  }
  if (rw.status === 'cancelled') {
    return res.status(400).json({
      code: 'INVALID_STATE_TRANSITION',
      message: 'Recurring walk is already cancelled.',
    });
  }
  rw.status = 'cancelled';
  rw.updatedAt = new Date().toISOString();
  store.recurringWalks.set(rw.id, rw);
  res.json(formatRecurringWalk(rw));
});

module.exports = router;

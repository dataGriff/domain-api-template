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

function formatWalkRequest(wr) {
  return {
    id: wr.id,
    ownerId: wr.ownerId,
    dogIds: wr.dogIds,
    preferredWalkerId: wr.preferredWalkerId !== undefined ? wr.preferredWalkerId : null,
    requestedDate: wr.requestedDate,
    requestedStartTime: wr.requestedStartTime,
    durationMinutes: wr.durationMinutes,
    walkType: wr.walkType,
    notes: wr.notes !== undefined ? wr.notes : null,
    status: wr.status,
    declineReason: wr.declineReason !== undefined ? wr.declineReason : null,
    walkId: wr.walkId !== undefined ? wr.walkId : null,
    recurringWalkId: wr.recurringWalkId !== undefined ? wr.recurringWalkId : null,
    createdAt: wr.createdAt,
    updatedAt: wr.updatedAt,
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

function resolveRate(walker, walkType, numDogs, durationMinutes) {
  if (!walker || !walker.walkRates || walker.walkRates.length === 0) return 0.0;
  const rate = walker.walkRates.find(
    r => r.walkType === walkType && r.numberOfDogs === numDogs && r.durationMinutes === durationMinutes
  );
  return rate ? rate.ratePerHour : 0.0;
}

// GET /walk-requests
router.get('/', authenticate, (req, res) => {
  let items = [...store.walkRequests.values()];
  if (req.query.status) items = items.filter(wr => wr.status === req.query.status);
  items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const result = paginate(items, req.query.page, req.query.pageSize);
  result.data = result.data.map(formatWalkRequest);
  res.json(result);
});

// POST /walk-requests
router.post('/', authenticate, (req, res) => {
  const {
    ownerId, dogIds, requestedDate, requestedStartTime, durationMinutes,
    walkType, preferredWalkerId, notes,
  } = req.body;
  const now = new Date().toISOString();
  const wr = {
    id: uuidv4(),
    ownerId,
    dogIds,
    preferredWalkerId: preferredWalkerId !== undefined ? preferredWalkerId : null,
    requestedDate,
    requestedStartTime,
    durationMinutes,
    walkType,
    notes: notes !== undefined ? notes : null,
    status: 'pending',
    declineReason: null,
    walkId: null,
    recurringWalkId: null,
    createdAt: now,
    updatedAt: now,
  };
  store.walkRequests.set(wr.id, wr);
  res.status(201).json(formatWalkRequest(wr));
});

// GET /walk-requests/:requestId
router.get('/:requestId', authenticate, (req, res) => {
  const wr = store.walkRequests.get(req.params.requestId);
  if (!wr) {
    return res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: 'Walk request not found.' });
  }
  res.json(formatWalkRequest(wr));
});

// PUT /walk-requests/:requestId
router.put('/:requestId', authenticate, (req, res) => {
  const wr = store.walkRequests.get(req.params.requestId);
  if (!wr) {
    return res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: 'Walk request not found.' });
  }
  const {
    ownerId, dogIds, requestedDate, requestedStartTime, durationMinutes,
    walkType, preferredWalkerId, notes,
  } = req.body;
  Object.assign(wr, {
    ownerId,
    dogIds,
    requestedDate,
    requestedStartTime,
    durationMinutes,
    walkType,
    updatedAt: new Date().toISOString(),
  });
  if (preferredWalkerId !== undefined) wr.preferredWalkerId = preferredWalkerId;
  if (notes !== undefined) wr.notes = notes;
  store.walkRequests.set(wr.id, wr);
  res.json(formatWalkRequest(wr));
});

// DELETE /walk-requests/:requestId
router.delete('/:requestId', authenticate, (req, res) => {
  const wr = store.walkRequests.get(req.params.requestId);
  if (!wr) {
    return res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: 'Walk request not found.' });
  }
  store.walkRequests.delete(req.params.requestId);
  res.status(204).send();
});

// POST /walk-requests/:requestId/accept - walker only
router.post('/:requestId/accept', authenticate, requireRole('walker'), (req, res) => {
  const wr = store.walkRequests.get(req.params.requestId);
  if (!wr) {
    return res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: 'Walk request not found.' });
  }
  if (wr.status !== 'pending') {
    return res.status(400).json({
      code: 'INVALID_STATE_TRANSITION',
      message: 'This action cannot be performed on a resource in its current status.',
    });
  }

  const { walkerId, confirmedDate, confirmedStartTime, notes } = req.body;
  const walker = store.walkers.get(walkerId);
  const agreedRate = resolveRate(walker, wr.walkType, wr.dogIds.length, wr.durationMinutes);

  const now = new Date().toISOString();
  const walkId = uuidv4();
  const walk = {
    id: walkId,
    requestId: wr.id,
    ownerId: wr.ownerId,
    walkerId,
    dogIds: wr.dogIds,
    scheduledDate: confirmedDate,
    scheduledStartTime: confirmedStartTime,
    durationMinutes: wr.durationMinutes,
    walkType: wr.walkType,
    agreedRate,
    status: 'scheduled',
    routeNotes: notes !== undefined ? notes : null,
    actualStartTime: null,
    actualEndTime: null,
    distanceKm: null,
    summaryNotes: null,
    cancelReason: null,
    createdAt: now,
    updatedAt: now,
  };
  store.walks.set(walkId, walk);

  wr.status = 'accepted';
  wr.walkId = walkId;
  wr.updatedAt = now;
  store.walkRequests.set(wr.id, wr);

  res.json(formatWalk(walk));
});

// POST /walk-requests/:requestId/decline - walker only
router.post('/:requestId/decline', authenticate, requireRole('walker'), (req, res) => {
  const wr = store.walkRequests.get(req.params.requestId);
  if (!wr) {
    return res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: 'Walk request not found.' });
  }
  if (wr.status !== 'pending') {
    return res.status(400).json({
      code: 'INVALID_STATE_TRANSITION',
      message: 'This action cannot be performed on a resource in its current status.',
    });
  }
  wr.status = 'declined';
  if (req.body && req.body.reason) wr.declineReason = req.body.reason;
  wr.updatedAt = new Date().toISOString();
  store.walkRequests.set(wr.id, wr);
  res.json(formatWalkRequest(wr));
});

module.exports = router;

const router = require('express').Router({ mergeParams: true });
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

function formatDog(dog) {
  const result = {
    id: dog.id,
    ownerId: dog.ownerId,
    name: dog.name,
    breed: dog.breed,
    dateOfBirth: dog.dateOfBirth,
    createdAt: dog.createdAt,
    updatedAt: dog.updatedAt,
  };
  const optionals = ['sex', 'colour', 'microchipNumber', 'vaccinations', 'vetContact', 'medicalNotes', 'behaviourNotes'];
  optionals.forEach(f => { if (dog[f] !== undefined) result[f] = dog[f]; });
  return result;
}

function checkOwnerAccess(req, res, ownerId) {
  if (req.user.role === 'owner') {
    const userOwner = [...store.owners.values()].find(o => o.userId === req.user.sub);
    if (!userOwner || userOwner.id !== ownerId) {
      res.status(403).json({ code: 'FORBIDDEN', message: 'You can only access your own records.' });
      return false;
    }
  }
  return true;
}

// GET /owners/:ownerId/dogs
router.get('/', authenticate, (req, res) => {
  const owner = store.owners.get(req.params.ownerId);
  if (!owner) {
    return res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: 'Owner not found.' });
  }
  if (!checkOwnerAccess(req, res, req.params.ownerId)) return;
  const items = [...store.dogs.values()].filter(d => d.ownerId === req.params.ownerId);
  const result = paginate(items, req.query.page, req.query.pageSize);
  result.data = result.data.map(formatDog);
  res.json(result);
});

// POST /owners/:ownerId/dogs
router.post('/', authenticate, (req, res) => {
  const owner = store.owners.get(req.params.ownerId);
  if (!owner) {
    return res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: 'Owner not found.' });
  }
  if (!checkOwnerAccess(req, res, req.params.ownerId)) return;
  const now = new Date().toISOString();
  const dog = {
    id: uuidv4(),
    ownerId: req.params.ownerId,
    name: req.body.name,
    breed: req.body.breed,
    dateOfBirth: req.body.dateOfBirth,
    createdAt: now,
    updatedAt: now,
  };
  const optionals = ['sex', 'colour', 'microchipNumber', 'vaccinations', 'vetContact', 'medicalNotes', 'behaviourNotes'];
  optionals.forEach(f => { if (req.body[f] !== undefined) dog[f] = req.body[f]; });
  store.dogs.set(dog.id, dog);
  res.status(201).json(formatDog(dog));
});

// GET /owners/:ownerId/dogs/:dogId
router.get('/:dogId', authenticate, (req, res) => {
  const owner = store.owners.get(req.params.ownerId);
  if (!owner) {
    return res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: 'Owner not found.' });
  }
  if (!checkOwnerAccess(req, res, req.params.ownerId)) return;
  const dog = store.dogs.get(req.params.dogId);
  if (!dog || dog.ownerId !== req.params.ownerId) {
    return res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: 'Dog not found.' });
  }
  res.json(formatDog(dog));
});

// PUT /owners/:ownerId/dogs/:dogId
router.put('/:dogId', authenticate, (req, res) => {
  const owner = store.owners.get(req.params.ownerId);
  if (!owner) {
    return res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: 'Owner not found.' });
  }
  if (!checkOwnerAccess(req, res, req.params.ownerId)) return;
  const dog = store.dogs.get(req.params.dogId);
  if (!dog || dog.ownerId !== req.params.ownerId) {
    return res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: 'Dog not found.' });
  }
  Object.assign(dog, {
    name: req.body.name,
    breed: req.body.breed,
    dateOfBirth: req.body.dateOfBirth,
    updatedAt: new Date().toISOString(),
  });
  const optionals = ['sex', 'colour', 'microchipNumber', 'vaccinations', 'vetContact', 'medicalNotes', 'behaviourNotes'];
  optionals.forEach(f => { if (req.body[f] !== undefined) dog[f] = req.body[f]; });
  store.dogs.set(dog.id, dog);
  res.json(formatDog(dog));
});

// DELETE /owners/:ownerId/dogs/:dogId
router.delete('/:dogId', authenticate, (req, res) => {
  const owner = store.owners.get(req.params.ownerId);
  if (!owner) {
    return res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: 'Owner not found.' });
  }
  if (!checkOwnerAccess(req, res, req.params.ownerId)) return;
  const dog = store.dogs.get(req.params.dogId);
  if (!dog || dog.ownerId !== req.params.ownerId) {
    return res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: 'Dog not found.' });
  }
  store.dogs.delete(req.params.dogId);
  res.status(204).send();
});

module.exports = router;

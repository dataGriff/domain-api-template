const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { store, resetStore } = require('../src/store');
const { signAccessToken, signRefreshToken } = require('../src/auth');
const app = require('../src/app');

async function createUser(email, password, firstName, lastName, role) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = uuidv4();
  const now = new Date().toISOString();
  const user = { id: userId, email, password: hashedPassword, firstName, lastName, role, createdAt: now };
  store.users.set(userId, user);
  return user;
}

function tokenForUser(user) {
  return signAccessToken({ sub: user.id, email: user.email, role: user.role });
}

async function createWalkerUser(overrides = {}) {
  const email = overrides.email || `walker-${uuidv4()}@test.com`;
  const user = await createUser(email, 'password123', 'Test', 'Walker', 'walker');
  const now = new Date().toISOString();
  const walker = {
    id: uuidv4(), userId: user.id, firstName: 'Test', lastName: 'Walker',
    email, phone: '', createdAt: now, updatedAt: now,
  };
  store.walkers.set(walker.id, walker);
  return user;
}

async function createOwnerUser(overrides = {}) {
  const email = overrides.email || `owner-${uuidv4()}@test.com`;
  const user = await createUser(email, 'password123', 'Test', 'Owner', 'owner');
  const now = new Date().toISOString();
  const owner = {
    id: uuidv4(), userId: user.id, firstName: 'Test', lastName: 'Owner',
    email, phone: '', createdAt: now, updatedAt: now,
  };
  store.owners.set(owner.id, owner);
  return user;
}

async function createWalkerToken(overrides = {}) {
  const user = await createWalkerUser(overrides);
  return { token: tokenForUser(user), user };
}

async function createOwnerToken(overrides = {}) {
  const user = await createOwnerUser(overrides);
  return { token: tokenForUser(user), user };
}

function seedWalker(overrides = {}) {
  const now = new Date().toISOString();
  const walker = {
    id: uuidv4(),
    firstName: 'Jane',
    lastName: 'Walker',
    email: `walker-${uuidv4()}@test.com`,
    phone: '01234567890',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
  store.walkers.set(walker.id, walker);
  return walker;
}

function seedOwner(overrides = {}) {
  const now = new Date().toISOString();
  const owner = {
    id: uuidv4(),
    firstName: 'John',
    lastName: 'Owner',
    email: `owner-${uuidv4()}@test.com`,
    phone: '01234567891',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
  store.owners.set(owner.id, owner);
  return owner;
}

function seedDog(ownerId, overrides = {}) {
  const now = new Date().toISOString();
  const dog = {
    id: uuidv4(),
    ownerId,
    name: 'Buddy',
    breed: 'Golden Retriever',
    dateOfBirth: '2022-01-01',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
  store.dogs.set(dog.id, dog);
  return dog;
}

function seedWalkRequest(overrides = {}) {
  const now = new Date().toISOString();
  const wr = {
    id: uuidv4(),
    ownerId: uuidv4(),
    dogIds: [uuidv4()],
    preferredWalkerId: null,
    requestedDate: '2026-06-01',
    requestedStartTime: '09:00:00Z',
    durationMinutes: 60,
    walkType: 'solo_walk',
    notes: null,
    status: 'pending',
    declineReason: null,
    walkId: null,
    recurringWalkId: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
  store.walkRequests.set(wr.id, wr);
  return wr;
}

function seedWalk(overrides = {}) {
  const now = new Date().toISOString();
  const walk = {
    id: uuidv4(),
    requestId: uuidv4(),
    ownerId: uuidv4(),
    walkerId: uuidv4(),
    dogIds: [uuidv4()],
    scheduledDate: '2026-06-01',
    scheduledStartTime: '09:00:00Z',
    durationMinutes: 60,
    walkType: 'solo_walk',
    agreedRate: 15.0,
    status: 'scheduled',
    routeNotes: null,
    actualStartTime: null,
    actualEndTime: null,
    distanceKm: null,
    summaryNotes: null,
    cancelReason: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
  store.walks.set(walk.id, walk);
  return walk;
}

function seedInvoice(overrides = {}) {
  const now = new Date().toISOString();
  store.invoiceCounter = (store.invoiceCounter || 0) + 1;
  const year = new Date().getFullYear();
  const invoiceNumber = `INV-${year}-${String(store.invoiceCounter).padStart(4, '0')}`;
  const lineItems = overrides.lineItems || [
    { walkId: uuidv4(), description: 'Solo walk 60min', quantity: 1, unitPrice: 15.0, total: 15.0 },
  ];
  const subtotal = lineItems.reduce((s, li) => s + li.total, 0);
  const invoice = {
    id: uuidv4(),
    invoiceNumber,
    ownerId: uuidv4(),
    walkerId: uuidv4(),
    lineItems,
    subtotal,
    taxRate: 0.0,
    taxAmount: 0.0,
    total: subtotal,
    dueDate: '2026-07-01',
    status: 'draft',
    notes: null,
    paidAt: null,
    paymentMethod: null,
    paymentReference: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
  store.invoices.set(invoice.id, invoice);
  return invoice;
}

module.exports = {
  app,
  store,
  resetStore,
  createUser,
  createWalkerToken,
  createOwnerToken,
  seedWalker,
  seedOwner,
  seedDog,
  seedWalkRequest,
  seedWalk,
  seedInvoice,
  tokenForUser,
};

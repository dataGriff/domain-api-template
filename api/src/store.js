const { v4: uuidv4 } = require('uuid');

let store = {
  users: new Map(),
  owners: new Map(),
  walkers: new Map(),
  dogs: new Map(),
  interestRequests: new Map(),
  walkRequests: new Map(),
  walks: new Map(),
  walkUpdates: new Map(),
  recurringWalks: new Map(),
  invoices: new Map(),
  invoiceCounter: 0,
};

function resetStore() {
  store.users = new Map();
  store.owners = new Map();
  store.walkers = new Map();
  store.dogs = new Map();
  store.interestRequests = new Map();
  store.walkRequests = new Map();
  store.walks = new Map();
  store.walkUpdates = new Map();
  store.recurringWalks = new Map();
  store.invoices = new Map();
  store.invoiceCounter = 0;
}

module.exports = { store, resetStore };

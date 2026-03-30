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

function calcInvoice(lineItems) {
  const items = lineItems.map(li => ({
    ...li,
    total: parseFloat(((li.quantity * li.unitPrice)).toFixed(2)),
  }));
  const subtotal = parseFloat(items.reduce((sum, li) => sum + li.total, 0).toFixed(2));
  const taxRate = 0.0;
  const taxAmount = 0.0;
  const total = parseFloat((subtotal + taxAmount).toFixed(2));
  return { items, subtotal, taxRate, taxAmount, total };
}

function formatInvoice(invoice) {
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    ownerId: invoice.ownerId,
    walkerId: invoice.walkerId,
    lineItems: invoice.lineItems,
    subtotal: invoice.subtotal,
    taxRate: invoice.taxRate,
    taxAmount: invoice.taxAmount,
    total: invoice.total,
    dueDate: invoice.dueDate,
    status: invoice.status,
    notes: invoice.notes !== undefined ? invoice.notes : null,
    paidAt: invoice.paidAt !== undefined ? invoice.paidAt : null,
    paymentMethod: invoice.paymentMethod !== undefined ? invoice.paymentMethod : null,
    paymentReference: invoice.paymentReference !== undefined ? invoice.paymentReference : null,
    createdAt: invoice.createdAt,
    updatedAt: invoice.updatedAt,
  };
}

// GET /invoices
router.get('/', authenticate, (req, res) => {
  let items = [...store.invoices.values()];
  if (req.query.status) items = items.filter(inv => inv.status === req.query.status);
  items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const result = paginate(items, req.query.page, req.query.pageSize);
  result.data = result.data.map(formatInvoice);
  res.json(result);
});

// POST /invoices
router.post('/', authenticate, (req, res) => {
  const { ownerId, walkerId, lineItems, dueDate, notes } = req.body;
  const now = new Date().toISOString();
  store.invoiceCounter = (store.invoiceCounter || 0) + 1;
  const year = new Date().getFullYear();
  const invoiceNumber = `INV-${year}-${String(store.invoiceCounter).padStart(4, '0')}`;

  const { items, subtotal, taxRate, taxAmount, total } = calcInvoice(lineItems);

  const invoice = {
    id: uuidv4(),
    invoiceNumber,
    ownerId,
    walkerId,
    lineItems: items,
    subtotal,
    taxRate,
    taxAmount,
    total,
    dueDate,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };
  if (notes !== undefined) invoice.notes = notes;
  store.invoices.set(invoice.id, invoice);
  res.status(201).json(formatInvoice(invoice));
});

// GET /invoices/:invoiceId
router.get('/:invoiceId', authenticate, (req, res) => {
  const invoice = store.invoices.get(req.params.invoiceId);
  if (!invoice) {
    return res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: 'Invoice not found.' });
  }
  res.json(formatInvoice(invoice));
});

// PUT /invoices/:invoiceId
router.put('/:invoiceId', authenticate, (req, res) => {
  const invoice = store.invoices.get(req.params.invoiceId);
  if (!invoice) {
    return res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: 'Invoice not found.' });
  }
  const { ownerId, walkerId, lineItems, dueDate, notes } = req.body;
  if (ownerId !== undefined) invoice.ownerId = ownerId;
  if (walkerId !== undefined) invoice.walkerId = walkerId;
  if (dueDate !== undefined) invoice.dueDate = dueDate;
  if (notes !== undefined) invoice.notes = notes;
  if (lineItems !== undefined) {
    const { items, subtotal, taxRate, taxAmount, total } = calcInvoice(lineItems);
    invoice.lineItems = items;
    invoice.subtotal = subtotal;
    invoice.taxRate = taxRate;
    invoice.taxAmount = taxAmount;
    invoice.total = total;
  }
  invoice.updatedAt = new Date().toISOString();
  store.invoices.set(invoice.id, invoice);
  res.json(formatInvoice(invoice));
});

// POST /invoices/:invoiceId/send
router.post('/:invoiceId/send', authenticate, (req, res) => {
  const invoice = store.invoices.get(req.params.invoiceId);
  if (!invoice) {
    return res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: 'Invoice not found.' });
  }
  if (invoice.status !== 'draft') {
    return res.status(400).json({
      code: 'INVALID_STATE_TRANSITION',
      message: 'Invoice can only be sent when in draft status.',
    });
  }
  invoice.status = 'sent';
  invoice.updatedAt = new Date().toISOString();
  store.invoices.set(invoice.id, invoice);
  res.json(formatInvoice(invoice));
});

// POST /invoices/:invoiceId/pay
router.post('/:invoiceId/pay', authenticate, (req, res) => {
  const invoice = store.invoices.get(req.params.invoiceId);
  if (!invoice) {
    return res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: 'Invoice not found.' });
  }
  if (invoice.status !== 'sent') {
    return res.status(400).json({
      code: 'INVALID_STATE_TRANSITION',
      message: 'Invoice can only be paid when in sent status.',
    });
  }
  const { paymentMethod, paidAt, reference } = req.body;
  invoice.status = 'paid';
  invoice.paymentMethod = paymentMethod;
  invoice.paidAt = paidAt;
  if (reference !== undefined) invoice.paymentReference = reference;
  invoice.updatedAt = new Date().toISOString();
  store.invoices.set(invoice.id, invoice);
  res.json(formatInvoice(invoice));
});

module.exports = router;

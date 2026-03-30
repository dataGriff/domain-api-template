const router = require('express').Router();

router.use(require('./auth'));
router.use('/interest-requests', require('./interestRequests'));
router.use('/owners', require('./owners'));
router.use('/walkers', require('./walkers'));
router.use('/walk-requests', require('./walkRequests'));
router.use('/walks', require('./walks'));
router.use('/recurring-walks', require('./recurringWalks'));
router.use('/invoices', require('./invoices'));

module.exports = router;

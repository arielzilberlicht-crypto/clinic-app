const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('./authMiddleware');

router.use('/auth', require('./routes/auth'));

// Everything below requires a valid Hub session.
router.use(requireAuth);
router.use('/overview', require('./routes/overview'));
router.use('/needs-attention', require('./routes/needsAttention'));
router.use('/today', require('./routes/today'));
router.use('/leads', require('./routes/leads'));
router.use('/patients', require('./routes/patientCard'));
// Sends real WhatsApp feedback requests - doctor only, per the brief.
router.use('/feedback', requireRole('DOCTOR'), require('./routes/feedback'));

module.exports = router;

const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const requireStaff = require('../middleware/requireStaff');

const router = express.Router();

router.get('/me', requireAuth, requireStaff, (req, res) => {
    res.json({
        success: true,
        user: {
            id: req.user.id,
            email: req.user.email,
            role: req.profile.role
        }
    });
});

module.exports = router;

const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/profile', auth, (req, res) => {
  res.json({
    message: 'Dostęp do chronionego zasobu',
    user: {
      id: req.user.id,
      email: req.user.email,
    },
  });
});

module.exports = router;
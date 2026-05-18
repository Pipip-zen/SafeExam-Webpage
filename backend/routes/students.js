const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Students endpoint is ready' });
});

module.exports = router;

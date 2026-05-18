const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Violations endpoint is ready' });
});

module.exports = router;

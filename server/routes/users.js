const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all users (excluding current user)
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find(
      { _id: { $ne: req.user._id } },
      { username: 1, email: 1, isOnline: 1, lastSeen: 1 }
    ).sort({ isOnline: -1, lastSeen: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

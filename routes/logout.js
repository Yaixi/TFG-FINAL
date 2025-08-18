const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    req.flash('success_msg', 'You are logged out');
    res.redirect('/login');
  });
});

module.exports = router;

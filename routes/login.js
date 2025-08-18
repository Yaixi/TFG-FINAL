var express = require('express');
var router = express.Router();
const passport = require("passport");

/* GET login form */
router.get('/', (req, res) => {
  res.render('login', { message: req.flash('loginMessage') });
});

/* POST login form */
router.post('/', passport.authenticate('local-login', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}));

module.exports = router;

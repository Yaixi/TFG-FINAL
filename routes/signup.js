var express = require('express');
var router = express.Router();
const passport = require("passport");

/* GET signup form */
router.get('/', (req, res) => {
  res.render('login', { message: req.flash('signupMessage') });
});

/* POST signup form */
router.post('/', passport.authenticate('local-signup', {
  successRedirect: '/',
  failureRedirect: '/signup',
  failureFlash: true
}));

module.exports = router;

var express = require('express');
var router = express.Router();
const userHelpers = require('../../helpers/user-helpers')

/* GET home page. */
router.get('/',(req,res,next) => {
  if(req.session.loggedIn){
    res.redirect('/home')
  }else{
    res.render('indexes/user-login',{ErrorLogin : req.session.errorLogin, Blocked: req.session.blocked});
    req.session.errorLogin = false;
    req.session.blocked = false;
  }
})

router.post('/', function(req, res, next) {
  req.session.loginDetails = req.body;
  userHelpers.doLogin(req.body).then((result) => {
    if(result.status){
      req.session.loggedIn = true;
      req.session.user=result.user
      res.redirect('/home');
    }else if(result.blocked){
      req.session.loggedIn = false;
      req.session.blocked = true;
      res.redirect('/login')
    }else{
      req.session.loggedIn = false;
      req.session.errorLogin = true;
      res.redirect('/login')
    }
  
  }).catch((err) => {
    next()
  })
});

module.exports = router;

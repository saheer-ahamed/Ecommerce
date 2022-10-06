var express = require('express');
var router = express.Router();
const userHelpers = require('../../helpers/user-helpers')

let otpDone = (req, res, next) => {
  if (req.session.otpDone) {
    next()
  } else {
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('indexes/sign-up', {userExists: req.session.userexists});
  req.session.userexists = false;
});

router.post('/', (req,res,next) => {
    req.session.signupData = req.body;
    userHelpers.signUp(req.body).then((data) => {
      if(data){
        console.log('helloiooooooooooooooooo');
        req.session.registered = true;
        res.redirect('/signup/verifyotp')
      }else{
        req.session.userexists = true;
        res.redirect('/signup')
      }
    }).catch((err) => {
      next()
    })
    
})

router.get('/verifyotp', (req,res,next) => {
  if(req.session.registered){
    res.render('indexes/otp',{otpError: req.session.otpError})
    req.session.otpError = false;
  }else{
    res.redirect('/signup');
  }
})

router.post('/verifyotp', (req,res,next) => {
  userHelpers.OTPVerify(req.session.signupData, req.body).then((data) => {
    if(data){
      req.session.otpDone = true;
      res.redirect('/login')
    }else{
      req.session.otpError = true;
      res.redirect('/signup/verifyotp')
    }
  }).catch((err) => {
    next()
  })
})

router.get('/resendotp', (req,res,next) => {
  userHelpers.resendOTP(req.session.signupData)
    res.redirect('/signup/verifyotp')
})

module.exports = router;

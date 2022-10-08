var express = require('express');
var router = express.Router();
const productHelpers = require('../../helpers/product-helpers')
const cartHelpers = require('../../helpers/cart_helpers')
const bannerHelpers = require('../../helpers/banner-helpers')


router.get('/', async (req, res, next) => {
  if (req.session.loggedIn) {
    let cartCount = await cartHelpers.getCartCount(req.session.user._id)
    const banners = await bannerHelpers.viewBanners()
    productHelpers.viewProduct().then((data) => {
      res.render('users/home', { data, cartCount, banners, home: true})
    }).catch((err) => {
      next()
    })
  } else if (req.session.blockeduser) {
    res.redirect('/login')
  } else {
    res.redirect('/')
  }
});


module.exports = router;

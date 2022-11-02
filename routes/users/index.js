var express = require('express');
var router = express.Router();
const collection = require('../../config/collections');
const udata = require('../../config/Schemas');
const mongoose = require('mongoose')
const productHelpers = require('../../helpers/product-helpers')
const cartHelpers = require('../../helpers/cart_helpers');
const wishlistHelpers = require('../../helpers/wishlist_helpers')
const addressHelpers = require('../../helpers/address-helpers')
const orderHelpers = require('../../helpers/orders-helpers')
const userHelpers = require('../../helpers/user-helpers');
const couponHelpers = require('../../helpers/coupon-helpers');
const bannerHelpers = require('../../helpers/banner-helpers');
const Contact = mongoose.model(collection.CONTACT_COLLECTION, udata.contactSchema);

// Verify Login

let verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next()
  } else {
    res.redirect('/login')
  }
}

let verifyCart = (req, res, next) => {
  if (!req.session.cartempty) {
    next()
  } else {
    res.redirect('/cart')
  }
}

// Index Page

router.get('/', async (req, res, next) => {
  if (req.session.loggedIn) {
    res.redirect('/home');
  } else {
    const banners = await bannerHelpers.viewBanners()
    productHelpers.viewProduct().then((data) => {
      res.render('indexes/index', { data, cartCount: 0, banners, home: true })
    }).catch((err) => {
      next()
    })
  }
});

// Product Details Page

router.get('/productDetails/:id', async (req, res, next) => {
  if (req.session.loggedIn) {
    let cartCount = await cartHelpers.getCartCount(req.session.user._id)
    productHelpers.eachProduct(req.params.id).then((prodDetails) => {
      res.render('users/productDetails', { prodDetails, user: true, cartCount })
    }).catch((err) => {
      next()
    })
  } else {
    productHelpers.eachProduct(req.params.id).then((prodDetails) => {
      res.render('users/productDetails', { prodDetails, user: false, cartCount: 0 })
    }).catch((err) => {
      next()
    });
  }
});

// Products Shop Page

router.get('/shop', async (req, res, next) => {
  if (req.session.loggedIn) {
    let cartCount = await cartHelpers.getCartCount(req.session.user._id)
    productHelpers.viewProduct().then((data) => {
      res.render('users/shop', { data, user: true, cartCount, shop: true, false: true })
    }).catch((err) => {
      next()
    })
  } else {
    productHelpers.viewProduct().then((data) => {
      res.render('users/shop', { data, cartCount: 0, shop: true })
    }).catch((err) => {
      next()
    })
  }
});

// User Cart

router.get('/cart', verifyLogin, async (req, res, next) => {
  let cartCount = await cartHelpers.getCartCount(req.session.user._id)
  cartHelpers.getCartProducts(req.session.user._id).then((result) => {
    if (result.cartempty) {
      res.render('users/cart', { fullCartItem, user: true, cartCount, cartnull: true })
    } else {
      var fullCartItem = result.cartItems;
      res.render('users/cart', { fullCartItem, user: true, cartCount, cartfill: true })
    }
  }).catch((err) => {
    next()
  })
});

router.get('/addToCart/:id/:quantity/:sellprice', (req, res, next) => {
  if (req.session.loggedIn) {
    cartHelpers.addToCart(req.params.id, req.session.user._id, req.params.quantity, req.params.sellprice).then(() => {
      res.json({ status: true })
    }).catch((err) => {
      next()
    })
  } else {
    res.json({ status: false })
  }
});

router.get('/removeCartItem/:id', verifyLogin, (req, res, next) => {
  cartHelpers.removeCartItem(req.params.id, req.session.user._id).then(() => {
    res.redirect('back')
  }).catch((err) => {
    next()
  })
});

// Wishlist Page

router.get('/addToWishlist/:id', verifyLogin, (req, res, next) => {
  wishlistHelpers.addToWishlist(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true })
  }).catch((err) => {
    next()
  })
});

router.get('/wishlist', verifyLogin, async (req, res, next) => {
  let cartCount = await cartHelpers.getCartCount(req.session.user._id)
  await wishlistHelpers.wishlistProducts(req.session.user._id).then((wishlistItems) => {
    if (wishlistItems.empty) {
      res.render('users/wishlist', { user: true, cartCount, empty: true })
    } else {
      res.render('users/wishlist', { wishlistItems, user: true, cartCount, wishfill: true })
    }
  }).catch((err) => {
    next()
  })
});

router.get('/removeWishlistItem/:id', (req, res, next) => {
  wishlistHelpers.removeWishlistItem(req.params.id, req.session.user._id).then(() => {
    res.redirect('back')
  }).catch((err) => {
    next()
  })
});

// Checkout Page

router.get('/cart/checkout', verifyLogin, verifyCart, async (req, res, next) => {

  if (!req.session.cartempty) {
    const objCartItem = await cartHelpers.getCartProducts(req.session.user._id);
    const fullCartProds = objCartItem.cartItems;
    const coupons = await couponHelpers.viewCoupons()
    console.log(coupons);
    await addressHelpers.getAddresses(req.session.user._id).then((allAddresses) => {
      const eachAddresses = allAddresses?.addresses;
      const coupon = req.session?.couponDetails

      fullCartProds.Total = Number(fullCartProds.SubTotal) - Number(coupon?.discount || 0)

      res.render('users/checkout', { fullCartProds, eachAddresses, coupon, coupons })
    }).catch((err) => {
      next()
    })
  } else {
    res.redirect('/cart')
  }
}),

  router.post('/applyCoupon', (req, res, next) => {
    couponHelpers.applyCoupon(req.body, req.session.user._id).then((result) => {
      if (result.noMinPurchase) {
        res.json({ status: false, noMinPurchase: true, minPurchaseAmount: result.MinPurchaseAmount })
      } else if (result.couponUsed || result.NoCoupon) {
        res.json({ status: false, couponUsed: true })
      } else {
        req.session.couponDetails = result;
        res.json(req.session?.couponDetails);
      }
    }).catch((err) => {
      next()
    })
  })

router.get('/chosenAddress/:id', verifyLogin, (req, res, next) => {
  addressHelpers.getbtnAddress(req.session.user._id, req.params.id).then((data) => {
    res.json(data)
  }).catch((err) => {
    next()
  })
})

// Placing order

router.post('/placed-order', verifyLogin, async (req, res, next) => {
  await orderHelpers.addOrder(req.session.user._id, req.body, req.session?.couponDetails).then((data) => {
    req.session.placeOrder = true;
    if (data.paymentMethod === 'Razorpay') {
      orderHelpers.generateRazorPay(data).then((response) => {
        req.session.couponDetails = null;
        res.json(response)
      }).catch((err) => {
        next()
      })
    } else {
      req.session.couponDetails = null;
      res.json({ status: false })
    }
  }).catch((err) => {
    next()
  })
})

// Veifying Payment

router.post('/verify-payment', (req, res, next) => {
  orderHelpers.verifyPayment(req.body).then(() => {
    orderHelpers.changePaymentStatus(req.body['orderData[receipt]']).then(() => {
      res.json({ status: true })
    }).catch((err) => {
      next()
    })
  }).catch((err) => {
    res.json({ status: false })
  })
})

// Order Success Page

router.get('/orderSuccess', verifyLogin, async (req, res, next) => {
  if (req.session.placeOrder) {
    let cartCount = await cartHelpers.getCartCount(req.session.user._id)
    res.render('users/YourAccount/orderSuccess', {cartCount})
    req.session.placeOrder = false;
    console.log('Success');
  } else {
    res.redirect('/cart')
  }
})

// User Account

router.get('/yourAccount', verifyLogin, async (req, res, next) => {
  let cartCount = await cartHelpers.getCartCount(req.session.user._id)
  res.render('users/YourAccount/yourAccount', {cartCount});
})

// Your Address Page

router.get('/yourAddresses', verifyLogin, async (req, res, next) => {
  let cartCount = await cartHelpers.getCartCount(req.session.user._id)
  await addressHelpers.getAddresses(req.session.user._id).then((allAddress) => {
    req.session.allAddress = allAddress;
    let eachAddresses = req.session?.allAddress?.addresses;
    res.render('users/YourAccount/yourAddresses', { eachAddresses, cartCount });
  }).catch((err) => {
    next()
  })
})

router.post('/addAddress', verifyLogin, (req, res, next) => {

  addressHelpers.addAddress(req.session.user._id, req.body).then((data) => {
    res.redirect('/yourAddresses')
  }).catch((err) => {
    next()
  })

})

router.get('/editAddress/:id', verifyLogin, async (req, res, next) => {
  let cartCount = await cartHelpers.getCartCount(req.session.user._id)
  addressHelpers.getbtnAddress(req.session.user._id, req.params.id).then((addressData) => {
    res.render('users/YourAccount/editAddress', { addressData, updated: req.session.updated, cartCount })
    req.session.updated = false;
  }).catch((err) => {
    next()
  })
})

router.post('/updateAddress/:id', verifyLogin, (req, res, next) => {
  addressHelpers.updateAddress(req.session.user._id, req.params.id, req.body).then((data) => {
    req.session.updated = true;
    res.redirect('/yourAddresses')
  }).catch((err) => {
    next()
  })
})

router.get('/deleteAddress/:id', (req, res, next) => {
  addressHelpers.deleteAddress(req.session.user._id, req.params.id).then((data) => {
    res.json({ status: true })
  }).catch((err) => {
    next()
  })
})

// User Profile

router.get('/userProfile', verifyLogin, async (req, res, next) => {
  let cartCount = await cartHelpers.getCartCount(req.session.user._id)
  userHelpers.getUserDetails(req.session.user._id).then((userDetails) => {
    res.render('users/YourAccount/userProfile', { userDetails, cartCount })
  }).catch((err) => {
    next()
  })
})

router.post('/updateProfile', verifyLogin, (req, res, next) => {
  userHelpers.updateUserDetails(req.session.user._id, req.body).then(() => {
    res.redirect('/userProfile');
  }).catch((err) => {
    next()
  })
})

router.get('/changePassword', verifyLogin, async (req, res, next) => {
  let cartCount = await cartHelpers.getCartCount(req.session.user._id)
  res.render('users/YourAccount/change-password', { verification: req.session.verification, errorPass: req.session.errorpass, cartCount })
  req.session.verification = false;
  req.session.errorpass = false;
})

router.post('/updatePassword', verifyLogin, (req, res, next) => {
  userHelpers.updateUserPassword(req.session.user._id, req.body).then((result) => {
    if (result.status) {
      req.session.verification = true;
      res.redirect('/changePassword')
    } else {
      req.session.errorpass = true;
      res.redirect('/changePassword')
    }
  }).catch((err) => {
    next()
  })
})

router.get('/changeMobile', verifyLogin, async (req, res, next) => {
  let cartCount = await cartHelpers.getCartCount(req.session.user._id)
  userHelpers.getUserDetails(req.session.user._id).then((userDetails) => {
    res.render('users/YourAccount/change-mobile', { userDetails, numExists: req.session.numExists, cartCount })
    req.session.numExists = false;
  }).catch((err) => {
    next()
  })
})

router.post('/updateMobile', verifyLogin, (req, res, next) => {
  req.session.newmobile = req.body.mobile;
  userHelpers.updateMobile(req.body).then((data) => {
    if (data) {
      res.redirect('/mobile-otp')
    } else {
      req.session.numExists = true;
      res.redirect('/changeMobile')
    }
  }).catch((err) => {
    next()
  })
})

router.get('/mobile-otp', verifyLogin, async (req, res, next) => {
  let cartCount = await cartHelpers.getCartCount(req.session.user._id)
  res.render('users/YourAccount/mobile-otp', { errOTP: req.session.errOTP, cartCount });
  req.session.errOTP = false;
})

router.get('/resendOTP', verifyLogin, (req, res, next) => {
  userHelpers.resendOTP(req.session.newmobile)
  res.redirect('/mobile-otp')
})

router.post('/mobileOtp', verifyLogin, (req, res, next) => {
  userHelpers.mobileOtpVerify(req.body, req.session.newmobile, req.session.user._id).then((data) => {
    if (data) {
      res.redirect('/changeMobile')
    } else {
      req.session.errOTP = true
      res.redirect('/mobile-otp')
    }
  }).catch((err) => {
    next()
  })
})

// Your Orders Page

router.get('/yourOrders', verifyLogin, async (req, res, next) => {
  let cartCount = await cartHelpers.getCartCount(req.session.user._id)
  orderHelpers.viewUserOrders(req.session.user._id).then((orderData) => {
    res.render('users/YourAccount/yourOrders', { orderData, cartCount });
  }).catch((err) => {
    next()
  })
})

router.get('/orderDetails/:id', verifyLogin, async (req, res, next) => {
  let cartCount = await cartHelpers.getCartCount(req.session.user._id)
  orderHelpers.eachOrder(req.params.id).then((data) => {
    res.render('users/YourAccount/orderDetails', { data, cartCount })
  }).catch((err) => {
    next()
  })
})

router.get('/cancelOrder/:id', (req, res, next) => {
  orderHelpers.cancelOrder(req.params.id).then((data) => {
    res.redirect('back')
  }).catch((err) => {
    next()
  })
})

// About Page

router.get('/about', async (req, res, next) => {
  if (req.session.loggedIn) {
    let cartCount = await cartHelpers.getCartCount(req.session.user._id)
    res.render('users/about', { user: true, about: true, cartCount })
  } else {
    res.render('users/about', { user: false, about: true, cartCount: 0 })
  }
})

// Contact Page

router.get('/contact', async (req, res, next) => {
  try {
    if (req.session.loggedIn) {
      let cartCount = await cartHelpers.getCartCount(req.session.user._id)
      res.render('users/contact', { user: true, contact: true, cartCount })
    } else {
      res.render('users/contact', { user: false, contact: true, cartCount: 0 })
    }
  } catch (error) {
    next()
  }
})

router.post('/contact', async (req, res, next) => {
  try {
    await Contact.create({
      userID: req?.session?.user?._id,
      email: req.body.email,
      msg: req.body.msg
    })
    res.json({ message: "Message sent successfully." })
  } catch (error) {
    next()
  }
})

// Logout router

router.get('/logout', (req, res, next) => {
  req.session.destroy()
  res.redirect('/');
})



module.exports = router;

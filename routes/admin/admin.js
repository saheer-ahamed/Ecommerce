var express = require("express");
var router = express.Router();
const userHelpers = require('../../helpers/user-helpers')
const categoryHelpers = require('../../helpers/category_helpers')
const productHelpers = require('../../helpers/product-helpers')
const orderHelpers = require('../../helpers/orders-helpers')
const couponHelpers = require('../../helpers/coupon-helpers')
const bannerHelpers = require('../../helpers/banner-helpers')

var Handlebars = require('handlebars');


Handlebars.registerHelper("inc", function (value, options) {
  return parseInt(value) + 1;
});



//.......................................................................

const multer = require('multer')
const path = require('path');
const { deleteAddress } = require("../../helpers/address-helpers");

const storage = multer.diskStorage({
  destination: './public/images/productsImg/',
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() +
      path.extname(file.originalname));
  }
})

const storageBanner = multer.diskStorage({
  destination: './public/images/bannersImg/',
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() +
      path.extname(file.originalname));
  }
})

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/webp'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
}

const upload = multer({
  storage: storage,
  limits: { fileSize: 10000000 },
  fileFilter: fileFilter
}).array('images', 4);

const uploadBanner = multer({
  storage: storageBanner,
  limits: { fileSize: 10000000 },
  fileFilter: fileFilter
}).single('Image');

//.......................................................................

let verifyAdmin = (req, res, next) => {
  if (req.session.adminLoggedin) {
    next()
  } else {
    res.redirect('/admin')
  }
}

//.......................................................................

const adminEmail = "adminChess@gmail.com"
const adminPass = '67890';


// .......Admin Login.......

router.get("/", function (req, res, next) {
  if (req.session.adminLoggedin) {
    res.redirect("admin/dashboard");
  } else {
    res.render("admin/admin");
  }
});


// .......Dashboard.......

router.get("/dashboard", async function (req, res, next) {
  try {
    if (req.session.adminLoggedin) {
      let totalSale = await orderHelpers.totalSale()
      let todaySale = await orderHelpers.todaySale()
      let totalOrders = await orderHelpers.totalOrders()
      let todayOrders = await orderHelpers.todayOrders()
      let eachDaySalesDetails = await orderHelpers.eachDaySalesDetails()
      let eachDayOrderDetails = await orderHelpers.eachDayOrderDetails()
      let salesData = await orderHelpers.viewOrders()

      let todayOrderCount = todayOrders?.[0]?.count || 0
      let todaySaleCount = todaySale?.[0]?.totalSale || 0


      res.render("admin/dashboard", { totalSale, todaySaleCount, totalOrders, todayOrderCount, eachDaySalesDetails, eachDayOrderDetails, salesData });
    } else {
      res.redirect('/admin')
    }
  } catch (err) {
    next()
  }

});

router.post("/", function (req, res, next) {
  try {
    if (req.body.adEmail === adminEmail && req.body.adPassword === adminPass) {
      req.session.adminLoggedin = true;
      res.redirect('/admin/dashboard');
    }
    else {
      req.session.adminLoggedin = false;
      res.redirect('/admin')
    }
  } catch (err) {
    next()
  }
});

// .......View Products.......

router.get("/Products/viewProducts", function (req, res, next) {
  try {
    if (req.session.adminLoggedin) {
      productHelpers.viewProduct().then((proDetails) => {
        const errDelete = req.flash('message')
        res.render("admin/Products/viewProducts", { proDetails, errDelete });
      })
    } else {
      res.redirect('/admin')
    }
  } catch (error) {
    next()
  }
});

// .......Add Products.......

router.get("/Products/addProducts", function (req, res, next) {
  try {
    if (req.session.adminLoggedin) {
      productHelpers.productCategories().then((cateView) => {
        res.render("admin/Products/addProducts", { cateView, msg: req.session.error });
      })
    } else {
      res.redirect('/admin')
    }
  } catch (error) {
    next()
  }
});

router.post("/Products/addProducts", function (req, res, next) {
  upload(req, res, (err) => {
    if (err) {
      console.log(err);
      req.session.error = err;
      res.redirect('/admin/Products/addProducts')
    } else {
      productHelpers.Addproduct(req.body, req.files).then((data) => {
        res.redirect('/admin/Products/addProducts')
      }).catch((err) => {
        next()
      })
    }
  })
});

// .......Edit Products.......

router.get("/Products/editproduct/:id", async (req, res, next) => {
  try {
    let product = await productHelpers.getProductdetails(req.params.id)
    let newcateView = await productHelpers.productCategories()
    res.render('admin/Products/editProduct', { product, newcateView })
  } catch (error) {
    next()
  }
});

router.post("/Products/editproduct/:id", (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      console.log(err);
      req.session.error = err;
      res.redirect('/admin/Products/viewProducts')
    } else {
      productHelpers.updateProduct(req.params.id, req.body, req?.files).then((data) => {
        res.redirect('/admin/Products/viewProducts')
      }).catch((err) => {
        next()
      })
    }
  })
});

// .......Delete Products.......

router.get("/deleteProduct/:id", function (req, res, next) {
  productHelpers.deleteProduct(req.params.id).then((data) => {
    if (data.proError) {
      req.flash('message', "This Product is already included in someone's cart or wishlists. It can't be deleted!")
    }
    res.json({ status: true })

  }).catch((err) => {
    next()
  })
})

// .......User Data.......

router.get("/Users", async function (req, res, next) {
  if (req.session.adminLoggedin) {
    userHelpers.getAllUsers().then((userview) => {
      res.render("admin/usersdata", { userview })
    })
  } else {
    res.redirect('/admin')
  }
});

// .......Active/Block User.......

router.get('/block-user/:id', (req, res, next) => {
  let userId = req.params.id
  userHelpers.blockUser(userId).then((response) => {
    res.redirect('/admin/Users')
  }).catch((err) => {
    next()
  })

});

router.get('/active-user/:id', (req, res, next) => {
  let userId = req.params.id
  userHelpers.activeUser(userId).then((response) => {
    res.redirect('/admin/Users')
  }).catch((err) => {
    next()
  })
});

// .......Category Management.......

router.get("/Category/viewCategory", verifyAdmin, function (req, res, next) {
  if (req.session.adminLoggedin) {
    categoryHelpers.viewAllCategories().then((categoryView) => {
      const errorMessage = req.flash('message')
      res.render("admin/Category/viewCategory", { categoryView, errorMessage });
    }).catch((error) => {
      next()
    })
  } else {
    res.redirect('/admin')
  }
});

router.get("/Category/addCategory", verifyAdmin, function (req, res, next) {
  try {
    if (req.session.adminLoggedin) {
      res.render("admin/Category/addCategory", { categoryExists: req.session.categoryExists });
      req.session.categoryExists = false;
    } else {
      res.redirect('/admin')
    }
  } catch (error) {
    next()
  }
});

router.post("/categoryAdded", function (req, res, next) {
  categoryHelpers.addCategory(req.body).then((result) => {
    if (result) {
      res.redirect('/admin/Category/addCategory')
    } else {
      req.session.categoryExists = true;
      res.redirect('/admin/Category/addCategory')
    }
  }).catch((err) => {
    next()
  })

});

router.get("/Category/editCategory/:id", verifyAdmin, async (req, res, next) => {
  try {
    if (req.session.adminLoggedin) {
      let category = await categoryHelpers.getCategorydetails(req.params.id)
      res.render('admin/Category/editCategory', { categoryExists: req.session.categoryExists, category })
      req.session.categoryExists = false;
    } else {
      res.redirect('/admin')
    }
  } catch (error) {
    next()
  }
});

router.post("/Category/updateCategory/:id", async (req, res, next) => {
  categoryHelpers.updateCategory(req.params.id, req.body).then((data) => {
    res.redirect('/admin/Category/viewCategory')
  }).catch((err) => {
    next()
  })
});

router.get("/Category/deleteCategory/:id", function (req, res, next) {
  categoryHelpers.deleteCategory(req.params.id).then((data) => {
    if (data.catError) {
      req.flash('message', "Category is already included in some products. Can't be deleted!");
    }
    console.log(req.flash)
    res.redirect('/admin/Category/viewCategory')
  }).catch((err) => {
    next()
  });
})

// .......Order Data.......

router.get('/orderData', verifyAdmin, (req, res, next) => {
  orderHelpers.viewOrders().then((data) => {
    res.render('admin/Orders/orderData', { data })
  }).catch((err) => {
    next()
  })
})

router.get('/changeOrder/:id', verifyAdmin, (req, res, next) => {
  orderHelpers.changeOrder(req.params.id).then((data) => {
    res.redirect('back')
  }).catch((err) => {
    next()
  })
})

router.get('/orderDetails/:id', verifyAdmin, (req, res, next) => {
  orderHelpers.eachOrder(req.params.id).then((data) => {
    res.render('admin/Orders/eachOrder', { data })
  }).catch((err) => {
    next()
  })
})

router.get('/coupons/viewCoupon', verifyAdmin, (req, res, next) => {
  couponHelpers.viewCoupons().then((coupons) => {
    res.render('admin/Coupons/viewCoupons', { coupons })
  }).catch((err) => {
    next()
  })
})

router.get('/coupons/addCoupon', verifyAdmin, (req, res, next) => {
  res.render('admin/Coupons/addCoupon')
})

router.post('/coupons/addCoupon', verifyAdmin, (req, res, next) => {
  couponHelpers.addCoupon(req.body).then((data) => {
    res.redirect('/admin/coupons/addCoupon');
  }).catch((err) => {
    next()
  })
})

router.get('/deleteCoupon/:id', verifyAdmin, (req, res, next) => {
  couponHelpers.deleteCoupon(req.params.id).then((data) => {
    res.json({ status: true })
  }).catch((err) => {
    next()
  })
})

// Banner Management

router.get('/banners/viewBanners', verifyAdmin, (req, res, next) => {
  bannerHelpers.viewBanners().then((banners) => {
    res.render('admin/Banners/viewBanners', { banners })
  })
})

router.get('/banners/addBanner', verifyAdmin, (req, res, next) => {
  res.render('admin/Banners/addBanner', { error: req.session.error })
  req.session.error = false;
})

router.post('/banners/addBanner', verifyAdmin, (req, res, next) => {
  uploadBanner(req, res, (err) => {
    if (err) {
      req.session.error = true;
      res.redirect('/admin/banners/addBanner')
    } else {
      bannerHelpers.addBanner(req.body, req.file).then((data) => {
        res.redirect('/admin/banners/addBanner')
      }).catch((err) => {
        next()
      })
    }
  })
})

router.get('/banners/editBanner/:id', verifyAdmin, async (req, res, next) => {
  try {
    await bannerHelpers.eachBanner(req.params.id).then((banner) => {
      res.render('admin/Banners/editBanner', { banner })
    })
  } catch (error) {
    next()
  }
})

router.post('/banners/editBanner/:id', verifyAdmin, (req, res, next) => {
  try {
    uploadBanner(req, res, (err) => {
      if (err) {
        res.redirect('/admin/banners/viewBanners')
      } else {
        bannerHelpers.updateBanner(req.params.id, req.body, req?.file).then((data) => {
          res.redirect('/admin/banners/viewBanners')
        })
      }
    })
  } catch (error) {
    next()
  }
})

router.get('/deleteBanner/:id', verifyAdmin, (req, res, next) => {
  try {
    bannerHelpers.deleteBanner(req.params.id).then((data) => {
      res.json({ status: true })
    })
  } catch (error) {
    next()
  }
})

// .......Admin Logout.......

router.get('/adminLogout', (req, res, next) => {
  req.session.destroy()
  res.redirect('/admin');
});


module.exports = router;

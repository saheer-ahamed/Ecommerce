const mongoose = require('mongoose')

module.exports = {
    userSchema: new mongoose.Schema({
        yourname: String,
        email: {
            type: String,
            unique: true
        },
        password: String,
        mobile: {
            type: Number,
            unique: true
        },
        Active: {
            type: Boolean,
            default: true
        }
    },
        { collection: 'Users' }),

    categorySchema: new mongoose.Schema({
        Name: {
            type: String,
            required: true,
            unique: true
        }
    },
        { timestamps: true }),

    productSchema: new mongoose.Schema({
        productName: {
            type: String,
            required: true,
            unique: true
        },
        Description: {
            type: String,
            required: true
        },
        Brand: {
            type: String,
            required: true
        },
        Price: {
            type: Number,
            default: null
        },
        sellPrice: {
            type: Number,
            required: true
        },
        Sold: {
            type: Number,
            default: 0
        },
        Quantity: {
            type: Number,
            required: true
        },
        Specs: {
            type: String,

        },
        Category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'categories'
        },
        Image: {
            type: Array,
            required: true
        }
    }, { timestamps: true }),

    cartSchema: new mongoose.Schema({
        userID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Users'
        },
        cart: [{
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'products'
            },
            quantity: {
                type: Number
            },
            eachTotal: {
                type: Number
            }
        }],
        SubTotal: Number,
        Total: Number
    }, { timestamps: true }),

    wishlistSchema: new mongoose.Schema({
        userID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Users'
        },
        wishlist: [{
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'products'
            }
        }]

    }, { timestamps: true }),

    addressSchema: new mongoose.Schema({
        userID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Users'
        },
        addresses: [{
            fullName: {
                type: String,
                required: true
            },
            apartment: {
                type: String,
                required: true
            },
            street: {
                type: String,
                required: true
            },
            landmark: {
                type: String,
                required: true
            },
            mobile: {
                type: Number,
                required: true
            },
            country: {
                type: String,
                required: true
            },
            state: {
                type: String,
                required: true
            },
            pincode: {
                type: Number,
                required: true
            }
        }]
    }),

    orderSchema: new mongoose.Schema({
        userID: {
            type: String,
            required: true
        },
        deliveryAddress: {
            fullName: {
                type: String,
                required: true
            },
            apartment: {
                type: String,
                required: true
            },
            street: {
                type: String,
                required: true
            },
            landmark: {
                type: String,
                required: true
            },
            mobile: {
                type: Number,
                required: true
            },
            country: {
                type: String,
                required: true
            },
            state: {
                type: String,
                required: true
            },
            pincode: {
                type: Number,
                required: true
            }

        },
        products: [{
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'products'
            },
            quantity: {
                type: Number
            },
            eachTotal: {
                type: Number
            }
        }],
        discount:{
            type: Number,
            default: 0
        },
        SubTotal: {
            type: Number
        },
        Total:{
            type: Number
        },
        paymentMethod: {
            type: String,
            required: true
        },
        paymentStatus: {
            type: String,
            default: "Pending"
            // enum: [

            // ]

        },
        orderStatus: {
            type: String,
            default: "Confirmed"
        },
        refunded: {
            type: String,
            default: false
        }

    }, { timestamps: true }),

    couponSchema: new mongoose.Schema({

        usedUsers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Users'
        }],
        couponName: {
            type: String,
            require: true,
        },
        couponCode: {
            type: String,
            require: true,
            unique: true
        },
        discount: {
            type: Number,
            require: true
        },
        maxLimit: {
            type: Number,
            require: true
        },
        minPurchase: {
            type: Number,
            require: true
        }
    }, { timestamps: true }),

    bannerSchema: new mongoose.Schema({
        bannerHeading: {
            type: String,
            required: true
        },
        bannerSubheading: {
            type: String,
            required: true
        },
        Image: {
            type: String,
            required: true
        }
    })
}

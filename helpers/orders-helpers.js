var collection = require("../config/collections");
var ObjectId = require("mongodb").ObjectId;
var udata = require("../config/Schemas");
const mongoose = require("mongoose");
const Razorpay = require('razorpay');

const Orders = mongoose.model(collection.ORDERS_COLLECTION, udata.orderSchema)
const Coupons = mongoose.model(collection.COUPONS_COLLECTION, udata.couponSchema)
const Cart = mongoose.model(collection.CART_COLLECTION, udata.cartSchema);

var instance = new Razorpay({
    key_id: process.env.YOUR_KEY_ID,
    key_secret: process.env.YOUR_KEY_SECRET,
});

module.exports = {
    addOrder: (userId, inputAddress, couponSession) => {
        return new Promise(async (resolve, reject) => {
            try {
                const { fullName, apartment, street, landmark, mobile, country, state, pincode } = inputAddress;
                let userCart = await Cart.findOne({ userID: userId })
                if (couponSession != null) {
                    var coupon = await Coupons.findOne({ _id: couponSession.couponId })
                    var Total = Number(userCart.SubTotal) - Number(couponSession.discount);
                    Math.round((Total * 100) / 100)
                }

                const newOrder = await Orders.create({
                    userID: userId,
                    deliveryAddress: { fullName, apartment, street, landmark, mobile, country, state, pincode },
                    products: [
                        ...userCart.cart
                    ],
                    discount: couponSession?.discount || 0,
                    SubTotal: userCart.SubTotal,
                    Total: Total || userCart.SubTotal,
                    paymentMethod: inputAddress.payment
                })


                newOrder.save().then((data) => {
                    userCart.remove({});
                    if (couponSession != null) {
                        coupon.usedUsers.push(userId)
                        coupon.save()
                    }
                    resolve(data)
                }).catch((err) => reject(err))
            } catch (error) {
                reject(error)
            }
        })
    },
    viewOrders: () => {
        return new Promise(async (resolve, reject) => {
            await Orders.find({}).populate('products.product').lean().then((data) => {
                resolve(data)
            }).catch((err) => reject(err))
        })
    },
    viewUserOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            await Orders.find({ userID: userId }).sort({ createdAt: -1 }).populate('products.product').lean().then((data) => {
                if (!data) resolve(data)
                resolve(data)
            }).catch((err) => reject(err))
        })
    },
    changeOrder: (orderId) => {
        return new Promise(async (resolve, reject) => {
            await Orders.findOne({ _id: orderId }).then(async (data) => {

                if (data.orderStatus === 'Confirmed') {
                    await Orders.findOneAndUpdate({ _id: orderId }, { orderStatus: "Packed" })
                }
                if (data.orderStatus === 'Packed') {
                    await Orders.findOneAndUpdate({ _id: orderId }, { orderStatus: "Dispatched" })
                }
                if (data.orderStatus === 'Dispatched') {
                    await Orders.findOneAndUpdate({ _id: orderId }, { orderStatus: "outForDelivery" })
                }
                if (data.orderStatus === 'outForDelivery') {
                    await Orders.findOneAndUpdate({ _id: orderId }, { orderStatus: "Delivered", paymentStatus: "Confirmed" })
                }

                resolve(true)
            }).catch((err) => reject(err))
        })
    },
    eachOrder: (orderId) => {
        return new Promise((resolve, reject) => {
            Orders.findOne({ _id: orderId }).populate([{
                path: 'userID',
                model: 'Users'
            }, {
                path: 'products.product',
                model: 'products'
            }]).lean().then((orderData) => {
                resolve(orderData)
            }).catch((err) => reject(err))
        })
    },
    cancelOrder: (orderId) => {
        return new Promise((resolve, reject) => {
            Orders.findOneAndUpdate({ _id: orderId },
                { orderStatus: "Cancelled", refunded: true, paymentStatus: "Refunded" }).then((data) => {
                    resolve(data)
                }).catch((err) => reject(err))
        })
    },
    generateRazorPay: (orderData) => {
        return new Promise((resolve, reject) => {
            try {
                orderData.SubTotal = parseInt(orderData.SubTotal)
                var options = {
                    amount: orderData.Total * 100,  // amount in the smallest currency unit
                    currency: "INR",
                    receipt: "" + orderData._id
                };
                instance.orders.create(options, function (err, order) {
                    if (err) console.log(err);
                    resolve(order)
                });
            } catch (error) {
                reject(error)
            }
        })
    },
    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            try {
                const crypto = require('crypto');
                const hmac = crypto.createHmac('sha256', process.env.YOUR_KEY_SECRET)
                    .update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]'])
                    .digest('hex')
                if (hmac === details['payment[razorpay_signature]']) {
                    resolve()
                } else {
                    reject()
                }
            } catch (error) {
                reject(error)
            }
        })
    },
    changePaymentStatus: async function (orderId) {
        return new Promise(async (resolve, reject) => {
            await Orders.findOneAndUpdate({ _id: ObjectId(orderId) }, { paymentStatus: 'Confirmed' }).then(() => {
                resolve()
            }).catch((err) => reject(err))
        })
    },



    //Chart Helpers


    totalSale: () => {
        return new Promise((resolve, reject) => {
            Orders.aggregate([{ $match: { refunded: "false" } }, {
                $group: {
                    _id: null,
                    totalSale: {
                        $sum: '$Total'
                    }
                }
            }
            ]).then((Data) => {
                resolve(Data[0]?.totalSale)
            }).catch((err) => reject(err))
        })
    },
    todaySale: () => {
        var start = new Date();
        start.setHours(0, 0, 0, 0);

        var end = new Date();
        end.setHours(23, 59, 59, 999);

        return new Promise((resolve, reject) => {
            Orders.aggregate([{ $match: { createdAt: { $gte: start, $lt: end }, refunded: "false" } }, {
                $group: {
                    _id: null,
                    totalSale: {
                        $sum: '$Total'
                    }
                }
            }]).then((todaySale) => {
                resolve(todaySale)
            }).catch((err) => reject(err))
        })
    },
    todayOrders: () => {
        var start = new Date();
        start.setHours(0, 0, 0, 0);

        var end = new Date();
        end.setHours(23, 59, 59, 999);

        return new Promise((resolve, reject) => {
            Orders.aggregate([{ $match: { createdAt: { $gte: start, $lt: end } } },
            { $count: "count" }
            ]).then((data) => {
                resolve(data)
            }).catch((err) => reject(err))
        })
    },
    totalOrders: () => {
        return new Promise((resolve, reject) => {
            Orders.count().then((data) => { resolve(data) }).catch((err) => reject(err))
        })
    },
    eachDaySalesDetails: () => {
        return new Promise((resolve, reject) => {
            Orders.aggregate([{$match: {refunded: "false"}},{
                $group: {
                    _id: {
                        day: {
                            $dayOfMonth: "$createdAt"
                        }, month: {
                            $month: "$createdAt"
                        }, year: {
                            $year: "$createdAt"
                        }
                    },
                    totalSales: { $sum: '$Total' }
                }
            },{$sort: {_id: -1}}]).then((data) => {
                data.sort((a,b) => b._id.month - a._id.month)
                resolve(data)
            }).catch((err) => reject(err))
        })
    },
    eachDayOrderDetails: () => {
        return new Promise((resolve, reject) => {
            Orders.aggregate([{
                $group: {
                    _id: {
                        day: {
                            $dayOfMonth: "$createdAt"
                        },
                        month: {
                            $month: "$createdAt"
                        },
                        year: {
                            $year: "$createdAt"
                        }
                    },
                    count: { $sum: 1 }
                }
            }, { $sort: { _id: -1 } }]).then((data) => {
                data.sort((a,b) => b._id.month - a._id.month)
                resolve(data)
            }).catch((err) => reject(err))
        })
    }
}
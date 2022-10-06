var collection = require("../config/collections");
var udata = require("../config/Schemas");
const mongoose = require("mongoose");
const { response } = require("express");

const Coupons = mongoose.model(collection.COUPONS_COLLECTION, udata.couponSchema)
const Cart = mongoose.model(collection.CART_COLLECTION, udata.cartSchema)

module.exports = {
    addCoupon: (couponBody) => {
        const { couponName, couponCode, discount, minPurchase, maxLimit } = couponBody;
        return new Promise((resolve, reject) => {
            Coupons.create(
                { couponName, couponCode, discount, minPurchase, maxLimit }
            ).then((data) => {
                resolve(data)
            }).catch((err) => reject(err))
        })
    },
    viewCoupons: () => {
        return new Promise(async (resolve, reject) => {
            await Coupons.find({}).lean().then((data) => {
                resolve(data)
            }).catch((err) => reject(err))
        })
    },
    deleteCoupon: (couponId) => {
        return new Promise(async (resolve, reject) => {
            await Coupons.findByIdAndDelete({ _id: couponId }).then((data) => {
                resolve(data)
            }).catch((err) => reject(err))
        })
    },
    applyCoupon: (couponCode, userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const findCoupon = await Coupons.findOne({ couponCode: couponCode.couponCode });
                const userCart = await Cart.findOne({ userID: userId });
                const subTotalPrice = userCart.SubTotal;
                const response = {};
    
                if (findCoupon) {
                    const checkCoupon = findCoupon.usedUsers.includes(userId);
                    if (!checkCoupon) {
                        if (subTotalPrice >= findCoupon.minPurchase) {
                            const discount = ((subTotalPrice * findCoupon.discount) / 100)
                            const validDiscount = discount <= findCoupon.maxLimit ? Number(discount) : Number(findCoupon.maxLimit)
                            resolve({ couponId: findCoupon._id, discount: validDiscount })
                        } else {
                            response.noMinPurchase = true
                            response.MinPurchaseAmount = Number(findCoupon.minPurchase)
                            resolve(response)
                        }
                    } else {
                        response.couponUsed = true
                        resolve(response)
                    }
                }else{
                    response.NoCoupon = true
                    resolve(response)
                }   
            } catch (error) {
                reject(error)
            }
        })
    }
}



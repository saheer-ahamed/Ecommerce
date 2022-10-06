var collection = require("../config/collections");
var ObjectId = require("mongodb").ObjectId;
var udata = require("../config/Schemas");
const mongoose = require("mongoose");

const Cart = mongoose.model(collection.CART_COLLECTION, udata.cartSchema);

module.exports = {
    addToCart: (productID, userID, itemQuantity, itemPrice) => {

        itemQuantity = parseInt(itemQuantity);
        itemPrice = parseInt(itemPrice);
        const eachPriceSum = itemQuantity * itemPrice;

        return new Promise(async (resolve, reject) => {
            try {
                let userCart = await Cart.findOne({ userID: ObjectId(userID) })
                
                if (userCart) {
                    //cart exists for user
                    let itemIndex = userCart.cart.findIndex(p => p.product == productID);
    
                    if (itemIndex > -1) {
                        //product exists in the cart, update the quantity
                        let productItem = userCart.cart[itemIndex];
                        productItem.quantity = parseInt(productItem.quantity)
                        productItem.quantity += itemQuantity;
                        productItem.eachTotal += eachPriceSum;
                        userCart.cart[itemIndex] = productItem;
    
                    } else {
                        //product does not exists in cart, add new item
                        userCart.cart.push({
                            product: ObjectId(productID),
                            quantity: itemQuantity,
                            eachTotal: eachPriceSum
                        });
                    }
                    userCart.SubTotal = userCart.cart.reduce((acc, curr) => {
                        return acc + curr.eachTotal
                    }, 0)
                    userCart.Total = userCart.SubTotal;
    
                    userCart.save().then((data) => resolve(data)).catch((err) => reject(err))
    
                } else {
                    //no cart for user, create new cart
                    const newCart = await Cart.create({
                        userID: ObjectId(userID),
                        cart: [{
                            product: productID,
                            quantity: itemQuantity,
                            eachTotal: eachPriceSum
                        }],
                        SubTotal: eachPriceSum,
                        Total: eachPriceSum
                    });
    
    
                    newCart.save().then((data) => resolve(data))
                }
            } catch (error) {
                reject(error)
            }
        })
    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let response = {}
                response.cartItems = await Cart.findOne({ userID: ObjectId(userId) }).populate('cart.product').lean()
                if (!response.cartItems || response.cartItems.cart.length <= 0) {
                    response.cartempty = true;
                    resolve(response)
                }
                resolve(response)
            } catch (error) {
                reject(error)
            }
        })
    },
    removeCartItem: (productID, userID) => {
        return new Promise(async (resolve, reject) => {
            try {
                let userCart = await Cart.findOne({ userID: ObjectId(userID) })
                const itemIndex = userCart.cart.findIndex(p => p.product == productID);
    
                userCart.cart.splice(itemIndex, 1);
    
                userCart.SubTotal = userCart.cart.reduce((acc, curr) => {
                    return acc + curr.eachTotal
                }, 0)
    
                userCart.save().then((data) => {
                    resolve(data)
                }).catch((err) => reject(err))
            } catch (error) {
                reject(error)
            }
        });
    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let count = 0;
                let cart = await Cart.findOne({ userID: ObjectId(userId) })
    
                if (cart) {
                    count = cart.cart.length;
                    resolve(count)
                } else {
                    resolve(count)
                }
            } catch (error) {
                reject(error)
            }0
        })
    }
}
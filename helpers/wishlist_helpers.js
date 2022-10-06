var collection = require("../config/collections");
var ObjectId = require("mongodb").ObjectId;
var udata = require("../config/Schemas");
const mongoose = require("mongoose");

const Wishlist = mongoose.model(collection.WISHLIST_COLLECTION, udata.wishlistSchema);

module.exports = {
    addToWishlist: (productID, userID) => {
        return new Promise(async (resolve, reject) => {
            try {
                let userWishlist = await Wishlist.findOne({ userID: ObjectId(userID) })
    
                if (userWishlist) {
                    const itemIndex = userWishlist.wishlist.findIndex(product => product.product == productID)
                    if (itemIndex > -1){
                        userWishlist.wishlist.splice(itemIndex, 1)
                        await userWishlist.save()
                    }else{
                        userWishlist.wishlist.push({
                            product: ObjectId(productID)
                        })
                        await userWishlist.save()
                    }
                } else {
                    let wishlistObj = new Wishlist({
                        userID: ObjectId(userID),
                        wishlist: [{
                            product: ObjectId(productID),
                        }]
                    })
                    wishlistObj.save().then((data) => {
                        resolve(data)
                    }).catch((err) => reject(err))
                }
            } catch (error) {
                reject(error)
            }
        })
    },
    wishlistProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let response = {}
                response.wishlistItems = await Wishlist.findOne({ userID: ObjectId(userId) }).populate('wishlist.product').lean()
    
                if (!response.wishlistItems || response.wishlistItems.wishlist.length <= 0) {
                    response.empty = true;
                    resolve(response)
                }
                resolve(response.wishlistItems.wishlist)
            } catch (error) {
                reject(error)
            }
        })
    },
    removeWishlistItem: (productID, userID) => {
        return new Promise(async (resolve, reject) => {

            Wishlist.findOneAndUpdate({ userID: ObjectId(userID) }, {
                $pull: {
                    wishlist: {
                        product: ObjectId(productID),
                    }
                }
            }).then((data) => {
                resolve(data)
            }).catch((err) => reject(err))
        });
    }
}
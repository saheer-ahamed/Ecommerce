var collection = require("../config/collections");
var ObjectId = require("mongodb").ObjectId;
var udata = require("../config/Schemas");
const mongoose = require("mongoose");

const Address = mongoose.model(collection.ADDRESS_COLLECTION, udata.addressSchema)

module.exports = {
    addAddress: (userId, addressData) => {

        const { fullName, apartment, street, landmark, mobile, country, state, pincode } = addressData;
        return new Promise(async (resolve, reject) => {
            try {
                const userAddress = await Address.findOne({ userID: userId })

                if (userAddress) {
                    userAddress.addresses.unshift({
                        fullName, apartment, street, landmark, mobile, country, state, pincode
                    })

                    userAddress.save().then((data) => {
                        resolve(data);
                    }).catch((err) => {
                        reject(err)
                    })
                } else {
                    const newAddress = await Address.create({
                        userID: ObjectId(userId),
                        addresses: [{
                            fullName, apartment, street, landmark, mobile, country, state, pincode
                        }]
                    })
                    newAddress.save().then((data) => {
                        resolve(data);
                    }).catch((err) => {
                        reject(err)
                    })
                }
            } catch (error) {
                reject(error)
            }
        })
    },
    getAddresses: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const allAddress = await Address.findOne({ userID: ObjectId(userId) }).lean()

                if (allAddress) {
                    resolve(allAddress)
                } else {
                    resolve(allAddress)
                }
            } catch (error) {
                reject(error)
            }
        })
    },
    getbtnAddress: (userId, addressId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const address = await Address.findOne({ userID: ObjectId(userId) }).lean()

                const userAddresses = address.addresses.map((eachData) => {
                    if (eachData._id == addressId) {
                        resolve(eachData)
                    }
                })
            } catch (error) {
                reject(error)
            }
        })
    },
    updateAddress: (userId, addressId, addressDetails) => {
        return new Promise(async (resolve, reject) => {
            await Address.findOneAndUpdate({ userID: userId, 'addresses._id': addressId },
                {
                    $set: {
                        'addresses.$.fullName': addressDetails.fullName,
                        'addresses.$.apartment': addressDetails.apartment,
                        'addresses.$.street': addressDetails.street,
                        'addresses.$.landmark': addressDetails.landmark,
                        'addresses.$.mobile': addressDetails.mobile,
                        'addresses.$.country': addressDetails.country,
                        'addresses.$.state': addressDetails.state,
                        'addresses.$.pincode': addressDetails.pincode
                    }

                })
                .then((data) => {
                    resolve(data);
                }).catch((err) => {
                    reject(err)
                })
        })
    },
    deleteAddress: (userId, addressId) => {
        return new Promise(async (resolve, reject) => {
            let userAddress = await Address.findOneAndUpdate({ userID: userId }, {
                $pull: {
                    addresses: {
                        _id: addressId
                    }
                }
            }).then((data) => resolve(data)).catch((err) => {reject(err)})
        })
    }
}
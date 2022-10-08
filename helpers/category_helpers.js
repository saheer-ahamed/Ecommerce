var collection = require("../config/collections");
var ObjectId = require("mongodb").ObjectId;
var udata = require("../config/Schemas");
const mongoose = require("mongoose");
const { response } = require("../app");

const Categories = mongoose.model(collection.CATEGORY_COLLECTION, udata.categorySchema);
const Products = mongoose.model(collection.PRODUCT_COLLECTION, udata.productSchema);

module.exports = {
    addCategory: (categoryData) => {
        return new Promise(async (resolve, reject) => {
            try {
                let category = await Categories.findOne({ Name: categoryData.Name });

                if (!category) {
                    const category1 = new Categories(categoryData);
                    category1.save().then((data) => {
                        resolve(data)
                    }).catch((err) => reject(err))
                } else {
                    resolve(false)
                }
            } catch (error) {
                reject(error)
            }
        })
    },
    viewAllCategories: () => {
        return new Promise((resolve, reject) => {
            try {
                const categoryView = Categories.find({}).lean();
                resolve(categoryView);
            } catch (error) {
                reject(error)
            }
        });
    },
    getCategorydetails: (categoryID) => {
        return new Promise((resolve, reject) => {
            Categories.findOne({ _id: ObjectId(categoryID) }).lean().then((response) => {
                resolve(response).catch((err) => reject(err))
            })
        })
    },
    updateCategory: (categoryID, categoryDetails) => {
        return new Promise(async (resolve, reject) => {
            Categories.updateOne({ _id: ObjectId(categoryID) },
                {
                    $set: { Name: categoryDetails.Name }
                })
                .then(() => {
                    resolve(true)
                }).catch((err) => reject(err))
        })
    },
    deleteCategory: (categoryID) => {
        return new Promise(async (resolve, reject) => {
            const response = {};
            const checkCategory = await Products.findOne({ Category: categoryID })
            if (checkCategory) {
                response.catError = true;
                resolve(response)
            } else {
                Categories.deleteOne({ _id: ObjectId(categoryID) }).then((response) => {
                    resolve(response)
                }).catch((err) => reject(err))
            }
        })
    }
}
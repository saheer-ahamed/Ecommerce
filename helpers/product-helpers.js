var collection = require("../config/collections");
var ObjectId = require("mongodb").ObjectId;
var udata = require("../config/Schemas");
const mongoose = require("mongoose");
const Products = mongoose.model(collection.PRODUCT_COLLECTION, udata.productSchema);
const Categories = mongoose.model(collection.CATEGORY_COLLECTION, udata.categorySchema);
const fs = require('fs')


module.exports = {
    productCategories: () => {
        return new Promise((resolve, reject) => {
            try {
                const cateView = Categories.find({}).lean();
                resolve(cateView);
            } catch (error) {
                reject(error)
            }
        });
    },
    Addproduct: (productData, imgData) => {
        return new Promise((resolve, reject) => {
            try {
                const eachProduct = new Products({
                    productName: productData.productName,
                    Description: productData.Description,
                    Price: productData.Price,
                    Brand: productData.Brand,
                    Quantity: productData.Quantity,
                    sellPrice: productData.sellPrice,
                    Category: productData.Category
                });
                if (imgData) {

                    let imagenames = imgData.map((values) => {
                        return values.filename;
                    })
                    eachProduct.Image = imagenames;

                    eachProduct.save().then((data) => {
                        resolve(data)
                    }).catch((err) => reject(err))
                }
            } catch (error) {
                reject(error)
            }
        });
    },
    viewProduct: () => {
        return new Promise(async (resolve, reject) => {
            try {
                const product1 = await Products.find({}).populate('Category').lean()
                resolve(product1);
            } catch (error) {
                reject(error)
            }
        })
    },
    getProductdetails: (productID) => {
        return new Promise((resolve, reject) => {
            Products.findOne({ _id: ObjectId(productID) }).populate('Category').lean().then((response) => {
                resolve(response)
            }).catch((err) => reject(err))
        })
    },
    updateProduct: (productID, productData, imgData) => {
        return new Promise(async (resolve, reject) => {
            const oldProImage = await Products.findById({ _id: productID })

            if (imgData.length === 0) {
                productData.Image = oldProImage.Image
            }else{
                const imagenames = imgData.map((values) => {
                    return values.filename
                })
                productData.Image = imagenames
                oldProImage.Image.map((values) => {
                    fs.existsSync('./public/images/productsImg/' + values) && fs.unlinkSync('./public/images/productsImg/' + values)
                })
            }
            
            oldProImage.replaceOne(productData).then((data) => {
                resolve(data)
            }).catch((err) => reject(err))
        });
    },
    deleteProduct: (productID) => {
        return new Promise(async (resolve, reject) => {
            const proData = await Products.findById({ _id: productID })
            proData.Image.map((values) => {
                fs.unlinkSync('./public/images/productsImg/' + values)
            })

            Products.deleteOne({ _id: ObjectId(productID) }).then((response) => {
                resolve(response)
            }).catch((err) => reject(err))
        })
    },
    eachProduct: (productID) => {
        return new Promise(async (resolve, reject) => {
            try {
                const product2 = await Products.findOne({ _id: ObjectId(productID) }).populate('Category').lean()
                resolve(product2);
            } catch (error) {
                reject(error)
            }
        })
    }
}

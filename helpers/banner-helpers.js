var collection = require("../config/collections");
var udata = require("../config/Schemas");
const mongoose = require("mongoose");
const fs = require('fs');

const Banner = mongoose.model(collection.BANNERS_COLLECTION, udata.bannerSchema);

module.exports = {
    addBanner: (details, imgData) => {
        return new Promise(async (resolve, reject) => {
            try {
                const { bannerHeading, bannerSubheading } = details
                const banners = await Banner.findOne({ bannerHeading: details.bannerHeading })
                if (!banners) {
                    const eachBanner = new Banner({ bannerHeading, bannerSubheading });

                    if (imgData) {
                        eachBanner.Image = imgData.filename;
                        eachBanner.save().then((data) => {
                            resolve(data)
                        }).catch((err) => reject(err))
                    } else {
                        resolve(false)
                    }
                } else {
                    resolve(false)
                }
            } catch (error) {
                reject(error)
            }
        })
    },
    viewBanners: () => {
        return new Promise(async (resolve, reject) => {
            await Banner.find({}).lean().then((data) => {
                resolve(data)
            }).catch((err) => reject(err))
        })
    },
    deleteBanner: (bannerId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const bannerData = await Banner.findById({ _id: bannerId })
                fs.unlinkSync('./public/images/bannersImg/' + bannerData.Image)
                await Banner.findByIdAndDelete({ _id: bannerId }).then((data) => {
                    resolve(data)
                }).catch((err) => reject(err))
            } catch (error) {
                reject(error)
            }
        })
    },
    eachBanner: (bannerId) => {
        return new Promise(async (resolve, reject) => {
            await Banner.findById({ _id: bannerId }).lean().then((data) => {
                resolve(data)
            }).catch((err) => reject(err))
        })
    },
    updateBanner: (bannerId, bannerData, imgData) => {
        return new Promise(async (resolve, reject) => {
            try {
                const oldImage = await Banner.findById(bannerId)

                if (imgData) {
                    fs.unlinkSync('./public/images/bannersImg/' + oldImage.Image);
                }
                await Banner.findByIdAndUpdate({ _id: bannerId },
                    {
                        bannerHeading: bannerData.bannerHeading,
                        bannerSubheading: bannerData.bannerSubheading,
                        Image: imgData?.filename || oldImage.Image
                    }).then((data) => {
                        resolve(data)
                    }).catch((err) => reject(err))
            } catch (error) {
                reject(error)
            }
        })
    }
}
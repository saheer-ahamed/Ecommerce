var collection = require("../config/collections");
var ObjectId = require("mongodb").ObjectId;
var udata = require("../config/Schemas");
var bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const Users = mongoose.model(collection.USER_COLLECTION, udata.userSchema);

module.exports = {
  signUp: (userData) => {
    return new Promise(async (resolve, reject) => {
      try {
        let user = await Users.findOne({ email: userData.email });
        let userphone = await Users.findOne({ mobile: userData.mobile });
  
        if (!user && !userphone) {
          const accountSid = process.env.TWILIO_ACCOUNT_SID;
          const authToken = process.env.TWILIO_AUTH_TOKEN;
          const client = require("twilio")(process.env.ACCOUNTSID, process.env.AUTHTOKEN);
  
          client.verify.v2.services(process.env.SERVICESID)
            .verifications
            .create({ to: `+91${userData.mobile}`, channel: 'sms' })
            .then(verification => console.log(verification.sid));
          resolve(true)
  
        } else {
          resolve(false)
        }       
      } catch (error) {
          reject(error)
      }
    })
  },
  resendOTP: (userData) => {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const client = require("twilio")(process.env.ACCOUNTSID, process.env.AUTHTOKEN);
  
      client.verify.v2.services(process.env.SERVICESID)
        .verifications
        .create({ to: `+91${userData.mobile}`, channel: 'sms' })
        .then(verification => console.log(verification.sid));
    } catch (error) {
        reject(error)
    }
  },
  OTPVerify: (signupData, otpCode) => {
    return new Promise((resolve, reject) => {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const client = require('twilio')(process.env.ACCOUNTSID, process.env.AUTHTOKEN);

      client.verify.v2.services(process.env.SERVICESID)
        .verificationChecks
        .create({ to: '+91' + signupData.mobile, code: otpCode.otp })
        .then(async (verification_check) => {

          if (verification_check.status == "approved") {
            signupData.password = await bcrypt.hash(signupData.password, 10);
            const user1 = new Users(signupData);
            user1.save().then((data) => {
              resolve(data)
            }).catch((err) => reject(err))

          } else {
            resolve(false)
          }
        }).catch((err) => reject(err))
    });
  },
  getAllUsers: () => {
    return new Promise((resolve, reject) => {
      try {
        const userview = Users.find({}).lean();
        resolve(userview);
      } catch (error) {
          reject(error)
      }
    });
  },
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      try {
        let response = {};
        let user = await Users.findOne({ email: userData.email });
  
        if (user) {
          if (user.Active == false) {
            response.blocked = true;
            resolve(response)
          }
          bcrypt.compare(userData.password, user.password).then((status) => {
            if (status) {
              console.log("login success");
              response.status = true;
              response.user = user
              resolve(response);
            } else {
              response.status = false;
              resolve(response);
            }
          }).catch((err) => reject(err))
        } else {
          console.log("login failed");
          resolve({ status: false });
        }       
      } catch (error) {
          reject(error)
      }
    });
  },

  blockUser: (userId) => {
    return new Promise((resolve, reject) => {
      Users.updateOne({ _id: ObjectId(userId) }, { Active: false }).then((data) => { resolve(data) })
      .catch((err) => reject(err))
    })
  },

  activeUser: (userId) => {
    return new Promise((resolve, reject) => {
      Users.findOneAndUpdate({ _id: ObjectId(userId) }, { Active: true }).then((data) => { resolve(data) })
      .catch((err) => reject(err))
    })
  },

  getUserDetails: (userId) => {
    return new Promise((resolve, reject) => {
      Users.findOne({ _id: userId }).lean().then((data) => { resolve(data) })
      .catch((err) => reject(err))
    })
  },

  updateUserDetails: (userId, newUserDetails) => {
    const { yourname, email } = newUserDetails;
    return new Promise((resolve, reject) => {
      Users.findOneAndUpdate({ _id: userId }, { yourname, email }).then(() => { resolve(true) })
      .catch((err) => reject(err))
    })
  },

  updateUserPassword: (userId, passwords) => {
    return new Promise(async (resolve, reject) => {
      try {
        let response = {};
        const user = await Users.findOne({ _id: userId })
        if (user) {
          bcrypt.compare(passwords.currentPassword, user.password).then(async (status) => {
            if (status) {
              passwords.newPassword = await bcrypt.hash(passwords.newPassword, 10);
              Users.updateOne({ _id: userId }, { $set: { password: passwords.newPassword } }).then((status) => {
                response.status = true;
                resolve(response);
              }).catch((err) => reject(err))
            } else {
              response.status = false;
              resolve(response);
            }
          }).catch((err) => reject(err))
        }       
      } catch (error) {
          reject(error)
      }
    })
  },
  updateMobile: (mobDetails) => {
    return new Promise(async (resolve, reject) => {
      try {
        const mob = await Users.findOne({ mobile: mobDetails.mobile })
        if (!mob) {
          const accountSid = process.env.TWILIO_ACCOUNT_SID;
          const authToken = process.env.TWILIO_AUTH_TOKEN;
          const client = require("twilio")(process.env.ACCOUNTSID, process.env.AUTHTOKEN);
  
          client.verify.v2.services(process.env.SERVICESID)
            .verifications
            .create({ to: `+91${mobDetails.mobile}`, channel: 'sms' })
            .then(verification => console.log(verification.sid));
          resolve(true)
        }
        if (mob) resolve(false)
      } catch (error) {
          reject(error)
      }
    })
  },
  mobileOtpVerify: (otpCode, newMobile, userId) => {
    return new Promise((resolve, reject) => {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const client = require('twilio')(process.env.ACCOUNTSID, process.env.AUTHTOKEN);

      client.verify.v2.services(process.env.SERVICESID)
        .verificationChecks
        .create({ to: '+91' + newMobile, code: otpCode.mobileotp })
        .then(async (verification_check) => {
          if (verification_check.status == "approved") {
            Users.findOneAndUpdate({_id: userId}, {mobile: newMobile}).then((data) => {
              resolve(data)
            }).catch((err) => reject(err))
          } else {
            resolve(false)
          }
        }).catch((err) => reject(err))
    });
  }
};

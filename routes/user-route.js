const express = require("express");
const { findOne } = require("../models/user-model");
const router = express.Router();

//IMPORT CLOUDINARY
const cloudinary = require("cloudinary").v2;
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

//HASH+SALT

const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");

//import model
const User = require("../models/user-model");
const Offer = require("../models/offer-model")
const { Router } = require("express");


//SIGNUP 

router.post("/user/signup", async(req, res) => {
    const username = req.fields.username;
    const password = req.fields.password;
    let avatarToUpload = req.files.avatar.path;

    try {
        const result = await cloudinary.uploader.upload(avatarToUpload, {
            folder: "/vinted-avatar",
            public_id: req.fields.username,
        });
        const userToFind = await User.findOne({ email: req.fields.email })
        if (userToFind) {
            res.status(409).json({ message: "This email already exists" })
                //ces conditions de validité peuvent être gérées en Front
        } else if (username === " ") {
            res.status(400).json({ message: "Username is empty" })
        } else if (password.length < 4) {
            res.status(400).json({ message: "Password invalid: 4 characters mini. required" })
                // création du user
        } else {

            const salt = uid2(64);
            const hash = SHA256(password + salt).toString(encBase64);
            const token = uid2(64);
            const newUser = new User({
                email: req.fields.email,
                account: {
                    username: req.fields.username,
                    phone: req.fields.phone,
                    avatar: result,
                },
                token: token,
                hash: hash,
                salt: salt
            })

            await newUser.save();
            res.status(200).json({ email: newUser.email, token: newUser.token, account: newUser.account.populate(), });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

//LOGIN 


router.post("/user/login", async(req, res) => {
    try {
        const { email, password } = req.fields;
        const user = await User.findOne({ email: email });
        if (user) {
            const hashToCompare = SHA256(password + user.salt).toString(encBase64);
            if (hashToCompare === user.hash) {
                res.status(200).json({ _id: user._id, token: user.token, account: user.account.populate(), });
            } else {
                res.status(400).json({ message: "Unauthorized" })
            }
        } else {
            res.status(400).json({ message: "Unauthorized" })
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
})


module.exports = router;
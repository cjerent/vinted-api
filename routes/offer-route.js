const express = require("express");
const { findOne } = require("../models/user-model");
const router = express.Router();
const isAuthenticated = require("../middleware/isAuthentificated");
const cloudinary = require("cloudinary");
const User = require("../models/user-model");
const Offer = require("../models/offer-model");
const { query } = require("express");



//PUBLISH 

router.post("/offer/publish", isAuthenticated, async(req, res) => {
    try {
        const pictureToUpload = req.files.picture.path;

        const newOffer = new Offer({
            product_name: req.fields.title,
            product_description: req.fields.description,
            product_price: req.fields.price,
            product_details: [{
                MARQUE: req.fields.brand,
                TAILLE: req.fields.size,
                ETAT: req.fields.condition,
                COULEUR: req.fields.color,
                EMPLACEMENT: req.fields.city,
            }],

            owner: req.user,

        })
        const productImage = await cloudinary.uploader.upload(pictureToUpload, {
            folder: "/vinted/offers",
            public_id: req.fields.title,
        });
        newOffer.product_image = productImage,

            await newOffer.save();

        res.status(200).json({
            id: newOffer._id,
            product_name: newOffer.product_name,
            product_description: newOffer.product_description,
            product_price: newOffer.product_price,
            product_details: newOffer.product_details,
            owner: { username: req.user.account, _id: req.user._id },
            product_image: productImage
        });

    } catch (error) {
        res.status(400).json({ message: error.message })

    }
})

//FILTERS
router.get("/offers", async(req, res) => {
    try {

        let filters = {};

        if (req.query.title) {
            filters.product_name = new RegExp(req.query.title, "i");
        }

        if (req.query.priceMin) {
            filters.product_price = {
                $gte: req.query.priceMin,
            };
        }

        if (req.query.priceMax) {
            if (filters.product_price) {
                filters.product_price.$lte = req.query.priceMax;
            } else {
                filters.product_price = {
                    $lte: req.query.priceMax,
                };
            }
        }

        let sort = {};

        if (req.query.sort === "price-desc") {
            sort = { product_price: -1 };
        } else if (req.query.sort === "price-asc") {
            sort = { product_price: 1 };
        }

        let page;
        if (Number(req.query.page) < 1) {
            page = 1;
        } else {
            page = Number(req.query.page);
        }

        let limit = Number(req.query.limit);

        const offers = await Offer.find(filters)
            .populate({
                path: "owner",
                select: "account",
            })
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit);
        const count = await Offer.countDocuments(filters);

        res.json({
            count: count,
            offers: offers,
        });
    } catch (error) {
        console.log(error.message);
        res.status(400).json({ message: error.message });
    }
});

//SEARCH OFFER BY ID

router.get("/offer/:id", async(req, res) => {
    try {
        const offer = await Offer.findById(req.params.id).populate({
            path: "owner",
            select: "account.username account.phone account.avatar",
        });
        res.json(offer);
    } catch (error) {
        console.log(error.message);
        res.status(400).json({ message: error.message });
    }
});


module.exports = router;
const express = require("express");
const { findOne } = require("../models/user-model");
const router = express.Router();
const isAuthenticated = require("../middleware/isAuthentificated");
const User = require("../models/user-model");
const Offer = require("../models/offer-model");
const { query } = require("express");

const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//PUBLISH OFFERS

router.post("/offer/publish", isAuthenticated, async (req, res) => {
  try {
    const pictureToUpload = req.files.picture.path;

    const newOffer = new Offer({
      product_name: req.fields.title,
      product_description: req.fields.description,
      product_price: req.fields.price,
      product_details: [
        { MARQUE: req.fields.brand },
        { TAILLE: req.fields.size },
        { ÉTAT: req.fields.condition },
        { COULEUR: req.fields.color },
        { EMPLACEMENT: req.fields.city },
      ],

      owner: req.user,
    });
    const productImage = await cloudinary.uploader.upload(pictureToUpload, {
      folder: `/vinted/offers/${newOffer._id}`,
      public_id: "preview",
    });
    (newOffer.product_image = productImage), await newOffer.save();

    res.status(200).json({
      id: newOffer._id,
      product_name: newOffer.product_name,
      product_description: newOffer.product_description,
      product_price: newOffer.product_price,
      product_details: newOffer.product_details,
      owner: { username: req.user.account, _id: req.user._id },
      product_image: productImage,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
  console.log(error);
});

//FILTERS
router.get("/offers", async (req, res) => {
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

router.get("/offer/:id", async (req, res) => {
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

//MODIFY OFFERS
router.put("/offer/modify/:id", isAuthenticated, async (req, res) => {
  const offerToModify = await Offer.findById(req.params.id);

  try {
    if (req.fields.title) {
      offerToModify.product_name = req.fields.title;
    }
    if (req.fields.description) {
      offerToModify.product_description = req.fields.description;
    }
    if (req.fields.price) {
      offerToModify.product_price = req.fields.price;
    }
    const offerDetails = offerToModify.product_details;
    for (i = 0; i < offerDetails.length; i++) {
      if (offerDetails[i].MARQUE) {
        if (req.fields.brand) {
          offerDetails[i].MARQUE = req.fields.brand;
        }
      }
      if (offerDetails[i].TAILLE) {
        if (req.fields.size) {
          offerDetails[i].TAILLE = req.fields.size;
        }
      }
      if (offerDetails[i].ETAT) {
        if (req.fields.condition) {
          offerDetails[i].ETAT = req.fields.condition;
        }
      }
      if (offerDetails[i].COULEUR) {
        if (req.fields.color) {
          offerDetails[i].COULEUR = req.fields.color;
        }
      }
      if (offerDetails[i].EMPLACEMENT) {
        if (req.fields.location) {
          offerDetails[i].EMPLACEMENT = req.fields.location;
        }
      }
    }
    offerToModify.markModified("product_details");
    if (req.files.picture) {
      const result = await cloudinary.uploader.upload(req.files.picture.path, {
        public_id: `vinted/offers/${offerToModify._id}/preview`,
      });
      offerToModify.product_image = result;
    }
    await offerToModify.save();
    res.status(200).json("Offer has been successfully modified !");
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
//DELETE OFFER

router.delete("/offer/delete/:id", isAuthenticated, async (req, res) => {
  try {
    await cloudinary.api.delete_resources_by_prefix(
      `vinted/offers/${req.params.id}`
    );
    await cloudinary.api.delete_folder(`vinted/offers/${req.params.id}`);
    offerToDelete = await Offer.findById(req.params.id);
    await offerToDelete.delete();
    res.status(200).json("Your offer has been successfully deleted !");
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;

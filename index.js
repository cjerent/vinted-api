const express = require("express");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
const cors = require("cors");
require('dotenv').config();

const app = express();
app.use(cors());
app.use(formidable());

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
});

//IMPORT CLOUDINARY
const cloudinary = require("cloudinary").v2;
cloudinary.config({
    cloud_name: "racoon",
    api_key: "115348264884395",
    api_secret: "tNyKD7kj7cvbakgxUZo06Pl3-HI"
});



//IMPORT ROUTES

const userRoutes = require("./routes/user-route");
app.use(userRoutes);
const offerRoutes = require("./routes/offer-route");
app.use(offerRoutes);

app.all("*", (req, res) => {
    res.status(404).json({ message: "Cette route n'existe pas" });
});

app.listen(process.env.PORT, () => {
    console.log("Server started");
});
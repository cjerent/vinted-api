const express = require("express");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

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
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//IMPORT ROUTES

const userRoutes = require("./routes/user-route");
app.use(userRoutes);
const offerRoutes = require("./routes/offer-route");
app.use(offerRoutes);

app.listen(process.env.PORT, () => {
  console.log("Server started");
});
app.all("*", (req, res) => {
  res.status(404).json({ message: "Cette route n'existe pas" });
});

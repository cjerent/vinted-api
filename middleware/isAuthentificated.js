const User = require("../models/user-model");
const isAuthenticated = async(req, res, next) => {
    if (req.headers.authorization) {
        const token = req.headers.authorization.replace("Bearer ", "");
        const user = await User.findOne({
            token: token
        }).select("account _id");
        if (user) {
            req.user = user;
            return next();
        } else {
            return res.status(400).json({ message: "Unauthorized" });
        }

    } else {
        return res.status(400).json({ message: "Unauthorized" });

    }
};

module.exports = isAuthenticated;
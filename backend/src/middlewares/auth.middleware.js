
const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")

async function authmiddlware(req, res, next) {

    const token = req.cookies.token

    if (!token) {
        return res.status(401).json({
            message: "token not provided"
        })
    }

    const isBlacklisted = await tokenBlacklistModel.findOne({ token })

    if (isBlacklisted) {
        return res.status(401).json({
            message: "Token invalid"
        })
    }

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        req.user = decoded

        next()
    } catch (error) {
        console.log("Error inside auth middleware", error.message);
        return res.status(401).json({
            message: "Invalid token"
        })

    }
}


module.exports = authmiddlware
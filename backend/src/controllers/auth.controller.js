const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const userModel = require("../models/user.model")
const tokenBlacklistModel = require("../models/blacklist.model")


async function registerUserController(req, res) {
    try {
        const { username, email, password } = req.body

        if (!username || !email || !password) {
            return res.status(400).json({
                message: "All fields required"
            })
        }

        const userExists = await userModel.findOne({
            $or: [{ email }, { username }]
        })

        if (userExists) {
            return res.status(400).json({
                message: "User already exists"
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await userModel.create({
            username,
            email,
            password: hashedPassword
        })

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        )

        res.cookie("token", token)

        res.status(201).json({
            message: "User created",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        })

    } catch (error) {
        console.log("This is an error : ", error.message);
        res.status(500).json({
            message: "Error inside register controller.."
        })

    }

}

async function login(req, res) {
    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "All fields required"
            })
        }

        const user = await userModel.findOne({
            email
        })

        if (!user) {
            return res.status(400).json({
                message: "user not existed"
            })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
            return res.status(400).json({
                message: "Invalid password"
            })
        }

        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        )

        res.cookie("token", token)

        res.status(200).json({
            message: "User logged in successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            }
        })

    } catch (error) {
        console.log("Login error : ", error.message);
        res.status(500).json({
            message: "Error inside login controller.."
        })
    }
}


async function logout(req, res) {
    try {

        const token = req.cookies.token;

        if (token) {
            await tokenBlacklistModel.create({ token })
        }

        res.clearCookie("token")

        res.status(200).json({
            message: "user logout successfully",
        });


    } catch (error) {
        console.log("Error inside logout", error.message);
        res.status(500).json({
            message: "Error inside login controller..",
        })
    }
}

async function getMeController(req, res) {
    try {
        const user = await userModel.findById(req.user.id)

        res.status(200).json({
            user : {
                id : user._id,
                username : user.username,
                email: user.email
            }
        })

    } catch (error) {
        console.log("Error inside getmeController", error.message);
        res.status(500).json({
            message: "Error inside getmeController",
        })
    }
}




module.exports = { registerUserController, login, logout, getMeController }
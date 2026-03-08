const { Router } = require("express")
const authController= require("../controllers/auth.controller")
const authmiddlware = require("../middlewares/auth.middleware")

const authRouter = Router()

authRouter.post("/register", authController.registerUserController)
authRouter.get("/login", authController.login)
authRouter.get("/logout", authController.logout)
authRouter.get("/getme", authmiddlware, authController.getMeController)


module.exports = authRouter
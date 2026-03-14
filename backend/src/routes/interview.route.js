const express = require("express")
const interviewRouter = express.Router();
const authmiddlware = require("../middlewares/auth.middleware")
const {interview} = require("../controllers/interview.controller")
const uploade = require("../middlewares/file.middleware")

interviewRouter.post("/", authmiddlware, uploade.single("resume"), interview)
module.exports = interviewRouter;



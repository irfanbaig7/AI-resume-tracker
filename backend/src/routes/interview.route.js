const express = require("express")
const interviewRouter = express.Router();
const authmiddlware = require("../middlewares/auth.middleware")
const {interview, getInterviewReportByIdController, getAllInterviewReportsController, generateResumePdfController} = require("../controllers/interview.controller")
const uploade = require("../middlewares/file.middleware")

interviewRouter.post("/", authmiddlware, uploade.single("resume"), interview)
interviewRouter.get("/report/:interviewId", authmiddlware, getInterviewReportByIdController)
interviewRouter.get("/", authmiddlware, getAllInterviewReportsController)
interviewRouter.post("/resume/pdf/:interviewReportId", authmiddlware, generateResumePdfController)


module.exports = interviewRouter;

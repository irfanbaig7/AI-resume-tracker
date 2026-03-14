const pdfParse = require("pdf-parse")
const generateInterviewReport = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")

async function interview(req, res){
    try {
        
        // const file = req.file

        // extract the content from file vai using pdf parse bcz the file data was into PDF
       const resumeContent = await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText()
        const { selfDescription, jobDescription } = req.body

        const interviewReportByAi = await generateInterviewReport({
            resume : resumeContent.text,
            selfDescription, 
            jobDescription
        })

        const interViewReport = await interviewReportModel.create({
            user: req.user.id,
            resume : resumeContent.text,
            selfDescription,
            jobDescription,
            ...interviewReportByAi
        })

        res.status(201).json({
            message : "interview report gen successfully...",
            interViewReport
        })       

    } catch (err) {
        console.log("Error goit it..", err.message);
    }

}

module.exports = {interview}
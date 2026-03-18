const pdfParse = require("pdf-parse")
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")

async function interview(req, res) {
    try {
        let resumeText = ""

        if (req.file) {
            const resumeContent = await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText()
            resumeText = resumeContent.text
        }

        const { selfDescription, jobDescription } = req.body

        const interviewReportByAi = await generateInterviewReport({
            resume: resumeText,
            selfDescription,
            jobDescription
        })

        const interViewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeText,
            selfDescription,
            jobDescription,
            ...interviewReportByAi
        })

        res.status(201).json({
            message: "interview report gen successfully...",
            interviewReport: interViewReport
        })

    } catch (err) {
        console.log("Error:", err.message);
        if (err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('RESOURCE_EXHAUSTED')) {
            return res.status(429).json({
                message: "AI service is busy right now. Please wait a minute and try again."
            })
        }
        res.status(500).json({ message: "Something went wrong. Please try again." })
    }
}


async function getInterviewReportByIdController(req, res) {

    const { interviewId } = req.params

    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    res.status(200).json({
        message: "Interview report fetched successfully.",
        interviewReport
    })
}


async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports
    })
}


async function generateResumePdfController(req, res) {
    try {

        const { interviewReportId } = req.params

        const interviewReport = await interviewReportModel.findById(interviewReportId)

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        const { resume, jobDescription, selfDescription } = interviewReport

        const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
        })

        res.send(pdfBuffer)

    } catch (err) {
        console.log("Error:", err.message);

        if (err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('RESOURCE_EXHAUSTED')) {
            return res.status(429).json({
                message: "AI service is busy right now. Please wait a minute and try again."
            })
        }

        res.status(500).json({ message: "Something went wrong. Please try again." })
    }
}



module.exports = { interview, getInterviewReportByIdController, getAllInterviewReportsController, generateResumePdfController }
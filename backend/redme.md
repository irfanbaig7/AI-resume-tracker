================================================
FILE: Backend/package.json
================================================
{
  "name": "yt-genai",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "dev": "npx nodemon server.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "@google/genai": "^1.42.0",
    "bcryptjs": "^3.0.3",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.6",
    "dotenv": "^17.3.1",
    "express": "^5.2.1",
    "jsonwebtoken": "^9.0.3",
    "mongoose": "^9.2.1",
    "multer": "^2.0.2",
    "pdf-parse": "^2.4.5",
    "puppeteer": "^24.37.5",
    "zod": "^3.25.76",
    "zod-to-json-schema": "^3.25.1"
  }
}



================================================
FILE: Backend/server.js
================================================
require("dotenv").config()
const app = require("./src/app")
const connectToDB = require("./src/config/database")

connectToDB()


app.listen(3000, () => {
    console.log("Server is running on port 3000")
})


================================================
FILE: Backend/src/app.js
================================================
const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")

const app = express()

app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))

/* require all the routes here */
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")


/* using all the routes here */
app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)



module.exports = app


================================================
FILE: Backend/src/config/database.js
================================================
const mongoose = require("mongoose")



async function connectToDB() {

    try {
        await mongoose.connect(process.env.MONGO_URI)

        console.log("Connected to Database")
    }
    catch (err) {
        console.log(err)
    }
}

module.exports = connectToDB


================================================
FILE: Backend/src/controllers/auth.controller.js
================================================
const userModel = require("../models/user.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")

/**
 * @name registerUserController
 * @description register a new user, expects username, email and password in the request body
 * @access Public
 */
async function registerUserController(req, res) {

    const { username, email, password } = req.body

    if (!username || !email || !password) {
        return res.status(400).json({
            message: "Please provide username, email and password"
        })
    }

    const isUserAlreadyExists = await userModel.findOne({
        $or: [ { username }, { email } ]
    })

    if (isUserAlreadyExists) {
        return res.status(400).json({
            message: "Account already exists with this email address or username"
        })
    }

    const hash = await bcrypt.hash(password, 10)

    const user = await userModel.create({
        username,
        email,
        password: hash
    })

    const token = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    )

    res.cookie("token", token)


    res.status(201).json({
        message: "User registered successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    })

}


/**
 * @name loginUserController
 * @description login a user, expects email and password in the request body
 * @access Public
 */
async function loginUserController(req, res) {

    const { email, password } = req.body

    const user = await userModel.findOne({ email })

    if (!user) {
        return res.status(400).json({
            message: "Invalid email or password"
        })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
        return res.status(400).json({
            message: "Invalid email or password"
        })
    }

    const token = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    )

    res.cookie("token", token)
    res.status(200).json({
        message: "User loggedIn successfully.",
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    })
}


/**
 * @name logoutUserController
 * @description clear token from user cookie and add the token in blacklist
 * @access public
 */
async function logoutUserController(req, res) {
    const token = req.cookies.token

    if (token) {
        await tokenBlacklistModel.create({ token })
    }

    res.clearCookie("token")

    res.status(200).json({
        message: "User logged out successfully"
    })
}

/**
 * @name getMeController
 * @description get the current logged in user details.
 * @access private
 */
async function getMeController(req, res) {

    const user = await userModel.findById(req.user.id)



    res.status(200).json({
        message: "User details fetched successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    })

}



module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController
}


================================================
FILE: Backend/src/controllers/interview.controller.js
================================================
const pdfParse = require("pdf-parse")
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")




/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {

    const resumeContent = await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText()
    const { selfDescription, jobDescription } = req.body

    const interViewReportByAi = await generateInterviewReport({
        resume: resumeContent.text,
        selfDescription,
        jobDescription
    })

    const interviewReport = await interviewReportModel.create({
        user: req.user.id,
        resume: resumeContent.text,
        selfDescription,
        jobDescription,
        ...interViewReportByAi
    })

    res.status(201).json({
        message: "Interview report generated successfully.",
        interviewReport
    })

}

/**
 * @description Controller to get interview report by interviewId.
 */
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


/** 
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports
    })
}


/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
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
}

module.exports = { generateInterViewReportController, getInterviewReportByIdController, getAllInterviewReportsController, generateResumePdfController }


================================================
FILE: Backend/src/middlewares/auth.middleware.js
================================================
const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")



async function authUser(req, res, next) {

    const token = req.cookies.token

    if (!token) {
        return res.status(401).json({
            message: "Token not provided."
        })
    }

    const isTokenBlacklisted = await tokenBlacklistModel.findOne({
        token
    })

    if (isTokenBlacklisted) {
        return res.status(401).json({
            message: "token is invalid"
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        req.user = decoded

        next()

    } catch (err) {

        return res.status(401).json({
            message: "Invalid token."
        })
    }

}


module.exports = { authUser }


================================================
FILE: Backend/src/middlewares/file.middleware.js
================================================
const multer = require("multer")


const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 3 * 1024 * 1024 // 3MB
    }
})


module.exports = upload


================================================
FILE: Backend/src/models/blacklist.model.js
================================================
const mongoose = require('mongoose')


const blacklistTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: [ true, "token is required to be added in blacklist" ]
    }
}, {
    timestamps: true
})

const tokenBlacklistModel = mongoose.model("blacklistTokens", blacklistTokenSchema)


module.exports = tokenBlacklistModel


================================================
FILE: Backend/src/models/interviewReport.model.js
================================================
const mongoose = require('mongoose');


const technicalQuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [ true, "Technical question is required" ]
    },
    intention: {
        type: String,
        required: [ true, "Intention is required" ]
    },
    answer: {
        type: String,
        required: [ true, "Answer is required" ]
    }
}, {
    _id: false
})

const behavioralQuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [ true, "Technical question is required" ]
    },
    intention: {
        type: String,
        required: [ true, "Intention is required" ]
    },
    answer: {
        type: String,
        required: [ true, "Answer is required" ]
    }
}, {
    _id: false
})

const skillGapSchema = new mongoose.Schema({
    skill: {
        type: String,
        required: [ true, "Skill is required" ]
    },
    severity: {
        type: String,
        enum: [ "low", "medium", "high" ],
        required: [ true, "Severity is required" ]
    }
}, {
    _id: false
})

const preparationPlanSchema = new mongoose.Schema({
    day: {
        type: Number,
        required: [ true, "Day is required" ]
    },
    focus: {
        type: String,
        required: [ true, "Focus is required" ]
    },
    tasks: [ {
        type: String,
        required: [ true, "Task is required" ]
    } ]
})

const interviewReportSchema = new mongoose.Schema({
    jobDescription: {
        type: String,
        required: [ true, "Job description is required" ]
    },
    resume: {
        type: String,
    },
    selfDescription: {
        type: String,
    },
    matchScore: {
        type: Number,
        min: 0,
        max: 100,
    },
    technicalQuestions: [ technicalQuestionSchema ],
    behavioralQuestions: [ behavioralQuestionSchema ],
    skillGaps: [ skillGapSchema ],
    preparationPlan: [ preparationPlanSchema ],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    },
    title: {
        type: String,
        required: [ true, "Job title is required" ]
    }
}, {
    timestamps: true
})


const interviewReportModel = mongoose.model("InterviewReport", interviewReportSchema);

module.exports = interviewReportModel;  


================================================
FILE: Backend/src/models/user.model.js
================================================
const mongoose = require("mongoose")


const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: [ true, "username already taken" ],
        required: true,
    },

    email: {
        type: String,
        unique: [ true, "Account already exists with this email address" ],
        required: true,
    },

    password: {
        type: String,
        required: true
    }
})

const userModel = mongoose.model("users", userSchema)

module.exports = userModel


================================================
FILE: Backend/src/routes/auth.routes.js
================================================
const { Router } = require('express')
const authController = require("../controllers/auth.controller")
const authMiddleware = require("../middlewares/auth.middleware")

const authRouter = Router()

/**
 * @route POST /api/auth/register
 * @description Register a new user
 * @access Public
 */
authRouter.post("/register", authController.registerUserController)


/**
 * @route POST /api/auth/login
 * @description login user with email and password
 * @access Public
 */
authRouter.post("/login", authController.loginUserController)


/**
 * @route GET /api/auth/logout
 * @description clear token from user cookie and add the token in blacklist
 * @access public
 */
authRouter.get("/logout", authController.logoutUserController)


/**
 * @route GET /api/auth/get-me
 * @description get the current logged in user details
 * @access private
 */
authRouter.get("/get-me", authMiddleware.authUser, authController.getMeController)


module.exports = authRouter


================================================
FILE: Backend/src/routes/interview.routes.js
================================================
const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const interviewController = require("../controllers/interview.controller")
const upload = require("../middlewares/file.middleware")

const interviewRouter = express.Router()



/**
 * @route POST /api/interview/
 * @description generate new interview report on the basis of user self description,resume pdf and job description.
 * @access private
 */
interviewRouter.post("/", authMiddleware.authUser, upload.single("resume"), interviewController.generateInterViewReportController)

/**
 * @route GET /api/interview/report/:interviewId
 * @description get interview report by interviewId.
 * @access private
 */
interviewRouter.get("/report/:interviewId", authMiddleware.authUser, interviewController.getInterviewReportByIdController)


/**
 * @route GET /api/interview/
 * @description get all interview reports of logged in user.
 * @access private
 */
interviewRouter.get("/", authMiddleware.authUser, interviewController.getAllInterviewReportsController)


/**
 * @route GET /api/interview/resume/pdf
 * @description generate resume pdf on the basis of user self description, resume content and job description.
 * @access private
 */
interviewRouter.post("/resume/pdf/:interviewReportId", authMiddleware.authUser, interviewController.generateResumePdfController)



module.exports = interviewRouter


================================================
FILE: Backend/src/services/ai.service.js
================================================
const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})


const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum([ "low", "medium", "high" ]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.")
    })).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
})

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {


    const prompt = `Generate an interview report for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}
`

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(interviewReportSchema),
        }
    })

    return JSON.parse(response.text)


}



async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
        format: "A4", margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm"
        }
    })

    await browser.close()

    return pdfBuffer
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
    })

    const prompt = `Generate resume for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
                        The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
                        The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
                        you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                        The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
                        The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
                    `

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(resumePdfSchema),
        }
    })


    const jsonContent = JSON.parse(response.text)

    const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

    return pdfBuffer

}

module.exports = { generateInterviewReport, generateResumePdf }


================================================
FILE: Frontend/README.md
================================================
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.



================================================
FILE: Frontend/eslint.config.js
================================================
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
])



================================================
FILE: Frontend/index.html
================================================
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>frontend</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>



================================================
FILE: Frontend/package.json
================================================
{
  "name": "frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.13.5",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router": "^7.13.0",
    "sass": "^1.97.3"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.1",
    "@types/react": "^19.2.7",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^5.1.1",
    "eslint": "^9.39.1",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-react-refresh": "^0.4.24",
    "globals": "^16.5.0",
    "vite": "^7.3.1"
  }
}



================================================
FILE: Frontend/vite.config.js
================================================
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})



================================================
FILE: Frontend/src/App.jsx
================================================
import { RouterProvider } from "react-router"
import { router } from "./app.routes.jsx"
import { AuthProvider } from "./features/auth/auth.context.jsx"
import { InterviewProvider } from "./features/interview/interview.context.jsx"

function App() {

  return (
    <AuthProvider>
      <InterviewProvider>
        <RouterProvider router={router} />
      </InterviewProvider>
    </AuthProvider>
  )
}

export default App



================================================
FILE: Frontend/src/app.routes.jsx
================================================
import { createBrowserRouter } from "react-router";
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import Protected from "./features/auth/components/Protected";
import Home from "./features/interview/pages/Home";
import Interview from "./features/interview/pages/Interview";


export const router = createBrowserRouter([
    {
        path: "/login",
        element: <Login />
    },
    {
        path: "/register",
        element: <Register />
    },
    {
        path: "/",
        element: <Protected><Home /></Protected>
    },
    {
        path:"/interview/:interviewId",
        element: <Protected><Interview /></Protected>
    }
])


================================================
FILE: Frontend/src/main.jsx
================================================
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import "./style.scss"

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)



================================================
FILE: Frontend/src/style.scss
================================================
@use "./style/button.scss";

* {
    margin: 0%;
    padding: 0%;
    box-sizing: border-box;
}

html,
body,
#root {
    width: 100%;
    background-color: #161616;
    color: whitesmoke;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

.highlight{
    color: #d20d3b;
}


================================================
FILE: Frontend/src/features/auth/auth.context.jsx
================================================
import { createContext,useState } from "react";


export const AuthContext = createContext()


export const AuthProvider = ({ children }) => { 

    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    


    return (
        <AuthContext.Provider value={{user,setUser,loading,setLoading}} >
            {children}
        </AuthContext.Provider>
    )

    
}


================================================
FILE: Frontend/src/features/auth/auth.form.scss
================================================
main{
    min-height: 100vh;
    width: 100%;

    display: flex;
    justify-content: center;
    align-items: center;


    .form-container{
        min-width: 350px;

        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    form{
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .input-group{
        display: flex;
        flex-direction: column;

        gap: 0.5rem;


        input{
            border: none;
            outline: none;
            padding-inline: 1rem;
            padding-block: 0.75rem;
            border-radius: 0.75rem;
        }
    }

    a{
        color: #e1034d;
        text-decoration: none;
    }
}


================================================
FILE: Frontend/src/features/auth/components/Protected.jsx
================================================
import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router";
import React from 'react'

const Protected = ({children}) => {
    const { loading,user } = useAuth()


    if(loading){
        return (<main><h1>Loading...</h1></main>)
    }

    if(!user){
        return <Navigate to={'/login'} />
    }
    
    return children
}

export default Protected


================================================
FILE: Frontend/src/features/auth/hooks/useAuth.js
================================================
import { useContext, useEffect } from "react";
import { AuthContext } from "../auth.context";
import { login, register, logout, getMe } from "../services/auth.api";



export const useAuth = () => {

    const context = useContext(AuthContext)
    const { user, setUser, loading, setLoading } = context


    const handleLogin = async ({ email, password }) => {
        setLoading(true)
        try {
            const data = await login({ email, password })
            setUser(data.user)
        } catch (err) {

        } finally {
            setLoading(false)
        }
    }

    const handleRegister = async ({ username, email, password }) => {
        setLoading(true)
        try {
            const data = await register({ username, email, password })
            setUser(data.user)
        } catch (err) {

        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        setLoading(true)
        try {
            const data = await logout()
            setUser(null)
        } catch (err) {

        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {

        const getAndSetUser = async () => {
            try {

                const data = await getMe()
                setUser(data.user)
            } catch (err) { } finally {
                setLoading(false)
            }
        }

        getAndSetUser()

    }, [])

    return { user, loading, handleRegister, handleLogin, handleLogout }
}


================================================
FILE: Frontend/src/features/auth/pages/Login.jsx
================================================
import React,{useState} from 'react'
import { useNavigate, Link } from 'react-router'
import "../auth.form.scss"
import { useAuth } from '../hooks/useAuth'

const Login = () => {

    const { loading, handleLogin } = useAuth()
    const navigate = useNavigate()

    const [ email, setEmail ] = useState("")
    const [ password, setPassword ] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault()
        await handleLogin({email,password})
        navigate('/')
    }

    if(loading){
        return (<main><h1>Loading.......</h1></main>)
    }


    return (
        <main>
            <div className="form-container">
                <h1>Login</h1>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            onChange={(e) => { setEmail(e.target.value) }}
                            type="email" id="email" name='email' placeholder='Enter email address' />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            onChange={(e) => { setPassword(e.target.value) }}
                            type="password" id="password" name='password' placeholder='Enter password' />
                    </div>
                    <button className='button primary-button' >Login</button>
                </form>
                <p>Don't have an account? <Link to={"/register"} >Register</Link> </p>
            </div>
        </main>
    )
}

export default Login


================================================
FILE: Frontend/src/features/auth/pages/Register.jsx
================================================
import React,{useState} from 'react'
import { useNavigate, Link } from 'react-router'
import { useAuth } from '../hooks/useAuth'

const Register = () => {

    const navigate = useNavigate()
    const [ username, setUsername ] = useState("")
    const [ email, setEmail ] = useState("")
    const [ password, setPassword ] = useState("")

    const {loading,handleRegister} = useAuth()
    
    const handleSubmit = async (e) => {
        e.preventDefault()
        await handleRegister({username,email,password})
        navigate("/")
    }

    if(loading){
        return (<main><h1>Loading.......</h1></main>)
    }

    return (
        <main>
            <div className="form-container">
                <h1>Register</h1>

                <form onSubmit={handleSubmit}>

                    <div className="input-group">
                        <label htmlFor="username">Username</label>
                        <input
                            onChange={(e) => { setUsername(e.target.value) }}
                            type="text" id="username" name='username' placeholder='Enter username' />
                    </div>
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            onChange={(e) => { setEmail(e.target.value) }}
                            type="email" id="email" name='email' placeholder='Enter email address' />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            onChange={(e) => { setPassword(e.target.value) }}
                            type="password" id="password" name='password' placeholder='Enter password' />
                    </div>

                    <button className='button primary-button' >Register</button>

                </form>

                <p>Already have an account? <Link to={"/login"} >Login</Link> </p>
            </div>
        </main>
    )
}

export default Register


================================================
FILE: Frontend/src/features/auth/services/auth.api.js
================================================
import axios from "axios"


const api = axios.create({
    baseURL: "http://localhost:3000",
    withCredentials: true
})

export async function register({ username, email, password }) {

    try {
        const response = await api.post('/api/auth/register', {
            username, email, password
        })

        return response.data

    } catch (err) {

        console.log(err)

    }

}

export async function login({ email, password }) {

    try {

        const response = await api.post("/api/auth/login", {
            email, password
        })

        return response.data

    } catch (err) {
        console.log(err)
    }

}

export async function logout() {
    try {

        const response = await api.get("/api/auth/logout")

        return response.data

    } catch (err) {

    }
}

export async function getMe() {

    try {

        const response = await api.get("/api/auth/get-me")

        return response.data

    } catch (err) {
        console.log(err)
    }

}


================================================
FILE: Frontend/src/features/interview/interview.context.jsx
================================================
import { createContext,useState } from "react";


export const InterviewContext = createContext()

export const InterviewProvider = ({ children }) => {
    const [loading, setLoading] = useState(false)
    const [report, setReport] = useState(null)
    const [reports, setReports] = useState([])

    return (
        <InterviewContext.Provider value={{ loading, setLoading, report, setReport, reports, setReports }}>
            {children}
        </InterviewContext.Provider>
    )
}


================================================
FILE: Frontend/src/features/interview/hooks/useInterview.js
================================================
import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumePdf } from "../services/interview.api"
import { useContext, useEffect } from "react"
import { InterviewContext } from "../interview.context"
import { useParams } from "react-router"


export const useInterview = () => {

    const context = useContext(InterviewContext)
    const { interviewId } = useParams()

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, report, setReport, reports, setReports } = context

    const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {
        setLoading(true)
        let response = null
        try {
            response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile })
            setReport(response.interviewReport)
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }

        return response.interviewReport
    }

    const getReportById = async (interviewId) => {
        setLoading(true)
        let response = null
        try {
            response = await getInterviewReportById(interviewId)
            setReport(response.interviewReport)
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }
        return response.interviewReport
    }

    const getReports = async () => {
        setLoading(true)
        let response = null
        try {
            response = await getAllInterviewReports()
            setReports(response.interviewReports)
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }

        return response.interviewReports
    }

    const getResumePdf = async (interviewReportId) => {
        setLoading(true)
        let response = null
        try {
            response = await generateResumePdf({ interviewReportId })
            const url = window.URL.createObjectURL(new Blob([ response ], { type: "application/pdf" }))
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `resume_${interviewReportId}.pdf`)
            document.body.appendChild(link)
            link.click()
        }
        catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        } else {
            getReports()
        }
    }, [ interviewId ])

    return { loading, report, reports, generateReport, getReportById, getReports, getResumePdf }

}


================================================
FILE: Frontend/src/features/interview/pages/Home.jsx
================================================
import React, { useState, useRef } from 'react'
import "../style/home.scss"
import { useInterview } from '../hooks/useInterview.js'
import { useNavigate } from 'react-router'

const Home = () => {

    const { loading, generateReport,reports } = useInterview()
    const [ jobDescription, setJobDescription ] = useState("")
    const [ selfDescription, setSelfDescription ] = useState("")
    const resumeInputRef = useRef()

    const navigate = useNavigate()

    const handleGenerateReport = async () => {
        const resumeFile = resumeInputRef.current.files[ 0 ]
        const data = await generateReport({ jobDescription, selfDescription, resumeFile })
        navigate(`/interview/${data._id}`)
    }

    if (loading) {
        return (
            <main className='loading-screen'>
                <h1>Loading your interview plan...</h1>
            </main>
        )
    }

    return (
        <div className='home-page'>

            {/* Page Header */}
            <header className='page-header'>
                <h1>Create Your Custom <span className='highlight'>Interview Plan</span></h1>
                <p>Let our AI analyze the job requirements and your unique profile to build a winning strategy.</p>
            </header>

            {/* Main Card */}
            <div className='interview-card'>
                <div className='interview-card__body'>

                    {/* Left Panel - Job Description */}
                    <div className='panel panel--left'>
                        <div className='panel__header'>
                            <span className='panel__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                            </span>
                            <h2>Target Job Description</h2>
                            <span className='badge badge--required'>Required</span>
                        </div>
                        <textarea
                            onChange={(e) => { setJobDescription(e.target.value) }}
                            className='panel__textarea'
                            placeholder={`Paste the full job description here...\ne.g. 'Senior Frontend Engineer at Google requires proficiency in React, TypeScript, and large-scale system design...'`}
                            maxLength={5000}
                        />
                        <div className='char-counter'>0 / 5000 chars</div>
                    </div>

                    {/* Vertical Divider */}
                    <div className='panel-divider' />

                    {/* Right Panel - Profile */}
                    <div className='panel panel--right'>
                        <div className='panel__header'>
                            <span className='panel__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            </span>
                            <h2>Your Profile</h2>
                        </div>

                        {/* Upload Resume */}
                        <div className='upload-section'>
                            <label className='section-label'>
                                Upload Resume
                                <span className='badge badge--best'>Best Results</span>
                            </label>
                            <label className='dropzone' htmlFor='resume'>
                                <span className='dropzone__icon'>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" /></svg>
                                </span>
                                <p className='dropzone__title'>Click to upload or drag &amp; drop</p>
                                <p className='dropzone__subtitle'>PDF or DOCX (Max 5MB)</p>
                                <input ref={resumeInputRef} hidden type='file' id='resume' name='resume' accept='.pdf,.docx' />
                            </label>
                        </div>

                        {/* OR Divider */}
                        <div className='or-divider'><span>OR</span></div>

                        {/* Quick Self-Description */}
                        <div className='self-description'>
                            <label className='section-label' htmlFor='selfDescription'>Quick Self-Description</label>
                            <textarea
                                onChange={(e) => { setSelfDescription(e.target.value) }}
                                id='selfDescription'
                                name='selfDescription'
                                className='panel__textarea panel__textarea--short'
                                placeholder="Briefly describe your experience, key skills, and years of experience if you don't have a resume handy..."
                            />
                        </div>

                        {/* Info Box */}
                        <div className='info-box'>
                            <span className='info-box__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" stroke="#1a1f27" strokeWidth="2" /><line x1="12" y1="16" x2="12.01" y2="16" stroke="#1a1f27" strokeWidth="2" /></svg>
                            </span>
                            <p>Either a <strong>Resume</strong> or a <strong>Self Description</strong> is required to generate a personalized plan.</p>
                        </div>
                    </div>
                </div>

                {/* Card Footer */}
                <div className='interview-card__footer'>
                    <span className='footer-info'>AI-Powered Strategy Generation &bull; Approx 30s</span>
                    <button
                        onClick={handleGenerateReport}
                        className='generate-btn'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" /></svg>
                        Generate My Interview Strategy
                    </button>
                </div>
            </div>

            {/* Recent Reports List */}
            {reports.length > 0 && (
                <section className='recent-reports'>
                    <h2>My Recent Interview Plans</h2>
                    <ul className='reports-list'>
                        {reports.map(report => (
                            <li key={report._id} className='report-item' onClick={() => navigate(`/interview/${report._id}`)}>
                                <h3>{report.title || 'Untitled Position'}</h3>
                                <p className='report-meta'>Generated on {new Date(report.createdAt).toLocaleDateString()}</p>
                                <p className={`match-score ${report.matchScore >= 80 ? 'score--high' : report.matchScore >= 60 ? 'score--mid' : 'score--low'}`}>Match Score: {report.matchScore}%</p>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* Page Footer */}
            <footer className='page-footer'>
                <a href='#'>Privacy Policy</a>
                <a href='#'>Terms of Service</a>
                <a href='#'>Help Center</a>
            </footer>
        </div>
    )
}

export default Home


================================================
FILE: Frontend/src/features/interview/pages/Interview.jsx
================================================
import React, { useState, useEffect } from 'react'
import '../style/interview.scss'
import { useInterview } from '../hooks/useInterview.js'
import { useNavigate, useParams } from 'react-router'



const NAV_ITEMS = [
    { id: 'technical', label: 'Technical Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>) },
    { id: 'behavioral', label: 'Behavioral Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>) },
    { id: 'roadmap', label: 'Road Map', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>) },
]

// ── Sub-components ────────────────────────────────────────────────────────────
const QuestionCard = ({ item, index }) => {
    const [ open, setOpen ] = useState(false)
    return (
        <div className='q-card'>
            <div className='q-card__header' onClick={() => setOpen(o => !o)}>
                <span className='q-card__index'>Q{index + 1}</span>
                <p className='q-card__question'>{item.question}</p>
                <span className={`q-card__chevron ${open ? 'q-card__chevron--open' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                </span>
            </div>
            {open && (
                <div className='q-card__body'>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--intention'>Intention</span>
                        <p>{item.intention}</p>
                    </div>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--answer'>Model Answer</span>
                        <p>{item.answer}</p>
                    </div>
                </div>
            )}
        </div>
    )
}

const RoadMapDay = ({ day }) => (
    <div className='roadmap-day'>
        <div className='roadmap-day__header'>
            <span className='roadmap-day__badge'>Day {day.day}</span>
            <h3 className='roadmap-day__focus'>{day.focus}</h3>
        </div>
        <ul className='roadmap-day__tasks'>
            {day.tasks.map((task, i) => (
                <li key={i}>
                    <span className='roadmap-day__bullet' />
                    {task}
                </li>
            ))}
        </ul>
    </div>
)

// ── Main Component ────────────────────────────────────────────────────────────
const Interview = () => {
    const [ activeNav, setActiveNav ] = useState('technical')
    const { report, getReportById, loading, getResumePdf } = useInterview()
    const { interviewId } = useParams()

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        }
    }, [ interviewId ])



    if (loading || !report) {
        return (
            <main className='loading-screen'>
                <h1>Loading your interview plan...</h1>
            </main>
        )
    }

    const scoreColor =
        report.matchScore >= 80 ? 'score--high' :
            report.matchScore >= 60 ? 'score--mid' : 'score--low'


    return (
        <div className='interview-page'>
            <div className='interview-layout'>

                {/* ── Left Nav ── */}
                <nav className='interview-nav'>
                    <div className="nav-content">
                        <p className='interview-nav__label'>Sections</p>
                        {NAV_ITEMS.map(item => (
                            <button
                                key={item.id}
                                className={`interview-nav__item ${activeNav === item.id ? 'interview-nav__item--active' : ''}`}
                                onClick={() => setActiveNav(item.id)}
                            >
                                <span className='interview-nav__icon'>{item.icon}</span>
                                {item.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => { getResumePdf(interviewId) }}
                        className='button primary-button' >
                        <svg height={"0.8rem"} style={{ marginRight: "0.8rem" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10.6144 17.7956 11.492 15.7854C12.2731 13.9966 13.6789 12.5726 15.4325 11.7942L17.8482 10.7219C18.6162 10.381 18.6162 9.26368 17.8482 8.92277L15.5079 7.88394C13.7092 7.08552 12.2782 5.60881 11.5105 3.75894L10.6215 1.61673C10.2916.821765 9.19319.821767 8.8633 1.61673L7.97427 3.75892C7.20657 5.60881 5.77553 7.08552 3.97685 7.88394L1.63658 8.92277C.868537 9.26368.868536 10.381 1.63658 10.7219L4.0523 11.7942C5.80589 12.5726 7.21171 13.9966 7.99275 15.7854L8.8704 17.7956C9.20776 18.5682 10.277 18.5682 10.6144 17.7956ZM19.4014 22.6899 19.6482 22.1242C20.0882 21.1156 20.8807 20.3125 21.8695 19.8732L22.6299 19.5353C23.0412 19.3526 23.0412 18.7549 22.6299 18.5722L21.9121 18.2532C20.8978 17.8026 20.0911 16.9698 19.6586 15.9269L19.4052 15.3156C19.2285 14.8896 18.6395 14.8896 18.4628 15.3156L18.2094 15.9269C17.777 16.9698 16.9703 17.8026 15.956 18.2532L15.2381 18.5722C14.8269 18.7549 14.8269 19.3526 15.2381 19.5353L15.9985 19.8732C16.9874 20.3125 17.7798 21.1156 18.2198 22.1242L18.4667 22.6899C18.6473 23.104 19.2207 23.104 19.4014 22.6899Z"></path></svg>
                        Download Resume
                    </button>
                </nav>

                <div className='interview-divider' />

                {/* ── Center Content ── */}
                <main className='interview-content'>
                    {activeNav === 'technical' && (
                        <section>
                            <div className='content-header'>
                                <h2>Technical Questions</h2>
                                <span className='content-header__count'>{report.technicalQuestions.length} questions</span>
                            </div>
                            <div className='q-list'>
                                {report.technicalQuestions.map((q, i) => (
                                    <QuestionCard key={i} item={q} index={i} />
                                ))}
                            </div>
                        </section>
                    )}

                    {activeNav === 'behavioral' && (
                        <section>
                            <div className='content-header'>
                                <h2>Behavioral Questions</h2>
                                <span className='content-header__count'>{report.behavioralQuestions.length} questions</span>
                            </div>
                            <div className='q-list'>
                                {report.behavioralQuestions.map((q, i) => (
                                    <QuestionCard key={i} item={q} index={i} />
                                ))}
                            </div>
                        </section>
                    )}

                    {activeNav === 'roadmap' && (
                        <section>
                            <div className='content-header'>
                                <h2>Preparation Road Map</h2>
                                <span className='content-header__count'>{report.preparationPlan.length}-day plan</span>
                            </div>
                            <div className='roadmap-list'>
                                {report.preparationPlan.map((day) => (
                                    <RoadMapDay key={day.day} day={day} />
                                ))}
                            </div>
                        </section>
                    )}
                </main>

                <div className='interview-divider' />

                {/* ── Right Sidebar ── */}
                <aside className='interview-sidebar'>

                    {/* Match Score */}
                    <div className='match-score'>
                        <p className='match-score__label'>Match Score</p>
                        <div className={`match-score__ring ${scoreColor}`}>
                            <span className='match-score__value'>{report.matchScore}</span>
                            <span className='match-score__pct'>%</span>
                        </div>
                        <p className='match-score__sub'>Strong match for this role</p>
                    </div>

                    <div className='sidebar-divider' />

                    {/* Skill Gaps */}
                    <div className='skill-gaps'>
                        <p className='skill-gaps__label'>Skill Gaps</p>
                        <div className='skill-gaps__list'>
                            {report.skillGaps.map((gap, i) => (
                                <span key={i} className={`skill-tag skill-tag--${gap.severity}`}>
                                    {gap.skill}
                                </span>
                            ))}
                        </div>
                    </div>

                </aside>
            </div>
        </div>
    )
}

export default Interview


================================================
FILE: Frontend/src/features/interview/services/interview.api.js
================================================
import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:3000",
    withCredentials: true,
})


/**
 * @description Service to generate interview report based on user self description, resume and job description.
 */
export const generateInterviewReport = async ({ jobDescription, selfDescription, resumeFile }) => {

    const formData = new FormData()
    formData.append("jobDescription", jobDescription)
    formData.append("selfDescription", selfDescription)
    formData.append("resume", resumeFile)

    const response = await api.post("/api/interview/", formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    })

    return response.data

}


/**
 * @description Service to get interview report by interviewId.
 */
export const getInterviewReportById = async (interviewId) => {
    const response = await api.get(`/api/interview/report/${interviewId}`)

    return response.data
}


/**
 * @description Service to get all interview reports of logged in user.
 */
export const getAllInterviewReports = async () => {
    const response = await api.get("/api/interview/")

    return response.data
}


/**
 * @description Service to generate resume pdf based on user self description, resume content and job description.
 */
export const generateResumePdf = async ({ interviewReportId }) => {
    const response = await api.post(`/api/interview/resume/pdf/${interviewReportId}`, null, {
        responseType: "blob"
    })

    return response.data
}


================================================
FILE: Frontend/src/features/interview/style/home.scss
================================================
// ── Variables ────────────────────────────────────────────────────────────────
$bg-page:        #0d1117;
$bg-card:        #161b22;
$bg-panel:       #1c2230;
$bg-input:       #1e2535;
$border-color:   #2a3348;
$text-primary:   #e6edf3;
$text-muted:     #7d8590;
$accent:         #ff2d78;
$accent-alt:     #ff6b9d;
$badge-required: #ff2d78;
$badge-best:     #ff2d78;
$info-bg:        #1b2a4a;
$info-border:    #2d4a7a;
$font-stack:     system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

// ── Page Shell ───────────────────────────────────────────────────────────────
.home-page {
    width: 100%;
    min-height: 100vh;
    background-color: $bg-page;
    color: $text-primary;
    font-family: $font-stack;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1.5rem;
    gap: 2rem;
}

// ── Page Header ──────────────────────────────────────────────────────────────
.page-header {
    text-align: center;

    h1 {
        font-size: 2.25rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
        color: $text-primary;
    }

    p {
        color: $text-muted;
        font-size: 0.95rem;
        max-width: 480px;
        margin: 0 auto;
        line-height: 1.6;
    }

    .highlight {
        color: $accent;
    }
}

// ── Main Card ─────────────────────────────────────────────────────────────────
.interview-card {
    width: 100%;
    max-width: 900px;
    background-color: $bg-card;
    border: 1px solid $border-color;
    border-radius: 1rem;
    overflow: hidden;

    &__body {
        display: flex;
        min-height: 520px;
    }

    &__footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 1.5rem;
        border-top: 1px solid $border-color;

        .footer-info {
            font-size: 0.8rem;
            color: $text-muted;
        }
    }
}

// ── Panels ────────────────────────────────────────────────────────────────────
.panel-divider {
    width: 1px;
    background-color: $border-color;
    flex-shrink: 0;
}

.panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem;

    &__header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.25rem;

        h2 {
            font-size: 1rem;
            font-weight: 600;
            color: $text-primary;
            flex: 1;
        }
    }

    &__icon {
        display: flex;
        align-items: center;
        color: $accent;
    }

    &__textarea {
        flex: 1;
        width: 100%;
        background-color: $bg-input;
        border: 1px solid $border-color;
        border-radius: 0.5rem;
        padding: 0.75rem 1rem;
        color: $text-primary;
        font-family: $font-stack;
        font-size: 0.875rem;
        resize: none;
        outline: none;
        transition: border-color 0.2s;
        line-height: 1.5;

        &::placeholder {
            color: $text-muted;
        }

        &:focus {
            border-color: $accent;
        }

        &--short {
            flex: unset;
            height: 96px;
        }
    }

    &--left {
        position: relative;

        .char-counter {
            position: absolute;
            bottom: 2.25rem;
            right: 2rem;
            font-size: 0.75rem;
            color: $text-muted;
        }
    }

    &--right {
        gap: 0.75rem;
    }
}

// ── Badges ────────────────────────────────────────────────────────────────────
.badge {
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.15rem 0.5rem;
    border-radius: 0.3rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;

    &--required {
        background-color: rgba($badge-required, 0.15);
        color: $badge-required;
        border: 1px solid rgba($badge-required, 0.3);
    }

    &--best {
        background-color: rgba($badge-best, 0.15);
        color: $badge-best;
        border: 1px solid rgba($badge-best, 0.3);
    }
}

// ── Section Label ─────────────────────────────────────────────────────────────
.section-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: $text-primary;
    margin-bottom: 0.25rem;
}

// ── Dropzone ──────────────────────────────────────────────────────────────────
.upload-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.dropzone {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    padding: 1.5rem 1rem;
    background-color: $bg-input;
    border: 2px dashed $border-color;
    border-radius: 0.6rem;
    cursor: pointer;
    transition: border-color 0.2s, background-color 0.2s;

    &:hover {
        border-color: $accent;
        background-color: rgba($accent, 0.05);
    }

    &__icon {
        color: $accent;
        margin-bottom: 0.25rem;
    }

    &__title {
        font-size: 0.875rem;
        font-weight: 500;
        color: $text-primary;
        margin: 0;
    }

    &__subtitle {
        font-size: 0.75rem;
        color: $text-muted;
        margin: 0;
    }
}

// ── OR Divider ────────────────────────────────────────────────────────────────
.or-divider {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: $text-muted;
    font-size: 0.75rem;

    &::before,
    &::after {
        content: '';
        flex: 1;
        height: 1px;
        background-color: $border-color;
    }

    span {
        white-space: nowrap;
    }
}

// ── Self Description ──────────────────────────────────────────────────────────
.self-description {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

// ── Info Box ──────────────────────────────────────────────────────────────────
.info-box {
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
    padding: 0.75rem 1rem;
    background-color: $info-bg;
    border: 1px solid $info-border;
    border-radius: 0.5rem;

    &__icon {
        flex-shrink: 0;
        color: #4a90e2;
        margin-top: 1px;
    }

    p {
        margin: 0;
        font-size: 0.8rem;
        color: #8ab4f8;
        line-height: 1.5;

        strong {
            color: $text-primary;
        }
    }
}

// ── Generate Button ───────────────────────────────────────────────────────────
.generate-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, $accent 0%, darken($accent, 10%) 100%);
    color: #fff;
    font-size: 0.9rem;
    font-weight: 600;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.1s;
    font-family: $font-stack;

    &:hover {
        opacity: 0.9;
    }

    &:active {
        transform: scale(0.98);
    }
}

.recent-reports{
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
    max-width: 900px;

    .reports-list{
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;

        .report-item{
            background-color: $bg-card;
            border: 1px solid $border-color;
            border-radius: 0.5rem;
            padding: 1rem;
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            cursor: pointer;
            flex-shrink: 0;

            .match-score {
                font-size: 0.8rem;
                font-weight: 600;
                color: $accent;
                align-items: flex-start;
            }
        }
    }
}


// ── Page Footer ───────────────────────────────────────────────────────────────
.page-footer {
    display: flex;
    gap: 1.5rem;

    a {
        font-size: 0.8rem;
        color: $text-muted;
        text-decoration: none;
        transition: color 0.2s;

        &:hover {
            color: $text-primary;
        }
    }
}


================================================
FILE: Frontend/src/features/interview/style/interview.scss
================================================
// ── Shared Variables (mirrors home.scss theme) ────────────────────────────────
$bg-page: #0d1117;
$bg-card: #161b22;
$bg-panel: #1c2230;
$bg-input: #1e2535;
$border-color: #2a3348;
$text-primary: #e6edf3;
$text-muted: #7d8590;
$accent: #ff2d78;
$font-stack: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

// severity palette
$severity-high: #ff4d4d;
$severity-medium: #f5a623;
$severity-low: #3fb950;

*::-webkit-scrollbar {
    display: none;
}

// ── Page Shell ────────────────────────────────────────────────────────────────
.interview-page {
    width: 100%;
    min-height: 100vh;
    background-color: $bg-page;
    color: $text-primary;
    font-family: $font-stack;
    display: flex;
    align-items: stretch;
    padding: 1.5rem;
    box-sizing: border-box;
}

// ── 3-Column Layout ───────────────────────────────────────────────────────────
.interview-layout {
    display: flex;
    width: 100%;
    max-width: 1280px;
    margin: 0 auto;
    background-color: $bg-card;
    border: 1px solid $border-color;
    border-radius: 1rem;
    justify-content: space-between;
}

.interview-divider {
    width: 1px;
    background-color: $border-color;
    flex-shrink: 0;
}

// ── Left Nav ─────────────────────────────────────────────────────────────────
.interview-nav {
    width: 220px;
    flex-shrink: 0;
    padding: 1.75rem 1rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 0.25rem;




    &__label {
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: $text-muted;
        padding: 0 0.75rem;
        margin-bottom: 0.5rem;
    }

    &__item {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        width: 100%;
        padding: 0.65rem 0.75rem;
        background: none;
        border: none;
        border-radius: 0.5rem;
        color: $text-muted;
        font-family: $font-stack;
        font-size: 0.875rem;
        cursor: pointer;
        text-align: left;
        transition: background-color 0.15s, color 0.15s;

        &:hover {
            background-color: $bg-panel;
            color: $text-primary;
        }

        &--active {
            background-color: rgba($accent, 0.1);
            color: $accent;

            .interview-nav__icon svg {
                stroke: $accent;
            }
        }
    }

    &__icon {
        display: flex;
        align-items: center;
        flex-shrink: 0;
    }
}

// ── Center Content ────────────────────────────────────────────────────────────
.interview-content {
    flex: 1;
    padding: 1.75rem 2rem;
    overflow-y: auto;
    min-height: initial;
    max-height: calc(100vh - 3rem);
    padding-bottom: 5rem;
    align-items: flex-start;








    section {
        min-height: 100%;
    }
}

.content-header {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid $border-color;

    h2 {
        font-size: 1.1rem;
        font-weight: 700;
        color: $text-primary;
        margin: 0;
    }

    &__count {
        font-size: 0.8rem;
        color: $text-muted;
        background-color: $bg-panel;
        padding: 0.15rem 0.6rem;
        border-radius: 2rem;
        border: 1px solid $border-color;
    }
}

// ── Question Cards ────────────────────────────────────────────────────────────
.q-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.q-card {
    background-color: $bg-panel;
    border: 1px solid $border-color;
    border-radius: 0.6rem;
    overflow: hidden;
    transition: border-color 0.2s;

    &:hover {
        border-color: lighten($border-color, 8%);
    }

    &__header {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 0.9rem 1rem;
        cursor: pointer;
        user-select: none;
    }

    &__index {
        flex-shrink: 0;
        font-size: 0.7rem;
        font-weight: 700;
        color: $accent;
        background-color: rgba($accent, 0.1);
        border: 1px solid rgba($accent, 0.2);
        border-radius: 0.3rem;
        padding: 0.15rem 0.4rem;
        margin-top: 2px;
    }

    &__question {
        flex: 1;
        margin: 0;
        font-size: 0.9rem;
        font-weight: 500;
        color: $text-primary;
        line-height: 1.5;
    }

    &__chevron {
        flex-shrink: 0;
        color: $text-muted;
        transition: transform 0.2s;
        margin-top: 2px;

        &--open {
            transform: rotate(180deg);
            color: $accent;
        }
    }

    &__body {
        padding: 0 1rem 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        border-top: 1px solid $border-color;
        padding-top: 0.75rem;
    }

    &__section {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;

        p {
            margin: 0;
            font-size: 0.835rem;
            color: lighten($text-muted, 15%);
            line-height: 1.6;
        }
    }

    &__tag {
        font-size: 0.68rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        padding: 0.15rem 0.5rem;
        border-radius: 0.25rem;
        width: fit-content;

        &--intention {
            color: #a78bfa;
            background-color: rgba(#a78bfa, 0.1);
            border: 1px solid rgba(#a78bfa, 0.2);
        }

        &--answer {
            color: #3fb950;
            background-color: rgba(#3fb950, 0.1);
            border: 1px solid rgba(#3fb950, 0.2);
        }
    }
}

// ── Road Map ──────────────────────────────────────────────────────────────────
.roadmap-list {
    display: flex;
    flex-direction: column;
    gap: 0;
    position: relative;

    // vertical timeline line
    &::before {
        content: '';
        position: absolute;
        left: 28px;
        top: 0;
        bottom: 0;
        width: 2px;
        background: linear-gradient(to bottom, $accent, rgba($accent, 0.1));
        border-radius: 1px;
    }
}

.roadmap-day {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem 0 0.75rem 3.5rem;
    position: relative;

    // dot on timeline
    &::before {
        content: '';
        position: absolute;
        left: 21px;
        top: 1.05rem;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background-color: $bg-card;
        border: 2px solid $accent;
    }

    &__header {
        display: flex;
        align-items: center;
        gap: 0.6rem;
    }

    &__badge {
        font-size: 0.7rem;
        font-weight: 700;
        color: $accent;
        background-color: rgba($accent, 0.1);
        border: 1px solid rgba($accent, 0.25);
        padding: 0.1rem 0.5rem;
        border-radius: 2rem;
    }

    &__focus {
        margin: 0;
        font-size: 0.95rem;
        font-weight: 600;
        color: $text-primary;
    }

    &__tasks {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;

        li {
            display: flex;
            align-items: flex-start;
            gap: 0.5rem;
            font-size: 0.845rem;
            color: lighten($text-muted, 12%);
            line-height: 1.5;
        }
    }

    &__bullet {
        flex-shrink: 0;
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background-color: $text-muted;
        margin-top: 8px;
    }
}

// ── Right Sidebar ─────────────────────────────────────────────────────────────
.interview-sidebar {
    width: 240px;
    flex-shrink: 0;
    padding: 1.75rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.sidebar-divider {
    height: 1px;
    background-color: $border-color;
}

// Match Score
.match-score {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;

    &__label {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: $text-muted;
        margin: 0;
        align-self: flex-start;
    }

    &__ring {
        width: 90px;
        height: 90px;
        border-radius: 50%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border: 4px solid;

        &.score--high {
            border-color: $severity-low;
        }

        &.score--mid {
            border-color: $severity-medium;
        }

        &.score--low {
            border-color: $severity-high;
        }
    }

    &__value {
        font-size: 1.6rem;
        font-weight: 800;
        color: $text-primary;
        line-height: 1;
    }

    &__pct {
        font-size: 0.75rem;
        color: $text-muted;
        margin-top: -2px;
    }

    &__sub {
        margin: 0;
        font-size: 0.75rem;
        color: $severity-low;
        text-align: center;
    }
}

// Skill Gaps
.skill-gaps {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;

    &__label {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: $text-muted;
        margin: 0;
    }

    &__list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }
}

.skill-tag {
    font-size: 0.775rem;
    font-weight: 500;
    padding: 0.3rem 0.7rem;
    border-radius: 0.4rem;
    border: 1px solid;
    cursor: default;

    &--high {
        color: $severity-high;
        background-color: rgba($severity-high, 0.1);
        border-color: rgba($severity-high, 0.25);
    }

    &--medium {
        color: $severity-medium;
        background-color: rgba($severity-medium, 0.1);
        border-color: rgba($severity-medium, 0.25);
    }

    &--low {
        color: $severity-low;
        background-color: rgba($severity-low, 0.1);
        border-color: rgba($severity-low, 0.25);
    }
}


================================================
FILE: Frontend/src/style/button.scss
================================================
.button{

    border: none;
    outline: none;
    padding-inline: 1.5rem;
    padding-block: 0.75rem;
    border-radius: 1rem;
    cursor: pointer;

    transition: all 0.3s ease-in-out;

    &.primary-button{
        background-color: #e1034d;
        color: white;
    }

    &:active{
        transform: scale(0.9);
    }
}


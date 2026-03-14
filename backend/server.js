require("dotenv").config()
const app = require("./src/app")
const connectToDB = require("./src/config/database")
// const invokeGeminiAi = require("./src/services/ai.service")
// const { resume, selfDescription, jobDescription } = require("./src/services/temp")
// const generateInterviewReport = require("./src/services/ai.service") 

connectToDB()
// generateInterviewReport({ resume, selfDescription, jobDescription })

// just for basic text of ai
// invokeGeminiAi() 

app.listen(3000, () => {
    console.log("Server is running on port 3000")
})

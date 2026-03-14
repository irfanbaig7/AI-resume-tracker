const resume = `
Ankur Sharma
Bhopal, India
ankur.sharma@gmail.com
+91 9876543210
LinkedIn: linkedin.com/in/ankursharma
GitHub: github.com/ankursharma

PROFESSIONAL SUMMARY
MERN Stack Developer with 3+ years of experience building scalable web applications and RESTful APIs.

TECHNICAL SKILLS
Languages: JavaScript, TypeScript
Frontend: React.js, Redux Toolkit, Tailwind CSS
Backend: Node.js, Express.js
Database: MongoDB, Mongoose
DevOps & Tools: Git, Docker (basic), Postman, Linux
Concepts: REST APIs, JWT Authentication, MVC Architecture

WORK EXPERIENCE

Backend Developer
TechNova Solutions | Jan 2023 | Present

- Designed and implemented RESTful APIs serving 15,000+ active users.
- Optimized MongoDB queries using indexing and aggregation pipelines, reducing response time.
- Built authentication and authorization system using JWT and role-based access control.
- Implemented caching strategy using Redis (basic implementation).
- Led migration from monolithic structure to modular service-based architecture.

CodeWorks Pvt Ltd | July 2021 | Dec 2022

- Developed dynamic UI components using React and Redux Toolkit.
- Integrated third-party APIs including payment gateways and email services.
- Improved frontend performance by reducing bundle size by 20%.
- Collaborated with design and QA teams to deliver production-ready features.

PROJECTS

AI Resume Builder
- Built an AI-powered resume tailoring system using Node.js and Gemini API.
- Implemented PDF generation using Puppeteer.
- Stored structured resume data in MongoDB.

Real-time Chat Application
- Built using Socket.io and Node.js.
- Implemented private messaging and group chat feature.
- Designed scalable event-driven backend architecture.

EDUCATION
Bachelor of Technology in Computer Science
Rajiv Gandhi Technical University | 2021
`


const selfDescription = `
I am a MERN stack developer with around 3 years of experience mainly focused on backend development using Node.js and MongoDB. I have worked on building REST APIs, implementing authentication using JWT, and optimizing database queries.

I enjoy working on system design problems and improving application performance. Recently, I have been exploring AI integrations using Gemini API and learning about scalable backend architecture.

I have some basic knowledge of Redis and Docker but haven't used them extensively in production.

I am currently targeting backend developer roles where I can build scalable systems and improve my expertise in distributed systems and performance optimization.
`


const jobDescription = `
Position: Backend Developer (Node.js)

Location: Remote / Bangalore

We are looking for a Backend Developer with strong experience in Node.js and database design to build scalable and high-performance APIs.

Responsibilities:
- Design and develop scalable RESTful APIs using Node.js and Express.
- Optimize database performance using indexing, query optimization, and caching strategies.
- Implement authentication and authorization mechanisms.
- Work with Redis or similar caching solutions.
- Write clean, maintainable, and testable code.
- Collaborate with frontend and DevOps teams.
- Participate in system design discussions.

Required Skills:
- 3+ years experience in backend development.
- Strong knowledge of Node.js and asynchronous programming.
- Experience with MongoDB and database optimization.
- Understanding of caching strategies (Redis preferred).
`


module.exports = {
    resume,
    selfDescription,
    jobDescription
}


import React from 'react'
import { Link } from 'react-router'
import Navbar from '../../../components/Navbar'
import './Landing.scss'

const FEATURES = [
    {
        icon: '🎯',
        title: 'Match Score',
        desc: 'AI evaluates your profile against the JD and gives a % match score so you know exactly where you stand.'
    },
    {
        icon: '💡',
        title: 'Technical Questions',
        desc: 'Get the exact technical questions likely to be asked — with intentions and model answers.'
    },
    {
        icon: '🧠',
        title: 'Behavioral Prep',
        desc: 'STAR-format behavioral questions tailored to the role, with guidance on what interviewers actually look for.'
    },
    {
        icon: '🗺️',
        title: 'Day-wise Roadmap',
        desc: 'A structured preparation plan telling you what to study, day by day, until your interview.'
    },
    {
        icon: '📄',
        title: 'AI Resume PDF',
        desc: 'Generate a tailored, ATS-friendly resume PDF optimized for the specific job description.'
    },
    {
        icon: '⚡',
        title: 'Instant Results',
        desc: 'Upload your resume, paste the JD, and get a full interview strategy in under 30 seconds.'
    },
]

const Landing = () => {
    return (
        <div className='landing'>
            <Navbar />

            {/* Hero */}
            <section className='landing__hero'>
                <div className='landing__hero-glow' />
                <div className='landing__hero-content'>
                    <span className='landing__badge'>AI-Powered Interview Prep</span>
                    <h1 className='landing__headline'>
                        Stop Guessing.<br />
                        <span className='landing__headline--accent'>Start Preparing Smart.</span>
                    </h1>
                    <p className='landing__subline'>
                        Upload your resume, paste the job description — get a complete, personalized interview strategy in seconds. Technical questions, behavioral prep, skill gaps, and a day-wise roadmap.
                    </p>
                    <div className='landing__cta-group'>
                        <Link to='/register' className='landing__cta-primary'>
                            Get Started Free
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                        </Link>
                        <Link to='/login' className='landing__cta-secondary'>
                            I already have an account
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className='landing__features'>
                <p className='landing__section-label'>What You Get</p>
                <h2 className='landing__section-title'>Everything you need to crack the interview</h2>
                <div className='landing__features-grid'>
                    {FEATURES.map((f, i) => (
                        <div key={i} className='feature-card'>
                            <span className='feature-card__icon'>{f.icon}</span>
                            <h3>{f.title}</h3>
                            <p>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA Banner */}
            <section className='landing__banner'>
                <h2>Ready to walk into your next interview confident?</h2>
                <Link to='/register' className='landing__cta-primary'>
                    Create Free Account
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                </Link>
            </section>

            {/* Footer */}
            <footer className='landing__footer'>
                <span className='landing__footer-brand'>⚡ PrepAI</span>
                <div className='landing__footer-links'>
                    <a href='#'>Privacy Policy</a>
                    <a href='#'>Terms of Service</a>
                    <a href='#'>Help Center</a>
                </div>
                <span className='landing__footer-copy'>© 2025 PrepAI. All rights reserved.</span>
            </footer>
        </div>
    )
}

export default Landing
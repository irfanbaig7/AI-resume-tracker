import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../features/auth/hooks/useAuth'
import './Navbar.scss'

const Navbar = () => {
    const { user, handleLogout } = useAuth()
    const navigate = useNavigate()
    const [dropdownOpen, setDropdownOpen] = useState(false)

    const onLogout = async () => {
        await handleLogout()
        navigate('/')
    }

    return (
        <nav className='navbar'>
            <Link to={user ? '/home' : '/'} className='navbar__brand'>
                <span className='navbar__logo'>⚡</span>
                <span>PrepAI</span>
            </Link>

            <div className='navbar__right'>
                {user ? (
                    <div className='navbar__profile' onClick={() => setDropdownOpen(o => !o)}>
                        <div className='navbar__avatar'>
                            {user.username[0].toUpperCase()}
                        </div>
                        <span className='navbar__username'>{user.username}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>

                        {dropdownOpen && (
                            <div className='navbar__dropdown'>
                                <div className='navbar__dropdown-header'>
                                    <p className='name'>{user.username}</p>
                                    <p className='email'>{user.email}</p>
                                </div>
                                <div className='navbar__dropdown-divider' />
                                <button onClick={onLogout} className='navbar__dropdown-item navbar__dropdown-item--danger'>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className='navbar__auth-links'>
                        <Link to='/login' className='navbar__link'>Login</Link>
                        <Link to='/register' className='navbar__btn'>Get Started</Link>
                    </div>
                )}
            </div>
        </nav>
    )
}

export default Navbar
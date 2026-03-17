import React, { useState } from 'react'
import "../../auth/auth.form.scss"
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../hooks/useAuth'
 
 
const Register = () => {
 
  const navigate = useNavigate();
  const { handleRegister, loding } = useAuth()
 
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
 
  const handleSubmit = async (e) => {
    e.preventDefault()
    await handleRegister({ username, email, password })  // await fix
    navigate("/")
  }
 
  if (loding) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h1 style={{ color: '#888', fontWeight: 400, fontSize: '1rem' }}>Loading...</h1>
      </main>
    )
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
 
          <button className='button primary-button'>Register</button>
        </form>
 
        <p>Already have an account? <Link to="/login">Login</Link></p>
      </div>
    </main>
  )
}
 
export default Register
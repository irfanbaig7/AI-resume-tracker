import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import "../../auth/auth.form.scss"
import { useAuth } from '../hooks/useAuth'


const Login = () => {

    const { loding, handleLogin } = useAuth()
    const naviagte = useNavigate();

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault()
        await handleLogin({ email, password })
        naviagte("/")
    }

    if(loding){
        return (<main><h1>Loading......</h1></main>)
    }


    return (
        <main>
            <div className='form-container'>
                <h1>Login</h1>

                <form onSubmit={handleSubmit}>
                    <div className='input-group'>
                        <label htmlFor="email">email</label>
                        <input onChange={(e) => {setEmail(e.target.value)}}  type="email" id='email' name='email' placeholder='Enter ur Email' />
                    </div>
                    <div className='input-group'>
                        <label htmlFor="password">password</label>
                        <input onChange={(e) => {setPassword(e.target.value)}} type="password" id='password' name='password' placeholder='Enter ur password' />
                    </div>
                    <button className='button primary-button'>
                        Login
                    </button>
                </form>
                <p>Don't have an account? <Link to={"/register"} >register</Link> </p>


            </div>
        </main>
    )
}

export default Login
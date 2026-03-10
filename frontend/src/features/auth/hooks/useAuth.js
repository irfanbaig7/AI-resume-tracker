import { useContext, useEffect } from "react";
import { AuthContext } from "../auth.context";
import { register, login, logout, getMe } from "../api/auth.api";


export const useAuth = () => {
    const context = useContext(AuthContext)
    const { user, setUser, loding, setLoding } = context


    const handleLogin = async ({ email, password }) => {
        setLoding(true)
        try {
            const data = await login({ email, password })
            setUser(data.user)
        } catch (error) {
            console.log(error.message);
        } finally {
            setLoding(false)
        }



    }

    const handleRegister = async ({ username, email, password }) => {
        setLoding(true)
        try {
            const data = await register({ username, email, password })
            setUser(data.user)
        } catch (error) {
            console.log(error.message);
        } finally {
            setLoding(false)
        }

    }

    const handleLogout = async () => {
        setLoding(true)
        try {
            await logout()
            setUser(null)
        } catch (error) {
            console.log(error.message);
        } finally {
            setLoding(false)
        }

    }

    // const handleGetme = async () => {
    //     setLoding(true)
    //     try {
    //         const data = await getMe()
    //         setUser(data.user)
    //     } catch (error) {
    //         console.log(error.message);
    //     } finally {
    //         setLoding(false)
    //     }


    // }

    useEffect(() => {
        const getAndSetUser = async () => {
            const data = await getMe()
            setUser(data.user)
            setLoding(false)
        }
        getAndSetUser()
    }, [])


    return { user, loding, handleRegister, handleLogin, handleLogout, }


}


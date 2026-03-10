import { createContext, useState } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(null)
    const [loding, setLoding] = useState(true)

    return (
        <AuthContext.Provider value={{ user, loding, setUser, setLoding }} >
            {children}
        </AuthContext.Provider>
    )

}

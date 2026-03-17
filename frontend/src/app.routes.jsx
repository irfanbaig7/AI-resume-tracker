import { createBrowserRouter } from "react-router";
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import Protected from "./features/auth/components/Protected";
import Home from "./features/interview/pages/Home";
import Interview from "./features/interview/pages/Interview";
import Landing from "./features/landing/pages/Landing";


export const router = createBrowserRouter([

    {
        path: "/",
        element: <Landing />        // public landing page
    },
    {
        path: "/home",
        element: <Protected> <Home /> </Protected>
    },
    {
        path: "/login",
        element: <Login />
    },
    {
        path: "/register",
        element: <Register />
    },
    {
        path: "/interview/:interviewId",
        element: <Protected><Interview /></Protected>
    }
])

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import LandingPage from "./components/LandingPage";
import MainPage from "./components/MainPage";
import About from "./components/About";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Profile from "./components/Profile";
import IndividualMovie from "./components/IndividualMovie";
import Error from "./components/Error";
import FreshSetup from "./components/FreshSetup";
import ProtectedRoute from "./components/ProtectedRoute"; // Import the ProtectedRoute
import Recommendations from "./components/Recommendations";
import { useState } from "react";

function App() {
    const [userRating, setUserRating] = useState([]);
    const callback = (imdbId, rating) => {
        console.log(`Rated movie ${imdbId} with rating ${rating}`);
        window.alert(`Rated movie ${imdbId} with rating ${rating}`);
        setUserRating((prevRatings) => {
            const updatedRatings = { ...prevRatings, [imdbId]: rating };
            // localStorage.setItem("userRatings", JSON.stringify(updatedRatings));
            return updatedRatings;
        });
    };
    console.log("User Ratings:", userRating); // Debugging
    return (
        <BrowserRouter>
            <Routes>
                {/* Landing Page (No Navbar) */}
                <Route path="/" element={<LandingPage />} />

                {/* Other Pages (With Navbar) */}
                <Route element={<Navbar userRatings={userRating} />}>
                    <Route
                        path="/mainpage"
                        element={<MainPage callback_handler={callback} />}
                    />
                    <Route path="/about" element={<About />} />
                    <Route
                        path="/recommendations"
                        element={<Recommendations />}
                    />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/movie/:id" element={<IndividualMovie />} />
                </Route>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                {/* FreshSetup is Protected */}
                <Route
                    path="/FreshSetup"
                    element={
                        <ProtectedRoute>
                            <FreshSetup />
                        </ProtectedRoute>
                    }
                />

                {/* Error Page */}
                <Route path="*" element={<Error />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;

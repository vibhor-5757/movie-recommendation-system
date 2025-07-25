import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LandingPage.css"; // New CSS file

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="landing-page">
            <div className="overlay"></div>
            <div className="content">
                <h1>Welcome to MovieFlix</h1>
                <p>
                    Discover, Rate, and Get Personalized Movie Recommendations
                </p>
                <div className="button-container">
                    <button
                        className="btn sign-in"
                        onClick={() => navigate("/login")}
                    >
                        Sign In
                    </button>
                    <button
                        className="btn sign-up"
                        onClick={() => navigate("/signup")}
                    >
                        Sign Up
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;

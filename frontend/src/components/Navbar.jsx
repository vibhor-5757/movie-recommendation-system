import React, { useState, useEffect } from "react";
import { BiSolidCameraMovie } from "react-icons/bi";
import { MdHome } from "react-icons/md";
import { Link, Outlet } from "react-router";

function Navbar({userRatings}) {
    const {imdbId, rating} = userRatings;
    console.log("User Ratings NAVBAR:", userRatings); // Debugging
    
    // const handleRateMovie = (imdbId, rating) => {
    //     setUserRatings((prevRatings) => {
    //         const updatedRatings = { ...prevRatings, [imdbId]: rating };
    //         // localStorage.setItem("userRatings", JSON.stringify(updatedRatings));
    //         return updatedRatings;
    //     });
    // };

    return (
        <div>
            <div className="navbar">
                <div className="logo-and-brand">
                    <div className="logo-div">
                        <BiSolidCameraMovie className="logo" />
                    </div>
                    <div className="brand">MovieFlix</div>
                </div>
                <div className="centre-section">
                    <div className="user-name-login">
                        <Link
                            to="/recommendations"
                            state={{ imdbId, rating }} 
                            className="bn3"
                        >
                            Recommendations
                        </Link>
                    </div>
                </div>
                <div className="right-buttons">
                    <div className="home-button">
                        <a href="/mainpage" className="bn3 ">
                            <MdHome />
                        </a>
                    </div>
                    <div className="user-name-login">
                        <a href="/profile" className="bn3">
                            Profile
                        </a>
                    </div>
                </div>
            </div>
            {/* Pass userRatings and handleRateMovie globally */}
            <Outlet context={{ userRatings }} />
        </div>
    );
}

export default Navbar;

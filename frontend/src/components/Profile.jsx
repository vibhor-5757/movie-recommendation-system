import React, { useState } from "react";
import MovieCarousel from "./MovieCarousel";

const Profile = () => {
    const [name, setName] = useState("Placeholder");
    const [model, setModel] = useState("user-based");

    const handleModelChange = (event) => {
        setModel(event.target.value);
    };

    const handleSubmit = () => {
        alert(`Selected Model: ${model}`);
    };

    return (
        <div>
            <div className="profile-photo-and-name">
                <img className="profile-photo" alt="Profile" />
                <div>
                    <h1>Hi, {name}</h1>
                </div>
            </div>
            <div className="recently-rated-movies">
                <h2>Your Recently Rated Movies</h2>
                <MovieCarousel />
            </div>
            <div className="select-model-radio">
                <h2>Select Model</h2>
                <label>
                    <input
                        type="radio"
                        name="model"
                        value="user-based"
                        checked={model === "user-based"}
                        onChange={handleModelChange}
                    />
                    User based model
                </label>
                <label>
                    <input
                        type="radio"
                        name="model"
                        value="movie-based"
                        checked={model === "movie-based"}
                        onChange={handleModelChange}
                    />
                    Movie based model
                </label>
                <label>
                    <input
                        type="radio"
                        name="model"
                        value="summary-based"
                        checked={model === "summary-based"}
                        onChange={handleModelChange}
                    />
                    Summary based model
                </label>
                <label>
                    <input
                        type="radio"
                        name="model"
                        value="cast-based"
                        checked={model === "cast-based"}
                        onChange={handleModelChange}
                    />
                    Cast based model
                </label>
                <button className="submit-button" onClick={handleSubmit}>
                    Submit
                </button>
            </div>
        </div>
    );
};

export default Profile;

import React from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";

function IndividualMovie() {
    const location = useLocation();
    const { id } = useParams();
    const navigate = useNavigate();

    // Redirect if accessed without state (e.g., via direct URL)
    if (!location.state) {
        navigate("/");
        return null;
    }

    const { title, rating, posterUrl, year } = location.state;

    return (
        <div className="individual-movie-page">
            <div className="movie-container">
                <div className="movie-poster">
                    <img src={posterUrl} alt={title} className="poster-img" />
                </div>
                <div className="movie-info">
                    <h1 className="movie-title">{title}</h1>
                    <p className="movie-year">🗓️ Year: {year}</p>
                    <p className="movie-rating">⭐ Rating: {rating}</p>
                </div>
            </div>
        </div>
    );
}

export default IndividualMovie;

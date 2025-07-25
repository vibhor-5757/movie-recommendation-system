import React, { useState } from "react";
import { Link } from "react-router";

// Store ratings for the user
const userRatings = {
    userId: 1300000,
    ratings: {},
};

const Movie = ({ id, title, rating, posterUrl, year, onRate }) => {
    // Initialize rating from userRatings or prop
    const [userRating, setUserRating] = useState(
        userRatings.ratings[id] || rating || 0
    );
    const [hover, setHover] = useState(0);
    const [posterHover, setPosterHover] = useState(0);

    const handleRatingClick = (star) => {
        setUserRating(star);
        userRatings.ratings[id] = star; // Store rating in userRatings object
        console.log("Updated Ratings:", userRatings); // Debugging
        if (onRate) {
            onRate(id, star);
        }
    };
    
    return (
        <div className="movie">
            <div
                className="movie-poster"
                onMouseEnter={() => setPosterHover(1)}
                onMouseLeave={() => setPosterHover(0)}
            >
                <img src={posterUrl} alt={title} />
            </div>

            {posterHover ? (
                <div
                    className="ratings-overlay"
                    onMouseEnter={() => setPosterHover(1)}
                    onMouseLeave={() => setPosterHover(0)}
                >
                    <div className="ratings">
                        <div className="star-rating">
                            <div style={{ fontSize: 24 }}>{userRating}★</div>
                            <div
                                className="stars"
                                style={{
                                    display: "flex",
                                    flexDirection: "row",
                                }}
                            >
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                        key={star}
                                        style={{
                                            fontSize: "2rem",
                                            color:
                                                star <= (hover || userRating)
                                                    ? "#ffc107"
                                                    : "#e4e5e9",
                                            cursor: "pointer",
                                        }}
                                        onClick={() => handleRatingClick(star)}
                                        onMouseEnter={() => setHover(star)}
                                        onMouseLeave={() => setHover(0)}
                                    >
                                        ★
                                    </span>
                                ))}
                            </div>
                            <div className="rating">
                                Your Rating: {userRating ? userRating : 0}★
                            </div>
                            <button
                                onClick={() => handleRatingClick(0)}
                                style={{ height: 20, width: 50 }}
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            <Link
                to={`/movie/${id}`}
                state={{ id, title, rating, posterUrl, year }}
                style={{ textDecoration: "none", color: "inherit" }}
            >
                <div className="movie-details">
                    <div className="movie-title">{title}</div>
                    <div>{year}</div>
                </div>
            </Link>
        </div>
    );
};

export default Movie;

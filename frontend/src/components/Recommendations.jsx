import React, { useEffect, useState } from "react";
import MovieCarousel from "./MovieCarousel";
import { useLocation } from "react-router-dom"; // Import useLocation

const Recommendations = () => {
    const location = useLocation(); // Get the location object
    // Access state passed through Link
    const { imdbId, rating } = location.state; // Handles undefined state
    const [imdbIds, setImdbIds] = useState([]);
    console.log("IMDB ID Recommendations:", imdbId); // Debugging
    console.log("Rating Recommendations:", rating); // Debugging
    useEffect(() => {
        const fetchRecommendations = async () => {
            
            const userRating = {
                user_id: 1300000,
                ratings: {
                    [imdbId]: rating,
                },
            };
            console.log("User Ratings:", userRating); // Debugging
            if (Object.keys(userRating.ratings).length === 0) {
                console.log("No ratings available for recommendations.");
                return;
            }

            try {
                const response = await fetch(
                    "http://localhost:8000/recommend/user_based",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(userRating),
                    }
                );

                const data = await response.json();

                if (response.ok && data.recommended_movies) {
                    setImdbIds(Object.values(data.recommended_movies));
                } else {
                    console.error(
                        "Error fetching recommendations:",
                        data.detail
                    );
                }
            } catch (error) {
                console.error("API Request Error:", error);
            }
        };

        fetchRecommendations();
    }, [rating]); // Re-run when userRatings change

    return (
        <div>

        <div>
            <h2>User Based Collaborative Filtering Model</h2>
            {imdbIds.length > 0 ? (
                <MovieCarousel imdbIds={imdbIds} />
            ) : (
                <p>No recommendations yet. Rate some movies first!</p>
            )}
        </div>
        <div>
            <h2>Movie Based Collaborative Filtering Model</h2>
            {imdbIds.length > 0 ? (
                <MovieCarousel imdbIds={imdbIds} />
            ) : (
                <p>No recommendations yet. Rate some movies first!</p>
            )}
        </div>
        <div>
            <h2>Summary Based Content Filtering Model</h2>
            {imdbIds.length > 0 ? (
                <MovieCarousel imdbIds={imdbIds} />
            ) : (
                <p>No recommendations yet. Rate some movies first!</p>
            )}
        </div>
        </div>
    );
};

export default Recommendations;

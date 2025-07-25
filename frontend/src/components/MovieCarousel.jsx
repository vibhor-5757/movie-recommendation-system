import { useState, useEffect } from "react";
import Movie from "./Movie";

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const MovieCarousel = ({ imdbIds, userId, callback }) => {
    const [movieDetails, setMovieDetails] = useState([]);
    const [ratings, setRatings] = useState({}); // Store ratings

    useEffect(() => {
        if (imdbIds.length === 0) return;

        const fetchMovieDetails = async () => {
            const moviePromises = imdbIds.map(async (imdbId) => {
                try {
                    const response = await fetch(
                        `https://api.themoviedb.org/3/find/${imdbId}?external_source=imdb_id&language=en`,
                        {
                            method: "GET",
                            headers: {
                                accept: "application/json",
                                Authorization: `Bearer ${TMDB_API_KEY}`,
                            },
                        }
                    );
                    const data = await response.json();
                    if (data.movie_results && data.movie_results.length > 0) {
                        const movie = data.movie_results[0];
                        return {
                            id: imdbId,
                            title: movie.title,
                            posterUrl: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
                            year: movie.release_date
                                ? movie.release_date.split("-")[0]
                                : "N/A",
                        };
                    }
                } catch (error) {
                    console.error("Error fetching movie:", error);
                }
                return null;
            });

            const fetchedMovies = (await Promise.all(moviePromises)).filter(
                Boolean
            );
            setMovieDetails(fetchedMovies);
        };

        fetchMovieDetails();
    }, [imdbIds]);

    // Function to handle rating update
    const handleRate = (imdbId, rating) => {
        setRatings((prevRatings) => ({
            ...prevRatings,
            [userId]: {
                ...(prevRatings[userId] || {}),
                ratings: {
                    ...(prevRatings[userId]?.ratings || {}),
                    [imdbId]: rating,
                },
            },
        }));
        callback(imdbId, rating); // Call the callback function
    };

    console.log("User Ratings:", ratings); // Debugging

    return (
        <div className="movie-carousel">
            {movieDetails.map((movie) => (
                <Movie
                    key={movie.id}
                    id={movie.id}
                    title={movie.title}
                    year={movie.year}
                    posterUrl={movie.posterUrl}
                    rating={ratings[userId]?.ratings?.[movie.id] || 0} // Retrieve stored rating
                    onRate={handleRate} // Pass function to update rating
                />
            ))}
        </div>
    );
};

export default MovieCarousel;

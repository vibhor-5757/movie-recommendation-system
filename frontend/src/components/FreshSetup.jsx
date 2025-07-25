import React, { useState, useEffect } from "react";
// Importing the JSON
import { useNavigate } from "react-router-dom";
import Movie from "./Movie";
import { auth, db } from "../firebase";
import { getAuth } from "firebase/auth";
import { doc, setDoc, getDocs, collection } from "firebase/firestore";



const FreshSetup = () => {
    const navigate = useNavigate();
    const [movies, setMovies] = useState([]);
    const [ratings, setRatings] = useState({});
    const [ratedMovies, setRatedMovies] = useState([]);
    const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

    const [moviesByGenre, setMoviesByGenre] = useState({});

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                const genres = [
                    "Action",
                    "Comedy",
                    "Drama",
                    "Horror",
                    "Sci-Fi",
                ];

                // Fetch IMDb IDs for each genre
                const genreMoviePromises = genres.map(async (genre) => {
                    const response = await fetch(
                        `http://localhost:8000/top_movies_by_genre/${genre}`
                    );
                    if (!response.ok) {
                        throw new Error(`Error fetching movies for ${genre}`);
                    }
                    const data = await response.json();
                    console.log(
                        `Fetched IMDb IDs for ${genre}:`,
                        data.imdb_ids
                    );
                    return { [genre]: data.imdb_ids };
                });

                const genreMoviesArray = await Promise.all(genreMoviePromises);
                const moviesByGenre = Object.assign({}, ...genreMoviesArray);
                setMoviesByGenre(moviesByGenre);

                console.log("Movies by Genre:", moviesByGenre);

                // Fetch TMDB details for each movie
                const movieDetailsPromises = Object.entries(
                    moviesByGenre
                ).flatMap(([genre, imdbIds]) =>
                    imdbIds.map(async (imdbId) => {
                        try {
                            const response = await fetch(
                                `https://api.themoviedb.org/3/find/${imdbId}?external_source=imdb_id&language=en`,
                                {
                                    headers: {
                                        accept: "application/json",
                                        Authorization: `Bearer ${TMDB_API_KEY}`,
                                    },
                                }
                            );
                            const data = await response.json();
                            if (data.movie_results.length > 0) {
                                const movie = data.movie_results[0];
                                return {
                                    id: movie.id,
                                    imdbID: imdbId, // Ensure we track IMDb ID
                                    title: movie.title,
                                    posterUrl: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
                                    year: movie.release_date
                                        ? movie.release_date.split("-")[0]
                                        : "N/A",
                                    genre,
                                };
                            }
                        } catch (error) {
                            console.error(
                                "Error fetching movie details:",
                                error
                            );
                        }
                        return null;
                    })
                );

                const fetchedMovies = (
                    await Promise.all(movieDetailsPromises)
                ).filter(Boolean);
                setMovies(fetchedMovies);

                // Organize movies by genre (no need to slice again)
                const moviesByGenreFinal = genres.reduce((acc, genre) => {
                    acc[genre] = fetchedMovies.filter(
                        (movie) => movie.genre === genre
                    );
                    return acc;
                }, {});

                setMoviesByGenre(moviesByGenreFinal);
                console.log("Final Movies By Genre:", moviesByGenreFinal);
            } catch (error) {
                console.error("Error fetching movies:", error);
            }
        };

        fetchMovies();
    }, []);

    const handleRatingChange = (movieId, rating) => {
        console.log(
            `Updating rating: Movie ID = ${movieId}, Rating = ${rating}`
        );

        setRatings((prevRatings) => ({
            ...prevRatings,
            [movieId]: rating,
        }));

        setRatedMovies((prevRatedMovies) => {
            const existingMovieIndex = prevRatedMovies.findIndex(
                (m) => m.imdbID === movieId
            );

            if (existingMovieIndex !== -1) {
                // Update the existing movie rating
                const updatedMovies = [...prevRatedMovies];
                updatedMovies[existingMovieIndex] = {
                    ...updatedMovies[existingMovieIndex],
                    rating: rating,
                };
                return updatedMovies;
            } else {
                // Add a new movie entry
                const movie = movies.find((m) => m.imdbID === movieId);
                if (movie) {
                    console.log(
                        `Adding new rated movie: ${movie.title} (IMDb ID: ${movie.imdbID})`
                    );
                    return [...prevRatedMovies, { ...movie, rating }];
                } else {
                    console.warn(`Movie not found for ID: ${movieId}`);
                    return prevRatedMovies;
                }
            }
        });
    };


    // useEffect(() => {
    //     const user = auth.currentUser;
    //     const needsSetup = localStorage.getItem("needsSetup") === "true";

    //     if (!user) {
    //         navigate("/login");
    //         return;
    //     }

    //     if (!needsSetup) {
    //         navigate("/MainPage");
    //         return;
    //     }
    // }, [navigate]);

    // const handleSubmit = async () => {
    //     try {
    //         const ratingsRef = collection(db, "ratings");

    //         for (const movie of ratedMovies) {
    //             const movieDoc = doc(ratingsRef, movie.imdbID); // Use IMDb ID as document ID
    //             await setDoc(movieDoc, {
    //                 movieID: movie.imdbID,
    //                 rating: movie.rating,
    //                 timestamp: new Date(),
    //             });
    //         }

    //         console.log("Ratings submitted successfully!");
    //         localStorage.setItem("needsSetup", "false");
    //         navigate("/MainPage");
    //     } catch (error) {
    //         console.error("Error submitting ratings:", error);
    //     }
    // };


    const handleSubmit = async () => {
        try {
            if (!ratedMovies || ratedMovies.length === 0) {
                console.error("No movies have been rated!");
                return;
            }

            // Reference to the 'user-data' collection
            const userCollection = collection(db, "user-data");

            // Fetch existing users to determine the next available user ID
            const snapshot = await getDocs(userCollection);
            const userCount = snapshot.size; // Number of existing users

            // Generate user ID starting from 130000
            const userId = 130000 + userCount;

            // Prepare ratings object
            const ratings = {};
            ratedMovies.forEach((movie) => {
                if (movie?.imdbID && movie?.rating !== undefined) {
                    ratings[movie.imdbID] = movie.rating; // Store IMDb ID as key
                } else {
                    console.warn(
                        "Skipping movie with missing IMDb ID or rating:",
                        movie
                    );
                }
            });

            // Check if ratings object is still empty
            if (Object.keys(ratings).length === 0) {
                console.error(
                    "No valid ratings found. Ratings object is empty."
                );
                return;
            }

            // Create a new document in Firestore with user ID
            const userDoc = doc(db, "user-data", userId.toString());
            await setDoc(userDoc, {
                user_id: userId,
                ratings: ratings,
            });

            console.log("Ratings submitted successfully for user:", userId);
            console.log("Stored Ratings:", ratings); // Debugging output
            localStorage.setItem("needsSetup", "false");
            navigate("/MainPage");
        } catch (error) {
            console.error("Error submitting ratings:", error);
        }
    };


    

    return (
        <div className="freshsetup">
            <h2>Rate Movies to Get Better Recommendations!</h2>

            <div className="freshsetup-carousel-section">
                {Object.keys(moviesByGenre).map((genre, index) => (
                    <div key={index} className="freshsetup-genre">
                        <h3>{genre}</h3>
                        <div className="movie-carousel">
                            {(moviesByGenre[genre] || []).map((movie) => (
                                <Movie
                                    key={movie.imdbID} // Use IMDb ID as key
                                    id={movie.imdbID} // Pass IMDb ID instead of TMDB ID
                                    title={movie.title}
                                    rating={ratings[movie.imdbID] || 0} // Retrieve rating using IMDb ID
                                    posterUrl={movie.posterUrl}
                                    year={movie.year}
                                    onRate={handleRatingChange}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="rated-movies">
                <h3 className="rated-movies-title">Movies You Have Rated:</h3>
                {ratedMovies.length > 0 ? (
                    <ul className="rated-movies-list">
                        {ratedMovies.map((movie) => (
                            <li key={movie.imdbID} className="rated-movie-item">
                                <span className="rated-movie-title">
                                    {movie.title}
                                </span>
                                <span className="rated-movie-rating">
                                    {movie.rating}★
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="no-rated-movies">
                        You haven't rated any movies yet.
                    </p>
                )}
            </div>

            <button className="submit-button" onClick={handleSubmit}>
                Submit
            </button>
        </div>
    );
};

export default FreshSetup;

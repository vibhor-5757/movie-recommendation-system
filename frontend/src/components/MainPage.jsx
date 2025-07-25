import React, { useState, useEffect } from "react";
import MovieCarousel from "./MovieCarousel";

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
// Hardcoded regions for selection
const regions = [
    { name: "United States", code: "ISO%203166-2%3AUS" },
    { name: "India", code: "ISO%203166-2%3AIN" },
    { name: "Spain", code: "ISO%203166-2%3AES" },
    { name: "Japan", code: "ISO%203166-2%3AJP" },
    { name: "Russia", code: "ISO%203166-2%3ARU" },
];

function MainPage({callback_handler}) {
    const [topMovies, setTopMovies] = useState([]);
    const [popularMovies, setPopularMovies] = useState([]);
    const [selectedRegion, setSelectedRegion] = useState("US"); // Default to US
    const [topMoviesByTopGenres, setTopMoviesByTopGenres] = useState([]);

    // Fetch top movies from FastAPI
    useEffect(() => {
        const fetchTopMovies = async () => {
            try {
                const response = await fetch(
                    "http://localhost:8000/top_movies"
                ); // Ensure this matches the route in FastAPI
                const data = await response.json();
                console.log("Top Movies:", data);
                setTopMovies(data.imdb_ids); // Update the state with the imdb_ids from the response
            } catch (error) {
                console.error("Error fetching top movies:", error);
            }
        };

        fetchTopMovies();
    }, []);
    
    // Fetch Top movies by Top Genres from FastAPI
    useEffect(() => {
        const fetchTopMovies = async () => {
            try {
                const response = await fetch(
                    "http://localhost:8000/top_movies_by_top_genres"
                ); // Ensure this matches the route in FastAPI
                const data = await response.json();
                console.log("Top Movies:", data);
                setTopMoviesByTopGenres(data.imdb_ids); // Update the state with the imdb_ids from the response
            } catch (error) {
                console.error("Error fetching top movies:", error);
            }
        };

        fetchTopMovies();
    }, []);

    // Fetch popular movies from TMDB based on selected region
    // useEffect(() => {
    //     const fetchPopularMovies = async () => {
    //         try {
    //             const url =
    //                 `https://api.themoviedb.org/3/movie/popular?language=en-US&page=1&region=${selectedRegion}`;
    //             const options = {
    //                 method: "GET",
    //                 headers: {
    //                     accept: "application/json",
    //                     Authorization: `Bearer ${TMDB_API_KEY}`,
    //                 },
    //             };

    //             const response = await fetch(url, options);
    //             const data = await response.json();
    //             console.log(`Popular Movies in ${selectedRegion}:`, data);

    //             // Extract only IMDb IDs if available
    //             const imdbIds = data.results?.map((movie) => movie.id) || [];
    //             setPopularMovies(imdbIds);
    //         } catch (error) {
    //             console.error("Error fetching popular movies:", error);
    //         }
    //     };

    //     fetchPopularMovies();
    // }, [selectedRegion]); // Trigger this effect when the selected region changes

    const callback = (imdbId, rating) => {
        console.log(`Rated movie ${imdbId} with rating ${rating} in MainPage`);
        callback_handler(imdbId, rating); // Call the callback function passed as a prop
    };
    return (
        <div className="mainpage">
            <div className="mainpage-title">
                Get recommendations based on your ratings!
            </div>
            <div className="carousel-section">
                <div className="top-picks">
                    <h3>Top Picks</h3>
                    {/* Pass topMovies as prop to MovieCarousel */}
                    <MovieCarousel imdbIds={topMovies} callback={callback} />
                </div>
                {/* Region Selection */}
                {/* <div className="region-selection">
                    <h3>Select Region for Popular Movies:</h3>
                    {regions.map((region) => (
                        <label key={region.code}>
                            <input
                                type="radio"
                                name="region"
                                value={region.code}
                                checked={selectedRegion === region.code}
                                onChange={() => setSelectedRegion(region.code)}
                            />
                            {region.name}
                        </label>
                    ))}
                </div> */}
                <div className="top-movies-by-top-genres">
                    <h3>Top Movies by Top Genres</h3>
                    {/* Pass topMovies as prop to MovieCarousel */}
                    <MovieCarousel imdbIds={topMoviesByTopGenres} />
                </div>
                <div className="also-watch">
                    <h3>Recommended Movies</h3>
                    {/* Pass topMovies as prop to MovieCarousel */}
                    <MovieCarousel imdbIds={topMovies} />
                </div>
            </div>
        </div>
    );
}

export default MainPage;

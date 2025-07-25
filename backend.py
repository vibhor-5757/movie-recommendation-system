# import matplotlib.pyplot as plt
import pandas as pd
# import os
# import pickle
import numpy as np
import joblib 
from typing import Dict

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, db

from sklearn.neighbors import NearestNeighbors
from sklearn.metrics.pairwise import cosine_similarity
from scipy.sparse import csr_matrix

merged_df_path = 'C:/Users/vibhor bhatia/Downloads/ml_code/movie recommendation system system/dataset/merged_rating_df.csv'

merged_df = pd.read_csv('C:/Users/vibhor bhatia/Downloads/ml_code/movie recommendation system/dataset/merged_rating_df.csv')
# print(merged_df[merged_df["userId"] == 152936])
combined_dataset = pd.read_csv('C:/Users/vibhor bhatia/Downloads/ml_code/movie recommendation system/dataset/combined_dataset.csv')


movie_matrix = joblib.load('C:/Users/vibhor bhatia/Downloads/ml_code/movie recommendation system/dataset/movie_collaborative_matrix.pkl', mmap_mode=None)
user_matrix = joblib.load('C:/Users/vibhor bhatia/Downloads/ml_code/movie recommendation system/dataset/user_collaborative_matrix.pkl', mmap_mode=None)
movie_pivot = joblib.load('C:/Users/vibhor bhatia/Downloads/ml_code/movie recommendation system/dataset/movie_collaborative_pivot.pkl', mmap_mode=None)
user_pivot = joblib.load('C:/Users/vibhor bhatia/Downloads/ml_code/movie recommendation system/dataset/user_collaborative_pivot.pkl', mmap_mode=None)

summary_matrix = joblib.load('C:/Users/vibhor bhatia/Downloads/ml_code/movie recommendation system/dataset/summary_based_tfidf_matrix.pkl', mmap_mode=None)
cast_matrix = joblib.load('C:/Users/vibhor bhatia/Downloads/ml_code/movie recommendation system/dataset/cast_based_count_matrix.pkl', mmap_mode=None)
hybrid_matrix = joblib.load('C:/Users/vibhor bhatia/Downloads/ml_code/movie recommendation system/dataset/hybrid_tfidf_matrix.pkl', mmap_mode=None)

user_based_model = joblib.load('C:/Users/vibhor bhatia/Downloads/ml_code/movie recommendation system/models/user_collaborative_knn.pkl', mmap_mode=None)
movie_based_model = joblib.load('C:/Users/vibhor bhatia/Downloads/ml_code/movie recommendation system/models/movie_collaborative_knn.pkl', mmap_mode=None)
summary_based_model = joblib.load('C:/Users/vibhor bhatia/Downloads/ml_code/movie recommendation system/models/summary_based_tfidf_vectorizer.pkl', mmap_mode=None)
cast_based_model = joblib.load('C:/Users/vibhor bhatia/Downloads/ml_code/movie recommendation system/models/cast_based_count_vectorizer.pkl', mmap_mode=None)
hybrid_model = joblib.load('C:/Users/vibhor bhatia/Downloads/ml_code/movie recommendation system/models/hybrid_tfidf_vectorizer.pkl', mmap_mode=None)


# Compute mean Bayesian average per movieId
baysian_avg_df = merged_df.groupby("movieId", as_index=False)["baysian_avg"].mean()

# Merge with combined_dataset
combined_df = pd.merge(
    combined_dataset, 
    baysian_avg_df,  # This is now a proper DataFrame
    on="movieId", 
    how="left"  # Left join ensures all movies in combined_dataset are kept
)
app = FastAPI()

# cred = credentials.Certificate("./firebase_config.json")
# # firebase_admin.initialize_app(cred, {"databaseURL": "https://your-database.firebaseio.com/"})
# firebase_admin.initialize_app(cred)


class FirebaseInput(BaseModel):
    user_id: int
    ratings: Dict[str, int]

@app.post("/recommend/user_based")
def user_based_recommendations(data: FirebaseInput):
    rated_imdb_ids = list(data.ratings.keys())  # Extract IMDb IDs from input
    rated_ratings = list(data.ratings.values())  # Extract ratings

    # Get movie titles from IMDb IDs
    rated_movies_titles = [
        combined_df[combined_df["imdb_id"] == imdb_id]["title"].values[0]
        for imdb_id in rated_imdb_ids if imdb_id in combined_df["imdb_id"].values
    ]

    user_value_vector = np.zeros((1, len(user_pivot.columns)))

    # Populate user value vector with ratings
    for movie_title, rating in zip(rated_movies_titles, rated_ratings):
        if movie_title in user_pivot.columns:
            movie_idx = user_pivot.columns.get_loc(movie_title)
            user_value_vector[0, movie_idx] = rating

    user_value_vector = csr_matrix(user_value_vector)

    # Find similar users
    dist, ind = user_based_model.kneighbors(user_value_vector, n_neighbors=500)

    recommendations = set()
    max_recommendations = 10

    for i in ind[0]:
        if len(recommendations) >= max_recommendations:
            break

        similar_user_id = user_pivot.index[i]
        user_movies = merged_df[merged_df["userId"] == similar_user_id]
        print("user: ", similar_user_id, "\n")
        print(user_movies, "\n\n")

        top_movies = user_movies.sort_values(by="rating", ascending=False).head(10)
        top_movies = top_movies[top_movies["rating"] >= 3]
        print(top_movies, "\n\n\n\n")
        for movie in top_movies["title"].tolist():
            print("movie_being added: ", movie)
            if movie not in rated_movies_titles and movie not in recommendations:
                recommendations.add(movie)
            if len(recommendations) >= max_recommendations:
                break  

    # Convert recommended movie titles to IMDb IDs
    recommended_dict = {
        movie: combined_df.loc[combined_df["title"] == movie, "imdb_id"].values[0]
        for movie in recommendations
    }

    return {"user_id": data.user_id, "recommended_movies": recommended_dict}



@app.post("/recommend/movie_based")
def movie_based_recommendations(data: FirebaseInput):
    # Extract rated IMDb IDs from input
    rated_imdb_ids = list(data.ratings.keys())

    # Get corresponding movie titles from combined_df
    rated_movies = [
        combined_df[combined_df["imdb_id"] == imdb]["title"].values[0]
        for imdb in rated_imdb_ids if len(combined_df[combined_df["imdb_id"] == imdb]["title"].values) > 0
    ]

    if not rated_movies:
        raise HTTPException(status_code=400, detail="No movies rated")

    recommendations = set()  # Use a set to avoid duplicates

    for movie in rated_movies:
        if movie in movie_pivot.index:
            movie_idx = movie_pivot.index.get_loc(movie)
            movie_value_vector = movie_matrix.getrow(movie_idx).toarray().reshape(1, -1)
            dist, ind = movie_based_model.kneighbors(movie_value_vector, n_neighbors=6)
            recommendations.update(movie_pivot.index[i] for i in ind[0] if i != movie_idx)

    # Convert recommended movie titles to IMDb IDs
    recommended_dict = {
        movie: combined_df.loc[combined_df["title"] == movie, "imdb_id"].values[0]
        for movie in list(recommendations)[:10]  # Convert set to list before slicing
        if movie in combined_df["title"].values
    }

    return {"user_id": data.user_id, "recommended_movies": recommended_dict}

# ---------------------- Summary-Based Filtering ----------------------
@app.post("/recommend/summary_based")
def summary_based_recommendations(data: FirebaseInput):
    rated_movies = sorted(data.ratings.items(), key=lambda x: x[1], reverse=True)[:10]
    if not rated_movies:
        raise HTTPException(status_code=400, detail="No movies rated")

    movie_descriptions = []
    rated_imdb_ids = set(data.ratings.keys())  # Store IMDb IDs of rated movies

    for imdb_id, rating in rated_movies:
        description = combined_dataset.loc[combined_dataset["imdb_id"] == imdb_id, "description"].values
        if len(description) > 0:
            movie_descriptions.append(description[0])

    if not movie_descriptions:
        raise HTTPException(status_code=404, detail="No valid movie descriptions found")

    X_text = summary_based_model.transform(movie_descriptions)
    similarity_scores = cosine_similarity(summary_matrix, X_text)

    recommendations = set()
    for scores in similarity_scores.T:
        top_indices = scores.argsort()[::-1]
        for idx in top_indices:
            movie_title = combined_dataset.iloc[idx]["title"]
            movie_imdb_id = combined_dataset.iloc[idx]["imdb_id"]
            
            # Ensure movie is not already rated and not already recommended
            if movie_imdb_id not in rated_imdb_ids and movie_title not in recommendations:
                recommendations.add(movie_title)

            if len(recommendations) >= 10:
                break

    recommended_dict = {
        movie: combined_dataset.loc[combined_dataset["title"] == movie, "imdb_id"].values[0]
        for movie in recommendations if movie in combined_dataset["title"].values
    }

    return {"user_id": data.user_id, "recommended_movies": recommended_dict}



# ---------------------- Cast-Based Filtering ----------------------
@app.post("/recommend/cast_based")
def cast_based_recommendations(data: FirebaseInput):
    rated_movies = sorted(data.ratings.items(), key=lambda x: x[1], reverse=True)[:10]
    if not rated_movies:
        raise HTTPException(status_code=400, detail="No movies rated")

    movie_casts = []
    rated_imdb_ids = set(data.ratings.keys())  # Store IMDb IDs of rated movies

    for imdb_id, rating in rated_movies:
        cast_info = combined_dataset.loc[combined_dataset["imdb_id"] == imdb_id, "cast_director_genre_keywords"].values
        if len(cast_info) > 0:
            movie_casts.append(cast_info[0])

    if not movie_casts:
        raise HTTPException(status_code=404, detail="No valid cast descriptions found")

    X_text = cast_based_model.transform(movie_casts)
    similarity_scores = cosine_similarity(cast_matrix, X_text)

    recommendations = set()
    for scores in similarity_scores.T:
        top_indices = scores.argsort()[::-1]
        for idx in top_indices:
            movie_title = combined_dataset.iloc[idx]["title"]
            movie_imdb_id = combined_dataset.iloc[idx]["imdb_id"]
            
            # Ensure movie is not already rated and not already recommended
            if movie_imdb_id not in rated_imdb_ids and movie_title not in recommendations:
                recommendations.add(movie_title)

            if len(recommendations) >= 10:
                break

    recommended_dict = {
        movie: combined_dataset.loc[combined_dataset["title"] == movie, "imdb_id"].values[0]
        for movie in recommendations if movie in combined_dataset["title"].values
    }

    return {"user_id": data.user_id, "recommended_movies": recommended_dict}


# ---------------------- Hybrid Filtering ----------------------
# @app.post("/recommend/hybrid")
# def hybrid_recommendations(data: FirebaseInput):
#     rated_movies = sorted(data.ratings.items(), key=lambda x: x[1], reverse=True)[:10]
#     if not rated_movies:
#         raise HTTPException(status_code=400, detail="No movies rated")

#     movie_descriptions = []
#     movie_casts = []
#     valid_movie_ids = []

#     for movie_id, rating in rated_movies:
#         movie_id = movie_id.replace("movie_id_", "")
#         overall_detail = combined_dataset.loc[combined_dataset["movieId"] == int(movie_id), "overall_detail"].values
#         cast_info = combined_dataset.loc[combined_dataset["movieId"] == int(movie_id), "cast_director_genre_keywords"].values

#         if len(overall_detail) > 0 and len(cast_info) > 0:
#             movie_descriptions.append(overall_detail[0])
#             movie_casts.append(cast_info[0])
#             valid_movie_ids.append(int(movie_id))

#     X_text = summary_based_model.transform(movie_descriptions)
#     X_cast = cast_based_model.transform(movie_casts)

#     hybrid_similarity = (cosine_similarity(summary_matrix, X_text) + cosine_similarity(cast_matrix, X_cast)) / 2

#     recommendations = set()
#     for scores in hybrid_similarity.T:
#         top_indices = scores.argsort()[::-1]
#         for idx in top_indices:
#             movie_title = combined_dataset.iloc[idx]["title"]
#             if movie_title not in recommendations:
#                 recommendations.add(movie_title)
#             if len(recommendations) >= 10:
#                 break

#     recommended_dict = {
#         movie: combined_dataset.loc[combined_dataset["title"] == movie, "imdb_id"].values[0]
#         for movie in recommendations if movie in combined_dataset["title"].values
#     }

#     return {"user_id": data.user_id, "recommended_movies": recommended_dict}

@app.post("/update_ratings")
def update_ratings(data: FirebaseInput):
    global merged_df  # Ensure we modify the global dataframe
    user_id = data.user_id
    ratings_dict = data.ratings

    print("Received Ratings:", ratings_dict)  # Debugging

    updated_rows = []  # List to store updated/new rows for debugging

    for imdb_id, rating in ratings_dict.items():
        # Get movie metadata using combined_df
        movie_info = combined_df[combined_df["imdb_id"] == imdb_id]

        print(f"Processing IMDb ID: {imdb_id}, Found in combined_df: {not movie_info.empty}")  # Debugging

        if movie_info.empty:
            continue  # Skip if IMDb ID is not found

        # print("movie info is: ", movie_info)
        movie_id = movie_info.iloc[0]["movieId"]
        # print("movie_id: is ", movie_id)
        title = movie_info.iloc[0]["title"]
        genre = movie_info.iloc[0]["genres"] if "genres" in movie_info.columns else "Unknown"

        # Compute Bayesian average from existing movies with the same title
        same_title_movies = merged_df[merged_df["title"] == title]
        if not same_title_movies.empty and "baysian_avg" in same_title_movies.columns:
            baysian_avg = same_title_movies["baysian_avg"].mean()  # Compute mean Bayesian estimate
        else:
            baysian_avg = rating  # Default to the user's rating if no data is available

        # Ensure `movieId` is in the correct type in `merged_df`
        merged_df["movieId"] = merged_df["movieId"].astype(int)

        # Check if the user has already rated this movie
        existing_entry = merged_df[(merged_df["userId"] == user_id) & (merged_df["movieId"] == movie_id)]

        if not existing_entry.empty:
            # Update the existing rating
            merged_df.loc[(merged_df["userId"] == user_id) & (merged_df["movieId"] == movie_id), "rating"] = rating
            action = "updated"
        else:
            # Create a new rating entry
            new_row = {
                "movieId": movie_id,
                "title": title,
                "genres": genre,
                "userId": user_id,
                "rating": rating,
                "baysian_avg": baysian_avg  # Set Bayesian average
            }

            # Convert to DataFrame and append to `merged_df`
            merged_df = pd.concat([merged_df, pd.DataFrame([new_row])], ignore_index=True)
            action = "added"

        # Store updated/new row for debugging
        updated_rows.append(merged_df[(merged_df["userId"] == user_id) & (merged_df["movieId"] == movie_id)])

    # Save updated ratings to CSV
    merged_df.to_csv("merged_data.csv", index=False) 

    # Print updated/new rows
    if updated_rows:
        print(pd.concat(updated_rows))
    else:
        print("No rows were updated or added.")

    return {"message": "Ratings processed successfully", "user_id": user_id, "ratings": ratings_dict}


@app.get("/top_movies")
def get_top_movies():
    """Returns the IMDb IDs of the top 10 movies based on Bayesian average."""
    top_movies = combined_df.groupby("imdb_id")["baysian_avg"].mean().reset_index().sort_values(by="baysian_avg", ascending=False).head(10)
    print(combined_df.info())
    print(combined_df.head())
    return {"imdb_ids": top_movies["imdb_id"].tolist()}


@app.get("/top_movies_by_genre/{genre}")
def get_top_movies_by_genre(genre: str):
    """Returns the IMDb IDs of the top 10 movies in the specified genre based on Bayesian average."""

    # Filter movies where the input genre is present in the list
    combined_df["genres"] = combined_df["genres"].apply(lambda x: x.split(" ") if isinstance(x, str) else x)

    genre_movies = combined_df[combined_df["genres"].apply(lambda g: genre in g if isinstance(g, list) else False)]

    # Debugging: Check how many movies match
    print(f"Movies found for genre '{genre}':", len(genre_movies))

    if genre_movies.empty:
        return {"imdb_ids": []}  # Return empty list if no movies found

    # Group by IMDb ID to avoid duplicates and compute the Bayesian average
    top_movies = (
        genre_movies.groupby("imdb_id", as_index=False)["baysian_avg"]
        .mean()
        .sort_values(by="baysian_avg", ascending=False)
        .head(10)
    )

    # Debugging: Print top movies found
    print("Top Movies:\n", top_movies[["imdb_id", "baysian_avg"]])

    return {"imdb_ids": top_movies["imdb_id"].tolist()}


@app.get("/top_movies_by_top_genres")
def get_top_movies_by_top_genres():
    """
    Returns the IMDb IDs of the top 10 movies based on Bayesian average 
    from the 4 most common genres, ensuring no duplicates.
    """
    # Convert genres from string to list using split
    combined_df["genres"] = combined_df["genres"].apply(lambda x: x.split(" ") if isinstance(x, str) else x)

    # Find the 4 most common genres
    all_genres = combined_df["genres"].explode().dropna()  # Flatten list of genres
    genre_counts = all_genres.value_counts()
    top_genres = genre_counts.head(4).index.tolist()

    print(f"Top genres: {top_genres}")  # Debugging

    selected_movies = []
    seen_movies = set()

    for genre in top_genres:
        genre_movies = combined_df[combined_df["genres"].apply(lambda g: genre in g if isinstance(g, list) else False)]
        print(f"Movies found for {genre}: {len(genre_movies)}")  # Debugging

        if genre_movies.empty:
            continue  # Skip if no movies found

        # Compute the mean Bayesian average for each movie
        grouped_movies = genre_movies.groupby(["movieId", "imdb_id"])["baysian_avg"].mean().reset_index()

        # Remove already selected movies
        grouped_movies = grouped_movies[~grouped_movies["movieId"].isin(seen_movies)]

        # Sort by Bayesian average
        grouped_movies = grouped_movies.sort_values(by="baysian_avg", ascending=False)

        # Pick top 3 movies for the genre
        top_movies = grouped_movies.head(3)

        imdb_ids = top_movies["imdb_id"].tolist()
        selected_movies.extend(imdb_ids)

        # Track seen movieIds to avoid duplicates
        seen_movies.update(top_movies["movieId"].tolist())

    return {"imdb_ids": selected_movies[:10]}  # Return exactly 10 unique IMDb IDs




if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)

    

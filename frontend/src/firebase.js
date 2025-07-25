// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBY3TKmfjj5lVzO2FsRTV1IhjXQolamZz4",
    authDomain: "movie-recommender-f03e4.firebaseapp.com",
    projectId: "movie-recommender-f03e4",
    storageBucket: "movie-recommender-f03e4.firebasestorage.app",
    messagingSenderId: "1070184039290",
    appId: "1:1070184039290:web:e3d3705290883b721dccc3",
    measurementId: "G-8QG8SN6Z50",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
const analytics = getAnalytics(app);

// Export the necessary variables
export { auth, provider, db };
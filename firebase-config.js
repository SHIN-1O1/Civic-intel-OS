// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-analytics.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCwYLEAo48lyLfVw8z2x0A_5-JJG-bbcwo",
    authDomain: "civic-d8974.firebaseapp.com",
    projectId: "civic-d8974",
    storageBucket: "civic-d8974.firebasestorage.app",
    messagingSenderId: "263006137497",
    appId: "1:263006137497:web:adc5bc52b9eebd1a2cdc08",
    measurementId: "G-W0BB8GTQQH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

export { auth, db, analytics };

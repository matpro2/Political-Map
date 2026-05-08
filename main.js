// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-analytics.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDdqoq0zKyZpLTdRsBpf7dpupgM7eWcVNc",
  authDomain: "political-map-e5391.firebaseapp.com",
  projectId: "political-map-e5391",
  storageBucket: "political-map-e5391.firebasestorage.app",
  messagingSenderId: "572979512370",
  appId: "1:572979512370:web:d077983b62922dd754e82b",
  measurementId: "G-2T89DHP2WF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
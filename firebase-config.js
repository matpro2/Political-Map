import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDdqoq0zKyZpLTdRsBpf7dpupgM7eWcVNc",
    authDomain: "political-map-e5391.firebaseapp.com",
    projectId: "political-map-e5391",
    storageBucket: "political-map-e5391.firebasestorage.app",
    messagingSenderId: "572979512370",
    appId: "1:572979512370:web:d077983b62922dd754e82b",
    measurementId: "G-2T89DHP2WF"
};

// Initialisation de l'application Firebase
const app = initializeApp(firebaseConfig);

// Exportation de Firestore pour pouvoir l'importer dans d'autres scripts
export const db = getFirestore(app);
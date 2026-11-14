
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBlNzsKdPPx9PKCk5wahuZqsD9SADJr9bA",
    authDomain: "aicode-dc8e5.firebaseapp.com",
    projectId: "aicode-dc8e5",
    storageBucket: "aicode-dc8e5.firebasestorage.app",
    messagingSenderId: "138718648408",
    appId: "1:138718648408:web:35cc9cc1a2d0e54b16d22d",
    measurementId: "G-JGEY1ECGR8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Authentication
const auth = getAuth(app);

// Export Firebase services
export {
    app,
    db,
    auth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut
};



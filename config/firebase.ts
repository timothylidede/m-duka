// Import polyfills at the very top (must be before any Firebase imports)
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAjR8OCUeJMHlEeW-mOj6AUw8LM6JI8ds",
  authDomain: "m-duka-eedca.firebaseapp.com",
  projectId: "m-duka-eedca",
  storageBucket: "m-duka-eedca.firebasestorage.app",
  messagingSenderId: "1090643805836",
  appId: "1:1090643805836:web:7f8cf6df71bbc4a7429da9",
  measurementId: "G-T7LEJMX7Z0"
};

// Check if any Firebase apps have been initialized already
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with the existing or newly created app
const firestore = getFirestore(app);

export { app, firestore };

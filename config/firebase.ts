// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, Firestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAjR8OCUeQJMHlEeW-mOj6AUw8LM6JI8ds",
  authDomain: "m-duka-eedca.firebaseapp.com",
  projectId: "m-duka-eedca",
  storageBucket: "m-duka-eedca.firebasestorage.app",
  messagingSenderId: "1090643805836",
  appId: "1:1090643805836:web:7f8cf6df71bbc4a7429da9",
  measurementId: "G-T7LEJMX7Z0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const firestore: Firestore = getFirestore(app);

export { firestore, app };
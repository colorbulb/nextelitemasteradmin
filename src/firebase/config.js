// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyADGpgValITKs6zCNqkJTz2Dc5eENVh6-Y",
  authDomain: "nextelite-89f47.firebaseapp.com",
  databaseURL: "https://nextelite-89f47-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "nextelite-89f47",
  storageBucket: "nextelite-89f47.firebasestorage.app",
  messagingSenderId: "106713038598",
  appId: "1:106713038598:web:a827700392eaced5e96887",
  measurementId: "G-L8CB85EJP1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;


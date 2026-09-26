import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBiiVxN8y0BDJtm0nGGb5sMd6eBulNxzSw",
  authDomain: "lucky-db-4cca9.firebaseapp.com",
  projectId: "lucky-db-4cca9",
  storageBucket: "lucky-db-4cca9.firebasestorage.app",
  messagingSenderId: "714417643330",
  appId: "1:714417643330:web:8112a9272db60c97b6b2db",
  measurementId: "G-4EWVJV5VQ8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

enableIndexedDbPersistence(db).catch((err) => {
  console.warn("Firebase persistence error:", err.code);
});

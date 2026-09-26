import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDZ8diiXPpwWbaL1vwpoLtCvub--jvPIQ0",
  authDomain: "blueret-db.firebaseapp.com",
  projectId: "blueret-db",
  storageBucket: "blueret-db.firebasestorage.app",
  messagingSenderId: "564353405412",
  appId: "1:564353405412:web:87a227461e4132760577f1",
  measurementId: "G-PXKM2B69L6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyDqtMs-MHcPJGxZbWwj3Z6uGLFDX-FXiR8",
    authDomain: "chat-app-c4d77.firebaseapp.com",
    projectId: "chat-app-c4d77",
    storageBucket: "chat-app-c4d77.appspot.com",
    messagingSenderId: "877788395377",
    appId: "1:877788395377:web:3ef448177f189964d528d0"

};


export const app = initializeApp(firebaseConfig);
export const auth = getAuth();
export const db = getFirestore();
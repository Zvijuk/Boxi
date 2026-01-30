// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    getFirestore, doc, setDoc, getDoc, updateDoc, addDoc,
    arrayUnion, onSnapshot, query, orderBy, limit, collection,
    serverTimestamp, where, runTransaction, Timestamp, getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCt522pC3_0uOgH0bYPTJCXzfla-kHU3iI",
    authDomain: "web-app-e98cb.firebaseapp.com",
    projectId: "web-app-e98cb",
    storageBucket: "web-app-e98cb.firebasestorage.app",
    messagingSenderId: "930464794067",
    appId: "1:930464794067:web:51c9af3f2413acd5e69b26",
    measurementId: "G-VBMFDNBXEP"
};

// Initialize Firebase
let app, auth, db, analytics;
let isInitialized = false;

try {
    app = initializeApp(firebaseConfig);
    analytics = getAnalytics(app);
    auth = getAuth(app);
    db = getFirestore(app);
    isInitialized = true;
    console.log("Firebase Initialized Successfully");
} catch (e) {
    console.error("Firebase Initialization Error:", e);
}

// Helper for Guest ID
function ensureGuestId() {
    let guestId = sessionStorage.getItem('coinis_guest_id');
    if (!guestId) {
        guestId = 'guest_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('coinis_guest_id', guestId);
    }
    return guestId;
}

// Export services to window for use in app.js
window.firebaseServices = {
    auth,
    db,
    // Export Firestore functions needed by app.js
    addDoc,
    collection,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    query,
    orderBy,
    limit,
    where,
    serverTimestamp,
    Timestamp,
    getDocs,
    onSnapshot,

    ensureGuestId,

    signInWithGoogle: async () => {
        if (!isInitialized) { alert("Firebase not initialized."); return; }
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            return result.user;
        } catch (error) {
            console.error(error);
            throw error;
        }
    },
    signOutUser: async () => {
        if (!isInitialized) return;
        return signOut(auth);
    },
    saveScore: async (level, moves) => {
        if (!isInitialized) return;
    },
    isConfigured: () => isInitialized
};

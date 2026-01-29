// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion, onSnapshot, query, orderBy, limit, collection } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// Export services to window for use in app.js
window.firebaseServices = {
    auth,
    db,
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
        if (!isInitialized || !auth.currentUser) return;
        const user = auth.currentUser;

        // Save user's personal best
        const userRef = doc(db, "users", user.uid);

        try {
            await setDoc(userRef, {
                displayName: user.displayName,
                lastActive: new Date().toISOString(),
                [`best_level_${level}`]: moves
            }, { merge: true });

            console.log("Score saved!");
        } catch (e) {
            console.error("Error saving score:", e);
        }
    },
    isConfigured: () => isInitialized
};

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion, onSnapshot, query, orderBy, limit, collection } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// TODO: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/setup#create-project
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
let app, auth, db;
let isInitialized = false;

try {
    // Check if config is set
    if (firebaseConfig.apiKey === "YOUR_API_KEY_HERE") {
        console.warn("Firebase Config missing! Leaderboard will be disabled.");
    } else {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        isInitialized = true;
        console.log("Firebase Initialized Successfully");
    }
} catch (e) {
    console.error("Firebase Initialization Error:", e);
}

// Export services to window for use in app.js
window.firebaseServices = {
    auth,
    db,
    signInWithGoogle: async () => {
        if (!isInitialized) { alert("Leaderboard not configured."); return; }
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
        const scoreRef = doc(db, "leaderboards", `level_${level}`);

        // We'll trust the client for now (simple game). 
        // Ideally should check if better than previous score.
        // For simplicity, we just add to a 'scores' subcollection or update user stat.

        // Strategy: User document stores their bests.
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

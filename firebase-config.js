// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion, onSnapshot, query, orderBy, limit, collection } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase configuration provided by user
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
let app, auth, db;
let isInitialized = false;

try {
    app = initializeApp(firebaseConfig);
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

        // Save to global high scores for this level
        // Collection: leaderboard_level_X
        // Doc: userID (enforces one score per user)
        try {
            const scoreRef = doc(db, `leaderboard_level_${level}`, user.uid);
            const currentDoc = await getDoc(scoreRef);

            if (currentDoc.exists()) {
                const data = currentDoc.data();
                if (data.moves <= moves) {
                    console.log("Existing score is better or equal. not updating.");
                    return; // Don't overwrite with worse score
                }
            }

            await setDoc(scoreRef, {
                uid: user.uid,
                displayName: user.displayName,
                photoURL: user.photoURL,
                moves: moves,
                timestamp: new Date().toISOString()
            });
            console.log("High score saved!");
        } catch (e) {
            console.error("Error saving score:", e);
        }
    },
    getLeaderboard: async (level) => {
        if (!isInitialized) return [];
        try {
            const q = query(
                collection(db, `leaderboard_level_${level}`),
                orderBy("moves", "asc"),
                limit(20)
            );

            return new Promise((resolve, reject) => {
                // Use onSnapshot for a single fetch (simpler than getDocs with modules here)
                const unsubscribe = onSnapshot(q, (snapshot) => {
                    const scores = [];
                    snapshot.forEach((doc) => {
                        scores.push(doc.data());
                    });
                    resolve(scores);
                    unsubscribe();
                }, (error) => {
                    reject(error);
                });
            });
        } catch (e) {
            console.error("Error fetching leaderboard:", e);
            return [];
        }
    },
    isConfigured: () => isInitialized
};

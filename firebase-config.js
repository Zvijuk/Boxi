// Firebase Compat Configuration for local file:// execution

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

// Initialize Firebase (Compat)
let app, auth, db;
let isInitialized = false;

try {
    if (typeof firebase !== 'undefined') {
        app = firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
        isInitialized = true;
        console.log("Firebase Initialized Successfully (Compat Mode)");
    } else {
        console.error("Firebase SDK not loaded");
    }
} catch (e) {
    console.error("Firebase Initialization Error:", e);
}

// Export services to window using Compat APIs
window.firebaseServices = {
    auth,
    db,
    signInWithGoogle: async () => {
        if (!isInitialized) { alert("Leaderboard not configured."); return; }
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            const result = await auth.signInWithPopup(provider);
            return result.user;
        } catch (error) {
            console.error(error);
            throw error;
        }
    },
    signOutUser: async () => {
        if (!isInitialized) return;
        return auth.signOut();
    },
    saveScore: async (level, moves) => {
        if (!isInitialized || !auth.currentUser) return;
        const user = auth.currentUser;

        try {
            // Compat: db.collection().doc()
            const scoreRef = db.collection(`leaderboard_level_${level}`).doc(user.uid);
            const currentDoc = await scoreRef.get();

            if (currentDoc.exists) {
                const data = currentDoc.data();
                if (data.moves <= moves) {
                    return;
                }
            }

            await scoreRef.set({
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
            const q = db.collection(`leaderboard_level_${level}`)
                .orderBy("moves", "asc")
                .limit(20);

            return new Promise((resolve, reject) => {
                const unsubscribe = q.onSnapshot((snapshot) => {
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
    isConfigured: () => isInitialized,

    // --- Chat API (Compat) ---
    subscribeToChat: (callback) => {
        if (!isInitialized) return () => { };

        const q = db.collection("chat_messages")
            .orderBy("timestamp", "desc")
            .limit(50);

        return q.onSnapshot((snapshot) => {
            const messages = [];
            snapshot.forEach((doc) => {
                messages.push({ id: doc.id, ...doc.data() });
            });
            callback(messages.reverse());
        });
    },

    sendMessage: async (text) => {
        if (!isInitialized || !auth.currentUser) return;
        const user = auth.currentUser;

        if (text.length > 100) throw new Error("Message too long");

        await db.collection("chat_messages").add({
            text: text,
            uid: user.uid,
            displayName: user.displayName,
            photoURL: user.photoURL,
            timestamp: new Date().toISOString()
        });
    }
};

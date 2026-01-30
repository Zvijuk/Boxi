// Coinis Boxworld - Official Brand Edition
// Matching authentic Coinis.com brand identity

// --- Level Configuration (Scoring & Par) ---
const LEVEL_CONFIG = {
    defaults: { par: 50, difficulty: 1.0 },
    1: { par: 15, difficulty: 1.0 },
    2: { par: 25, difficulty: 1.1 },
    3: { par: 35, difficulty: 1.2 },
    4: { par: 40, difficulty: 1.3 },
    5: { par: 45, difficulty: 1.4 },
};

class CoinisBoxworldOfficial {
    constructor() {
        this.currentLevel = 1;
        this.highestUnlockedLevel = 1;
        this.moves = 0;
        this.history = [];
        this.gameBoard = document.getElementById('gameBoard');
        this.isAnimating = false;

        // User State
        this.currentUser = null;
        this.userData = null;

        // Official Coinis game levels
        if (window.classicLevels) {
            this.levels = [...window.classicLevels];
        } else {
            console.error("Critical: Classic levels not loaded!");
            this.levels = [];
        }

        this.initializeGame();
    }

    initializeGame() {
        this.setupEventListeners();
        this.showWelcomeMessage();

        this.loadLevel(1);
        this.updateUI();

        // Initialize Auth & Data Sync
        this.setupAuth();
    }

    showWelcomeMessage() {
        console.log("Coinis Boxworld: System Ready (v1.2 Fixed)");
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // Button controls
        const ids = ['undoBtn', 'restartBtn', 'levelsBtn', 'leaderboardBtn', 'nextLevelBtn', 'restartLevelBtn', 'closeLevelsBtn', 'closeLeaderboardBtn'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('click', () => {
                    this.addVisualFeedback();
                    if (id === 'undoBtn') this.undo();
                    if (id === 'restartBtn') this.restart();
                    if (id === 'levelsBtn') this.showLevelSelection();
                    if (id === 'leaderboardBtn') this.showLeaderboard();
                    if (id === 'nextLevelBtn') this.nextLevel();
                    if (id === 'restartLevelBtn') this.restart();
                    if (id === 'closeLevelsBtn') this.hideLevelSelection();
                    if (id === 'closeLeaderboardBtn') document.getElementById('leaderboardModal').classList.remove('active');
                });
            }
        });

        // Modal overlay interactions
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                    this.addVisualFeedback();
                }
            });
        });

        // Touch controls
        this.setupTouchControls();
    }

    setupTouchControls() {
        this.touchStartX = 0;
        this.touchStartY = 0;
        const gameBoard = document.getElementById('gameBoard');

        if (gameBoard) {
            gameBoard.addEventListener('touchstart', (e) => {
                this.touchStartX = e.changedTouches[0].screenX;
                this.touchStartY = e.changedTouches[0].screenY;
                e.preventDefault();
            }, { passive: false });

            gameBoard.addEventListener('touchend', (e) => {
                const touchEndX = e.changedTouches[0].screenX;
                const touchEndY = e.changedTouches[0].screenY;
                this.handleSwipe(touchEndX, touchEndY);
                e.preventDefault();
            }, { passive: false });
        }
    }

    handleSwipe(endX, endY) {
        const threshold = 30;
        const dx = endX - this.touchStartX;
        const dy = endY - this.touchStartY;

        if (Math.abs(dx) > Math.abs(dy)) {
            if (Math.abs(dx) > threshold) {
                this.movePlayerWithAnimation(dx > 0 ? 1 : -1, 0);
            }
        } else {
            if (Math.abs(dy) > threshold) {
                this.movePlayerWithAnimation(0, dy > 0 ? 1 : -1);
            }
        }
    }

    addVisualFeedback() {
        document.body.style.filter = 'brightness(1.05)';
        setTimeout(() => document.body.style.filter = 'brightness(1)', 100);
    }

    // --- Auth & Data Management ---

    setupAuth() {
        const loginBtn = document.getElementById('loginBtn');
        const userDisplay = document.getElementById('userName');

        // Toggle Login/Logout Logic
        if (loginBtn) {
            loginBtn.onclick = async () => {
                if (this.currentUser) {
                    // LOGOUT
                    if (confirm("Log out?")) {
                        await window.firebaseServices.signOutUser();
                        // State reset handled in onAuthStateChanged
                    }
                } else {
                    // LOGIN
                    if (window.firebaseServices && window.firebaseServices.isConfigured()) {
                        try {
                            await window.firebaseServices.signInWithGoogle();
                        } catch (e) {
                            console.error(e);
                        }
                    } else {
                        alert("Service not configured!");
                    }
                }
            };
        }

        // Initialize Auth State Listener
        const checkAuth = setInterval(() => {
            if (window.firebaseServices && window.firebaseServices.auth) {
                clearInterval(checkAuth);

                window.firebaseServices.auth.onAuthStateChanged(async (user) => {
                    if (user) {
                        // === LOGGED IN ===
                        this.currentUser = user;
                        // Update UI
                        if (loginBtn) {
                            loginBtn.textContent = 'Logout';
                            loginBtn.style.background = '#444';
                        }
                        if (userDisplay) {
                            userDisplay.style.display = 'inline-block';
                            userDisplay.textContent = `👤 ${user.displayName.split(' ')[0]}`;
                        }

                        await this.loadUserData(user.uid);
                    } else {
                        // === GUEST / LOGOUT ===
                        this.currentUser = null;
                        this.userData = null;

                        // Reset UI
                        if (loginBtn) {
                            loginBtn.textContent = 'Login';
                            loginBtn.style.background = ''; // reset
                            loginBtn.style.display = 'inline-block';
                        }
                        if (userDisplay) userDisplay.style.display = 'none';

                        // RESET STATE TO LEVEL 1
                        console.log("Session reset (Guest Mode)");
                        this.highestUnlockedLevel = 1;
                        this.currentLevel = 1;
                        this.loadLevel(1);
                    }
                });
            }
        }, 500);
    }

    async loadUserData(uid) {
        if (!window.firebaseServices) return;
        const { db, getDoc, doc } = window.firebaseServices;

        try {
            console.log("Loading user profile...");
            const docRef = doc(db, "users", uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                console.log("Profile loaded:", data);

                this.highestUnlockedLevel = data.highestUnlockedLevel || 1;

                // RESUME LOGIC
                if (data.currentLevel && data.currentState) {
                    console.log(`Resuming Level ${data.currentLevel}...`);
                    this.restoreGameState(data.currentLevel, data.currentState);
                } else {
                    console.log("No saved state found, starting fresh.");
                    if (this.currentLevel !== 1) this.loadLevel(data.highestUnlockedLevel || 1);
                }
            } else {
                console.log("New user profile created.");
                this.highestUnlockedLevel = 1;
                // Create initial doc to confirm permissions
                this.saveProgress(false);
            }
        } catch (e) {
            console.error("Error loading user data:", e);
            alert("Could not load save data. Check internet or permissions.");
        }
    }

    restoreGameState(levelNum, stateJSON) {
        try {
            const state = JSON.parse(stateJSON);
            this.loadLevel(levelNum);

            // Override
            this.gameState.player = state.player;
            this.gameState.boxes = state.boxes;
            this.moves = state.moves || 0;

            this.renderGame();
            this.updateUI();
        } catch (e) {
            console.error("Failed to restore state", e);
            this.loadLevel(levelNum);
        }
    }

    saveProgress(isCompletion = false) {
        if (!this.currentUser || !window.firebaseServices) return;

        const { db, setDoc, doc, serverTimestamp } = window.firebaseServices;

        const updateData = {
            lastActive: serverTimestamp(),
            displayName: this.currentUser.displayName,
            // Always save highest unlocked
            highestUnlockedLevel: Math.max(this.highestUnlockedLevel, isCompletion ? (this.currentLevel + 1) : this.currentLevel)
        };

        // If updating Highest Unlocked (Completion)
        if (isCompletion) {
            this.highestUnlockedLevel = updateData.highestUnlockedLevel;
        }

        // Always save current state for resume (unless just completed logic? No, even then save state as "ready for next")
        // Actually, if completed, we probably are about to load next level, which will trigger another save. 
        // So this save is just for metadata.

        if (!isCompletion) {
            updateData.currentLevel = this.currentLevel;
            updateData.currentState = JSON.stringify({
                player: this.gameState.player,
                boxes: this.gameState.boxes,
                moves: this.moves
            });
        }

        console.log("Saving progress to cloud...", isCompletion ? "[Completion]" : "[State]");

        setDoc(doc(db, "users", this.currentUser.uid), updateData, { merge: true })
            .then(() => console.log("Cloud save success."))
            .catch(e => {
                console.error("Cloud save failed:", e);
                // alert("Cloud save failed! Check console."); // detailed debugging
            });
    }

    // --- Game Logic ---

    loadLevel(levelNum) {
        if (levelNum > this.highestUnlockedLevel) {
            alert(`Level ${levelNum} is locked! Finish Level ${this.highestUnlockedLevel} first.`);
            return;
        }

        if (levelNum < 1 || levelNum > this.levels.length) return;

        const level = this.levels[levelNum - 1];
        this.currentLevel = levelNum;
        this.moves = 0;
        this.history = [];

        // Parse level map
        this.gameState = {
            map: level.map.map(row => row.split('')),
            player: null,
            boxes: [],
            targets: [],
            width: Math.max(...level.map.map(row => row.length)),
            height: level.map.length,
            levelData: level
        };

        // Find game elements
        for (let y = 0; y < this.gameState.height; y++) {
            for (let x = 0; x < this.gameState.width; x++) {
                const cell = this.gameState.map[y] ? this.gameState.map[y][x] || ' ' : ' ';
                switch (cell) {
                    case '@': this.gameState.player = { x, y }; this.gameState.map[y][x] = ' '; break;
                    case '+': this.gameState.player = { x, y }; this.gameState.targets.push({ x, y }); this.gameState.map[y][x] = ' '; break;
                    case '$': this.gameState.boxes.push({ x, y }); this.gameState.map[y][x] = ' '; break;
                    case '*': this.gameState.boxes.push({ x, y }); this.gameState.targets.push({ x, y }); this.gameState.map[y][x] = ' '; break;
                    case '.': this.gameState.targets.push({ x, y }); this.gameState.map[y][x] = ' '; break;
                }
            }
        }

        this.saveState();
        this.renderGame();
        this.updateUI();

        // Initial save (clears old state from previous level)
        // Ensure we don't overwrite if just loading from restore?
        // restoreGameState calls loadLevel FIRST, then overrides. 
        // We should delay this save or check context. 
        // Simplest: Just save.
        if (this.currentUser) setTimeout(() => this.saveProgress(false), 500);
    }

    renderGame() {
        const board = this.gameBoard;
        board.innerHTML = '';
        board.style.gridTemplateColumns = `repeat(${this.gameState.width}, auto)`; // Fixed auto for squashing bug

        for (let y = 0; y < this.gameState.height; y++) {
            for (let x = 0; x < this.gameState.width; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.setAttribute('data-x', x);
                cell.setAttribute('data-y', y);

                const cellChar = this.gameState.map[y] ? this.gameState.map[y][x] || ' ' : ' ';
                if (cellChar === '#') cell.classList.add('wall');
                else {
                    cell.classList.add('floor');
                    const isTarget = this.gameState.targets.some(t => t.x === x && t.y === y);
                    if (isTarget) cell.classList.add('target');

                    const box = this.gameState.boxes.find(b => b.x === x && b.y === y);
                    if (box) cell.classList.add(isTarget ? 'box-on-target' : 'box');

                    if (this.gameState.player.x === x && this.gameState.player.y === y) {
                        cell.classList.add(isTarget ? 'player-on-target' : 'player');
                    }
                }

                if (cellChar !== '#') {
                    cell.onmouseenter = () => { cell.style.transform = 'scale(1.02)'; cell.style.transition = 'transform 0.15s'; };
                    cell.onmouseleave = () => cell.style.transform = 'scale(1)';
                }
                board.appendChild(cell);
            }
        }
    }

    updateCell(x, y) {
        const cell = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
        if (!cell) return;

        // Simplified full class reset for safety
        const isWall = this.gameState.map[y][x] === '#';
        cell.className = 'cell'; // reset
        if (isWall) { cell.classList.add('wall'); return; }

        cell.classList.add('floor');
        const isTarget = this.gameState.targets.some(t => t.x === x && t.y === y);
        if (isTarget) cell.classList.add('target');

        const box = this.gameState.boxes.find(b => b.x === x && b.y === y);
        if (box) cell.classList.add(isTarget ? 'box-on-target' : 'box');

        if (this.gameState.player.x === x && this.gameState.player.y === y) {
            cell.classList.add(isTarget ? 'player-on-target' : 'player');
        }

        cell.onmouseenter = () => { cell.style.transform = 'scale(1.02)'; cell.style.transition = 'transform 0.15s'; };
        cell.onmouseleave = () => cell.style.transform = 'scale(1)';
    }

    handleKeyPress(e) {
        if (this.isAnimating) return;
        const key = e.key.toLowerCase();
        let dx = 0, dy = 0;
        switch (key) {
            case 'w': case 'arrowup': dy = -1; break;
            case 's': case 'arrowdown': dy = 1; break;
            case 'a': case 'arrowleft': dx = -1; break;
            case 'd': case 'arrowright': dx = 1; break;
            case 'r': this.restart(); return;
            case 'u': this.undo(); return;
            case 'escape':
                this.hideLevelSelection();
                document.getElementById('victoryModal').classList.remove('active');
                return;
            case ' ': e.preventDefault(); return;
            default: return;
        }
        e.preventDefault();
        this.movePlayerWithAnimation(dx, dy);
    }

    async movePlayerWithAnimation(dx, dy) {
        // ... (preserving exact logic from before, just compacting for file update)
        const oldPlayerX = this.gameState.player.x, oldPlayerY = this.gameState.player.y;
        const newX = oldPlayerX + dx, newY = oldPlayerY + dy;

        if (newY < 0 || newY >= this.gameState.height || newX < 0 || newX >= this.gameState.width) return;
        if (this.gameState.map[newY][newX] === '#') return;

        const box = this.gameState.boxes.find(b => b.x === newX && b.y === newY);
        if (box) {
            const pushX = newX + dx, pushY = newY + dy;
            if (pushY < 0 || pushY >= this.gameState.height || pushX < 0 || pushX >= this.gameState.width) return;
            if (this.gameState.map[pushY][pushX] === '#') return;
            if (this.gameState.boxes.some(b => b.x === pushX && b.y === pushY)) return;

            this.isAnimating = true;
            this.saveState();
            box.x = pushX; box.y = pushY;
            this.gameState.player.x = newX; this.gameState.player.y = newY;
            this.moves++;

            this.updateCell(oldPlayerX, oldPlayerY);
            this.updateCell(newX, newY);
            this.updateCell(pushX, pushY);

            const pEl = document.querySelector(`[data-x="${newX}"][data-y="${newY}"]`);
            const bEl = document.querySelector(`[data-x="${pushX}"][data-y="${pushY}"]`);
            if (pEl) { pEl.classList.add('moving'); setTimeout(() => pEl.classList.remove('moving'), 100); }
            if (bEl) { bEl.classList.add('moving'); setTimeout(() => bEl.classList.remove('moving'), 100); }
        } else {
            this.isAnimating = true;
            this.saveState();
            this.gameState.player.x = newX; this.gameState.player.y = newY;
            this.moves++;
            this.updateCell(oldPlayerX, oldPlayerY);
            this.updateCell(newX, newY);
            const pEl = document.querySelector(`[data-x="${newX}"][data-y="${newY}"]`);
            if (pEl) { pEl.classList.add('moving'); setTimeout(() => pEl.classList.remove('moving'), 100); }
        }

        this.updateUI();

        // Debounce Save (Resume Logic)
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => this.saveProgress(false), 1500);

        setTimeout(() => { this.checkWin(); this.isAnimating = false; }, 50);
    }

    saveState() {
        this.history.push({
            player: { ...this.gameState.player },
            boxes: this.gameState.boxes.map(b => ({ ...b })),
            moves: this.moves
        });
        if (this.history.length > 50) this.history.shift();
    }

    undo() {
        if (this.history.length > 0) {
            const prevState = this.history.pop();
            this.gameState.player = { ...prevState.player };
            this.gameState.boxes = prevState.boxes.map(b => ({ ...b }));
            this.moves = prevState.moves;
            this.renderGame(); this.updateUI();
            this.saveProgress(false);
        }
    }

    restart() {
        this.isSolving = false;
        this.loadLevel(this.currentLevel);
    }

    checkWin() {
        if (this.gameState.boxes.every(box => this.gameState.targets.some(t => t.x === box.x && t.y === box.y))) {
            const score = this.calculateScore();
            this.saveScoreToLeaderboard(score);
            if (this.currentLevel === this.highestUnlockedLevel) this.highestUnlockedLevel++;
            this.saveProgress(true);
            this.showVictory(score);
        }
    }

    calculateScore() {
        const config = LEVEL_CONFIG[this.currentLevel] || LEVEL_CONFIG.defaults;
        const safeMoves = Math.max(1, this.moves);
        let points = Math.round(1000 * config.difficulty * (config.par / safeMoves));
        if (safeMoves < config.par) points += 500;
        return Math.max(10, points);
    }

    async saveScoreToLeaderboard(points) {
        if (!window.firebaseServices) return;
        const { db, collection, addDoc, serverTimestamp, ensureGuestId, doc, setDoc } = window.firebaseServices;

        const levelId = `level_${this.currentLevel}`;
        const guestId = ensureGuestId();
        const userName = this.currentUser ? (this.currentUser.displayName || "Anonymous") : `Guest-${guestId.substr(0, 4)}`;

        const scoreData = {
            levelId: this.currentLevel,
            moves: this.moves,
            points: points,
            createdAt: serverTimestamp(),
            uid: this.currentUser ? this.currentUser.uid : guestId,
            name: userName,
            isGuest: !this.currentUser
        };

        try {
            console.log("Submitting score to leaderboard...", scoreData);
            await addDoc(collection(db, "leaderboards", levelId, "scores"), scoreData);
            console.log("Score submitted.");

            if (this.currentUser) {
                // Update Personal Best
                await setDoc(doc(db, "users", this.currentUser.uid), {
                    [`best_level_${this.currentLevel}`]: points
                }, { merge: true });
            }
        } catch (e) {
            console.error("Leaderboard submit failed (Check permissions?):", e);
            // alert("Score could not be posted. You may be offline or permissions are blocking.");
        }
    }

    showVictory(score) {
        document.getElementById('completedLevel').textContent = `Level ${this.currentLevel} - ${this.gameState.levelData.name}`;
        document.getElementById('finalMoves').innerHTML = `<div>Moves: ${this.moves}</div><div style="font-size:1.2em;color:#e74c3c;font-weight:bold;">Score: ${score}</div>`;
        const nextBtn = document.getElementById('nextLevelBtn');
        nextBtn.style.display = (this.currentLevel < this.levels.length) ? 'inline-flex' : 'none';
        document.getElementById('victoryModal').classList.add('active');
    }

    nextLevel() {
        document.getElementById('victoryModal').classList.remove('active');
        if (this.currentLevel < this.levels.length) this.loadLevel(this.currentLevel + 1);
    }

    async showLeaderboard() {
        const modal = document.getElementById('leaderboardModal');
        if (!modal) return;
        modal.classList.add('active');
        const list = document.getElementById('leaderboardList');

        list.innerHTML = `<div style="text-align:center;padding:20px;"><div style="display:inline-block;width:24px;height:24px;border:3px solid #ccc;border-top-color:#333;border-radius:50%;animation:spin 1s infinite;"></div><p>Fetching scores...</p><style>@keyframes spin{to{transform:rotate(360deg)}}</style></div>`;

        if (!window.firebaseServices || !window.firebaseServices.isConfigured()) {
            list.innerHTML = "<p>Service not available.</p>"; return;
        }

        const { db, collection, query, orderBy, limit, getDocs } = window.firebaseServices;

        try {
            console.log(`Fetching leaderboard for level_${this.currentLevel}...`);
            const q = query(
                collection(db, "leaderboards", `level_${this.currentLevel}`, "scores"),
                orderBy("points", "desc"),
                limit(50)
            );

            const snapshot = await getDocs(q);
            console.log(`Fetched ${snapshot.size} scores.`);

            if (snapshot.empty) {
                list.innerHTML = `<p style="text-align:center;opacity:0.6;margin-top:20px;">No scores yet for this level.</p>`;
                return;
            }

            let html = '<table style="width:100%;border-collapse:collapse;margin-top:10px;">';
            html += '<tr style="border-bottom:1px solid #eee;opacity:0.7;font-size:0.9em;"><th style="padding:8px;text-align:left;">#</th><th style="padding:8px;text-align:left;">Player</th><th style="padding:8px;text-align:right;">Score</th></tr>';

            let rank = 1;
            snapshot.forEach(doc => {
                const d = doc.data();
                const isMe = this.currentUser && d.uid === this.currentUser.uid;
                html += `<tr style="${isMe ? 'background:#f0fafe;font-weight:bold;' : ''}border-bottom:1px solid #f5f5f5;">
                    <td style="padding:8px;">${rank++}</td>
                    <td style="padding:8px;">${d.name ? d.name.substring(0, 16) : 'Unk'}</td>
                    <td style="padding:8px;text-align:right;">${d.points}</td>
                </tr>`;
            });
            html += '</table>';
            list.innerHTML = html;
        } catch (e) {
            console.error("Leaderboard error:", e);
            list.innerHTML = `<div style="text-align:center;color:#e74c3c;padding:20px;">
                <p>Failed to load scores.</p>
                <p style="font-size:0.8em;opacity:0.7;">${e.code || e.message}</p>
            </div>`;
        }
    }

    hideLevelSelection() { document.getElementById('levelsModal').classList.remove('active'); }

    showLevelSelection() {
        const grid = document.getElementById('levelsGrid');
        grid.innerHTML = '';
        this.levels.forEach((l, i) => {
            const num = i + 1;
            const btn = document.createElement('button');
            btn.className = 'level-btn';

            const isUnlocked = num <= this.highestUnlockedLevel;
            if (num === this.currentLevel) btn.classList.add('current');
            else if (isUnlocked) btn.classList.add('completed');
            else { btn.classList.add('locked'); btn.disabled = true; }

            btn.innerHTML = `<div class="level-number">${num}</div><div class="level-difficulty">${l.difficulty}</div>${!isUnlocked ? '🔒' : ''}`;
            if (!btn.disabled) btn.onclick = () => { this.addVisualFeedback(); this.loadLevel(num); this.hideLevelSelection(); };
            grid.appendChild(btn);
        });
        document.getElementById('levelsModal').classList.add('active');
    }

    updateUI() {
        const l = this.levels[this.currentLevel - 1];
        document.querySelector('.current-level').textContent = this.currentLevel.toString().padStart(2, '0');
        document.querySelector('.level-name').textContent = l.name;
        document.querySelector('.move-count').textContent = this.moves.toString().padStart(3, '0');

        const rem = this.gameState.targets.length - this.gameState.boxes.filter(b => this.gameState.targets.some(t => t.x === b.x && t.y === b.y)).length;
        document.querySelector('.targets-remaining').textContent = rem.toString().padStart(2, '0');

        document.getElementById('undoBtn').disabled = this.history.length <= 0;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!window.classicLevels) console.error("Levels missing!");
    new CoinisBoxworldOfficial();
});
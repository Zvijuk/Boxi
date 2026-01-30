// Coinis Boxworld - Official Brand Edition
// Matching authentic Coinis.com brand identity

// --- Level Configuration (Scoring & Par) ---
// Define par moves and difficulty for scoring.
// If a level isn't listed, defaults will be used.
const LEVEL_CONFIG = {
    defaults: { par: 50, difficulty: 1.0 },
    1: { par: 15, difficulty: 1.0 },
    2: { par: 25, difficulty: 1.1 },
    3: { par: 35, difficulty: 1.2 },
    4: { par: 40, difficulty: 1.3 },
    5: { par: 45, difficulty: 1.4 },
    // Add more specific configs as needed for levels 6-100
};

class CoinisBoxworldOfficial {
    constructor() {
        this.currentLevel = 1;
        this.highestUnlockedLevel = 1; // Default for guests
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
            if (this.levels.length < 100) {
                console.warn(`Only loaded ${this.levels.length} levels from classic set.`);
            }
        } else {
            console.error("Critical: Classic levels not loaded!");
            this.levels = [];
        }

        this.initializeGame();
    }

    initializeGame() {
        this.setupEventListeners();
        this.showWelcomeMessage();

        // Initial simple load (will be overridden by Auth if logged in)
        this.loadLevel(1);
        this.updateUI();

        // Initialize Auth & Data Sync
        this.setupAuth();
    }

    showWelcomeMessage() {
        console.log(`
╔══════════════════════════════════════════════════════════════╗
║                     COINIS BOXWORLD                          ║
║                 Professional Gaming Platform                 ║
║                                                              ║
║  Status: System Ready                                        ║
║  Version: 1.1 (Leaderboard Edition)                         ║
║  Framework: Modern Web Technologies                         ║
║                                                              ║
║  > Leaderboards & Cloud Save Active                         ║
║  > Performance Optimized                                    ║
║                                                              ║
║  Powered by Coinis AdTech Solutions                         ║
║  Visit: https://coinis.com                                  ║
╚══════════════════════════════════════════════════════════════╝`);
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // Button controls
        document.getElementById('undoBtn').addEventListener('click', () => {
            this.addVisualFeedback();
            this.undo();
        });

        document.getElementById('restartBtn').addEventListener('click', () => {
            this.addVisualFeedback();
            this.restart();
        });

        document.getElementById('levelsBtn').addEventListener('click', () => {
            this.addVisualFeedback();
            this.showLevelSelection();
        });

        // Leaderboard Button
        const lbBtn = document.getElementById('leaderboardBtn');
        if (lbBtn) {
            lbBtn.addEventListener('click', () => {
                this.addVisualFeedback();
                this.showLeaderboard();
            });
        }

        // Modal controls
        document.getElementById('nextLevelBtn').addEventListener('click', () => {
            this.addVisualFeedback();
            this.nextLevel();
        });

        document.getElementById('restartLevelBtn').addEventListener('click', () => {
            this.addVisualFeedback();
            this.restart();
        });

        document.getElementById('closeLevelsBtn').addEventListener('click', () => {
            this.hideLevelSelection();
        });

        const closeLb = document.getElementById('closeLeaderboardBtn');
        if (closeLb) {
            closeLb.addEventListener('click', () => {
                document.getElementById('leaderboardModal').classList.remove('active');
            });
        }

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
                if (dx > 0) this.movePlayerWithAnimation(1, 0);
                else this.movePlayerWithAnimation(-1, 0);
            }
        } else {
            if (Math.abs(dy) > threshold) {
                if (dy > 0) this.movePlayerWithAnimation(0, 1);
                else this.movePlayerWithAnimation(0, -1);
            }
        }
    }

    addVisualFeedback() {
        document.body.style.filter = 'brightness(1.05)';
        setTimeout(() => {
            document.body.style.filter = 'brightness(1)';
        }, 100);
    }

    // --- Auth & Data Management ---

    setupAuth() {
        const loginBtn = document.getElementById('loginBtn');
        const userDisplay = document.getElementById('userName');

        // Initialize Auth State Listener
        const checkAuth = setInterval(() => {
            if (window.firebaseServices && window.firebaseServices.auth) {
                clearInterval(checkAuth);

                // Login Button Listener (Delayed attach)
                if (loginBtn) {
                    loginBtn.addEventListener('click', async () => {
                        if (window.firebaseServices && window.firebaseServices.isConfigured()) {
                            try {
                                await window.firebaseServices.signInWithGoogle();
                            } catch (e) {
                                alert("Authentication cancelled or failed.");
                            }
                        } else {
                            alert("Leaderboard service is not configured!");
                        }
                    });
                }

                window.firebaseServices.auth.onAuthStateChanged(async (user) => {
                    if (user) {
                        // User Logged In
                        this.currentUser = user;
                        if (loginBtn) loginBtn.style.display = 'none';
                        if (userDisplay) {
                            userDisplay.style.display = 'inline-block';
                            userDisplay.textContent = `👤 ${user.displayName.split(' ')[0]}`;
                        }

                        await this.loadUserData(user.uid);
                    } else {
                        // User Logged Out / Guest
                        this.currentUser = null;
                        this.userData = null;
                        if (loginBtn) loginBtn.style.display = 'inline-block';
                        if (userDisplay) userDisplay.style.display = 'none';

                        // Switch to Guest Mode (Reset critical progress)
                        this.highestUnlockedLevel = 1;
                        console.log("Switched to Guest Mode");

                        // Optionally reset to level 1 for guest safety
                        if (this.currentLevel > 1) {
                            this.loadLevel(1);
                        }
                    }
                });
            }
        }, 500);
    }

    async loadUserData(uid) {
        if (!window.firebaseServices) return;
        const { db, getDoc, doc } = window.firebaseServices;

        try {
            const docRef = doc(db, "users", uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                this.highestUnlockedLevel = data.highestUnlockedLevel || 1;

                // Resume Feature
                if (data.currentLevel && data.currentState) {
                    console.log(`Resuming Level ${data.currentLevel}...`);
                    this.restoreGameState(data.currentLevel, data.currentState);
                } else {
                    if (this.currentLevel !== 1) {
                        this.loadLevel(data.highestUnlockedLevel || 1);
                    }
                }
            } else {
                // New User
                this.highestUnlockedLevel = 1;
            }
        } catch (e) {
            console.error("Error loading user data:", e);
        }
    }

    restoreGameState(levelNum, stateJSON) {
        try {
            const state = JSON.parse(stateJSON);
            this.loadLevel(levelNum); // Load base map first

            // Override with saved state
            this.gameState.player = state.player;
            this.gameState.boxes = state.boxes;
            this.moves = state.moves || 0;

            // We need to re-render to reflect restored state (boxes moved, player moved)
            this.renderGame();
            this.updateUI();
        } catch (e) {
            console.error("Failed to restore state", e);
            this.loadLevel(levelNum);
        }
    }

    saveProgress(isCompletion = false) {
        // Save logic:
        // 1. If Guest: Do nothing (Session only).
        // 2. If Auth: Save to 'users/{uid}'.
        if (!this.currentUser || !window.firebaseServices) return;

        const { db, setDoc, doc, serverTimestamp } = window.firebaseServices;

        const updateData = {
            lastActive: serverTimestamp(),
            displayName: this.currentUser.displayName
        };

        if (isCompletion) {
            updateData.highestUnlockedLevel = Math.max(this.highestUnlockedLevel, this.currentLevel + 1);
            this.highestUnlockedLevel = updateData.highestUnlockedLevel;
        } else {
            // Routine Save (State Resume)
            updateData.currentLevel = this.currentLevel;
            updateData.currentState = JSON.stringify({
                player: this.gameState.player,
                boxes: this.gameState.boxes,
                moves: this.moves
            });
        }

        // Fire and forget save
        setDoc(doc(db, "users", this.currentUser.uid), updateData, { merge: true })
            .catch(e => console.error("Save failed:", e));
    }

    // --- Game Logic ---

    loadLevel(levelNum) {
        // Level Gating check
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
                    case '@':
                        this.gameState.player = { x, y };
                        this.gameState.map[y][x] = ' ';
                        break;
                    case '+':
                        this.gameState.player = { x, y };
                        this.gameState.targets.push({ x, y });
                        this.gameState.map[y][x] = ' ';
                        break;
                    case '$':
                        this.gameState.boxes.push({ x, y });
                        this.gameState.map[y][x] = ' ';
                        break;
                    case '*':
                        this.gameState.boxes.push({ x, y });
                        this.gameState.targets.push({ x, y });
                        this.gameState.map[y][x] = ' ';
                        break;
                    case '.':
                        this.gameState.targets.push({ x, y });
                        this.gameState.map[y][x] = ' ';
                        break;
                }
            }
        }

        this.saveState();
        this.renderGame();
        this.updateUI();

        // Save initial state for resume
        this.saveProgress(false); // Only clears old state essentially
    }

    renderGame() {
        const board = this.gameBoard;
        board.innerHTML = '';
        board.style.gridTemplateColumns = `repeat(${this.gameState.width}, 1fr)`;

        for (let y = 0; y < this.gameState.height; y++) {
            for (let x = 0; x < this.gameState.width; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.setAttribute('data-x', x);
                cell.setAttribute('data-y', y);

                const cellChar = this.gameState.map[y] ? this.gameState.map[y][x] || ' ' : ' ';

                if (cellChar === '#') {
                    cell.classList.add('wall');
                } else {
                    cell.classList.add('floor');
                    const isTarget = this.gameState.targets.some(t => t.x === x && t.y === y);
                    if (isTarget) cell.classList.add('target');

                    const box = this.gameState.boxes.find(b => b.x === x && b.y === y);
                    if (box) {
                        cell.classList.add(isTarget ? 'box-on-target' : 'box');
                    }

                    if (this.gameState.player && this.gameState.player.x === x && this.gameState.player.y === y) {
                        cell.classList.add(isTarget ? 'player-on-target' : 'player');
                    }
                }

                // Interactions
                if (cellChar !== '#') {
                    cell.onmouseenter = () => {
                        cell.style.transform = 'scale(1.02)';
                        cell.style.transition = 'transform 0.15s ease';
                    };
                    cell.onmouseleave = () => {
                        cell.style.transform = 'scale(1)';
                    };
                }

                board.appendChild(cell);
            }
        }
    }

    // Performance Optimized Cell Updater
    updateCell(x, y) {
        const cell = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
        if (!cell) return;

        const isWall = this.gameState.map[y][x] === '#';
        cell.className = 'cell';

        if (isWall) {
            cell.classList.add('wall');
            return;
        }

        cell.classList.add('floor');

        const isTarget = this.gameState.targets.some(t => t.x === x && t.y === y);
        if (isTarget) cell.classList.add('target');

        const box = this.gameState.boxes.find(b => b.x === x && b.y === y);
        if (box) {
            cell.classList.add(isTarget ? 'box-on-target' : 'box');
        }

        if (this.gameState.player.x === x && this.gameState.player.y === y) {
            cell.classList.add(isTarget ? 'player-on-target' : 'player');
        }

        // Re-attach hover listeners
        cell.onmouseenter = () => {
            if (!isWall) {
                cell.style.transform = 'scale(1.02)';
                cell.style.transition = 'transform 0.15s ease';
            }
        };
        cell.onmouseleave = () => {
            cell.style.transform = 'scale(1)';
        };
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
        const oldPlayerX = this.gameState.player.x;
        const oldPlayerY = this.gameState.player.y;
        const newX = oldPlayerX + dx;
        const newY = oldPlayerY + dy;

        if (newY < 0 || newY >= this.gameState.height || newX < 0 || newX >= this.gameState.width) return;

        const newCell = this.gameState.map[newY] ? this.gameState.map[newY][newX] || ' ' : ' ';
        if (newCell === '#') return;

        const box = this.gameState.boxes.find(b => b.x === newX && b.y === newY);
        if (box) {
            const pushX = newX + dx;
            const pushY = newY + dy;

            if (pushY < 0 || pushY >= this.gameState.height || pushX < 0 || pushX >= this.gameState.width) return;
            const pushCell = this.gameState.map[pushY] ? this.gameState.map[pushY][pushX] || ' ' : ' ';
            if (pushCell === '#') return;
            if (this.gameState.boxes.some(b => b.x === pushX && b.y === pushY)) return;

            this.isAnimating = true;
            this.saveState();

            box.x = pushX;
            box.y = pushY;

            this.gameState.player.x = newX;
            this.gameState.player.y = newY;
            this.moves++;

            this.updateCell(oldPlayerX, oldPlayerY);
            this.updateCell(newX, newY);
            this.updateCell(pushX, pushY);

            const playerEl = document.querySelector(`[data-x="${newX}"][data-y="${newY}"]`);
            const boxEl = document.querySelector(`[data-x="${pushX}"][data-y="${pushY}"]`);

            if (playerEl) {
                playerEl.classList.add('moving');
                setTimeout(() => playerEl.classList.remove('moving'), 100);
            }
            if (boxEl) {
                boxEl.classList.add('moving');
                setTimeout(() => boxEl.classList.remove('moving'), 100);
            }

        } else {
            this.isAnimating = true;
            this.saveState();

            this.gameState.player.x = newX;
            this.gameState.player.y = newY;
            this.moves++;

            this.updateCell(oldPlayerX, oldPlayerY);
            this.updateCell(newX, newY);

            const playerEl = document.querySelector(`[data-x="${newX}"][data-y="${newY}"]`);
            if (playerEl) {
                playerEl.classList.add('moving');
                setTimeout(() => playerEl.classList.remove('moving'), 100);
            }
        }

        this.updateUI();

        // Debounce cloud save for resume
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => this.saveProgress(false), 2000);

        setTimeout(() => {
            this.checkWin();
            this.isAnimating = false;
        }, 50);
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
            this.renderGame();
            this.updateUI();
            this.saveProgress(false);
        }
    }

    restart() {
        this.isSolving = false;
        this.loadLevel(this.currentLevel);
    }

    // --- Scoring & Win Logic ---

    checkWin() {
        const allBoxesOnTargets = this.gameState.boxes.every(box =>
            this.gameState.targets.some(target => target.x === box.x && target.y === box.y)
        );

        if (allBoxesOnTargets) {
            const score = this.calculateScore();

            // 1. Submit to Leaderboard (Always, Guest or Auth)
            this.saveScoreToLeaderboard(score);

            // 2. Unlock Next Level Logic
            if (this.currentLevel === this.highestUnlockedLevel) {
                this.highestUnlockedLevel++;
            }

            // 3. Save User Progress (Auth only)
            this.saveProgress(true);

            this.showVictory(score);
        }
    }

    calculateScore() {
        // Safe access to defaults if level config missing
        const config = LEVEL_CONFIG[this.currentLevel] || LEVEL_CONFIG.defaults;
        const par = config.par;
        const difficulty = config.difficulty;

        // Formula: 1000 * difficulty * (par / moves)
        const safeMoves = Math.max(1, this.moves);
        let points = Math.round(1000 * difficulty * (par / safeMoves));

        // Bonus for being under par
        if (safeMoves < par) {
            points += 500;
        }

        return Math.max(10, points); // Min score 10
    }

    async saveScoreToLeaderboard(points) {
        if (!window.firebaseServices) return;
        const { db, collection, addDoc, serverTimestamp, ensureGuestId } = window.firebaseServices;

        const levelId = `level_${this.currentLevel}`;
        const guestId = ensureGuestId();

        // Use currentUser display name or fallback
        let userName;
        if (this.currentUser) {
            userName = this.currentUser.displayName || "Anonymous";
        } else {
            userName = `Guest-${guestId.substr(0, 4).toUpperCase()}`;
        }

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
            await addDoc(collection(db, "leaderboards", levelId, "scores"), scoreData);
            console.log("Leaderboard score submitted:", scoreData);

            // Also update personal best if Auth
            if (this.currentUser) {
                const { doc, setDoc } = window.firebaseServices;
                await setDoc(doc(db, "users", this.currentUser.uid), {
                    [`best_level_${this.currentLevel}`]: points
                }, { merge: true });
            }
        } catch (e) {
            console.error("Leaderboard submit failed", e);
        }
    }

    showVictory(score) {
        const level = this.gameState.levelData;
        document.getElementById('completedLevel').textContent = `Level ${this.currentLevel} - ${level.name}`;

        // Use innerHTML to style the points
        const finalMovesEl = document.getElementById('finalMoves');
        finalMovesEl.innerHTML = `
            <div>Moves: ${this.moves}</div>
            <div style="font-size: 1.2em; color: var(--color-primary); font-weight: bold; margin-top: 5px;">
                Score: ${score}
            </div>
        `;

        const nextBtn = document.getElementById('nextLevelBtn');
        if (this.currentLevel < this.levels.length) {
            nextBtn.style.display = 'inline-flex';
        } else {
            nextBtn.style.display = 'none';
        }

        document.getElementById('victoryModal').classList.add('active');
    }

    nextLevel() {
        document.getElementById('victoryModal').classList.remove('active');
        if (this.currentLevel < this.levels.length) {
            this.loadLevel(this.currentLevel + 1);
        }
    }

    // --- Leaderboard UI ---

    async showLeaderboard() {
        const modal = document.getElementById('leaderboardModal');
        if (!modal) return;
        modal.classList.add('active');

        const list = document.getElementById('leaderboardList');
        // Clear previous content and show spinner
        list.innerHTML = `
            <div style="text-align:center; padding: 20px;">
                <div style="display:inline-block; width: 20px; height: 20px; border: 2px solid #ccc; border-top-color: #333; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <p>Loading Level ${this.currentLevel} scores...</p>
                <style>@keyframes spin {0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style>
            </div>
        `;

        if (!window.firebaseServices || !window.firebaseServices.isConfigured()) {
            list.innerHTML = "<p>Leaderboard service not configured.</p>";
            return;
        }

        const { db, collection, query, orderBy, limit, getDocs } = window.firebaseServices;
        const levelId = `level_${this.currentLevel}`;

        try {
            const q = query(
                collection(db, "leaderboards", levelId, "scores"),
                orderBy("points", "desc"),
                limit(50)
            );

            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                list.innerHTML = `<p style="text-align:center; opacity:0.6;">No scores yet for Level ${this.currentLevel}. Be the first!</p>`;
                return;
            }

            let html = '<table style="width:100%; border-collapse: collapse;">';
            html += '<tr style="border-bottom: 1px solid rgba(0,0,0,0.1); text-align: left; opacity: 0.6;"><th style="padding: 8px;">Rank</th><th style="padding: 8px;">Player</th><th style="padding: 8px; text-align: right;">Score</th><th style="padding: 8px; text-align: right;">Moves</th></tr>';

            let rank = 1;
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const isMe = this.currentUser && data.uid === this.currentUser.uid;
                const rowStyle = isMe ? 'background-color: rgba(var(--color-primary-rgb), 0.1); font-weight: bold;' : '';
                const nameDisplay = data.name.length > 15 ? data.name.substring(0, 15) + '...' : data.name;

                html += `<tr style="border-bottom: 1px solid rgba(0,0,0,0.05); ${rowStyle}">
                    <td style="padding: 8px;">#${rank}</td>
                    <td style="padding: 8px;">${nameDisplay}</td>
                    <td style="padding: 8px; text-align: right;">${data.points}</td>
                    <td style="padding: 8px; text-align: right;">${data.moves}</td>
                </tr>`;
                rank++;
            });
            html += '</table>';

            list.innerHTML = html;

        } catch (e) {
            console.error("Fetch leaderboard error:", e);
            list.innerHTML = `<p style="text-align:center; color:red;">Failed to load scores. Check connection/console.</p>`;
        }
    }

    hideLevelSelection() {
        document.getElementById('levelsModal').classList.remove('active');
    }

    showLevelSelection() {
        const grid = document.getElementById('levelsGrid');
        grid.innerHTML = '';

        this.levels.forEach((level, index) => {
            const levelNum = index + 1;
            const btn = document.createElement('button');
            btn.className = 'level-btn';

            // Gating Logic
            const isUnlocked = levelNum <= this.highestUnlockedLevel;
            const isCompleted = levelNum < this.highestUnlockedLevel; // Simple assumption or track separately
            // Actually, highestUnlockedLevel means 1..N are unlocked. 1..(N-1) are usually completed.

            if (levelNum === this.currentLevel) {
                btn.classList.add('current');
            } else if (isUnlocked) {
                // Check if actually completed (we tracked completedLevels in localStorage before, now only Highest)
                // Let's assume everything < highest is completed for visual simplicity, 
                // or use userData if we loaded specific completion array? 
                // We didn't save specific completions to Firestore, only 'highestUnlockedLevel' and 'best_level_X'.
                // So for now, treat < highest as completed.
                if (levelNum < this.highestUnlockedLevel) btn.classList.add('completed');
            } else {
                btn.classList.add('locked');
                btn.disabled = true;
            }

            btn.innerHTML = `
                <div class="level-number">${levelNum.toString().padStart(2, '0')}</div>
                <div class="level-difficulty">${level.difficulty}</div>
                ${!isUnlocked ? '<div style="font-size:10px; margin-top:2px;">🔒</div>' : ''}
            `;

            btn.title = `Level ${levelNum}: ${level.name} - ${level.description}`;

            if (!btn.disabled) {
                btn.addEventListener('click', () => {
                    this.addVisualFeedback();
                    this.loadLevel(levelNum);
                    this.hideLevelSelection();
                });
            }

            grid.appendChild(btn);
        });

        document.getElementById('levelsModal').classList.add('active');
    }

    updateUI() {
        const level = this.levels[this.currentLevel - 1];
        document.querySelector('.current-level').textContent = this.currentLevel.toString().padStart(2, '0');
        document.querySelector('.level-name').textContent = level.name;
        document.querySelector('.move-count').textContent = this.moves.toString().padStart(3, '0');

        const remainingTargets = this.gameState.targets.length -
            this.gameState.boxes.filter(box =>
                this.gameState.targets.some(target =>
                    target.x === box.x && target.y === box.y
                )
            ).length;
        document.querySelector('.targets-remaining').textContent = remainingTargets.toString().padStart(2, '0');

        const undoBtn = document.getElementById('undoBtn');
        undoBtn.disabled = this.history.length <= 0;
    }
}

// Initialize professional game
document.addEventListener('DOMContentLoaded', () => {
    document.body.style.opacity = '0';

    setTimeout(() => {
        // Ensure levels are loaded
        if (!window.classicLevels) {
            console.error("Levels not loaded, waiting...");
            // could add a retry loop here if needed
        }

        new CoinisBoxworldOfficial();

        document.body.style.transition = 'opacity 0.8s ease';
        document.body.style.opacity = '1';
    }, 100);
});
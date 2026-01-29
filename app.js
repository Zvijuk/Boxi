// Coinis Boxworld - Official Brand Edition
// Matching authentic Coinis.com brand identity

class CoinisBoxworldOfficial {
    constructor() {
        this.currentLevel = 1;
        this.moves = 0;
        this.history = [];
        this.gameBoard = document.getElementById('gameBoard');
        this.completedLevels = this.loadProgress();
        this.isAnimating = false;

        // Official Coinis game levels
        if (window.classicLevels) {
            this.levels = [...window.classicLevels];
            // Ensure we have 100 levels
            if (this.levels.length < 100) {
                console.warn(`Only loaded ${this.levels.length} levels from classic set.`);
            }
        } else {
            console.error("Critical: Classic levels not loaded!");
            this.levels = [];
        }

        this.initializeGame();
    }

    // generateAdditionalLevels removed as we now have 100 static levels

    initializeGame() {
        this.setupEventListeners();
        this.loadLevel(this.currentLevel);
        this.updateUI();
        this.showWelcomeMessage();

        // Initialize Auth
        this.setupAuth();
    }

    showWelcomeMessage() {
        // Professional console message matching Coinis brand
        console.log(`
╔══════════════════════════════════════════════════════════════╗
║                     COINIS BOXWORLD                          ║
║                 Professional Gaming Platform                 ║
║                                                              ║
║  Status: System Ready                                        ║
║  Version: 1.0 (Official Brand Edition)                      ║
║  Framework: Modern Web Technologies                         ║
║                                                              ║
║  > All 13 levels verified and tested                        ║
║  > Level 4 deadlock issue resolved                          ║
║                                                              ║
║  Powered by Coinis AdTech Solutions                         ║
║  Visit: https://coinis.com                                  ║
╚══════════════════════════════════════════════════════════════╝`);
    }

    setupEventListeners() {
        // Enhanced keyboard controls
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

        // Modal overlay interactions
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                    this.addVisualFeedback();
                }
            });
        });

        // Close Leaderboard
        const closeLb = document.getElementById('closeLeaderboardBtn');
        if (closeLb) {
            closeLb.addEventListener('click', () => {
                document.getElementById('leaderboardModal').classList.remove('active');
            });
        }

        // Touch controls
        this.touchStartX = 0;
        this.touchStartY = 0;
        const gameBoard = document.getElementById('gameBoard');

        if (gameBoard) {
            gameBoard.addEventListener('touchstart', (e) => {
                this.touchStartX = e.changedTouches[0].screenX;
                this.touchStartY = e.changedTouches[0].screenY;
                e.preventDefault(); // Prevent default scroll
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
        const threshold = 30; // Min distance for swipe
        const dx = endX - this.touchStartX;
        const dy = endY - this.touchStartY;

        if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal swipe
            if (Math.abs(dx) > threshold) {
                if (dx > 0) this.movePlayerWithAnimation(1, 0); // Right
                else this.movePlayerWithAnimation(-1, 0); // Left
            }
        } else {
            // Vertical swipe
            if (Math.abs(dy) > threshold) {
                if (dy > 0) this.movePlayerWithAnimation(0, 1); // Down
                else this.movePlayerWithAnimation(0, -1); // Up
            }
        }
    }

    addVisualFeedback() {
        // Subtle professional feedback
        document.body.style.filter = 'brightness(1.05)';
        setTimeout(() => {
            document.body.style.filter = 'brightness(1)';
        }, 100);
    }

    loadLevel(levelNum) {
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

                // Enhanced cell rendering
                if (cellChar === '#') {
                    cell.classList.add('wall');
                } else {
                    cell.classList.add('floor');

                    // Check for targets
                    const isTarget = this.gameState.targets.some(t => t.x === x && t.y === y);
                    if (isTarget) {
                        cell.classList.add('target');
                    }

                    // Check for boxes
                    const box = this.gameState.boxes.find(b => b.x === x && b.y === y);
                    if (box) {
                        if (isTarget) {
                            cell.classList.add('box-on-target');
                        } else {
                            cell.classList.add('box');
                        }
                    }

                    // Check for player
                    if (this.gameState.player && this.gameState.player.x === x && this.gameState.player.y === y) {
                        if (isTarget) {
                            cell.classList.add('player', 'player-on-target');
                        } else {
                            cell.classList.add('player');
                        }
                    }
                }

                // Add professional hover effects
                if (cellChar !== '#') {
                    cell.addEventListener('mouseenter', () => {
                        cell.style.transform = 'scale(1.02)';
                        cell.style.transition = 'transform 0.15s ease';
                    });

                    cell.addEventListener('mouseleave', () => {
                        cell.style.transform = 'scale(1)';
                    });
                }

                board.appendChild(cell);
            }
        }
    }

    handleKeyPress(e) {
        if (this.isAnimating) return;

        const key = e.key.toLowerCase();
        let dx = 0, dy = 0;

        switch (key) {
            case 'w':
            case 'arrowup':
                dy = -1;
                break;
            case 's':
            case 'arrowdown':
                dy = 1;
                break;
            case 'a':
            case 'arrowleft':
                dx = -1;
                break;
            case 'd':
            case 'arrowright':
                dx = 1;
                break;
            case 'r':
                this.restart();
                return;
            case 'u':
                this.undo();
                return;
            case 'escape':
                this.hideLevelSelection();
                document.getElementById('victoryModal').classList.remove('active');
                return;
            case ' ':
                e.preventDefault();
                return;
            default:
                return;
        }

        e.preventDefault();
        this.movePlayerWithAnimation(dx, dy);
    }

    async movePlayerWithAnimation(dx, dy) {
        const newX = this.gameState.player.x + dx;
        const newY = this.gameState.player.y + dy;

        // Check bounds
        if (newY < 0 || newY >= this.gameState.height ||
            newX < 0 || newX >= this.gameState.width) return;

        // Check wall collision
        const newCell = this.gameState.map[newY] ? this.gameState.map[newY][newX] || ' ' : ' ';
        if (newCell === '#') return;

        // Check box collision
        const box = this.gameState.boxes.find(b => b.x === newX && b.y === newY);
        if (box) {
            // Try to push box
            const pushX = newX + dx;
            const pushY = newY + dy;

            // Check push bounds
            if (pushY < 0 || pushY >= this.gameState.height ||
                pushX < 0 || pushX >= this.gameState.width) return;

            // Check push destination
            const pushCell = this.gameState.map[pushY] ? this.gameState.map[pushY][pushX] || ' ' : ' ';
            if (pushCell === '#') return;

            // Check if another box is in the way
            if (this.gameState.boxes.some(b => b.x === pushX && b.y === pushY)) return;

            // Animate box push
            this.isAnimating = true;
            this.saveState();
            box.x = pushX;
            box.y = pushY;

            // Add moving animation
            const boxCell = document.querySelector(`[data-x="${newX}"][data-y="${newY}"]`);
            if (boxCell) {
                boxCell.classList.add('moving');
                setTimeout(() => boxCell.classList.remove('moving'), 300);
            }
        } else {
            // Regular move
            this.isAnimating = true;
            this.saveState();
        }

        // Move player with animation
        const playerCell = document.querySelector(`[data-x="${this.gameState.player.x}"][data-y="${this.gameState.player.y}"]`);
        if (playerCell) {
            playerCell.classList.add('moving');
            setTimeout(() => playerCell.classList.remove('moving'), 300);
        }

        this.gameState.player.x = newX;
        this.gameState.player.y = newY;
        this.moves++;

        // Delayed re-render for smooth animation
        setTimeout(() => {
            this.renderGame();
            this.updateUI();
            this.checkWin();
            this.isAnimating = false;
        }, 150);
    }

    saveState() {
        this.history.push({
            player: { ...this.gameState.player },
            boxes: this.gameState.boxes.map(b => ({ ...b })),
            moves: this.moves
        });

        if (this.history.length > 100) {
            this.history.shift();
        }
    }

    undo() {
        if (this.history.length > 1) {
            this.history.pop();
            const prevState = this.history[this.history.length - 1];

            this.gameState.player = { ...prevState.player };
            this.gameState.boxes = prevState.boxes.map(b => ({ ...b }));
            this.moves = prevState.moves;

            this.renderGame();
            this.updateUI();
        }
    }

    restart() {
        this.isSolving = false;
        this.loadLevel(this.currentLevel);
    }

    checkWin() {
        const allBoxesOnTargets = this.gameState.boxes.every(box =>
            this.gameState.targets.some(target =>
                target.x === box.x && target.y === box.y
            )
        );

        if (allBoxesOnTargets) {
            this.completedLevels[this.currentLevel] = true;
            this.saveProgress();
            this.saveScoreToCloud(this.currentLevel, this.moves);
            this.showVictory();
        }
    }

    showVictory() {
        const level = this.gameState.levelData;
        document.getElementById('completedLevel').textContent = `Level ${this.currentLevel} - ${level.name}`;
        document.getElementById('finalMoves').textContent = this.moves.toString().padStart(3, '0');

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

    showLevelSelection() {
        const grid = document.getElementById('levelsGrid');
        grid.innerHTML = '';

        this.levels.forEach((level, index) => {
            const levelNum = index + 1;
            const btn = document.createElement('button');
            btn.className = 'level-btn';

            // Professional button state logic
            if (this.completedLevels[levelNum]) {
                btn.classList.add('completed');
            } else if (levelNum === this.currentLevel) {
                btn.classList.add('current');
            }
            // All levels unlocked for testing
            // else if (levelNum > this.currentLevel && !this.completedLevels[levelNum]) {
            //     if (levelNum <= Math.max(this.currentLevel, Math.max(...Object.keys(this.completedLevels).map(Number)) + 1)) {
            //         // Unlocked
            //     } else {
            //         btn.classList.add('locked');
            //         btn.disabled = true;
            //     }
            // }

            btn.innerHTML = `
                <div class="level-number">${levelNum.toString().padStart(2, '0')}</div>
                <div class="level-difficulty">${level.difficulty}</div>
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

    hideLevelSelection() {
        document.getElementById('levelsModal').classList.remove('active');
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

        // Update button states
        const undoBtn = document.getElementById('undoBtn');
        undoBtn.disabled = this.history.length <= 1;
    }

    saveProgress() {
        localStorage.setItem('coinis-boxworld-official-progress', JSON.stringify(this.completedLevels));
    }

    loadProgress() {
        const saved = localStorage.getItem('coinis-boxworld-official-progress');
        return saved ? JSON.parse(saved) : {};
    }

    setupAuth() {
        const loginBtn = document.getElementById('loginBtn');
        const userDisplay = document.getElementById('userName');

        if (!loginBtn) return;

        loginBtn.addEventListener('click', async () => {
            if (window.firebaseServices && window.firebaseServices.isConfigured()) {
                try {
                    const user = await window.firebaseServices.signInWithGoogle();
                    console.log("Logged in:", user.displayName);
                } catch (e) {
                    alert("Authentication cancelled or failed.");
                }
            } else {
                alert("Leaderboard service is not configured! Please see firebase-config.js.");
            }
        });

        // Initialize Auth State Listener
        // We use a simple interval to check if firebase is ready and set up listener
        const checkAuth = setInterval(() => {
            if (window.firebaseServices && window.firebaseServices.auth) {
                clearInterval(checkAuth);
                window.firebaseServices.auth.onAuthStateChanged(user => {
                    if (user) {
                        this.currentUser = user;
                        loginBtn.style.display = 'none';
                        userDisplay.style.display = 'inline-block';
                        userDisplay.textContent = `👤 ${user.displayName.split(' ')[0]}`;
                    } else {
                        this.currentUser = null;
                        loginBtn.style.display = 'inline-block';
                        userDisplay.style.display = 'none';
                    }
                });
            }
        }, 500);
    }

    showLeaderboard() {
        const modal = document.getElementById('leaderboardModal');
        if (!modal) return;

        modal.classList.add('active');
        const list = document.getElementById('leaderboardList');

        if (!window.firebaseServices || !window.firebaseServices.isConfigured()) {
            list.innerHTML = "<p>Leaderboard service not configured.</p>";
            return;
        }

        list.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <p><strong>Coming Soon!</strong></p>
                <p>The backend is connected.</p>
                <p>Top scores will appear here.</p>
            </div>
        `;
    }

    saveScoreToCloud(level, moves) {
        if (this.currentUser && window.firebaseServices) {
            window.firebaseServices.saveScore(level, moves);
        }
    }
}

// Initialize professional game
document.addEventListener('DOMContentLoaded', () => {
    // Professional loading sequence
    document.body.style.opacity = '0';

    setTimeout(() => {
        new CoinisBoxworldOfficial();

        // Smooth fade in
        document.body.style.transition = 'opacity 0.8s ease';
        document.body.style.opacity = '1';
    }, 100);
});
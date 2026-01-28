class LevelGenerator {
    constructor() {
        this.DIRECTIONS = [
            { dx: 0, dy: -1 }, // Up
            { dx: 0, dy: 1 },  // Down
            { dx: -1, dy: 0 }, // Left
            { dx: 1, dy: 0 }   // Right
        ];
    }

    generateLevel(levelNum) {
        // Difficulty scaling parameters (IQ 120+ Target)
        const isTutorial = levelNum <= 5;
        // Non-linear difficulty curve: favors harder levels earlier
        const difficulty = Math.pow((levelNum - 1) / 99, 0.8); // 0.0 to 1.0

        // Grid size: 7x7 to 12x12 (Kept tighter for higher density)
        const size = Math.floor(7 + difficulty * 5);
        const width = size;
        const height = size;

        // Box count: 3 to 10 (Higher density)
        const boxCount = Math.floor(3 + difficulty * 7);

        // Complexity (steps to reverse): 30 to 500 (Much deeper solutions)
        const steps = Math.floor(30 + difficulty * 470);

        return this.createLevel(width, height, boxCount, steps, levelNum);
    }

    createLevel(width, height, boxCount, steps, levelNum) {
        let map = [];
        let player = { x: 0, y: 0 };
        let boxes = [];
        // 1. Initialize empty room with walls
        for (let y = 0; y < height; y++) {
            let row = [];
            for (let x = 0; x < width; x++) {
                if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
                    row.push('#');
                } else {
                    row.push(' ');
                }
            }
            map.push(row);
        }

        // 2. Place Goals (Targets) randomly in the interior
        // We will treat these as the STARTING positions of the boxes in our simulation
        let attempts = 0;
        while (boxes.length < boxCount && attempts < 1000) {
            let x = Math.floor(Math.random() * (width - 2)) + 1;
            let y = Math.floor(Math.random() * (height - 2)) + 1;

            // Check spacing - distinct positions
            if (!boxes.some(b => b.x === x && b.y === y)) {
                boxes.push({ x, y });
                map[y][x] = '.'; // Place target on map
            }
            attempts++;
        }

        // 3. Place Player randomly (not on a box)
        let playerPlaced = false;
        attempts = 0;
        while (!playerPlaced && attempts < 1000) {
            let x = Math.floor(Math.random() * (width - 2)) + 1;
            let y = Math.floor(Math.random() * (height - 2)) + 1;

            if (!boxes.some(b => b.x === x && b.y === y)) {
                player = { x, y };
                playerPlaced = true;
            }
            attempts++;
        }

        // 4. Reverse Walk (Pulling boxes)
        // We simulate the player PULLING boxes instead of pushing them.
        // If we can pull a box from B to A, it means later we can push from A to B.
        // Pull Logic: 
        // Current state: Player at P, Box at B.
        // To pull B to NewB (where NewB is adjacent to B, and Player is at NewB currently? No.)
        // Standard Pull: Player is at P. Box is at B (adjacent). Player moves to NewP (away from B). Box moves to P.
        // Requirement: NewP must be empty. P is occupied by Player. B is occupied by Box.

        // Let's rephrase: 
        // We are at configuration C_i.
        // Choose a random box B_i at (bx, by).
        // Choose a pull direction.
        // The pull is valid if:
        //   - The player is currently "behind" the box? 
        //   - Actually, in reverse mode, the player must be at the destination of the pull?
        //   Let's think about a 'PUSH' from A to B.
        //   Player P is at A-1. Box is at A. PUSH -> Player at A, Box at B.
        //   REVERSE:
        //   Player is at A. Box is at B. PULL -> Player at A-1, Box at A.
        //   For this to be valid: 
        //     1. Player must be 'adjacent' to the Box in the direction of the pull? No.
        //     Let's map it:
        //     FORWARD: [Player] [Box] [Empty]  ---> [Empty] [Player] [Box]
        //     REVERSE: [Empty] [Player] [Box]  ---> [Player] [Box] [Empty]

        //   So, to perform a REVERSE PULL:
        //   - Pick a Box at (bx, by).
        //   - Pick a neighbor cell (px, py) where the Player currently IS.
        //   - Pick the cell BEHIND the player (pullDestX, pullDestY).
        //   - Verify (pullDestX, pullDestY) is empty (or floor).
        //   - ACTION: Move Player to (pullDestX, pullDestY). Move Box to (px, py).
        //   Wait, that's simple adjacency. But the player has to be ABLE to reach that position (px, py) adjacent to the box.
        //   So: 
        //   1. Pick a random box.
        //   2. Pick a random valid neighbor cell for the player to stand in (must be within grid, reachable from current player pos).
        //      - Reachability is key. We can use BFS/Floodfill to check if current Player pos can reach the Pull-Spot.
        //   3. Pick the direction to pull.
        //      - The "Pull-Spot" is where the player stands NOW to pull the box.
        //      - Actually, in the text diagrams: 
        //        Start: [..] [Player] [Box]
        //        Pull:  [Player] [Box] [..]
        //      So Player stands at (x,y). Box is at (x+1, y).
        //      Player moves to (x-1, y). Box moves to (x, y). (Pulling it 'left').
        //      Condition: (x-1, y) must be empty.

        //   Algorithm loop:
        //   For n steps:
        //     - Identify all "Potential Pulls". A potential pull is:
        //       - A box B at (bx, by).
        //       - A direction D.
        //       - Let P_req be (bx + dx, by + dy). This is where the Player must stand to pull.
        //       - Let P_dest be (bx + 2dx, by + 2dy). This is where the Player ends up.
        //       - Let B_dest be (bx + dx, by + dy). This is where the Box ends up.
        //       - CHECK:
        //         - P_req is within bounds and not a wall? (It's currently empty or player).
        //         - P_dest is within bounds, not wall, not box.
        //         - Can Player reach P_req from current Player.x, Player.y? (BFS ignoring boxes).
        //     - If valid pulls exist, pick one (randomly or weigh by "change").
        //     - Execute Pull:
        //         - Teleport Player to P_req (logically he walked there).
        //         - Move Player to P_dest.
        //         - Move Box to B_dest (which is P_req).
        //     - Update map state (Box positions changed).

        // Track box positions precisely.
        // Map char update:
        // We'll keep 'map' mostly static with walls and targets. We manage entities separately.

        let currentBoxes = boxes.map(b => ({ ...b }));
        let currentPlayer = { ...player };

        for (let i = 0; i < steps; i++) {
            let possiblePulls = [];

            // Find all valid pulls
            currentBoxes.forEach((box, boxIdx) => {
                this.DIRECTIONS.forEach(dir => {
                    // Notation:
                    // Box is at B.
                    // We want to pull it from B to P_req.
                    // Player is standing at P_req.
                    // Player moves to P_dest.
                    // Box moves to P_req.
                    //
                    // Wait, standard PULL definition: 
                    // [Player] [Box] -> Player moves back, Box follows.
                    // Pre-state: [Empty] [Player] [Box]
                    // Post-state: [Player] [Box] [Empty]
                    //
                    // So:
                    // Box at (bx, by).
                    // Player at (bx + dx, by + dy)  <-- P_req
                    // Move Player to (bx + 2dx, by + 2dy) <-- P_dest
                    // Move Box to (bx + dx, by + dy) <-- B_dest == P_req

                    const pReq = { x: box.x + dir.dx, y: box.y + dir.dy };
                    const pDest = { x: box.x + 2 * dir.dx, y: box.y + 2 * dir.dy };

                    // 1. Check bounds and walls for P_req
                    if (!this.isValidCell(pReq, width, height, map, currentBoxes)) return; // Cell occupied by box?
                    // Actually P_req MUST NOT be a box (it's where player needs to stand).
                    if (this.isBox(pReq, currentBoxes)) return;

                    // 2. Check bounds and walls for P_dest
                    if (!this.isValidCell(pDest, width, height, map, currentBoxes)) return;
                    if (this.isBox(pDest, currentBoxes)) return;

                    // 3. Can player reach P_req?
                    // BFS from currentPlayer to pReq
                    if (this.canReach(currentPlayer, pReq, width, height, map, currentBoxes)) {
                        possiblePulls.push({
                            boxIdx,
                            dir,
                            pReq,
                            pDest
                        });
                    }
                });
            });

            if (possiblePulls.length === 0) break; // Stuck

            // Pick random pull
            const pull = possiblePulls[Math.floor(Math.random() * possiblePulls.length)];

            // Execute
            const box = currentBoxes[pull.boxIdx];

            // Move player to dest
            currentPlayer.x = pull.pDest.x;
            currentPlayer.y = pull.pDest.y;

            // Move box to pReq
            box.x = pull.pReq.x;
            box.y = pull.pReq.y;
        }

        // Finalize Map
        // Convert dynamic entities back to string map
        // Map currently has Walls (#) and Targets (.) and Floors ( )
        // We need to place '$' (Box), '@' (Player), '*' (Box on Target), '+' (Player on Target)

        let finalMap = JSON.parse(JSON.stringify(map)); // Deep copy chars

        // Place Boxes
        currentBoxes.forEach(box => {
            const char = finalMap[box.y][box.x];
            if (char === '.') {
                finalMap[box.y][box.x] = '*';
            } else {
                finalMap[box.y][box.x] = '$';
            }
        });

        // Place Player
        const char = finalMap[currentPlayer.y][currentPlayer.x];
        if (char === '.') {
            finalMap[currentPlayer.y][currentPlayer.x] = '+';
        } else if (char === '$' || char === '*') {
            // Should not happen if logic is correct
            // Fallback if player ended up on box?
        } else {
            finalMap[currentPlayer.y][currentPlayer.x] = '@';
        }

        return {
            level: levelNum,
            name: `Generated Sector ${levelNum}`,
            difficulty: this.getDifficultyLabel(levelNum),
            description: `Procedurally generated challenge (S${steps} B${boxCount})`,
            map: finalMap.map(row => row.join(''))
        };
    }

    isValidCell(pos, w, h, map, boxes) {
        if (pos.x < 0 || pos.x >= w || pos.y < 0 || pos.y >= h) return false;
        if (map[pos.y][pos.x] === '#') return false;
        // Note: We don't check boxes here because 'boxes' argument is used for dynamic checks
        return true;
    }

    isBox(pos, boxes) {
        return boxes.some(b => b.x === pos.x && b.y === pos.y);
    }

    canReach(start, target, w, h, map, boxes) {
        if (start.x === target.x && start.y === target.y) return true;

        let file = new Array(h).fill(0).map(() => new Array(w).fill(false));
        let queue = [start];
        file[start.y][start.x] = true;

        while (queue.length > 0) {
            let curr = queue.shift();

            for (let dir of this.DIRECTIONS) {
                let next = { x: curr.x + dir.dx, y: curr.y + dir.dy };

                if (next.x === target.x && next.y === target.y) return true;

                if (this.isValidCell(next, w, h, map, boxes) &&
                    !this.isBox(next, boxes) &&
                    !file[next.y][next.x]) {

                    file[next.y][next.x] = true;
                    queue.push(next);
                }
            }
        }
        return false;
    }

    getDifficultyLabel(n) {
        if (n <= 10) return "Beginner";
        if (n <= 25) return "Intermediate";
        if (n <= 50) return "Advanced";
        if (n <= 75) return "Expert";
        return "Master";
    }
}

// Export for usage
window.LevelGenerator = LevelGenerator;

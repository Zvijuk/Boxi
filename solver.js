
// Basic Priority Queue for A*
class PriorityQueue {
    constructor() { this.items = []; }
    enqueue(element, priority) {
        let contain = false;
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].priority > priority) {
                this.items.splice(i, 0, { element, priority });
                contain = true;
                break;
            }
        }
        if (!contain) this.items.push({ element, priority });
    }
    dequeue() { return this.items.shift(); }
    isEmpty() { return this.items.length === 0; }
}

class SokobanSolver {
    constructor(map) {
        this.map = map; // Array of strings
        this.parsed = this.parseMap(map);
        this.width = this.parsed.width;
        this.height = this.parsed.height;
        this.walls = this.parsed.walls;
        this.goals = this.parsed.goals;
        // Precompute goal map for quick heuristic
        this.goalMap = new Set(this.goals.map(g => `${g.x},${g.y}`));
    }

    solve(maxTimeMs = 5000) {
        const startState = {
            player: this.parsed.player,
            boxes: this.parsed.boxes.sort((a, b) => (a.y - b.y) || (a.x - b.x)),
            path: ""
        };

        const queue = new PriorityQueue();
        queue.enqueue(startState, 0);

        const visited = new Set();
        visited.add(this.encode(startState));

        const startTime = performance.now();
        let checked = 0;

        while (!queue.isEmpty()) {
            if (checked++ % 100 === 0) {
                if (performance.now() - startTime > maxTimeMs) return null; // Timeout
            }

            const { element: curr } = queue.dequeue();

            if (this.isSolved(curr.boxes)) {
                return curr.path;
            }

            // Simple moves (L, U, R, D)
            const moves = [
                { dx: 0, dy: -1, char: 'u', pushChar: 'U' }, // Up
                { dx: 0, dy: 1, char: 'd', pushChar: 'D' },  // Down
                { dx: -1, dy: 0, char: 'l', pushChar: 'L' }, // Left
                { dx: 1, dy: 0, char: 'r', pushChar: 'R' }   // Right
            ];

            for (const move of moves) {
                const nextX = curr.player.x + move.dx;
                const nextY = curr.player.y + move.dy;

                // Wall?
                if (this.isWall(nextX, nextY)) continue;

                // Box?
                const boxIndex = curr.boxes.findIndex(b => b.x === nextX && b.y === nextY);

                if (boxIndex !== -1) {
                    // Push
                    const pushX = nextX + move.dx;
                    const pushY = nextY + move.dy;

                    // Can push?
                    if (this.isWall(pushX, pushY)) continue;
                    if (curr.boxes.some(b => b.x === pushX && b.y === pushY)) continue;

                    // Simple deadlock checks (corner)
                    if (this.isDeadlock(pushX, pushY)) continue;

                    const newBoxes = [...curr.boxes];
                    newBoxes[boxIndex] = { x: pushX, y: pushY };
                    newBoxes.sort((a, b) => (a.y - b.y) || (a.x - b.x));

                    const newState = {
                        player: { x: nextX, y: nextY },
                        boxes: newBoxes,
                        path: curr.path + move.pushChar
                    };

                    const enc = this.encode(newState);
                    if (!visited.has(enc)) {
                        visited.add(enc);
                        const h = this.heuristic(newState);
                        queue.enqueue(newState, newState.path.length + h); // A* (f = g + h)
                    }

                } else {
                    // Walk
                    const newState = {
                        player: { x: nextX, y: nextY },
                        boxes: curr.boxes,
                        path: curr.path + move.char
                    };

                    const enc = this.encode(newState);
                    if (!visited.has(enc)) {
                        visited.add(enc);
                        const h = this.heuristic(newState); // h is same as parent, but g increases
                        queue.enqueue(newState, newState.path.length + h);
                    }
                }
            }
        }
        return null; // No solution found
    }

    // Heuristic: Sum of manhattan distances of boxes to nearest goal
    heuristic(state) {
        let total = 0;
        for (const box of state.boxes) {
            let min = Infinity;
            for (const goal of this.goals) {
                const dist = Math.abs(box.x - goal.x) + Math.abs(box.y - goal.y);
                if (dist < min) min = dist;
            }
            total += min;
        }
        return total;
    }

    isSolved(boxes) {
        // All boxes on goals
        // Assuming box count == goal count (standard)
        // Or at least every box is on a goal
        return boxes.every(b => this.goalMap.has(`${b.x},${b.y}`));
    }

    isWall(x, y) {
        return this.walls.has(`${x},${y}`);
    }

    isDeadlock(x, y) {
        if (this.goalMap.has(`${x},${y}`)) return false;

        const u = this.isWall(x, y - 1);
        const d = this.isWall(x, y + 1);
        const l = this.isWall(x - 1, y);
        const r = this.isWall(x + 1, y);

        // Corner
        if ((u && l) || (u && r) || (d && l) || (d && r)) return true;

        return false;
    }

    encode(state) {
        // pX,pY|b1X,b1Y|b2X...
        let s = `${state.player.x},${state.player.y}|`;
        // Boxes are already sorted
        s += state.boxes.map(b => `${b.x},${b.y}`).join('|');
        return s;
    }

    parseMap(map) {
        const h = map.length;
        const w = map.reduce((m, r) => Math.max(m, r.length), 0);
        let player = null;
        let boxes = [];
        let goals = [];
        let walls = new Set();

        for (let y = 0; y < h; y++) {
            const row = map[y];
            for (let x = 0; x < row.length; x++) {
                const c = row[x];
                if (c === '#') walls.add(`${x},${y}`);
                if (c === '@' || c === '+') player = { x, y };
                if (c === '$' || c === '*') boxes.push({ x, y });
                if (c === '.' || c === '+' || c === '*') goals.push({ x, y });
            }
        }
        return { width: w, height: h, parsedPlayer: player, player, boxes, goals, walls };
    }
}

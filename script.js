const canvas = document.getElementById("mazeCanvas");
const ctx = canvas.getContext("2d");

const widthInput = document.getElementById("widthInput");
const heightInput = document.getElementById("heightInput");

const generateBtn = document.getElementById("generateBtn");
const solveBtn = document.getElementById("solveBtn");

const status = document.getElementById("status");

let maze = null;
let solution = null;

const CELL_SIZE = 20;


// --------------------------------------------------
// Maze generation
// --------------------------------------------------

function generateMaze(width, height) {

    maze = Array.from(
        { length: height },
        () => Array(width).fill(1)
    );

    const start = [1, 1];

    maze[start[1]][start[0]] = 0;

    const stack = [start];

    const directions = [
        [0, -2],
        [0, 2],
        [-2, 0],
        [2, 0]
    ];

    while (stack.length > 0) {

        const [x, y] = stack[stack.length - 1];

        const neighbors = [];

        for (const [dx, dy] of directions) {

            const nx = x + dx;
            const ny = y + dy;

            if (
                nx >= 1 &&
                nx < width - 1 &&
                ny >= 1 &&
                ny < height - 1 &&
                maze[ny][nx] === 1
            ) {
                neighbors.push([
                    nx,
                    ny,
                    x + dx / 2,
                    y + dy / 2
                ]);
            }
        }

        if (neighbors.length === 0) {

            stack.pop();

            continue;
        }

        const randomIndex =
            Math.floor(Math.random() * neighbors.length);

        const [nx, ny, wallX, wallY] =
            neighbors[randomIndex];

        maze[wallY][wallX] = 0;
        maze[ny][nx] = 0;

        stack.push([nx, ny]);
    }

    // Entry
    maze[0][1] = 0;

    // Exit
    maze[height - 1][width - 2] = 0;

    return maze;
}


// --------------------------------------------------
// Drawing
// --------------------------------------------------

function drawMaze() {

    if (!maze) return;

    const height = maze.length;
    const width = maze[0].length;

    canvas.width = width * CELL_SIZE;
    canvas.height = height * CELL_SIZE;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.fillStyle = "#111111";

    for (let y = 0; y < height; y++) {

        for (let x = 0; x < width; x++) {

            if (maze[y][x] === 1) {

                ctx.fillRect(
                    x * CELL_SIZE,
                    y * CELL_SIZE,
                    CELL_SIZE,
                    CELL_SIZE
                );
            }
        }
    }
}


// --------------------------------------------------
// BFS solver
// --------------------------------------------------

function solveMaze() {

    if (!maze) return;

    const height = maze.length;
    const width = maze[0].length;

    const start = [1, 0];
    const end = [width - 2, height - 1];

    const queue = [start];
    let queueIndex = 0;

    const cameFrom = new Map();

    const key = (x, y) => `${x},${y}`;

    cameFrom.set(key(...start), null);

    const directions = [
        [0, -1],
        [0, 1],
        [-1, 0],
        [1, 0]
    ];

    while (queueIndex < queue.length) {

        const [x, y] = queue[queueIndex++];

        if (x === end[0] && y === end[1]) {
            break;
        }

        for (const [dx, dy] of directions) {

            const nx = x + dx;
            const ny = y + dy;

            if (
                nx < 0 ||
                nx >= width ||
                ny < 0 ||
                ny >= height
            ) {
                continue;
            }

            if (maze[ny][nx] !== 0) {
                continue;
            }

            const nextKey = key(nx, ny);

            if (cameFrom.has(nextKey)) {
                continue;
            }

            cameFrom.set(nextKey, [x, y]);

            queue.push([nx, ny]);
        }
    }

    const endKey = key(...end);

    if (!cameFrom.has(endKey)) {
        return null;
    }

    const path = [];

    let current = end;

    while (current !== null) {

        path.push(current);

        current =
            cameFrom.get(key(...current));
    }

    return path.reverse();
}


// --------------------------------------------------
// Solution drawing
// --------------------------------------------------

function drawSolution(path) {

    if (!path) return;

    ctx.strokeStyle = "#ff3b30";
    ctx.lineWidth = 3;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();

    for (let i = 0; i < path.length; i++) {

        const [x, y] = path[i];

        const px =
            x * CELL_SIZE +
            CELL_SIZE / 2;

        const py =
            y * CELL_SIZE +
            CELL_SIZE / 2;

        if (i === 0) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    }

    ctx.stroke();
}


// --------------------------------------------------
// Generate
// --------------------------------------------------

function generate() {

    let width = Number(widthInput.value);
    let height = Number(heightInput.value);

    if (width < 3) width = 3;
    if (height < 3) height = 3;

    // Keep dimensions odd
    if (width % 2 === 0) width++;
    if (height % 2 === 0) height++;

    widthInput.value = width;
    heightInput.value = height;

    solution = null;

    maze = generateMaze(width, height);

    drawMaze();

    status.textContent =
        `${width} × ${height} maze generated`;
}


// --------------------------------------------------
// Solve
// --------------------------------------------------

function solve() {

    if (!maze) {
        generate();
    }

    status.textContent = "Solving...";

    solution = solveMaze();

    if (!solution) {
        status.textContent = "No solution found";
        return;
    }

    drawMaze();
    drawSolution(solution);

    status.textContent =
        `Solved — ${solution.length} steps`;
}

// --------------------------------------------------
// Export helpers
// --------------------------------------------------

function downloadBlob(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}


function exportPNG() {
    if (!maze) return;

    const link = document.createElement("a");

    link.download = "maze.png";
    link.href = canvas.toDataURL("image/png");

    link.click();
}


function exportSVG() {
    if (!maze) return;

    const height = maze.length;
    const width = maze[0].length;
    const size = 20;

    let path = "";

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {

            if (maze[y][x] === 1) {
                const px = x * size;
                const py = y * size;

                path += `M${px} ${py}h${size}v${size}H${px}Z`;
            }
        }
    }

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg"
     width="${width * size}"
     height="${height * size}"
     viewBox="0 0 ${width * size} ${height * size}">
    <path
        d="${path}"
        fill="#000000"
        stroke="none"
    />
</svg>`;

    const blob = new Blob(
        [svg],
        { type: "image/svg+xml;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "maze.svg";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 1000);
}


function exportJSON() {
    if (!maze) return;

    const data = {
        width: maze[0].length,
        height: maze.length,

        start: [1, 0],

        end: [
            maze[0].length - 2,
            maze.length - 1
        ],

        grid: maze
    };

    downloadBlob(
        JSON.stringify(data, null, 2),
        "maze.json",
        "application/json"
    );
}


function exportTXT() {
    if (!maze) return;

    const text = maze
        .map(row =>
            row
                .map(cell => cell === 1 ? "#" : " ")
                .join("")
        )
        .join("\n");

    downloadBlob(
        text,
        "maze.txt",
        "text/plain"
    );
}


// --------------------------------------------------
// Export events
// --------------------------------------------------

document
    .querySelectorAll("[data-export]")
    .forEach(button => {

        button.addEventListener("click", () => {

            if (!maze) {
                generate();
            }

            switch (button.dataset.export) {

                case "png":
                    exportPNG();
                    break;

                case "svg":
                    exportSVG();
                    break;

                case "json":
                    exportJSON();
                    break;

                case "txt":
                    exportTXT();
                    break;
            }
        });
    });

// --------------------------------------------------
// Events
// --------------------------------------------------

generateBtn.addEventListener("click", generate);

solveBtn.addEventListener("click", solve);


// Initial maze
generate();
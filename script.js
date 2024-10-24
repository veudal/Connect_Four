const thickness = 10;

let minimumForWin = 4;
let rows = 6;
let columns = 7;
let audio = new Audio("assets/sound.mp3");

let board = [];
let isRedsTurn = true;
let selectorPos = Math.floor(columns / 2);

let spaceBetweenRows;
let spaceBetweenColumns;
let rowThickness;
let columnThickness;

let canvas;
let ctx;
let dpr;
let background;

document.addEventListener("DOMContentLoaded", function() {
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");
    background = window.getComputedStyle(document.body).backgroundColor;
    initCanvas();
    initDocumentEvents();   
});

function initDocumentEvents() {
    document.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('pointerdown', handleCell);
    canvas.addEventListener('pointermove', handleMouseMove);
    window.addEventListener('resize', resizeCanvas)
}

function resizeCanvas(){
    initCanvas();
}

function handleInputChange(inputType) {
    const inputElement = document.getElementById(inputType);
    
    let min, max;
    switch (inputType) {
        case 'rows':
        case 'columns':
            min = 1;
            max = 60;
            break;
        case 'minimum':
            min = 2;
            max = undefined;
            break;
    }

    let value = parseInt(inputElement.value);
    if (!value){
        value = 0; 
    } 

    value = Math.max(value, min);
    if (max !== undefined) value = Math.min(value, max);

    inputElement.value = value;

    switch (inputType) {
        case 'rows':
            rows = value;
            break;
        case 'columns':
            columns = value;
            break;
        case 'minimum':
            minimumForWin = value;
            break;
    }
    reset();
    initCanvas();
}


function handleMouseMove(event) {
    const rect = canvas.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const moveToPos = Math.floor(x / spaceBetweenColumns * dpr);

    move(moveToPos)
}

function handleCell() {
    requestAnimationFrame(insertCell);
    waitForNextFrame().then(checkForEnd);
}

function initCanvas() {
    rowThickness = Math.round(canvas.height / canvas.width * thickness);
    columnThickness = Math.round(canvas.height / canvas.width * thickness);

    dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const bottom = document.getElementById("bottom");
    const side = document.getElementById("side");

    drawPreview();
    adjust3DBorder(bottom, rect, side);    
}

function adjust3DBorder(bottom, rect, side) {
    const borderThickness = 20;

    bottom.style.top = `${canvas.style.y + rect.height + spaceBetweenRows}px`;
    bottom.style.width = `${rect.width + borderThickness / 1.2 - dpr}px`;
    bottom.style.height = `${borderThickness}px`;
    bottom.style.left = `${canvas.style.left - borderThickness + dpr}px`;

    side.style.left = `${canvas.style.x - borderThickness - dpr}px`;
    side.style.top = `${canvas.style.top + spaceBetweenRows / dpr * 1.04}px`;
    side.style.width = `${borderThickness + dpr}px`;
    side.style.height = `${rect.height - spaceBetweenRows / dpr + dpr * 5}px`;
}

function handleKeyDown(e) {
    const key = e.key.toUpperCase();

    if (key == "A" || key == "ARROWLEFT") 
        move(selectorPos - 1);
    else if (key == "D" || key == "ARROWRIGHT") 
        move(selectorPos + 1);
    else if (e.key == " " || key == "ENTER") 
        handleCell();
};

function waitForNextFrame() {
    return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

function checkForEnd() {
    const result = checkWin();
    if(result){
        alert(result + " won the game!");
        reset();
    }
    else if(board.length == rows * columns) {
        alert("It's a tie.");
        reset();
    }
}

function reset() {
    board = [];
    isRedsTurn = true;
    selectorPos = Math.floor(columns / 2);
    drawPreview();
}

function checkWin() {
    for(let y = 0; y <= rows; y++){
        for(let x = 0; x <= columns; x++){
            let checkedCells = [];
            const cell = board.find(item => item.x == x && item.y == y);
            if(cell && isMinimumReached(cell, checkedCells)) {
                return cell.isRed ? "Red" : "Yellow";
            }
        }
    }
    return undefined;
}

function isMinimumReached(cell, checkedCells) {
    //Horizontal check
    // Skip check if an item left to it has already been checked
    // if(!checkedCells.some(item => item.isRed == cell.isRed && item.y == cell.y && cell.x - item.x == 1)){
        let count = 1;
        for (let i = cell.x + 1; i < minimumForWin + cell.x; i++) {
            if(board.some(item => item.isRed == cell.isRed && item.y == cell.y && item.x == i)) {
                count++;
                if(count == minimumForWin)
                    return true;
            }
            else
                break;
        }
    // }

    //Vertical check
    // Skip check if an item above it has already been checked
        count = 1;
        for (let i = cell.y + 1; i < minimumForWin + cell.y; i++) {
            if(board.some(item => item.isRed == cell.isRed && item.x == cell.x && item.y == i)) {
                count++;
                if(count == minimumForWin)
                    return true;
            }
            else 
                break;
        }

    //Diagonal check top to bottom
    count = 1;
    for (let i = 1; i < minimumForWin; i++) {
        if(board.some(item => item.isRed == cell.isRed && item.x == cell.x + i && item.y == cell.y + i)) {
            count++;
            if(count == minimumForWin)
                return true;
        }
        else 
            break;
    }

    //Diagonal check bottom to top
    count = 1;
    for (let i = 1; i < minimumForWin; i++) {
        if(board.some(item => item.isRed == cell.isRed && item.x == cell.x + i && item.y == cell.y - i)) {
            count++;
            if(count == minimumForWin)
                return true;
        }
        else 
            break;
    }

    checkedCells.push(cell);
    return false;
}

function insertCell() {
    let topCell = board.findLast(item => item.x == selectorPos)
    const highestY = topCell ? topCell.y - 1 : rows;
    if(highestY <= 0){
        return;
    }

    const cell = new Cell(selectorPos, highestY, isRedsTurn);
    board.push(cell)
    if(!audio.paused){
        audio.currentTime = 0;
    }
    audio.play();
    isRedsTurn = !isRedsTurn;
    fillCircle(cell);
    fillCircle(new Cell(cell.x, 0, isRedsTurn));
}

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(rows, columns);
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, spaceBetweenRows)
    ctx.fillStyle = "#0007c8";
    ctx.fillRect(0, spaceBetweenRows, canvas.width, canvas.height - spaceBetweenRows)
    drawState();
}

function drawState() {
    for(let i = 0; i <  columns; i++){
        for(let j = 0; j < rows; j++){
            const x = rowThickness + i * spaceBetweenColumns;
            const y = columnThickness + (j + 1) * spaceBetweenRows;
            const width = spaceBetweenColumns - rowThickness;
            const height = spaceBetweenRows - columnThickness;
            const radius = Math.min(width, height) / 2.5;
        
            drawCircle(x, y, width / 2, height / 2, radius, "blue", background);
        }
    }

    for(let i = 0; i < board.length; i++){
        const cell = board[i];
        fillCircle(cell);
    }
}

function fillCircle(cell) {
    const x = rowThickness + cell.x * spaceBetweenColumns;
    const y = columnThickness + cell.y * spaceBetweenRows;
    const width = spaceBetweenColumns - rowThickness;
    const height = spaceBetweenRows - columnThickness;
    const radius = Math.min(width, height) / 2.5;

    const color = cell.isRed ? "red" : "yellow";

    drawCircle(x, y, width / 2, height / 2, radius, null, color);
}

function drawCircle(x, y, width, height, radius, color1, color2) {
    if(color1){
        ctx.fillStyle = color1;
        ctx.beginPath();
        ctx.arc(x + 5 * dpr + width, y + 5 * dpr + height, radius + 1, 0, 2 * Math.PI, false);
        ctx.fill();
    }

    ctx.fillStyle = color2;
    ctx.beginPath();
    ctx.arc(x + width, y + height, radius, 0, 2 * Math.PI, false);
    ctx.fill();


}

function move(newPos) {
    //Ensure that new position is within bounds
    selectorPos = Math.min(Math.max(newPos, 0), columns - 1);
    drawPreview();
}

function drawPreview() {
    board.push(new Cell(selectorPos, 0, isRedsTurn));
    drawBoard();
    board.pop();
}

function drawGrid(columns, rows) {
    ctx.fillStyle = "blue";

    spaceBetweenColumns = Math.round(canvas.width / rows);
    spaceBetweenRows = Math.round(canvas.height / (columns + 1)); // +1 Because the top row is reserved for preview cells

    for(let i = 1; i < rows; i++) {
        ctx.fillRect(i * spaceBetweenColumns, spaceBetweenRows, rowThickness, canvas.height);
    }

    for(let i = 1; i < columns; i++) {
        ctx.fillRect(0, (i + 1) * spaceBetweenRows, canvas.width, columnThickness);
    }
}

class Cell {
    constructor(x, y, isRed) {
        this.x = x;
        this.y = y;
        this.isRed = isRed;
    }
}
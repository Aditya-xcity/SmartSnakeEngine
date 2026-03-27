const CELL = 18;
const COLS = 30;
const ROWS = 26;
const W = COLS * CELL;
const H = ROWS * CELL;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = W;
canvas.height = H;

const SPEEDS = [160, 110, 70, 38];
let speedIdx = 0;

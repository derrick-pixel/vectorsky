/**
 * gen-og.js  --  Generate og-image.png (1200x630) for VectorSky Defense
 * Usage: node gen-og.js
 * Requires: npm install canvas
 */
const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

const W = 1200;
const H = 630;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext("2d");

const BG      = "#080a08";
const AMBER   = "#c8860a";
const AMBER_L = "#f0a820";
const GRAY    = "#3a3e3a";
const LIGHT   = "#d0d0d0";

// background
ctx.fillStyle = BG;
ctx.fillRect(0, 0, W, H);

// subtle grid
ctx.strokeStyle = "rgba(200,134,10,0.06)";
ctx.lineWidth = 1;
for (let x = 0; x <= W; x += 60) {
  ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
}
for (let y = 0; y <= H; y += 60) {
  ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
}

// corner brackets (targeting bracket motif from the logo)
const bLen = 60, bOff = 30;
ctx.strokeStyle = AMBER;
ctx.lineWidth = 3;
ctx.beginPath(); ctx.moveTo(bOff, bOff + bLen); ctx.lineTo(bOff, bOff); ctx.lineTo(bOff + bLen, bOff); ctx.stroke();
ctx.beginPath(); ctx.moveTo(W - bOff - bLen, bOff); ctx.lineTo(W - bOff, bOff); ctx.lineTo(W - bOff, bOff + bLen); ctx.stroke();
ctx.beginPath(); ctx.moveTo(bOff, H - bOff - bLen); ctx.lineTo(bOff, H - bOff); ctx.lineTo(bOff + bLen, H - bOff); ctx.stroke();
ctx.beginPath(); ctx.moveTo(W - bOff - bLen, H - bOff); ctx.lineTo(W - bOff, H - bOff); ctx.lineTo(W - bOff, H - bOff - bLen); ctx.stroke();

// V-chevron (logo mark)
const vCx = W / 2, vCy = 175, vS = 2.8;
ctx.strokeStyle = AMBER; ctx.lineWidth = 4;
ctx.beginPath();
ctx.moveTo(vCx - 16*vS, vCy - 14*vS); ctx.lineTo(vCx, vCy + 14*vS); ctx.lineTo(vCx + 16*vS, vCy - 14*vS);
ctx.stroke();

// inner brackets on V
ctx.strokeStyle = AMBER_L; ctx.lineWidth = 2.5;
ctx.beginPath(); ctx.moveTo(vCx - 8*vS, vCy - 14*vS); ctx.lineTo(vCx - 16*vS, vCy - 14*vS); ctx.lineTo(vCx - 16*vS, vCy - 6*vS); ctx.stroke();
ctx.beginPath(); ctx.moveTo(vCx + 8*vS, vCy - 14*vS); ctx.lineTo(vCx + 16*vS, vCy - 14*vS); ctx.lineTo(vCx + 16*vS, vCy - 6*vS); ctx.stroke();

// small diamond
ctx.fillStyle = AMBER; ctx.fillRect(vCx - 5, vCy - 2, 10, 10);

// text (falls back to system sans-serif; Barlow Condensed used if registered)
const fT = "sans-serif", fM = "monospace", fB = "sans-serif";

ctx.fillStyle = "#ffffff";
ctx.font = `800 54px ${fT}`;
ctx.textAlign = "center";
ctx.fillText("VECTORSKY DEFENSE", W / 2, 340);

ctx.strokeStyle = AMBER; ctx.lineWidth = 2;
ctx.beginPath(); ctx.moveTo(W/2 - 160, 365); ctx.lineTo(W/2 + 160, 365); ctx.stroke();

ctx.fillStyle = AMBER_L;
ctx.font = `700 38px ${fT}`;
ctx.fillText("DEPLOY.  DEFEND.  DOMINATE.", W / 2, 415);

ctx.fillStyle = LIGHT;
ctx.font = `500 18px ${fB}`;
ctx.fillText("Aviation & Defense Solutions", W / 2, 460);

// classification bar bottom
ctx.fillStyle = "rgba(200,134,10,0.12)";
ctx.fillRect(0, H - 50, W, 50);
ctx.fillStyle = GRAY;
ctx.font = `400 13px ${fM}`;
ctx.fillText("VSD-OPS-001  //  EST. 2024  //  SINGAPORE", W / 2, H - 22);

// classification bar top
ctx.fillStyle = "rgba(200,134,10,0.12)";
ctx.fillRect(0, 0, W, 44);
ctx.fillStyle = GRAY;
ctx.font = `400 12px ${fM}`;
ctx.fillText("AUTHORIZED PERSONNEL ONLY", W / 2, 28);

// save
const outPath = path.join(__dirname, "assets", "og-image.png");
const buf = canvas.toBuffer("image/png");
fs.writeFileSync(outPath, buf);
console.log(`OG image written to ${outPath}  (${buf.length} bytes)`);

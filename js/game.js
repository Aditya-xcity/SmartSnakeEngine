let snake, bodySet, rewards, poisons, herbs, itemHeap;
let dir, nextDir;
let score, level, gameOver, paused, running;
let tickInterval, particles, hintPath;
let tickCount = 0;
let logEntries = [];
let prevLevel = 1;
let autoPlay = false;
let nextHerbSpawnTick = 0;
let currentSnakePreset = null;
let playerName = "Space Potato";
const MENU_SETTINGS_KEY = "noodleChaos.menuSettings";

const SNAKE_PRESETS = [
  {
    id: "plasma-pickle",
    name: "Plasma Pickle",
    head: "#1ea3d6",
    glow: "#1ea3d6",
    bodyStart: "#8edff5",
    bodyEnd: "#5fb7d8",
    eye: "#f0fbff",
    smiley: false,
  },
  {
    id: "nacho-ninja",
    name: "Nacho Ninja",
    head: "#ff8a00",
    glow: "#ff8a00",
    bodyStart: "#ffd16a",
    bodyEnd: "#ffac37",
    eye: "#3b2500",
    smiley: false,
  },
  {
    id: "mint-disaster",
    name: "Mint Disaster",
    head: "#20b877",
    glow: "#20b877",
    bodyStart: "#95f0ce",
    bodyEnd: "#4ecf98",
    eye: "#073826",
    smiley: false,
  },
  {
    id: "captain-smirk",
    name: "Captain Smirk",
    head: "#f54291",
    glow: "#f54291",
    bodyStart: "#ffb4d6",
    bodyEnd: "#ff78b5",
    eye: "#fff4fa",
    smiley: true,
  },
  {
    id: "void-noodle",
    name: "Void Noodle",
    head: "#7f6bff",
    glow: "#7f6bff",
    bodyStart: "#ccc4ff",
    bodyEnd: "#9b8cff",
    eye: "#1a143f",
    smiley: false,
  },
];

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const num = Number.parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function lerpColorHex(a, b, t) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const r = Math.round(ca.r + (cb.r - ca.r) * t);
  const g = Math.round(ca.g + (cb.g - ca.g) * t);
  const bl = Math.round(ca.b + (cb.b - ca.b) * t);
  return `rgb(${r},${g},${bl})`;
}

function ensureSnakePreset() {
  if (!currentSnakePreset) currentSnakePreset = SNAKE_PRESETS[0];
}

function setSnakePresetById(id, shouldLog = true) {
  const found = SNAKE_PRESETS.find((p) => p.id === id);
  if (!found) return;
  currentSnakePreset = found;

  const nameEl = document.getElementById("snakeNameVal");
  if (nameEl) nameEl.textContent = found.name;

  const picker = document.getElementById("snakeSkinSelect");
  if (picker && picker.value !== found.id) picker.value = found.id;

  document.querySelectorAll(".snake-preview-card").forEach((card) => {
    card.classList.toggle("active", card.getAttribute("data-skin-id") === found.id);
  });

  if (shouldLog && typeof daaLog === "function") {
    daaLog("STYLE", `Snake profile set: ${found.name}`, "Greedy");
  }

  if (running) render();
}

function applySnakePreset(id) {
  setSnakePresetById(id, true);
}

function renderSnakePreviewList() {
  const host = document.getElementById("snakePreviewList");
  if (!host) return;

  host.innerHTML = SNAKE_PRESETS.map((p) => {
    const s0 = lerpColorHex(p.bodyStart, p.bodyEnd, 0.25);
    const s1 = lerpColorHex(p.bodyStart, p.bodyEnd, 0.6);
    const s2 = lerpColorHex(p.bodyStart, p.bodyEnd, 0.95);
    const face = p.smiley ? " :)" : "";
    return `
      <div class="snake-preview-card${currentSnakePreset && currentSnakePreset.id === p.id ? " active" : ""}" data-skin-id="${p.id}">
        <div class="snake-preview-track">
          <span class="snake-preview-seg" style="background:${s0}"></span>
          <span class="snake-preview-seg" style="background:${s1}"></span>
          <span class="snake-preview-seg" style="background:${s2}"></span>
          <span class="snake-preview-seg" style="background:${p.head}; box-shadow:0 0 6px ${p.glow}"></span>
        </div>
        <div class="snake-preview-name">${p.name}${face}</div>
      </div>`;
  }).join("");

  host.querySelectorAll(".snake-preview-card").forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.getAttribute("data-skin-id");
      if (id) applySnakePreset(id);
    });
  });
}

function initSnakePresetUI() {
  const picker = document.getElementById("snakeSkinSelect");
  if (!picker) return;
  picker.innerHTML = SNAKE_PRESETS.map((p) => `<option value="${p.id}">${p.name}</option>`).join("");
  ensureSnakePreset();
  picker.value = currentSnakePreset.id;
  setSnakePresetById(currentSnakePreset.id, false);
  renderSnakePreviewList();
}

function loadMenuSettings() {
  try {
    const raw = localStorage.getItem(MENU_SETTINGS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function applyMenuSettings() {
  const settings = loadMenuSettings();
  ensureSnakePreset();

  if (settings?.snakePresetId) setSnakePresetById(settings.snakePresetId, false);
  else setSnakePresetById(SNAKE_PRESETS[0].id, false);

  if (typeof settings?.playerName === "string") applyPlayerName(settings.playerName, false);
  else applyPlayerName(playerName, false);

  if (Number.isInteger(settings?.speedIdx)) {
    speedIdx = Math.max(0, Math.min(SPEEDS.length - 1, settings.speedIdx));
  }

  if (settings?.mode === "auto") autoPlay = true;
  else if (settings?.mode === "manual") autoPlay = false;

  if (typeof settings?.autoPlay === "boolean") {
    autoPlay = settings.autoPlay;
  }
}

function sanitizePlayerName(raw) {
  const compact = (raw || "").replace(/\s+/g, " ").trim();
  if (!compact) return "Space Potato";
  return compact.slice(0, 18);
}

function applyPlayerName(name, syncInput = true) {
  playerName = sanitizePlayerName(name);
  const nameEl = document.getElementById("playerNameVal");
  if (nameEl) nameEl.textContent = playerName.toUpperCase();
  const input = document.getElementById("playerNameInput");
  if (syncInput && input) input.value = playerName;
}

function bindTitleScreenNameInput() {
  const input = document.getElementById("playerNameInput");
  if (!input) return;
  input.value = playerName;
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      startGame();
    }
  });
}

function goToMainMenu() {
  window.location.href = "index.html";
}

function key(x, y) {
  return `${x},${y}`;
}

function isReverseDirection(a, b) {
  return a[0] === -b[0] && a[1] === -b[1];
}

function buildBlockedSet(ignoreTail = false) {
  const blocked = new Set();
  const body = snake.toArray();
  for (let i = 1; i < body.length; i++) {
    if (ignoreTail && i === body.length - 1) continue;
    blocked.add(key(body[i].x, body[i].y));
  }
  for (const p of poisons) blocked.add(key(p.x, p.y));
  return blocked;
}

function bfsPathAvoid(startX, startY, goalX, goalY, blocked) {
  const queue = [[startX, startY, []]];
  const visited = new Set([key(startX, startY)]);
  const dirs = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ];

  while (queue.length > 0) {
    const [cx, cy, path] = queue.shift();
    for (const [dx, dy] of dirs) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;

      const k = key(nx, ny);
      if (visited.has(k)) continue;
      if (blocked.has(k)) continue;

      const newPath = [...path, [nx, ny]];
      if (nx === goalX && ny === goalY) return newPath;
      visited.add(k);
      queue.push([nx, ny, newPath]);
    }
  }
  return null;
}

function reachableAreaSize(startX, startY, blocked, limit = 220) {
  const start = key(startX, startY);
  if (blocked.has(start)) return 0;

  const queue = [[startX, startY]];
  const seen = new Set([start]);
  const dirs = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ];

  while (queue.length > 0 && seen.size < limit) {
    const [cx, cy] = queue.shift();
    for (const [dx, dy] of dirs) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
      const k = key(nx, ny);
      if (seen.has(k) || blocked.has(k)) continue;
      seen.add(k);
      queue.push([nx, ny]);
    }
  }

  return seen.size;
}

function nearestDistance(x, y, items) {
  if (!items || items.length === 0) return COLS + ROWS;
  let best = Infinity;
  for (const it of items) {
    const d = Math.abs(x - it.x) + Math.abs(y - it.y);
    if (d < best) best = d;
  }
  return best;
}

function chooseAutoDirection() {
  const head = snake.front();
  const dirs = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ];
  const blocked = buildBlockedSet(true);

  const safeMoves = dirs.filter(([dx, dy]) => {
    if (snake.size > 1 && isReverseDirection([dx, dy], dir)) return false;
    const nx = head.x + dx;
    const ny = head.y + dy;
    if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) return false;
    if (blocked.has(key(nx, ny))) return false;
    return true;
  });

  if (safeMoves.length === 0) return dir;

  const sortedRewards = rewards
    .slice()
    .sort(
      (a, b) =>
        Math.abs(head.x - a.x) + Math.abs(head.y - a.y) -
        (Math.abs(head.x - b.x) + Math.abs(head.y - b.y)),
    );

  for (const r of sortedRewards) {
    const path = bfsPathAvoid(head.x, head.y, r.x, r.y, blocked);
    if (!path || path.length === 0) continue;
    const first = path[0];
    const bestDir = [first[0] - head.x, first[1] - head.y];
    if (safeMoves.some((m) => m[0] === bestDir[0] && m[1] === bestDir[1])) {
      if (tickCount % 12 === 0) {
        daaLog("AI", `Autoplay path: ${path.length} steps to reward`, "BFS");
      }
      return bestDir;
    }
  }

  let bestMove = safeMoves[0];
  let bestScore = -Infinity;
  for (const [dx, dy] of safeMoves) {
    const nx = head.x + dx;
    const ny = head.y + dy;
    const space = reachableAreaSize(nx, ny, blocked);
    const rewardDist = nearestDistance(nx, ny, rewards);
    const poisonDist = nearestDistance(nx, ny, poisons);
    const scoreValue = space * 2.5 - rewardDist + poisonDist * 0.8;
    if (scoreValue > bestScore) {
      bestScore = scoreValue;
      bestMove = [dx, dy];
    }
  }

  if (tickCount % 12 === 0) {
    daaLog("AI", "Autoplay fallback: safest move selected", "Greedy");
  }
  return bestMove;
}

function updateAutoUI() {
  const el = document.getElementById("autoState");
  if (!el) return;
  el.textContent = autoPlay ? "AUTO: ON" : "AUTO: OFF";
  el.style.color = autoPlay ? "var(--green)" : "#cdb9a4";
}

function toggleAutoPlay() {
  autoPlay = !autoPlay;
  updateAutoUI();
  daaLog("AI", autoPlay ? "Autoplay enabled" : "Autoplay disabled", "Greedy");
}

function initGame() {
  ensureSnakePreset();

  snake = new Deque();
  bodySet = new HashSet();
  rewards = [];
  poisons = [];
  herbs = [];
  particles = [];
  hintPath = null;

  itemHeap = new MinHeap((a, b) => a.spawnTick - b.spawnTick);

  for (let i = 4; i >= 2; i--) {
    snake.pushBack({ x: i, y: Math.floor(ROWS / 2) });
    bodySet.add(i, Math.floor(ROWS / 2));
  }

  dir = [1, 0];
  nextDir = [1, 0];
  score = 0;
  level = 1;
  prevLevel = 1;
  gameOver = false;
  paused = false;
  tickCount = 0;
  nextHerbSpawnTick = 200;
  logEntries = [];

  updateUI();
  updateAutoUI();
  spawnItems();
  daaLog("INIT", "Deque initialized O(1)", "Deque");
  daaLog("INIT", "HashSet built O(n)", "HashSet");
}

function freeCells() {
  const free = [];
  for (let x = 1; x < COLS - 1; x++) {
    for (let y = 1; y < ROWS - 1; y++) {
      if (bodySet.has(x, y)) continue;
      if (rewards.some((r) => r.x === x && r.y === y)) continue;
      if (poisons.some((p) => p.x === x && p.y === y)) continue;
      if (herbs.some((h) => h.x === x && h.y === y)) continue;
      free.push({ x, y });
    }
  }
  return free;
}

function spawnItems() {
  while (itemHeap.size > 0 && itemHeap.peek().spawnTick < tickCount - 200) {
    const expired = itemHeap.pop();
    rewards = rewards.filter((r) => !(r.x === expired.x && r.y === expired.y));
    poisons = poisons.filter((p) => !(p.x === expired.x && p.y === expired.y));
    herbs = herbs.filter((h) => !(h.x === expired.x && h.y === expired.y));
    daaLog("PQ", "Expired item removed O(log n)", "PQ");
  }

  const maxRewards = 2 + Math.floor(level / 2);
  const maxPoisons = 1 + level;
  const free = freeCells();
  if (free.length < 5) return;

  const needed =
    Math.max(0, maxRewards - rewards.length) +
    Math.max(0, maxPoisons - poisons.length);
  if (needed <= 0) return;

  const spots = fisherYatesSample(free, needed);
  let si = 0;

  while (rewards.length < maxRewards && si < spots.length) {
    const s = spots[si++];
    const item = { x: s.x, y: s.y, spawnTick: tickCount };
    rewards.push(item);
    itemHeap.push(item);
    daaLog("SPAWN", `Reward at (${s.x},${s.y}) Fisher-Yates`, "Fisher");
  }
  while (poisons.length < maxPoisons && si < spots.length) {
    const s = spots[si++];
    const item = { x: s.x, y: s.y, spawnTick: tickCount, isPoison: true };
    poisons.push(item);
    itemHeap.push(item);
    daaLog("SPAWN", `Poison at (${s.x},${s.y}) Fisher-Yates`, "Fisher");
  }

  if (herbs.length === 0 && tickCount >= nextHerbSpawnTick) {
    const freeAfterMain = freeCells();
    if (freeAfterMain.length > 0 && Math.random() < 0.03) {
      const herbSpot = fisherYatesSample(freeAfterMain, 1)[0];
      if (herbSpot) {
        const herb = { x: herbSpot.x, y: herbSpot.y, spawnTick: tickCount, isHerb: true };
        herbs.push(herb);
        itemHeap.push(herb);
        nextHerbSpawnTick = tickCount + 220;
        daaLog("SPAWN", `Yellow herb at (${herb.x},${herb.y})`, "Fisher");
      }
    }
  }
}

function tick() {
  if (paused || gameOver) return;
  tickCount++;

  if (autoPlay) {
    nextDir = chooseAutoDirection();
  }

  dir = nextDir;
  const head = snake.front();
  const nx = head.x + dir[0];
  const ny = head.y + dir[1];

  if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) {
    soundWallDeath();
    endGame("Wall collision");
    return;
  }

  if (bodySet.has(nx, ny)) {
    daaLog("HASH", `Collision @ (${nx},${ny}) O(1)`, "HashSet");
    soundWallDeath();
    endGame("Self collision");
    return;
  }

  const poisonIdx = poisons.findIndex((p) => p.x === nx && p.y === ny);
  if (poisonIdx !== -1) {
    spawnParticles(nx, ny, "#34d5ff");
    daaLog("EVENT", "Poison eaten! Game over.", "HashSet");
    soundDeath();
    endGame("Poison consumed ☠");
    return;
  }

  const newHead = { x: nx, y: ny };
  snake.pushFront(newHead);
  bodySet.add(nx, ny);
  daaLog("DEQUE", `pushFront(${nx},${ny}) O(1)`, "Deque");

  const rewardIdx = rewards.findIndex((r) => r.x === nx && r.y === ny);
  const herbIdx = herbs.findIndex((h) => h.x === nx && h.y === ny);
  if (rewardIdx !== -1) {
    score += 10 * level;
    rewards.splice(rewardIdx, 1);
    spawnParticles(nx, ny, "#ff4d39");
    daaLog("EVENT", `Reward +${10 * level}pts Score:${score}`, "PQ");
    soundEatReward();

    if (score >= prevLevel * 50) {
      level++;
      prevLevel = level;
      soundLevelUp();
    }
    hintPath = null;
  } else if (herbIdx !== -1) {
    herbs.splice(herbIdx, 1);
    const cleared = poisons.length;
    poisons = [];
    nextHerbSpawnTick = tickCount + 260;
    spawnParticles(nx, ny, "#ffd93b");
    soundHerbClear();
    daaLog("EVENT", `Yellow herb used: cleared ${cleared} poison(s)`, "PQ");
  } else {
    const tail = snake.popBack();
    bodySet.delete(tail.x, tail.y);
    daaLog("DEQUE", `popBack(${tail.x},${tail.y}) O(1)`, "Deque");
  }

  spawnItems();
  updateUI();
  render();
}

function endGame(reason) {
  gameOver = true;
  clearInterval(tickInterval);
  stopGameTrack();
  startTitleTrack();
  document.getElementById("overlayTitle").textContent = "RUN TERMINATED";
  document.getElementById("overlayScore").textContent = `${playerName} scored ${score}  |  ${reason}`;
  document.getElementById("overlay").style.display = "flex";
  daaLog("END", `Game over: ${reason}`, "System");
  render();
}

function startGame() {
  document.getElementById("overlay").style.display = "none";
  initGame();
  clearInterval(tickInterval);
  running = true;
  getAudioCtx();
  stopTitleTrack();
  soundStart();
  startGameTrack();
  tickInterval = setInterval(tick, SPEEDS[speedIdx]);
  requestAnimationFrame(renderLoop);
}

function setSpeed(idx, btn) {
  speedIdx = idx;
  document.querySelectorAll(".speed-btn").forEach((b) => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  if (running && !gameOver) {
    clearInterval(tickInterval);
    tickInterval = setInterval(tick, SPEEDS[speedIdx]);
  }
}

function spawnParticles(x, y, color) {
  const cx = x * CELL + CELL / 2;
  const cy = y * CELL + CELL / 2;
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * (1.5 + Math.random() * 2),
      vy: Math.sin(angle) * (1.5 + Math.random() * 2),
      life: 1.0,
      color,
    });
  }
}

function renderLoop() {
  if (running) {
    render();
    requestAnimationFrame(renderLoop);
  }
}

function render() {
  ctx.fillStyle = "#dff4ff";
  ctx.fillRect(0, 0, W, H);

  const sweep = ctx.createRadialGradient(W * 0.72, H * 0.25, 20, W * 0.72, H * 0.25, W * 0.9);
  sweep.addColorStop(0, "rgba(101, 190, 226, 0.18)");
  sweep.addColorStop(1, "rgba(223, 244, 255, 0)");
  ctx.fillStyle = sweep;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(79, 174, 214, 0.22)";
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * CELL, 0);
    ctx.lineTo(x * CELL, H);
    ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * CELL);
    ctx.lineTo(W, y * CELL);
    ctx.stroke();
  }

  if (hintPath) {
    ctx.fillStyle = "rgba(62, 181, 225, 0.2)";
    for (const [px, py] of hintPath) {
      ctx.fillRect(px * CELL + 2, py * CELL + 2, CELL - 4, CELL - 4);
    }
  }

  for (const r of rewards) {
    const cx = r.x * CELL + CELL / 2;
    const cy = r.y * CELL + CELL / 2;
    const pulse = 0.75 + 0.25 * Math.sin(Date.now() * 0.009 + r.x);
    ctx.shadowBlur = 16 * pulse;
    ctx.shadowColor = "#ff69c8";
    ctx.fillStyle = "#ff69c8";
    ctx.beginPath();
    ctx.arc(cx, cy, (CELL / 2 - 2) * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 233, 247, 0.9)";
    ctx.beginPath();
    ctx.arc(cx - 2, cy - 2, Math.max(1.5, CELL * 0.12), 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255, 156, 217, 0.88)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, CELL / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#ffe9f7";
    ctx.font = `${CELL - 4}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("◆", cx, cy + 0.5);
  }

  for (const p of poisons) {
    const cx = p.x * CELL + CELL / 2;
    const cy = p.y * CELL + CELL / 2;
    const radius = CELL / 2 - 3;
    const spin = Date.now() * 0.006;
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#486b9a";
    ctx.fillStyle = "#5b82b3";
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(spin) * radius, cy + Math.sin(spin) * radius);
    for (let i = 1; i <= 6; i++) {
      const a = spin + (Math.PI * 2 * i) / 6;
      const rr = i % 2 === 0 ? radius * 0.45 : radius;
      ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#e5f6ff";
    ctx.font = `${CELL - 6}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("X", cx, cy + 0.5);
  }

  for (const h of herbs) {
    const cx = h.x * CELL + CELL / 2;
    const cy = h.y * CELL + CELL / 2;
    const pulse = 0.78 + 0.22 * Math.sin(Date.now() * 0.01 + h.x * 2);
    const radius = (CELL / 2 - 3) * pulse;
    ctx.shadowBlur = 14;
    ctx.shadowColor = "#ffd93b";
    ctx.fillStyle = "#ffd93b";
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255, 243, 177, 0.8)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#8b6c00";
    ctx.font = `${CELL - 7}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✚", cx, cy + 0.5);
  }

  const body = snake.toArray();
  for (let i = 0; i < body.length; i++) {
    const seg = body[i];
    const t = body.length <= 1 ? 0 : i / (body.length - 1);
    if (i === 0) {
      ctx.shadowBlur = 16;
      ctx.shadowColor = currentSnakePreset.glow;
      ctx.fillStyle = currentSnakePreset.head;
    } else {
      ctx.shadowBlur = 4;
      ctx.shadowColor = currentSnakePreset.bodyStart;
      ctx.fillStyle = lerpColorHex(currentSnakePreset.bodyStart, currentSnakePreset.bodyEnd, t);
    }
    const pad = i === 0 ? 1 : 2;
    ctx.fillRect(seg.x * CELL + pad, seg.y * CELL + pad, CELL - pad * 2, CELL - pad * 2);
    ctx.shadowBlur = 0;

    if (i === 0) {
      ctx.fillStyle = currentSnakePreset.eye;
      const [dx, dy] = dir;
      const ex1 = seg.x * CELL + CELL / 2 + dy * 4 - dx * 2;
      const ey1 = seg.y * CELL + CELL / 2 - dx * 4 - dy * 2;
      const ex2 = seg.x * CELL + CELL / 2 - dy * 4 - dx * 2;
      const ey2 = seg.y * CELL + CELL / 2 + dx * 4 - dy * 2;
      ctx.beginPath();
      ctx.arc(ex1, ey1, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ex2, ey2, 2, 0, Math.PI * 2);
      ctx.fill();

      // Only one preset gets the smiley expression.
      if (currentSnakePreset.smiley) {
        const mx = seg.x * CELL + CELL / 2 + dx * 3;
        const my = seg.y * CELL + CELL / 2 + dy * 3;
        ctx.strokeStyle = currentSnakePreset.eye;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (dx === 1) ctx.arc(mx, my, 3.2, Math.PI * 0.2, Math.PI * 0.8);
        else if (dx === -1) ctx.arc(mx, my, 3.2, Math.PI * 1.2, Math.PI * 1.8);
        else if (dy === 1) ctx.arc(mx, my, 3.2, Math.PI * 0.7, Math.PI * 1.3);
        else ctx.arc(mx, my, 3.2, Math.PI * 1.7, Math.PI * 0.3);
        ctx.stroke();
      }
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.06;
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3 * p.life, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function updateUI() {
  document.getElementById("scoreVal").textContent = score;
  document.getElementById("lengthVal").textContent = snake ? snake.size : 3;
  document.getElementById("levelVal").textContent = level;
}

function daaLog(type, msg, algo) {
  logEntries.unshift({ type, msg, algo, t: tickCount });
  if (logEntries.length > 30) logEntries.pop();
  const el = document.getElementById("daaLog");
  el.innerHTML = logEntries
    .slice(0, 20)
    .map(
      (e) =>
        `<div class="log-entry"><span class="log-algo">[${e.algo}]</span> <span class="log-time">t=${e.t}</span> ${e.msg}</div>`,
    )
    .join("");

  const algoMap = {
    Deque: "a-deque",
    HashSet: "a-hash",
    Fisher: "a-fisher",
    BFS: "a-bfs",
    Greedy: "a-greedy",
    PQ: "a-pq",
  };
  document.querySelectorAll(".algo-list li").forEach((li) => li.classList.remove("active"));
  if (algoMap[algo]) {
    const el2 = document.getElementById(algoMap[algo]);
    if (el2) el2.classList.add("active");
  }
}

applyMenuSettings();
updateAutoUI();
startGame();

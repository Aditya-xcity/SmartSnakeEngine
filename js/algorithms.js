class Deque {
  constructor() {
    this.data = [];
  }
  pushFront(v) {
    this.data.unshift(v);
  }
  pushBack(v) {
    this.data.push(v);
  }
  popBack() {
    return this.data.pop();
  }
  popFront() {
    return this.data.shift();
  }
  front() {
    return this.data[0];
  }
  back() {
    return this.data[this.data.length - 1];
  }
  get size() {
    return this.data.length;
  }
  toArray() {
    return this.data;
  }
}

class HashSet {
  constructor() {
    this.set = new Set();
  }
  key(x, y) {
    return `${x},${y}`;
  }
  add(x, y) {
    this.set.add(this.key(x, y));
  }
  has(x, y) {
    return this.set.has(this.key(x, y));
  }
  delete(x, y) {
    this.set.delete(this.key(x, y));
  }
  clear() {
    this.set.clear();
  }
  get size() {
    return this.set.size;
  }
}

class MinHeap {
  constructor(cmp) {
    this.heap = [];
    this.cmp = cmp;
  }
  push(v) {
    this.heap.push(v);
    this._bubbleUp(this.heap.length - 1);
  }
  pop() {
    const top = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._sinkDown(0);
    }
    return top;
  }
  peek() {
    return this.heap[0];
  }
  get size() {
    return this.heap.length;
  }
  _bubbleUp(i) {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.cmp(this.heap[i], this.heap[p]) < 0) {
        [this.heap[i], this.heap[p]] = [this.heap[p], this.heap[i]];
        i = p;
      } else break;
    }
  }
  _sinkDown(i) {
    const n = this.heap.length;
    while (true) {
      let m = i;
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      if (l < n && this.cmp(this.heap[l], this.heap[m]) < 0) m = l;
      if (r < n && this.cmp(this.heap[r], this.heap[m]) < 0) m = r;
      if (m !== i) {
        [this.heap[i], this.heap[m]] = [this.heap[m], this.heap[i]];
        i = m;
      } else break;
    }
  }
}

function fisherYatesSample(arr, k) {
  const copy = arr.slice();
  const result = [];
  for (let i = 0; i < k && i < copy.length; i++) {
    const j = i + Math.floor(Math.random() * (copy.length - i));
    [copy[i], copy[j]] = [copy[j], copy[i]];
    result.push(copy[i]);
  }
  return result;
}

function bfsPath(startX, startY, goalX, goalY, bodySet) {
  const queue = [[startX, startY, []]];
  const visited = new Set();
  visited.add(`${startX},${startY}`);
  const dirs = [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ];
  while (queue.length > 0) {
    const [cx, cy, path] = queue.shift();
    for (const [dx, dy] of dirs) {
      const nx = cx + dx;
      const ny = cy + dy;
      const k = `${nx},${ny}`;
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
      if (visited.has(k)) continue;
      if (bodySet.has(nx, ny)) continue;
      const newPath = [...path, [nx, ny]];
      if (nx === goalX && ny === goalY) return newPath;
      visited.add(k);
      queue.push([nx, ny, newPath]);
    }
  }
  return null;
}

function greedyNextDir(head, dir, bodySet, rewards, poisons) {
  const dirs = [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ];
  let bestScore = -Infinity;
  let bestDir = dir;
  for (let i = 0; i < dirs.length; i++) {
    const [dx, dy] = dirs[i];
    const nx = head.x + dx;
    const ny = head.y + dy;
    if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
    if (bodySet.has(nx, ny)) continue;
    let score = 0;
    for (const r of rewards)
      score += 100 / (Math.abs(nx - r.x) + Math.abs(ny - r.y) + 1);
    for (const p of poisons)
      score -= 60 / (Math.abs(nx - p.x) + Math.abs(ny - p.y) + 1);
    score -= nx === 0 || nx === COLS - 1 || ny === 0 || ny === ROWS - 1 ? 10 : 0;
    if (score > bestScore) {
      bestScore = score;
      bestDir = dirs[i];
    }
  }
  return bestDir;
}

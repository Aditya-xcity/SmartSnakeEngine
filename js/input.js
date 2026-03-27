document.addEventListener("keydown", (e) => {
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();

  switch (e.key) {
    case "ArrowUp":
    case "w":
    case "W":
      if (!autoPlay && dir[1] !== 1) nextDir = [0, -1];
      break;
    case "ArrowDown":
    case "s":
    case "S":
      if (!autoPlay && dir[1] !== -1) nextDir = [0, 1];
      break;
    case "ArrowLeft":
    case "a":
    case "A":
      if (!autoPlay && dir[0] !== 1) nextDir = [-1, 0];
      break;
    case "ArrowRight":
    case "d":
    case "D":
      if (!autoPlay && dir[0] !== -1) nextDir = [1, 0];
      break;
    case "p":
    case "P":
      paused = !paused;
      daaLog("SYS", paused ? "Paused" : "Resumed", "System");
      break;
    case "h":
    case "H":
      if (!gameOver && snake && rewards.length > 0) {
        const head = snake.front();
        const target = rewards[0];
        hintPath = bfsPath(head.x, head.y, target.x, target.y, bodySet);
        daaLog(
          "BFS",
          `BFS hint ${hintPath ? hintPath.length + " steps" : "no path"} O(V+E)`,
          "BFS",
        );
        soundHint();
      }
      break;
    case "t":
    case "T":
      toggleAutoPlay();
      break;
    case "m":
    case "M":
      toggleSound();
      break;
  }
  e.preventDefault();
});

canvas.width = W;
canvas.height = H;
updateAutoUI();
ctx.fillStyle = "#020c08";
ctx.fillRect(0, 0, W, H);

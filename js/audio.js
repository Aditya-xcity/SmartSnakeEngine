let audioCtx = null;
let soundEnabled = true;
let titleTrackTimer = null;
let gameTrackTimer = null;
let backgroundTrack = null;

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function makeTone(freq, at, duration, type = "square", volume = 0.2, glideTo = null) {
  if (!soundEnabled) return;
  try {
    const ac = getAudioCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime + at);
    if (glideTo) {
      osc.frequency.linearRampToValueAtTime(glideTo, ac.currentTime + at + duration);
    }

    gain.gain.setValueAtTime(0.0001, ac.currentTime + at);
    gain.gain.linearRampToValueAtTime(volume, ac.currentTime + at + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + at + duration);

    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(ac.currentTime + at);
    osc.stop(ac.currentTime + at + duration + 0.02);
  } catch (e) {}
}

function makeNoise(at, duration = 0.08, volume = 0.12) {
  if (!soundEnabled) return;
  try {
    const ac = getAudioCtx();
    const bufferSize = ac.sampleRate * duration;
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = ac.createBufferSource();
    const filter = ac.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 700;

    const gain = ac.createGain();
    gain.gain.setValueAtTime(volume, ac.currentTime + at);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + at + duration);

    noise.buffer = buffer;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);

    noise.start(ac.currentTime + at);
    noise.stop(ac.currentTime + at + duration + 0.02);
  } catch (e) {}
}

function playPattern(notes, beatSec = 0.13, type = "square", volume = 0.13) {
  if (!soundEnabled) return;
  notes.forEach((n, idx) => {
    const t = idx * beatSec;
    if (!n || n <= 0) return;
    makeTone(n, t, beatSec * 0.9, type, volume);
  });
}

function ensureBackgroundTrack() {
  if (backgroundTrack) return backgroundTrack;
  backgroundTrack = new Audio("Sound_Effect/bAckground mUsic.mp3");
  backgroundTrack.loop = true;
  backgroundTrack.volume = 0.34;
  backgroundTrack.preload = "auto";
  return backgroundTrack;
}

function playBackgroundTrack() {
  if (!soundEnabled) return;
  const track = ensureBackgroundTrack();
  const playPromise = track.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => {});
  }
}

function pauseBackgroundTrack() {
  if (!backgroundTrack) return;
  backgroundTrack.pause();
}

function stopTitleTrack() {
  if (titleTrackTimer) {
    clearInterval(titleTrackTimer);
    titleTrackTimer = null;
  }
  pauseBackgroundTrack();
}

function stopGameTrack() {
  if (gameTrackTimer) {
    clearInterval(gameTrackTimer);
    gameTrackTimer = null;
  }
  pauseBackgroundTrack();
}

function startTitleTrack() {
  if (!soundEnabled) return;
  stopGameTrack();
  playBackgroundTrack();
}

function startGameTrack() {
  if (!soundEnabled) return;
  stopTitleTrack();
  playBackgroundTrack();
}

function soundEatReward() {
  if (!soundEnabled) return;
  makeTone(523.25, 0, 0.07, "square", 0.2);
  makeTone(659.25, 0.06, 0.07, "square", 0.2);
  makeTone(880, 0.12, 0.13, "square", 0.18);
  makeTone(1320, 0.2, 0.08, "triangle", 0.11);
}

function soundDeath() {
  if (!soundEnabled) return;
  makeTone(392, 0, 0.12, "sawtooth", 0.25, 196);
  makeTone(311.13, 0.12, 0.12, "sawtooth", 0.23, 155.56);
  makeTone(246.94, 0.24, 0.15, "sawtooth", 0.2, 123.47);
  makeNoise(0.1, 0.28, 0.12);
}

function soundWallDeath() {
  if (!soundEnabled) return;
  makeNoise(0, 0.1, 0.18);
  makeTone(180, 0, 0.08, "square", 0.21, 110);
  makeTone(98, 0.08, 0.12, "square", 0.2, 70);
}

function soundLevelUp() {
  if (!soundEnabled) return;
  makeTone(392, 0, 0.08, "triangle", 0.16);
  makeTone(523.25, 0.09, 0.08, "triangle", 0.16);
  makeTone(659.25, 0.18, 0.1, "square", 0.18);
  makeTone(783.99, 0.29, 0.18, "square", 0.2);
}

function soundStart() {
  if (!soundEnabled) return;
  makeTone(294, 0, 0.08, "square", 0.15);
  makeTone(349.23, 0.08, 0.08, "square", 0.15);
  makeTone(440, 0.16, 0.1, "square", 0.16);
  makeTone(587.33, 0.26, 0.16, "triangle", 0.14);
}

function soundHint() {
  if (!soundEnabled) return;
  makeTone(880, 0, 0.05, "triangle", 0.11);
  makeTone(1174.66, 0.06, 0.05, "triangle", 0.1);
  makeTone(880, 0.12, 0.08, "triangle", 0.11);
}

function soundHerbClear() {
  if (!soundEnabled) return;
  makeTone(659.25, 0, 0.06, "triangle", 0.14);
  makeTone(783.99, 0.05, 0.06, "triangle", 0.14);
  makeTone(987.77, 0.1, 0.08, "triangle", 0.14);
  makeNoise(0.14, 0.06, 0.06);
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  const btn = document.getElementById("soundToggle");

  if (soundEnabled) {
    btn.classList.remove("muted");
    btn.innerHTML = '<span id="soundIcon">🔊</span> SOUND ON';
    if (typeof running !== "undefined" && running && !gameOver) {
      startGameTrack();
    } else {
      startTitleTrack();
    }
  } else {
    stopTitleTrack();
    stopGameTrack();
    pauseBackgroundTrack();
    btn.classList.add("muted");
    btn.innerHTML = '<span id="soundIcon">🔇</span> SOUND OFF';
  }
}

let titleBooted = false;
function bootTitleIfIdle() {
  if (titleBooted) return;
  titleBooted = true;
  if (soundEnabled && (typeof running === "undefined" || !running || gameOver)) {
    startTitleTrack();
  }
}

window.addEventListener("pointerdown", bootTitleIfIdle, { once: true });
window.addEventListener("keydown", bootTitleIfIdle, { once: true });

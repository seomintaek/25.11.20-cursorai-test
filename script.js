const canvas = document.getElementById("court");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const timerEl = document.getElementById("timer");
const statusEl = document.getElementById("statusText");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");

const court = {
  width: canvas.width,
  height: canvas.height,
  floor: canvas.height - 50,
  gravity: 0.6,
  friction: 0.995,
  bounce: 0.72,
};

const BALL_HOME = { x: 180, y: court.floor - 20 };

const ball = {
  x: BALL_HOME.x,
  y: BALL_HOME.y,
  radius: 22,
  vx: 0,
  vy: 0,
  dragging: false,
  dragOrigin: { x: BALL_HOME.x, y: BALL_HOME.y },
  ready: true,
  scored: false,
};

const hoop = {
  rimX: canvas.width - 190,
  rimY: canvas.height / 3,
  rimRadius: 40,
  backboardX: canvas.width - 120,
};

let score = 0;
let timeLeft = 30;
let playing = false;
let timerInterval = null;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function resetBall() {
  ball.x = BALL_HOME.x;
  ball.y = BALL_HOME.y;
  ball.vx = 0;
  ball.vy = 0;
  ball.dragging = false;
  ball.ready = true;
  ball.scored = false;
}

function resetGameState(keepPlaying = false) {
  score = 0;
  timeLeft = 30;
  updateScore();
  updateTimer();
  resetBall();
  updateStatus("준비 완료! 공을 드래그해 슛을 준비하세요.");

  if (!keepPlaying) {
    playing = false;
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function startGame() {
  if (playing) return;
  resetGameState(true);
  playing = true;
  updateStatus("타이머 시작! 빠르게 슛을 던져 점수를 올려보세요.");

  timerInterval = setInterval(() => {
    timeLeft -= 1;
    updateTimer();
    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function endGame() {
  clearInterval(timerInterval);
  timerInterval = null;
  playing = false;
  updateStatus(`게임 종료! 최종 점수는 ${score}점입니다.`);
  setTimeout(() => {
    alert(`게임 종료! 최종 점수: ${score}점`);
  }, 50);
}

function updateScore() {
  scoreEl.textContent = score;
}

function updateTimer() {
  const safeTime = Math.max(timeLeft, 0);
  timerEl.textContent = `${safeTime}s`;
}

function updateStatus(message) {
  if (statusEl) {
    statusEl.textContent = message;
  }
}

function drawCourt() {
  ctx.clearRect(0, 0, court.width, court.height);

  // Court base
  ctx.fillStyle = "#1b722f";
  ctx.fillRect(0, court.height * 0.15, court.width, court.height * 0.7);

  // Key area
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 4;
  ctx.strokeRect(120, court.floor - 220, 200, 220);
  ctx.beginPath();
  ctx.arc(220, court.floor - 110, 60, Math.PI * 1.5, Math.PI * 0.5, true);
  ctx.stroke();

  // Rim
  ctx.strokeStyle = "#ff9b42";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(hoop.rimX, hoop.rimY, hoop.rimRadius, 0, Math.PI, true);
  ctx.stroke();

  // Net
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 2;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(hoop.rimX + i * 10, hoop.rimY);
    ctx.lineTo(hoop.rimX + i * 6, hoop.rimY + 35);
    ctx.stroke();
  }

  // Backboard
  ctx.fillStyle = "#f4f4f4";
  ctx.fillRect(hoop.backboardX, hoop.rimY - 60, 8, 140);

  // Floor
  ctx.fillStyle = "#0e1f33";
  ctx.fillRect(0, court.floor, court.width, court.height - court.floor);
}

function drawBall() {
  ctx.save();
  ctx.translate(ball.x, ball.y);

  const gradient = ctx.createRadialGradient(-6, -10, 4, 0, 0, ball.radius + 4);
  gradient.addColorStop(0, "#ffd166");
  gradient.addColorStop(0.7, "#ff8c42");
  gradient.addColorStop(1, "#d95d39");

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(0,0,0,0.2)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, ball.radius * 0.8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, ball.radius * 0.45, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();

  if (ball.dragging) {
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(ball.dragOrigin.x, ball.dragOrigin.y);
    ctx.lineTo(ball.x, ball.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function handlePhysics() {
  if (ball.dragging) return;

  ball.vy += court.gravity;
  ball.x += ball.vx;
  ball.y += ball.vy;
  ball.vx *= court.friction;

  // Floor collision
  if (ball.y + ball.radius > court.floor) {
    ball.y = court.floor - ball.radius;
    ball.vy *= -court.bounce;
    ball.vx *= 0.9;

    if (Math.abs(ball.vy) < 0.4) {
      ball.vy = 0;
    }
    if (Math.abs(ball.vx) < 0.2) {
      ball.vx = 0;
    }

    if (ball.vx === 0 && ball.vy === 0 && !ball.dragging) {
      ball.ready = true;
    }
  }

  // Walls
  if (ball.x - ball.radius < 40) {
    ball.x = 40 + ball.radius;
    ball.vx *= -0.7;
  }

  if (ball.x + ball.radius > court.width - 30) {
    ball.x = court.width - 30 - ball.radius;
    ball.vx *= -0.7;
  }

  // Backboard collision
  if (
    ball.x + ball.radius > hoop.backboardX &&
    ball.y > hoop.rimY - 70 &&
    ball.y < hoop.rimY + 70
  ) {
    ball.x = hoop.backboardX - ball.radius;
    ball.vx *= -0.8;
  }

  // Simple hoop scoring window
  const withinHoop =
    ball.x > hoop.rimX - hoop.rimRadius + 5 &&
    ball.x < hoop.rimX + hoop.rimRadius - 5 &&
    ball.y > hoop.rimY &&
    ball.y < hoop.rimY + 60;

  if (withinHoop && !ball.scored && ball.vy > 0) {
    score += 1;
    ball.scored = true;
    updateScore();
    updateStatus(`나이스 샷! 현재 점수 ${score}점`);
  }

  // Reset ball near starting point
  if (
    ball.y + ball.radius >= court.floor - 2 &&
    Math.abs(ball.vx) < 0.3 &&
    Math.abs(ball.vy) < 0.3
  ) {
    resetBall();
  }
}

function render() {
  drawCourt();
  drawBall();
}

function gameLoop() {
  handlePhysics();
  render();
  requestAnimationFrame(gameLoop);
}

function getCanvasPos(evt) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (evt.clientX - rect.left) * scaleX,
    y: (evt.clientY - rect.top) * scaleY,
  };
}

function pointerDown(evt) {
  if (!playing) return;

  const pos = getCanvasPos(evt);
  const dist = Math.hypot(pos.x - ball.x, pos.y - ball.y);
  if (dist <= ball.radius + 8 && ball.ready) {
    ball.dragging = true;
    ball.dragOrigin = { x: ball.x, y: ball.y };
    ball.x = pos.x;
    ball.y = pos.y;
    ball.scored = false;
    canvas.setPointerCapture(evt.pointerId);
  }
}

function pointerMove(evt) {
  if (!ball.dragging) return;
  const pos = getCanvasPos(evt);
  ball.x = clamp(pos.x, 60 + ball.radius, court.width - ball.radius - 60);
  ball.y = clamp(pos.y, court.height * 0.25, court.floor - 8);
}

function pointerUp(evt) {
  if (!ball.dragging) return;
  canvas.releasePointerCapture(evt.pointerId);
  const dx = ball.x - ball.dragOrigin.x;
  const dy = ball.y - ball.dragOrigin.y;
  const distance = Math.hypot(dx, dy);

  if (distance < 5) {
    resetBall();
  } else {
    const power = 0.22;
    ball.vx = clamp(-dx * power, -25, 25);
    ball.vy = clamp(-dy * power, -25, 25);
    ball.ready = false;
  }

  ball.dragging = false;
}

canvas.addEventListener("pointerdown", pointerDown);
canvas.addEventListener("pointermove", pointerMove);
canvas.addEventListener("pointerup", pointerUp);
canvas.addEventListener("pointerleave", pointerUp);

startBtn.addEventListener("click", startGame);
resetBtn.addEventListener("click", () => {
  resetGameState();
  updateTimer();
  updateScore();
});

updateScore();
updateTimer();
gameLoop();


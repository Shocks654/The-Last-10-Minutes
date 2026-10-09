// ============================================================================
// GAME.JS - Komplett Retro Űrhajós Játék
// ============================================================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const STATES = { MENU: 0, PLAYING: 1, PAUSED: 2, GAME_OVER: 3, VICTORY: 4 };
let currentState = STATES.MENU;
let score = 0;
let highScore = localStorage.getItem("highScore") || 0;
let currentLevel = 1;
let gameLoopId = null;

const CONFIG = { canvasWidth: 800, canvasHeight: 600, playerSpeed: 5, bulletSpeed: 7, enemySpeed: 1.5, maxLevels: 5 };
canvas.width = CONFIG.canvasWidth;
canvas.height = CONFIG.canvasHeight;

const keys = { ArrowLeft: false, ArrowRight: false, Space: false, Escape: false };

class Player {
    constructor() {
        this.width = 50; this.height = 40;
        this.x = CONFIG.canvasWidth / 2 - this.width / 2;
        this.y = CONFIG.canvasHeight - 60;
        this.cooldown = 0; this.maxCooldown = 15; this.lives = 3;
    }
    draw() {
        ctx.fillStyle = "#00FF00";
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#FF0000";
        for (let i = 0; i < this.lives; i++) {
            ctx.fillRect(this.x + (i * 15), this.y + this.height + 5, 10, 5);
        }
    }
    update() {
        if (keys.ArrowLeft && this.x > 0) this.x -= CONFIG.playerSpeed;
        if (keys.ArrowRight && this.x < CONFIG.canvasWidth - this.width) this.x += CONFIG.playerSpeed;
        if (this.cooldown > 0) this.cooldown--;
        if (keys.Space && this.cooldown === 0) this.shoot();
    }
    shoot() {
        bullets.push(new Bullet(this.x + this.width / 2 - 2, this.y, -CONFIG.bulletSpeed, true));
        this.cooldown = this.maxCooldown;
    }
}

class Bullet {
    constructor(x, y, speed, isPlayer) {
        this.x = x; this.y = y; this.width = 4; this.height = 15;
        this.speed = speed; this.isPlayer = isPlayer; this.active = true;
    }
    draw() {
        ctx.fillStyle = this.isPlayer ? "#00FFFF" : "#FF00FF";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    update() {
        this.y += this.speed;
        if (this.y < 0 || this.y > CONFIG.canvasHeight) this.active = false;
    }
}

class Enemy {
    constructor(x, y, type) {
        this.x = x; this.y = y; this.width = 40; this.height = 30;
        this.type = type; this.points = type * 10; this.direction = 1; this.active = true;
    }
    draw() {
        if (this.type === 1) ctx.fillStyle = "#FF3333";
        else if (this.type === 2) ctx.fillStyle = "#FF9933";
        else ctx.fillStyle = "#FFFF33";
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = "#000000";
        ctx.fillRect(this.x + 8, this.y + 8, 6, 6);
        ctx.fillRect(this.x + this.width - 14, this.y + 8, 6, 6);
    }
    update(globalMoveDown) {
        this.x += CONFIG.enemySpeed * this.direction * (1 + currentLevel * 0.2);
        if (globalMoveDown) { this.y += 20; this.direction *= -1; }
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y; this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 4 - 2; this.speedY = Math.random() * 4 - 2;
        this.life = 30; this.maxLife = 30; this.color = color;
    }
    draw() {
        ctx.fillStyle = this.color; ctx.globalAlpha = this.life / this.maxLife;
        ctx.fillRect(this.x, this.y, this.size, this.size); ctx.globalAlpha = 1.0;
    }
    update() { this.x += this.speedX; this.y += this.speedY; this.life--; }
}

class Star {
    constructor() {
        this.x = Math.random() * CONFIG.canvasWidth; this.y = Math.random() * CONFIG.canvasHeight;
        this.size = Math.random() * 2; this.speed = Math.random() * 2 + 0.5;
    }
    draw() { ctx.fillStyle = "#FFFFFF"; ctx.fillRect(this.x, this.y, this.size, this.size); }
    update() { this.y += this.speed; if (this.y > CONFIG.canvasHeight) { this.y = 0; this.x = Math.random() * CONFIG.canvasWidth; } }
}

let player = new Player(); let bullets = []; let enemies = []; let particles = []; let stars = [];
for (let i = 0; i < 100; i++) stars.push(new Star());

function initEnemies() {
    enemies = []; bullets = [];
    const rows = 4; const cols = 8; const padding = 20;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            enemies.push(new Enemy(c * (40 + padding) + 100, r * (30 + padding) + 80, Math.min(3, rows - r)));
        }
    }
}

function checkCollisions() {
    for (let b = bullets.length - 1; b >= 0; b--) {
        const bullet = bullets[b]; if (!bullet.isPlayer) continue;
        for (let e = enemies.length - 1; e >= 0; e--) {
            const enemy = enemies[e];
            if (bullet.x < enemy.x + enemy.width && bullet.x + bullet.width > enemy.x && bullet.y < enemy.y + enemy.height && bullet.y + bullet.height > enemy.y) {
                createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, "#FF5555");
                score += enemy.points; enemies.splice(e, 1); bullets.splice(b, 1); break;
            }
        }
    }
    for (let b = bullets.length - 1; b >= 0; b--) {
        const bullet = bullets[b];
        if (!bullet.isPlayer && bullet.x < player.x + player.width && bullet.x + bullet.width > player.x && bullet.y < player.y + player.height && bullet.y + bullet.height > player.y) {
            createExplosion(player.x + player.width / 2, player.y + player.height / 2, "#00FF00");
            player.lives--; bullets.splice(b, 1);
            if (player.lives <= 0) gameOver(); break;
        }
    }
}

function createExplosion(x, y, color) { for (let i = 0; i < 15; i++) particles.push(new Particle(x, y, color)); }

function enemyShootLogic() {
    if (enemies.length === 0) return;
    if (Math.random() < 0.01 * currentLevel) {
        const rEnemy = enemies[Math.floor(Math.random() * enemies.length)];
        bullets.push(new Bullet(rEnemy.x + rEnemy.width / 2, rEnemy.y + rEnemy.height, CONFIG.bulletSpeed - 3, false));
    }
}

function updateGame() {
    if (currentState !== STATES.PLAYING) return;
    player.update(); stars.forEach(s => s.update());
    let changeDir = false;
    enemies.forEach(e => { if ((e.x <= 10 && e.direction === -1) || (e.x >= CONFIG.canvasWidth - e.width - 10 && e.direction === 1)) changeDir = true; });
    enemies.forEach(e => e.update(changeDir)); enemyShootLogic();
    for (let i = bullets.length - 1; i >= 0; i--) { bullets[i].update(); if (!bullets[i].active) bullets.splice(i, 1); }
    for (let i = particles.length - 1; i >= 0; i--) { particles[i].update(); if (particles[i].life <= 0) particles.splice(i, 1); }
    checkCollisions();
    if (enemies.length === 0) { if (currentLevel < CONFIG.maxLevels) { currentLevel++; initEnemies(); } else { currentState = STATES.VICTORY; saveHighScore(); } }
}

function drawUI() {
    ctx.fillStyle = "#FFFFFF"; ctx.font = "18px Courier New";
    ctx.fillText(`PONTOK: ${score}`, 20, 30);
    ctx.fillText(`SZINT: ${currentLevel}`, CONFIG.canvasWidth / 2 - 40, 30);
    ctx.fillText(`REKORD: ${highScore}`, CONFIG.canvasWidth - 160, 30);
}

function drawMenu() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)"; ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);
    ctx.fillStyle = "#00FF00"; ctx.font = "40px Courier New"; ctx.textAlign = "center";
    ctx.fillText("SPACE ATTACKER", CONFIG.canvasWidth / 2, CONFIG.canvasHeight / 2 - 50);
    ctx.fillStyle = "#FFFFFF"; ctx.font = "20px Courier New";
    ctx.fillText("NYOMD MEG AZ ENTER-T A JÁTÉKHOZ", CONFIG.canvasWidth / 2, CONFIG.canvasHeight / 2 + 20);
    ctx.textAlign = "left";
}

function renderGame() {
    ctx.fillStyle = "#050510"; ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);
    stars.forEach(s => s.draw());
    if (currentState === STATES.PLAYING || currentState === STATES.PAUSED) {
        player.draw(); enemies.forEach(e => e.draw()); bullets.forEach(b => b.draw()); particles.forEach(p => p.draw()); drawUI();
    }
    if (currentState === STATES.MENU) drawMenu();
    if (currentState === STATES.GAME_OVER) { ctx.fillStyle = "#FF0000"; ctx.font = "40px Courier New"; ctx.textAlign = "center"; ctx.fillText("VÉGE A JÁTÉKNAK", CONFIG.canvasWidth / 2, CONFIG.canvasHeight / 2); ctx.textAlign = "left"; }
    if (currentState === STATES.VICTORY) { ctx.fillStyle = "#00FFFF"; ctx.font = "40px Courier New"; ctx.textAlign = "center"; ctx.fillText("GYŐZELEM!", CONFIG.canvasWidth / 2, CONFIG.canvasHeight / 2); ctx.textAlign = "left"; }
}

function gameOver() { currentState = STATES.GAME_OVER; saveHighScore(); }
function saveHighScore() { if (score > highScore) { highScore = score; localStorage.setItem("highScore", highScore); } }
function resetGame() { score = 0; currentLevel = 1; player = new Player(); bullets = []; particles = []; initEnemies(); currentState = STATES.PLAYING; }

window.addEventListener("keydown", (e) => {
    if (e.code === "ArrowLeft") keys.ArrowLeft = true; if (e.code === "ArrowRight") keys.ArrowRight = true; if (e.code === "Space") keys.Space = true;
    if (e.code === "Enter") { if (currentState === STATES.MENU) resetGame(); else if (currentState === STATES.GAME_OVER || currentState === STATES.VICTORY) currentState = STATES.MENU; }
});
window.addEventListener("keyup", (e) => {
    if (e.code === "ArrowLeft") keys.ArrowLeft = false; if (e.code === "ArrowRight") keys.ArrowRight = false; if (e.code === "Space") keys.Space = false;
});

function loop() { updateGame(); renderGame(); gameLoopId = requestAnimationFrame(loop); }
initEnemies(); loop();

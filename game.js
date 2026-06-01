// ═══════════════════════════════════════════════════════

// TOWER DEFENSE — game.js v3.2
// ═══════════════════════════════════════════════════════

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameOverlay = document.getElementById('gameOverlay');
const goldDisplay = document.getElementById('goldDisplay');
const livesDisplay = document.getElementById('livesDisplay');
const waveDisplay = document.getElementById('waveDisplay');
const scoreDisplay = document.getElementById('scoreDisplay');
const killsDisplay = document.getElementById('killsDisplay');
const waveProgressFill = document.getElementById('waveProgressFill');
const startWaveBtn = document.getElementById('startWaveBtn');
const restartBtn = document.getElementById('restartBtn');
const lobbyBtn = document.getElementById('lobbyBtn');
const towerBtns = document.querySelectorAll('.tower-btn');
const towerInfoPanel = document.getElementById('towerInfo');
const upgradeBtn = document.getElementById('upgradeBtn');
const sellBtn = document.getElementById('sellBtn');
const speedBtns = document.querySelectorAll('.speed-btn');
const puIndicator = document.getElementById('puIndicator');
const puTimerFill = document.getElementById('puTimerFill');
const comboDisplayEl = document.getElementById('comboDisplay');
const comboCountEl = document.getElementById('comboCount');
const comboMultEl = document.getElementById('comboMult');

// ── Game State ──
let gameRunning = false;
let gold = 100;
let lives = 20;
let score = 0;
let killCount = 0;
let currentWave = 0;
let maxWaves = 15;
let waveInProgress = false;
  let isNight = false;
   let nightTransition = 0;
   let endlessMode = false;
   let laserBeams = [];
   let shopOpen = false;
   let selectedTowerType = null;
let selectedTower = null;
let towers = [];
let enemies = [];
let projectiles = [];
let particles = [];
let floatingTexts = [];
let animationId;
let gameSpeed = 1;
let mouseX = 0, mouseY = 0;
let enemiesSpawned = 0;
let totalWaveEnemies = 0;
let shopUpgrades = { dmgBonus: 0, fireRateBonus: 0, startGoldBonus: 0, extraLives: 0 };
const SHOP_ITEMS = [ { id: 'dmgBonus', key: 'dmgBonus', name: 'Damage Boost', desc: '+10% tower damage', baseCost: 50, costInc: 20, icon: '⚔️', maxLevel: 5 }, { id: 'fireRateBonus', key: 'fireRateBonus', name: 'Fire Rate Boost', desc: '+10% faster fire rate', baseCost: 60, costInc: 25, icon: '⚡', maxLevel: 5 }, { id: 'startGoldBonus', key: 'startGoldBonus', name: 'Starting Gold', desc: '+25 starting gold', baseCost: 40, costInc: 15, icon: '💰', maxLevel: 5 }, { id: 'extraLives', key: 'extraLives', name: 'Extra Lives', desc: '+2 extra lives', baseCost: 80, costInc: 30, icon: '❤️', maxLevel: 5 } ];

// ── Screen Shake ──
let shakeAmount = 0;
let shakeDuration = 0;

// ── Sound System (Web Audio API) ──
let audioCtx = null;
function initAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
  }
}
function playSound(freq, duration, type, vol) {
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(vol || 0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch(e) {}
}
function sfxShoot()    { playSound(800, 0.08, 'square', 0.06); }
function sfxCannon()   { playSound(150, 0.2, 'sawtooth', 0.08); }
function sfxIce()      { playSound(1200, 0.12, 'sine', 0.05); }
function sfxLightning(){ playSound(2000, 0.06, 'sawtooth', 0.07); }
function sfxSniper()   { playSound(400, 0.15, 'square', 0.07); }
function sfxPoison()   { playSound(300, 0.1, 'triangle', 0.05); }
function sfxKill()     { playSound(600, 0.1, 'square', 0.05); }
function sfxBossKill() { playSound(100, 0.4, 'sawtooth', 0.1); playSound(200, 0.3, 'square', 0.08); }
function sfxPowerUp()  { playSound(523, 0.1, 'sine', 0.08); setTimeout(()=>playSound(659, 0.1, 'sine', 0.08), 100); setTimeout(()=>playSound(784, 0.15, 'sine', 0.08), 200); }
function sfxCrit()     { playSound(1000, 0.06, 'square', 0.07); playSound(1500, 0.08, 'sawtooth', 0.06); }
function sfxWaveClear(){ playSound(523, 0.15, 'sine', 0.08); setTimeout(()=>playSound(659, 0.15, 'sine', 0.08), 150); setTimeout(()=>playSound(784, 0.2, 'sine', 0.1), 300); }
function sfxPlace()    { playSound(440, 0.08, 'triangle', 0.06); }
function sfxSell()     { playSound(330, 0.1, 'triangle', 0.06); }
function sfxGameOver() { playSound(200, 0.3, 'sawtooth', 0.1); setTimeout(()=>playSound(150, 0.4, 'sawtooth', 0.1), 300); }
function sfxVictory()  { [523,659,784,1047].forEach((f,i)=>setTimeout(()=>playSound(f,0.2,'sine',0.1),i*150)); }
function sfxLaser() { playSound(1800, 0.08, 'sawtooth', 0.06); }
function sfxBuff() { playSound(600, 0.1, 'sine', 0.06); setTimeout(()=>playSound(800, 0.1, 'sine', 0.06), 80); }

// ── Nature Background Data ──
let natureElements = [];
let ambientParticles = [];
let natureTime = 0;

// ── Lobby / Difficulty / Map ──
let difficulty = 'normal';
let currentMap = 'classic';
let autoWave = false;

// ── Power-ups ──
let activePowerUp = null;
let powerUpSpawnTimer = 0;
let powerUpOnMap = null;
const POWER_UP_TYPES = ['doubleGold', 'damageBoost', 'heal', 'freeze', 'tripleGold'];
const POWER_UP_ICONS = { doubleGold: '💰', damageBoost: '🔥', heal: '❤️', freeze: '🧊', tripleGold: '3️⃣' };
const POWER_UP_DURATION = 480;

// ── Combo System ──
let comboCount = 0;
let comboTimer = 0;
const COMBO_TIMEOUT = 120;

// ── Critical Hits ──
const CRIT_CHANCE = 0.12;
const CRIT_MULTIPLIER = 2.5;

// ── High Score ──
let highScore = parseInt(localStorage.getItem('tdHighScore') || '0');

// ── Map Paths ──
const MAP_PATHS = {
  classic: [
    { x: 0, y: 100 }, { x: 150, y: 100 }, { x: 150, y: 250 },
    { x: 400, y: 250 }, { x: 400, y: 400 }, { x: 200, y: 400 },
    { x: 200, y: 520 }, { x: 550, y: 520 }, { x: 550, y: 300 },
    { x: 700, y: 300 }
  ],
  zigzag: [
    { x: 0, y: 50 }, { x: 600, y: 50 }, { x: 600, y: 150 },
    { x: 100, y: 150 }, { x: 100, y: 250 }, { x: 600, y: 250 },
    { x: 600, y: 350 }, { x: 100, y: 350 }, { x: 100, y: 450 },
    { x: 600, y: 450 }, { x: 600, y: 550 }, { x: 700, y: 550 }
  ],
  spiral: [
    { x: 0, y: 300 }, { x: 100, y: 300 }, { x: 100, y: 100 },
    { x: 500, y: 100 }, { x: 500, y: 500 }, { x: 200, y: 500 },
    { x: 200, y: 200 }, { x: 400, y: 200 }, { x: 400, y: 400 },
    { x: 300, y: 400 }, { x: 300, y: 300 }, { x: 300, y: 50 },
    { x: 700, y: 50 }
  ],
  backrooms: [ { x: 0, y: 50 }, { x: 100, y: 50 }, { x: 100, y: 150 }, { x: 300, y: 150 }, { x: 300, y: 50 }, { x: 500, y: 50 }, { x: 500, y: 200 }, { x: 350, y: 200 }, { x: 350, y: 300 }, { x: 550, y: 300 }, { x: 550, y: 450 }, { x: 350, y: 450 }, { x: 350, y: 550 }, { x: 150, y: 550 }, { x: 150, y: 400 }, { x: 50, y: 400 }, { x: 50, y: 300 }, { x: 200, y: 300 }, { x: 200, y: 200 }, { x: 50, y: 200 }, { x: 50, y: 500 }, { x: 250, y: 500 }, { x: 250, y: 400 }, { x: 450, y: 400 }, { x: 450, y: 550 }, { x: 600, y: 550 }, { x: 600, y: 350 }, { x: 650, y: 350 }, { x: 650, y: 150 }, { x: 700, y: 150 } ] }; let PATH = MAP_PATHS.classic;

// Path rendering
const PATH_COLOR = '#ffcc00';
const PATH_WIDTH = 52;

// ── Difficulty Settings ──
const DIFFICULTY_SETTINGS = {
  easy:   { goldMult: 1.5, hpMult: 0.7, livesBonus: 10, scoreMult: 0.8 },
  normal: { goldMult: 1.0, hpMult: 1.0, livesBonus: 0,  scoreMult: 1.0 },
  hard:   { goldMult: 0.7, hpMult: 1.5, livesBonus: -5, scoreMult: 1.5 }
};

// ── Tower Definitions ──
const TOWER_TYPES = {
  arrow:     { cost: 50,  damage: 15, range: 120, fireRate: 20, color: '#8b4513', name: 'Arrow Tower',     projectileColor: '#ffd700', projectileSpeed: 8,  icon: '🏹', desc: 'Fast attack, low damage',           upgradeCost: 40,  upgradeDmg: 10, upgradeRange: 15, sfx: sfxShoot },
  cannon:    { cost: 100, damage: 50, range: 100, fireRate: 60, color: '#444',    name: 'Cannon Tower',    projectileColor: '#ff4500', projectileSpeed: 5,  splash: 40, icon: '💣', desc: 'Slow attack, high damage + splash', upgradeCost: 75,  upgradeDmg: 25, upgradeRange: 10, sfx: sfxCannon },
  ice:       { cost: 75,  damage: 20, range: 110, fireRate: 35, color: '#00bfff', name: 'Ice Tower',       projectileColor: '#00ffff', projectileSpeed: 6,  slow: 0.5, icon: '❄️', desc: 'Slows enemies, medium damage',      upgradeCost: 55,  upgradeDmg: 8,  upgradeRange: 12, sfx: sfxIce },
  lightning: { cost: 150, damage: 30, range: 150, fireRate: 50, color: '#9932cc', name: 'Lightning Tower', projectileColor: '#ffff00', projectileSpeed: 20, chain: 3,  icon: '⚡', desc: 'Chain lightning to 3 enemies',      upgradeCost: 100, upgradeDmg: 15, upgradeRange: 15, sfx: sfxLightning },
  sniper:    { cost: 125, damage: 80, range: 250, fireRate: 90, color: '#2e8b57', name: 'Sniper Tower',    projectileColor: '#ff00ff', projectileSpeed: 15, icon: '🎯', desc: 'Very long range, massive damage',   upgradeCost: 90,  upgradeDmg: 40, upgradeRange: 20, sfx: sfxSniper },
  poison:    { cost: 90,  damage: 8,  range: 100, fireRate: 25, color: '#32cd32', name: 'Poison Tower',    projectileColor: '#7cfc00', projectileSpeed: 7,  poison: 3, icon: '☠️', desc: 'Poisons enemies — damage over time', upgradeCost: 60, upgradeDmg: 4,  upgradeRange: 10, sfx: sfxPoison },
    laser: {
        cost: 200, damage: 2, range: 180, fireRate: 5, color: '#ff0000',
        name: 'Laser Tower', projectileColor: '#ff0000', projectileSpeed: 0,
        icon: '🔴', desc: 'Piercing beam, hits all in line',
        upgradeCost: 150, upgradeDmg: 1, upgradeRange: 15,
        isLaser: true, sfx: sfxLaser
    },
    buff: {
        cost: 120, damage: 0, range: 0, fireRate: 0, color: '#ffd700',
        name: 'Buff Tower', projectileColor: '#ffd700', projectileSpeed: 0,
        icon: '✨', desc: 'Boosts nearby towers damage and speed',
        upgradeCost: 80, upgradeDmg: 0, upgradeRange: 20,
        isBuff: true, buffRadius: 120, buffDmgMult: 1.25, buffFireRateMult: 1.2,
        sfx: sfxBuff
    }
};

// ── Enemy Types ──
const ENEMY_TYPES = {
  basic:  { hp: 80,  speed: 1.5, reward: 10,  color: '#ff6b6b', size: 15, name: 'Grunt' },
  fast:   { hp: 50,  speed: 3,   reward: 15,  color: '#ffff00', size: 12, name: 'Scout' },
  tank:   { hp: 300, speed: 0.8, reward: 30,  color: '#8b0000', size: 22, name: 'Brute' },
  healer: { hp: 120, speed: 1.2, reward: 25,  color: '#00ff88', size: 16, name: 'Medic' },
  boss:   { hp: 1000,speed: 0.5, reward: 100, color: '#4a0080', size: 30, name: 'Overlord' },
  flying: { hp: 60, speed: 2.5, reward: 20, color: '#ffa500', size: 14, name: 'Drone', flying: true },
  finalBoss: { hp: 10000, speed: 0.4, reward: 1000, color: '#ff0000', size: 50, name: 'Final Boss' }
};

// ═══════════════════════════════════════════════════════
// RESPONSIVE CANVAS
// ═══════════════════════════════════════════════════════
const BASE_W = 700, BASE_H = 600;

function resizeCanvas() {
  // Compute available width for the canvas: window width minus sidebar and gap
  const sidebarWidth = 240; // from CSS
  const gap = 20;
  const availableW = window.innerWidth - sidebarWidth - gap;
  const availableH = window.innerHeight * 0.65;
  // If availableW is not positive, ignore it (use height only)
  const scaleW = availableW > 0 ? availableW / BASE_W : Infinity;
  const scaleH = availableH / BASE_H;
  const scale = Math.min(scaleW, scaleH, 1);
  canvas.style.width = (BASE_W * scale) + 'px';
  canvas.style.height = (BASE_H * scale) + 'px';
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 200));

// ═══════════════════════════════════════════════════════
// NATURE BACKGROUND GENERATOR
// ═══════════════════════════════════════════════════════
function generateNature() {
  if (currentMap === 'backrooms') { generateBackroomsElements(); return; }
  if (currentMap === 'zigzag') { generateZigzagFloralElements(); return; }

  natureElements = [];
  ambientParticles = [];

  // Grass patches
  for (let i = 0; i < 120; i++) {
    natureElements.push({
      type: 'grass', x: Math.random() * BASE_W, y: Math.random() * BASE_H,
      h: 6 + Math.random() * 10, sway: Math.random() * Math.PI * 2
    });
  }
  // Flowers
  for (let i = 0; i < 30; i++) {
    const colors = ['#ff6b9d','#ffd700','#ff4500','#da70d6','#fff','#ff69b4','#87ceeb'];
    natureElements.push({
      type: 'flower', x: Math.random() * BASE_W, y: Math.random() * BASE_H,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 3 + Math.random() * 4, petals: 4 + Math.floor(Math.random() * 3)
    });
  }
  // Trees
  for (let i = 0; i < 12; i++) {
    natureElements.push({
      type: 'tree', x: Math.random() * BASE_W, y: Math.random() * BASE_H,
      size: 20 + Math.random() * 25, shade: Math.random() * 0.3
    });
  }
  // Water ponds
  for (let i = 0; i < 3; i++) {
    natureElements.push({
      type: 'water', x: 80 + Math.random() * (BASE_W - 160), y: 80 + Math.random() * (BASE_H - 160),
      w: 40 + Math.random() * 50, h: 25 + Math.random() * 30
    });
  }
  // Butterflies
  for (let i = 0; i < 5; i++) {
    const bColors = ['#ff69b4','#ffd700','#87ceeb','#da70d6','#ff6347'];
    natureElements.push({
      type: 'butterfly', x: Math.random() * BASE_W, y: Math.random() * BASE_H,
      color: bColors[Math.floor(Math.random() * bColors.length)],
      vx: (Math.random() - 0.5) * 1.2, vy: (Math.random() - 0.5) * 0.8,
      wingPhase: Math.random() * Math.PI * 2
    });
  }
  // Birds
  for (let i = 0; i < 3; i++) {
    natureElements.push({
      type: 'bird', x: Math.random() * BASE_W, y: 20 + Math.random() * 80,
      vx: 0.5 + Math.random() * 1, wingPhase: Math.random() * Math.PI * 2
    });
  }
  // Ambient particles (leaves, petals)
  for (let i = 0; i < 15; i++) {
    ambientParticles.push({
      x: Math.random() * BASE_W, y: Math.random() * BASE_H,
      vx: 0.2 + Math.random() * 0.5, vy: 0.1 + Math.random() * 0.3,
      size: 2 + Math.random() * 3, rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.05,
      color: Math.random() > 0.5 ? '#90ee90' : '#ffb6c1',
      alpha: 0.3 + Math.random() * 0.4
    });
  }
}

function generateBackroomsElements() {
  natureElements = [];
  ambientParticles = [];
  // Wall segments along the edges and interior
  const wallPositions = [
    // Top walls
    { x: 0, y: 0, w: 200, h: 20, shade: 0.9 },
    { x: 250, y: 0, w: 180, h: 20, shade: 0.85 },
    { x: 480, y: 0, w: 220, h: 20, shade: 0.92 },
    // Bottom walls
    { x: 0, y: 580, w: 160, h: 20, shade: 0.88 },
    { x: 220, y: 580, w: 200, h: 20, shade: 0.9 },
    { x: 470, y: 580, w: 230, h: 20, shade: 0.86 },
    // Left walls
    { x: 0, y: 0, w: 20, h: 180, shade: 0.87 },
    { x: 0, y: 230, w: 20, h: 160, shade: 0.91 },
    { x: 0, y: 430, w: 20, h: 170, shade: 0.85 },
    // Right walls
    { x: 680, y: 0, w: 20, h: 200, shade: 0.89 },
    { x: 680, y: 260, w: 20, h: 150, shade: 0.93 },
    { x: 680, y: 450, w: 20, h: 150, shade: 0.88 },
    // Interior wall segments
    { x: 150, y: 100, w: 20, h: 120, shade: 0.82 },
    { x: 350, y: 50, w: 20, h: 100, shade: 0.88 },
    { x: 500, y: 200, w: 120, h: 20, shade: 0.84 },
    { x: 100, y: 350, w: 20, h: 100, shade: 0.9 },
    { x: 300, y: 400, w: 150, h: 20, shade: 0.86 },
    { x: 550, y: 350, w: 20, h: 130, shade: 0.92 },
    { x: 200, y: 500, w: 100, h: 20, shade: 0.87 },
    { x: 450, y: 480, w: 20, h: 80, shade: 0.83 },
  ];
  for (const w of wallPositions) {
    natureElements.push({ type: 'wall', ...w });
  }
  // Doors along walls
  const doorPositions = [
    { x: 210, y: 0, w: 30, h: 20, open: false },
    { x: 440, y: 0, w: 30, h: 20, open: true },
    { x: 170, y: 580, w: 30, h: 20, open: false },
    { x: 430, y: 580, w: 30, h: 20, open: true },
    { x: 0, y: 190, w: 20, h: 30, open: false },
    { x: 0, y: 410, w: 20, h: 30, open: true },
    { x: 680, y: 210, w: 20, h: 30, open: false },
    { x: 680, y: 420, w: 20, h: 30, open: true },
    { x: 150, y: 230, w: 20, h: 30, open: Math.random() > 0.5 },
    { x: 350, y: 160, w: 20, h: 30, open: Math.random() > 0.5 },
    { x: 500, y: 220, w: 30, h: 20, open: Math.random() > 0.5 },
    { x: 100, y: 460, w: 20, h: 30, open: Math.random() > 0.5 },
  ];
  for (const d of doorPositions) {
    natureElements.push({ type: 'door', ...d });
  }
  // Water stains on carpet
  for (let i = 0; i < 12; i++) {
    natureElements.push({
      type: 'stain',
      x: 40 + Math.random() * 620,
      y: 40 + Math.random() * 520,
      r: 8 + Math.random() * 18
    });
  }
  // Ambient dust particles
  for (let i = 0; i < 40; i++) {
    ambientParticles.push({
      x: Math.random() * 700,
      y: Math.random() * 600,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.2,
      size: 1 + Math.random() * 2,
      alpha: 0.2 + Math.random() * 0.4,
      life: Math.random() * 200
    });
  }
}

function generateZigzagFloralElements() {
  natureElements = [];
  ambientParticles = [];

  const waterY = BASE_H * 0.35;

  // Helper to avoid path placement
  function isNearPath(x, y, threshold = 30) {
    for (let i = 0; i < PATH.length; i++) {
      const dx = x - PATH[i].x;
      const dy = y - PATH[i].y;
      if (dx*dx + dy*dy < threshold*threshold) return true;
    }
    return false;
  }

  // Water lilies (flowers) on the pond
  const flowerCount = 80;
  const flowerColors = ['#ffffff', '#fff0f0', '#ffe4b5', '#ffd700', '#ff69b4', '#87ceeb', '#e6e6fa', '#ffb6c1'];
  for (let i = 0; i < flowerCount; i++) {
    let fx, fy;
    let attempts = 0;
    do {
      fx = Math.random() * BASE_W;
      fy = waterY + Math.random() * (BASE_H - waterY - 30);
      attempts++;
    } while (isNearPath(fx, fy, 30) && attempts < 100);
    natureElements.push({
      type: 'flower',
      x: fx,
      y: fy,
      color: flowerColors[Math.floor(Math.random() * flowerColors.length)],
      size: 5 + Math.random() * 5,
      petals: 5 + Math.floor(Math.random() * 4)
    });
  }

  // Butterflies
  const butterflyCount = 12;
  const butterflyColors = ['#ff69b4', '#ffd700', '#87ceeb', '#da70d6', '#ff6347', '#00ffff'];
  for (let i = 0; i < butterflyCount; i++) {
    natureElements.push({
      type: 'butterfly',
      x: Math.random() * BASE_W,
      y: waterY + Math.random() * (BASE_H - waterY - 20),
      color: butterflyColors[Math.floor(Math.random() * butterflyColors.length)],
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 0.8,
      wingPhase: Math.random() * Math.PI * 2
    });
  }

  // Grass on the banks (edges)
  const grassCount = 30;
  for (let i = 0; i < grassCount; i++) {
    let gx, gy;
    let attempts = 0;
    do {
      const side = Math.random() < 0.5 ? -1 : 1;
      gx = side === -1 ? 10 + Math.random() * 100 : BASE_W - 110 + Math.random() * 100;
      gy = waterY + 10 + Math.random() * (BASE_H - waterY - 40);
      attempts++;
    } while (isNearPath(gx, gy, 30) && attempts < 100);
    natureElements.push({
      type: 'grass',
      x: gx,
      y: gy,
      h: 8 + Math.random() * 12,
      sway: Math.random() * Math.PI * 2
    });
  }

  // Ambient floating particles (pollen)
  const particleCount = 20;
  for (let i = 0; i < particleCount; i++) {
    ambientParticles.push({
      x: Math.random() * BASE_W,
      y: waterY + Math.random() * (BASE_H - waterY - 20),
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2 - 0.1,
      size: 1 + Math.random() * 2,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.05,
      color: Math.random() > 0.5 ? '#fff8dc' : '#ffd700',
      alpha: 0.3 + Math.random() * 0.5
    });
  }
}

function drawBackroomsBackground() {
  natureTime += 0.02;
  // Yellow/beige wallpaper base
  ctx.fillStyle = '#c9b458';
  ctx.fillRect(0, 0, BASE_W, BASE_H);
  // Wallpaper texture - subtle vertical stripes
  for (let x = 0; x < BASE_W; x += 60) {
    ctx.fillStyle = 'rgba(180,160,60,0.15)';
    ctx.fillRect(x, 0, 30, BASE_H);
  }
  // Horizontal wall/ceiling line
  ctx.fillStyle = '#b8a548';
  ctx.fillRect(0, 0, BASE_W, 8);
  // Floor - damp carpet
  ctx.fillStyle = '#6b5c3e';
  ctx.fillRect(0, BASE_H - 60, BASE_W, 60);
  // Carpet texture
  for (let x = 0; x < BASE_W; x += 12) {
    ctx.fillStyle = (x / 12) % 2 === 0 ? 'rgba(90,75,50,0.3)' : 'rgba(120,100,70,0.2)';
    ctx.fillRect(x, BASE_H - 60, 12, 60);
  }
  // Ceiling
  ctx.fillStyle = '#d4c468';
  ctx.fillRect(0, 0, BASE_W, 25);
  // Ceiling tiles
  for (let x = 0; x < BASE_W; x += 50) {
    ctx.strokeStyle = 'rgba(160,140,50,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, 0, 50, 25);
  }
  // Fluorescent light fixtures on ceiling
  for (let i = 0; i < 8; i++) {
    const lx = 40 + i * 85;
    const ly = 12;
    // Flicker effect
    const flicker = Math.sin(natureTime * 8 + i * 2.5) > -0.3 ? 1 : 0.3;
    // Light glow
    const glow = ctx.createRadialGradient(lx + 20, ly, 0, lx + 20, ly, 60);
    glow.addColorStop(0, 'rgba(255,255,220,' + flicker + ')');
    glow.addColorStop(1, 'rgba(255,255,220,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(lx - 40, ly - 50, 120, 120);
    // Light fixture body
    ctx.fillStyle = '#888';
    ctx.fillRect(lx, ly - 4, 40, 8);
    // Light tube
    ctx.fillStyle = 'rgba(255,255,230,' + flicker + ')';
    ctx.fillRect(lx + 2, ly - 2, 36, 4);
  }
  // Wall segments (hallway walls)
  const wallColor = '#c9b458';
  const wallDark = '#b8a548';
  const wallDarker = '#a89538';
  // Draw wall segments to create hallway feel
  natureElements.filter(n => n.type === 'wall').forEach(w => {
    ctx.fillStyle = w.shade > 0.5 ? wallDark : wallColor;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    // Wall border
    ctx.strokeStyle = wallDarker;
    ctx.lineWidth = 2;
    ctx.strokeRect(w.x, w.y, w.w, w.h);
    // Wallpaper pattern on wall
    for (let py = w.y; py < w.y + w.h; py += 20) {
      ctx.strokeStyle = 'rgba(160,140,50,0.2)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(w.x, py);
      ctx.lineTo(w.x + w.w, py);
      ctx.stroke();
    }
  });
  // Doors along walls
  natureElements.filter(n => n.type === 'door').forEach(d => {
    // Door frame
    ctx.fillStyle = '#5a4a2a';
    ctx.fillRect(d.x - 2, d.y - 2, d.w + 4, d.h + 4);
    // Door
    ctx.fillStyle = '#7a6a4a';
    ctx.fillRect(d.x, d.y, d.w, d.h);
    // Door handle
    ctx.fillStyle = '#c0a030';
    ctx.beginPath();
    ctx.arc(d.x + d.w - 8, d.y + d.h / 2, 3, 0, Math.PI * 2);
    ctx.fill();
    // Door slightly open (dark gap)
    if (d.open) {
      ctx.fillStyle = '#1a1a0a';
      ctx.fillRect(d.x, d.y, 4, d.h);
    }
  });
  // Water stains on carpet
  natureElements.filter(n => n.type === 'stain').forEach(s => {
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, s.r, s.r * 0.6, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(80,70,40,0.3)';
    ctx.fill();
  });
  // Ambient buzzing particles (dust in light)
  ambientParticles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x > BASE_W) p.x = 0;
    if (p.y > BASE_H) p.y = 0;
    if (p.x < 0) p.x = BASE_W;
    if (p.y < 0) p.y = BASE_H;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,200,' + p.alpha + ')';
    ctx.fill();
  });
  // Subtle vignette for unsettling feel
  const vignette = ctx.createRadialGradient(BASE_W/2, BASE_H/2, BASE_W*0.3, BASE_W/2, BASE_H/2, BASE_W*0.7);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.25)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, BASE_W, BASE_H);
}
function drawNatureBackground() {
  natureTime += 0.02;

  // Base grass colour
  const grassBase = currentMap === 'spiral' ? '#1e4d2b' : '#2a6e2a';
  ctx.fillStyle = grassBase;
  ctx.fillRect(0, 0, BASE_W, BASE_H);

  // Subtle grass texture stripes
  for (let y = 0; y < BASE_H; y += 20) {
    ctx.fillStyle = y % 40 === 0 ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.02)';
    ctx.fillRect(0, y, BASE_W, 20);
  }

  // Draw water ponds first (behind everything)
  natureElements.filter(n => n.type === 'water').forEach(w => {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(w.x, w.y, w.w, w.h, 0, 0, Math.PI * 2);
    const wg = ctx.createRadialGradient(w.x, w.y, 0, w.x, w.y, w.w);
    wg.addColorStop(0, 'rgba(30,144,255,0.6)');
    wg.addColorStop(0.7, 'rgba(30,100,200,0.4)');
    wg.addColorStop(1, 'rgba(0,80,160,0.1)');
    ctx.fillStyle = wg;
    ctx.fill();
    // Ripples
    const rippleR = (w.w * 0.5) + Math.sin(natureTime * 2 + w.x) * 5;
    ctx.beginPath();
    ctx.ellipse(w.x, w.y, rippleR, rippleR * 0.5, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  });

  // Trees
  natureElements.filter(n => n.type === 'tree').forEach(t => {
    // Trunk
    ctx.fillStyle = '#5c3a1e';
    ctx.fillRect(t.x - 4, t.y - t.size * 0.3, 8, t.size * 0.6);
    // Canopy (layered circles)
    const sway = Math.sin(natureTime + t.x * 0.1) * 2;
    for (let layer = 0; layer < 3; layer++) {
      const r = t.size * (1 - layer * 0.2);
      const ox = sway * (layer + 1) * 0.3;
      const oy = -t.size * 0.5 - layer * 5;
      ctx.beginPath();
      ctx.arc(t.x + ox, t.y + oy, r, 0, Math.PI * 2);
      const green = 80 + layer * 30 + t.shade * 60;
      ctx.fillStyle = `rgb(${30 + layer * 10},${green},${20 + layer * 10})`;
      ctx.fill();
    }
  });

  // Grass blades
  natureElements.filter(n => n.type === 'grass').forEach(g => {
    const sway = Math.sin(natureTime * 1.5 + g.sway) * 3;
    ctx.strokeStyle = `rgba(60,${140 + Math.floor(g.h * 5)},40,0.7)`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.quadraticCurveTo(g.x + sway, g.y - g.h * 0.6, g.x + sway * 1.5, g.y - g.h);
    ctx.stroke();
  });

  // Flowers
  natureElements.filter(n => n.type === 'flower').forEach(f => {
    const sway = Math.sin(natureTime * 2 + f.x) * 1;
    // Stem
    ctx.strokeStyle = '#228b22';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(f.x, f.y);
    ctx.lineTo(f.x + sway, f.y - 8);
    ctx.stroke();
    // Petals
    for (let p = 0; p < f.petals; p++) {
      const angle = (p / f.petals) * Math.PI * 2 + natureTime * 0.3;
      ctx.beginPath();
      ctx.ellipse(
        f.x + sway + Math.cos(angle) * f.size,
        f.y - 8 + Math.sin(angle) * f.size,
        f.size * 0.6, f.size * 0.3, angle, 0, Math.PI * 2
      );
      ctx.fillStyle = f.color;
      ctx.fill();
    }
    // Center
    ctx.beginPath();
    ctx.arc(f.x + sway, f.y - 8, f.size * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd700';
    ctx.fill();
  });

  // Butterflies
  natureElements.filter(n => n.type === 'butterfly').forEach(b => {
    b.x += b.vx + Math.sin(natureTime * 2 + b.wingPhase) * 0.3;
    b.y += b.vy + Math.cos(natureTime * 1.5 + b.wingPhase) * 0.2;
    b.wingPhase += 0.15;
    // Wrap around
    if (b.x > BASE_W + 20) b.x = -20;
    if (b.x < -20) b.x = BASE_W + 20;
    if (b.y > BASE_H + 20) b.y = -20;
    if (b.y < -20) b.y = BASE_H + 20;

    const wingOpen = Math.abs(Math.sin(b.wingPhase));
    ctx.save();
    ctx.translate(b.x, b.y);
    // Wings
    ctx.fillStyle = b.color;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.ellipse(-3, 0, 5 * wingOpen, 3, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(3, 0, 5 * wingOpen, 3, 0.3, 0, Math.PI * 2);
    ctx.fill();
    // Body
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#333';
    ctx.fillRect(-1, -3, 2, 6);
    ctx.restore();
  });

  // Birds
  natureElements.filter(n => n.type === 'bird').forEach(bird => {
    bird.x += bird.vx;
    bird.wingPhase += 0.1;
    if (bird.x > BASE_W + 30) bird.x = -30;
    const wingY = Math.sin(bird.wingPhase) * 5;
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bird.x - 8, bird.y + wingY);
    ctx.quadraticCurveTo(bird.x - 3, bird.y - 3, bird.x, bird.y);
    ctx.quadraticCurveTo(bird.x + 3, bird.y - 3, bird.x + 8, bird.y + wingY);
    ctx.stroke();
  });

  // Ambient floating particles
  ambientParticles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.rotSpeed;
    if (p.x > BASE_W + 10) p.x = -10;
    if (p.y > BASE_H + 10) { p.y = -10; p.x = Math.random() * BASE_W; }
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
  ctx.globalAlpha = 1;
}

// ═══════════════════════════════════════════════════════
// ZIGZAG POND BACKGROUND
// ═══════════════════════════════════════════════════════
function drawZigzagPondBackground() {
  const time = natureTime;

  // Sky gradient (soft overcast)
  const skyHeight = BASE_H * 0.35;
  const skyGrad = ctx.createLinearGradient(0, 0, 0, skyHeight);
  skyGrad.addColorStop(0, '#b8c8d8');
  skyGrad.addColorStop(1, '#d0d8e0');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, BASE_W, skyHeight);

  // Water
  const waterY = skyHeight;
  const waterH = BASE_H - waterY;
  const waterGrad = ctx.createLinearGradient(0, waterY, 0, BASE_H);
  waterGrad.addColorStop(0, '#6ca875');
  waterGrad.addColorStop(1, '#4a8a5a');
  ctx.fillStyle = waterGrad;
  ctx.fillRect(0, waterY, BASE_W, waterH);

  // Water ripples
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 20; i++) {
    const y = waterY + 20 + i * 25;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= BASE_W; x += 8) {
      const waveY = y + Math.sin(x * 0.015 + time * 0.5) * 2;
      ctx.lineTo(x, waveY);
    }
    ctx.stroke();
  }

  // Dense background foliage (layered trees)
  ctx.fillStyle = '#2d5a3d';
  for (let x = 0; x < BASE_W; x += 12) {
    const h = 20 + ((x * 0.12) % 15);
    ctx.fillRect(x, waterY - h - 5, 12, h);
  }
  
  // More distant dark green layer
  ctx.fillStyle = 'rgba(30, 50, 35, 0.7)';
  for (let x = 0; x < BASE_W; x += 20) {
    const h = 25 + ((x * 0.1) % 12);
    ctx.fillRect(x, waterY - h - 15, 20, h);
  }

  // Weeping willow trees (5 - more for lush feel)
  const willowCount = 5;
  for (let w = 0; w < willowCount; w++) {
    const wx = (BASE_W * (0.1 + w * 0.2));
    const trunkY = waterY - 10;
    // Trunk
    ctx.fillStyle = '#6b4423';
    ctx.fillRect(wx - 7, trunkY - 85, 14, 85);
    // Dense foliage canopy
    ctx.fillStyle = '#3a7c3a';
    ctx.beginPath();
    ctx.ellipse(wx, trunkY - 85, 50, 35, 0, 0, Math.PI * 2);
    ctx.fill();
    // Inner lighter foliage
    ctx.fillStyle = '#4a9c4a';
    ctx.beginPath();
    ctx.ellipse(wx, trunkY - 80, 35, 25, 0, 0, Math.PI * 2);
    ctx.fill();
    // Drooping branches
    ctx.strokeStyle = '#5aac5a';
    ctx.lineWidth = 2;
    const branchCount = 12;
    for (let i = 0; i < branchCount; i++) {
      const offsetX = (i - branchCount/2) * 9;
      const startX = wx + offsetX;
      const startY = trunkY - 70;
      const ctrlX = startX + 18;
      const ctrlY = startY + 35;
      const endX = startX + 45;
      const endY = startY + 25 + Math.abs(i - branchCount/2) * 4;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
      ctx.stroke();
    }
  }

  // Flowering bushes (purple/pink hydrangeas on banks)
  const bushCount = 6;
  for (let b = 0; b < bushCount; b++) {
    const bx = (BASE_W * (0.05 + b * 0.16));
    const by = waterY - 5;
    // Bush body
    ctx.fillStyle = '#3d6b3d';
    ctx.beginPath();
    ctx.ellipse(bx, by - 15, 25, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    // Flowers (hydrangea clusters)
    const flowerCount = 12;
    for (let f = 0; f < flowerCount; f++) {
      const angle = (f / flowerCount) * Math.PI * 2;
      const px = bx + Math.cos(angle) * 20;
      const py = by - 15 + Math.sin(angle) * 15;
      ctx.fillStyle = f % 3 === 0 ? '#d45ed4' : (f % 3 === 1 ? '#e87cee' : '#ff7eb3');
      for (let petal = 0; petal < 5; petal++) {
        const petalAngle = (petal / 5) * Math.PI * 2;
        const petX = px + Math.cos(petalAngle) * 3;
        const petY = py + Math.sin(petalAngle) * 3;
        ctx.beginPath();
        ctx.arc(petX, petY, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Lily pads with flowers
  const lilyCount = 35;
  for (let i = 0; i < lilyCount; i++) {
    const lx = (i * 37 + 13) % BASE_W;
    const ly = waterY + 30 + (i * 23 % (waterH - 80));
    const size = 8 + (i % 5);
    ctx.fillStyle = '#4a8c5a';
    ctx.beginPath();
    ctx.ellipse(lx, ly, size, size * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    // Slit
    ctx.strokeStyle = '#3a6c4a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(lx, ly - size * 0.4);
    ctx.lineTo(lx, ly + size * 0.4);
    ctx.stroke();
    // Small flower on lily pad
    if (i % 3 === 0) {
      ctx.fillStyle = i % 2 === 0 ? '#ff9ed9' : '#ffb3e6';
      ctx.beginPath();
      ctx.arc(lx, ly - size - 2, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Fallen leaves on water
  const leafCount = 20;
  for (let i = 0; i < leafCount; i++) {
    const lx = (i * 51 + 7) % BASE_W;
    const ly = waterY + 50 + (i * 31 % (waterH - 100));
    const size = 3 + (i % 4);
    ctx.fillStyle = i % 3 === 0 ? '#d4a017' : (i % 3 === 1 ? '#c1441e' : '#e0b030');
    ctx.beginPath();
    ctx.arc(lx, ly, size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Banks (edges) with lush foliage
  ctx.fillStyle = '#3a6b4a';
  // Left bank curve
  ctx.beginPath();
  ctx.moveTo(0, BASE_H);
  ctx.lineTo(0, waterY - 20);
  ctx.quadraticCurveTo(60, waterY - 50, 120, waterY - 10);
  ctx.lineTo(120, BASE_H);
  ctx.fill();
  // Right bank curve
  ctx.beginPath();
  ctx.moveTo(BASE_W, BASE_H);
  ctx.lineTo(BASE_W, waterY - 30);
  ctx.quadraticCurveTo(BASE_W - 80, waterY - 60, BASE_W - 180, waterY - 15);
  ctx.lineTo(BASE_W - 180, BASE_H);
  ctx.fill();

  // Foreground garden flowers (lush pink/purple hydrangeas)
  // Hydrangea clusters (left side)
  for (let cluster = 0; cluster < 8; cluster++) {
    const cx = 15 + cluster * 13;
    const cy = BASE_H - 15;
    const flowerCount = 20;
    for (let i = 0; i < flowerCount; i++) {
      const angle = (i / flowerCount) * Math.PI * 2;
      const fx = cx + Math.cos(angle) * 12;
      const fy = cy - 20 + Math.sin(angle) * 12;
      ctx.fillStyle = i % 3 === 0 ? '#d45ed4' : (i % 3 === 1 ? '#e87cee' : '#ff7eb3');
      ctx.beginPath();
      ctx.arc(fx, fy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Overcast overlay
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillRect(0, 0, BASE_W, BASE_H);
}

// ═══════════════════════════════════════════════════════
// MINI-MAP
// ═══════════════════════════════════════════════════════
function drawMiniMap() {
  const mmW = 100, mmH = 86;
  const mmX = BASE_W - mmW - 8, mmY = 8;
  const sx = mmW / BASE_W, sy = mmH / BASE_H;

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.strokeStyle = 'rgba(0,255,255,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(mmX, mmY, mmW, mmH, 6);
  ctx.fill();
  ctx.stroke();

  // Path
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(mmX + PATH[0].x * sx, mmY + PATH[0].y * sy);
  for (let i = 1; i < PATH.length; i++) ctx.lineTo(mmX + PATH[i].x * sx, mmY + PATH[i].y * sy);
  ctx.stroke();

  // Towers
  towers.forEach(t => {
    ctx.fillStyle = t.color;
    ctx.fillRect(mmX + t.x * sx - 1, mmY + t.y * sy - 1, 3, 3);
  });

  // Enemies
  enemies.forEach(e => {
    ctx.fillStyle = e.type === 'boss' ? '#ff0000' : '#ff6b6b';
    ctx.fillRect(mmX + e.x * sx - 1, mmY + e.y * sy - 1, 2, 2);
  });
}

// ═══════════════════════════════════════════════════════
// DRAW PATH
// ═══════════════════════════════════════════════════════
function drawPath() {
  let pathColor, pathOutline;
  if (currentMap === 'backrooms') {
    pathColor = '#8b6914';
    pathOutline = '#5a4510';
  } else if (currentMap === 'zigzag') {
    pathColor = '#a67c52';  // Warm medium brown (wood)
    pathOutline = '#5d4037';  // Dark brown outline
  } else {
    pathColor = PATH_COLOR;
    pathOutline = null;
  }
  // Draw outline first for backrooms-style maps
  if (pathOutline) {
    ctx.strokeStyle = pathOutline;
    ctx.lineWidth = PATH_WIDTH + 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(PATH[0].x, PATH[0].y);
    for (let i = 1; i < PATH.length; i++) {
      ctx.lineTo(PATH[i].x, PATH[i].y);
    }
    ctx.stroke();
  }
  ctx.strokeStyle = pathColor;
  ctx.lineWidth = PATH_WIDTH;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(PATH[0].x, PATH[0].y);
  for (let i = 1; i < PATH.length; i++) {
    ctx.lineTo(PATH[i].x, PATH[i].y);
  }
  ctx.stroke();
  // Add subtle center highlight for zigzag to simulate worn wood
  if (currentMap === 'zigzag') {
    ctx.strokeStyle = '#f5e6d3'; // lighter beige
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(PATH[0].x, PATH[0].y);
    for (let i = 1; i < PATH.length; i++) {
      ctx.lineTo(PATH[i].x, PATH[i].y);
    }
    ctx.stroke();
  }
}

// ═══════════════════════════════════════════════════════
// LOBBY
// ═══════════════════════════════════════════════════════
function setDifficulty(diff) {
  difficulty = diff;
  document.querySelectorAll('.diff-btn').forEach(b => b.classList.toggle('active', b.dataset.diff === diff));
}
function setMap(map) {
  currentMap = map;
  document.querySelectorAll('.map-btn').forEach(b => b.classList.toggle('active', b.dataset.map === map));
}
function startGame() {
  initAudio();
  document.getElementById('lobby').classList.add('hidden');
  document.getElementById('gameContainer').classList.remove('hidden');
  PATH = MAP_PATHS[currentMap];
  init();
  resizeCanvas();
}
function goToLobby() {
  gameRunning = false;
  cancelAnimationFrame(animationId);
  document.getElementById('gameContainer').classList.add('hidden');
  document.getElementById('lobby').classList.remove('hidden');
  document.getElementById('lobbyHighScore').textContent = '🏆 Best Score: ' + highScore;
}

// ═══════════════════════════════════════════════════════
// CHANGELOG
// ═══════════════════════════════════════════════════════
function toggleChangelog() {
  const el = document.getElementById('changelog');
  el.classList.toggle('hidden');
}

// ═══════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════
function init() {
  const diff = DIFFICULTY_SETTINGS[difficulty];
  gold = Math.floor(100 * diff.goldMult);
  lives = 20 + diff.livesBonus;
  score = 0;
  killCount = 0;
  currentWave = 0;
  waveInProgress = false;
  isNight = false;
  nightTransition = 0;
  endlessMode = false;
  laserBeams = [];
  shopOpen = false;
  selectedTowerType = null;
  selectedTower = null;
  towers = [];
  enemies = [];
  projectiles = [];
  particles = [];
  floatingTexts = [];
  gameSpeed = 1;
  autoWave = false;
  activePowerUp = null;
  powerUpSpawnTimer = 600 + Math.floor(Math.random() * 600);
  powerUpOnMap = null;
  comboCount = 0;
  comboTimer = 0;
  shakeAmount = 0;
  shakeDuration = 0;
  natureTime = 0;
  generateNature();
  updateSpeedButtons();
  updateUI();
  hideTowerInfo();
  updatePowerUpUI();
  updateComboUI();
  gameOverlay.classList.add('hidden');
  gameOverlay.classList.remove('victory', 'defeat');
  gameRunning = true;
  gameLoop();
}

// ═══════════════════════════════════════════════════════
// UI
// ═══════════════════════════════════════════════════════
function updateUI() {
  goldDisplay.textContent = gold;
  livesDisplay.textContent = lives;
  waveDisplay.textContent = currentWave + (endlessMode ? ' ∞' : ' / ' + maxWaves);
  scoreDisplay.textContent = score;
  killsDisplay.textContent = killCount;
  const dnEl = document.getElementById('dayNightIndicator');
  if (dnEl) dnEl.textContent = isNight ? '🌙 Night' : '☀ Day';
  startWaveBtn.disabled = waveInProgress;
  startWaveBtn.textContent = waveInProgress ? '⚔️ Wave in Progress...' : (autoWave ? '⚔️ Auto: ON (click to toggle)' : '⚔️ Start Wave (click to toggle auto)');
  towerBtns.forEach(btn => {
    const type = btn.dataset.tower;
    if (TOWER_TYPES[type]) {
      btn.disabled = gold < TOWER_TYPES[type].cost;
      btn.classList.toggle('selected', selectedTowerType === type);
    }
  });
  if (waveInProgress && totalWaveEnemies > 0) {
    const killed = totalWaveEnemies - enemies.length;
    const pct = Math.min(100, (killed / totalWaveEnemies) * 100);
    waveProgressFill.style.width = pct + '%';
  } else {
    waveProgressFill.style.width = '0%';
  }
  if (selectedTower) updateTowerInfoPanel(selectedTower);
}

function selectTower(type) {
  if (gold >= TOWER_TYPES[type].cost) {
    selectedTowerType = selectedTowerType === type ? null : type;
    selectedTower = null;
    hideTowerInfo();
    updateUI();
  }
}

function showTowerInfo(tower) {
  selectedTower = tower;
  selectedTowerType = null;
  towerInfoPanel.classList.add('active');
  updateTowerInfoPanel(tower);
  updateUI();
}

function hideTowerInfo() {
  towerInfoPanel.classList.remove('active');
  selectedTower = null;
}

function updateTowerInfoPanel(tower) {
  const type = TOWER_TYPES[tower.type];
  document.getElementById('infoTitle').textContent = type.icon + ' ' + type.name + ' Lv.' + tower.level;
  document.getElementById('infoDamage').textContent = 'Damage: ' + tower.damage;
  document.getElementById('infoRange').textContent = 'Range: ' + tower.range;
  document.getElementById('infoKills').textContent = 'Kills: ' + tower.kills;
  const upgCost = type.upgradeCost * tower.level;
  upgradeBtn.textContent = '⬆ Upgrade (💰' + upgCost + ')';
  upgradeBtn.disabled = gold < upgCost || tower.level >= 5;
  const sellValue = Math.floor(type.cost * 0.6 * tower.level);
  sellBtn.textContent = '💰 Sell (💰' + sellValue + ')';
}

function upgradeTower() {
  if (!selectedTower || selectedTower.level >= 5) return;
  const type = TOWER_TYPES[selectedTower.type];
  const cost = type.upgradeCost * selectedTower.level;
  if (gold < cost) return;
  gold -= cost;
  selectedTower.level++;
  selectedTower.damage += type.upgradeDmg;
  selectedTower.range += type.upgradeRange;
  selectedTower.fireRate = Math.max(5, selectedTower.fireRate - 2);
  createParticles(selectedTower.x, selectedTower.y, '#00ff88', 15);
  addFloatingText(selectedTower.x, selectedTower.y - 30, '⬆ Lv.' + selectedTower.level, '#00ff88');
  sfxPlace();
  updateUI();
}

function sellTower() {
  if (!selectedTower) return;
  const type = TOWER_TYPES[selectedTower.type];
  const sellValue = Math.floor(type.cost * 0.6 * selectedTower.level);
  gold += sellValue;
  towers = towers.filter(t => t !== selectedTower);
  createParticles(selectedTower.x, selectedTower.y, '#ffd700', 15);
  addFloatingText(selectedTower.x, selectedTower.y - 30, '+' + sellValue + '💰', '#ffd700');
  sfxSell();
  hideTowerInfo();
  updateUI();
}

function setSpeed(speed) {
  gameSpeed = speed;
  updateSpeedButtons();
}

function updateSpeedButtons() {
  speedBtns.forEach(btn => btn.classList.toggle('active', parseInt(btn.dataset.speed) === gameSpeed));
}

// ── Power-up UI ──
function updatePowerUpUI() {
  if (activePowerUp) {
    puIndicator.textContent = POWER_UP_ICONS[activePowerUp.type] + ' ' + activePowerUp.type;
    puIndicator.classList.add('active');
    puTimerFill.style.width = ((activePowerUp.timer / activePowerUp.maxTimer) * 100) + '%';
  } else {
    puIndicator.textContent = '⚡ No Power-up';
    puIndicator.classList.remove('active');
    puTimerFill.style.width = '0%';
  }
}

// ── Combo UI ──
function updateComboUI() {
  if (comboCount >= 2) {
    comboDisplayEl.classList.remove('hidden');
    comboDisplayEl.classList.toggle('active', comboCount >= 5);
    comboCountEl.textContent = comboCount;
    comboMultEl.textContent = 'x' + getComboMultiplier().toFixed(1);
  } else {
    comboDisplayEl.classList.add('hidden');
  }
}

function getComboMultiplier() {
  if (comboCount >= 10) return 3.0;
  if (comboCount >= 7) return 2.5;
  if (comboCount >= 5) return 2.0;
  if (comboCount >= 3) return 1.5;
  return 1.0;
}

// ═══════════════════════════════════════════════════════
// WAVES
// ═══════════════════════════════════════════════════════
function startWave() {
  if (shopOpen) closeShop();
  if (waveInProgress) return;
  if (!endlessMode && currentWave >= maxWaves) {
    autoWave = !autoWave;
    updateUI();
    return;
  }
  currentWave++;
  waveInProgress = true;
  waveAnnounceText = endlessMode ? '∞ Endless Wave ' + currentWave : '⚔️ Wave ' + currentWave;
  waveAnnounceTimer = 90;
  updateUI();
  spawnWave();
}

function spawnWave() {
  let enemyCount = 5 + currentWave * 2;
  // Endless mode scaling
  if (endlessMode) {
    enemyCount = Math.floor(enemyCount * (1 + (currentWave - maxWaves) * 0.1));
  }
  totalWaveEnemies = enemyCount;
  enemiesSpawned = 0;
  let spawnDelay = 0;
  for (let i = 0; i < enemyCount; i++) {
    setTimeout(() => {
      if (!gameRunning) return;
      let type = 'basic';
      const rand = Math.random();
      if (currentWave >= 3 && rand < 0.25) type = 'fast';
      if (currentWave >= 5 && rand < 0.15) type = 'tank';
      if (currentWave >= 4 && rand >= 0.25 && rand < 0.35) type = 'healer';
      if (currentWave >= 6 && rand >= 0.35 && rand < 0.5) type = 'flying';
      if (currentWave === maxWaves && i === enemyCount - 1) type = 'finalBoss';
      else if (currentWave >= 8 && i === enemyCount - 1) type = 'boss';
      spawnEnemy(type);
      enemiesSpawned++;
    }, spawnDelay);
    spawnDelay += Math.max(200, 800 - currentWave * 30);
  }
}

function spawnEnemy(type) {
  const template = ENEMY_TYPES[type];
  const diff = DIFFICULTY_SETTINGS[difficulty];
  let hpMult = (1 + currentWave * 0.15) * diff.hpMult;
  let speedMult = 1;
  // Endless mode scaling
  if (endlessMode) {
    const endlessWave = currentWave - maxWaves;
    hpMult *= Math.pow(1.15, endlessWave);
    speedMult = Math.pow(1.05, endlessWave);
  }
  enemies.push({
    x: PATH[0].x, y: PATH[0].y,
    hp: template.hp * hpMult, maxHp: template.hp * hpMult,
    speed: template.speed * speedMult,
    reward: template.reward,
    color: template.color, size: template.size,
    pathIndex: 0, slowTimer: 0, slowAmount: 1,
    poisonTimer: 0, poisonDmg: 0,
    type: type, frozen: false, frozenTimer: 0,
    flying: template.flying || false
  });
}

// ═══════════════════════════════════════════════════════
// TOWER PLACEMENT
// ═══════════════════════════════════════════════════════
function placeTower(x, y) {
  if (!selectedTowerType) return;
  if (towers.length >= MAX_TOWERS) {
    addFloatingText(x, y, 'Tower limit (35) reached!', '#ff6b6b');
    return;
  }
  const type = TOWER_TYPES[selectedTowerType];
  if (gold < type.cost) return;
  for (let i = 0; i < PATH.length - 1; i++) {
    if (distToSegment(x, y, PATH[i], PATH[i + 1]) < 40) return;
  }
  for (const tower of towers) {
    if (Math.hypot(x - tower.x, y - tower.y) < 50) return;
  }
  gold -= type.cost;
  towers.push({
    x, y, type: selectedTowerType,
    damage: type.damage, range: type.range, fireRate: type.fireRate,
    color: type.color, projectileColor: type.projectileColor,
    projectileSpeed: type.projectileSpeed,
    splash: type.splash || 0, slow: type.slow || 0,
    chain: type.chain || 0, poison: type.poison || 0,
    cooldown: 0, angle: 0, level: 1, kills: 0
  });
  createParticles(x, y, type.color, 10);
  addFloatingText(x, y - 30, '-' + type.cost + '💰', '#ff6b6b');
  sfxPlace();
  updateUI();
}

function distToSegment(px, py, v, w) {
  const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
  if (l2 === 0) return Math.hypot(px - v.x, py - v.y);
  let t = ((px - v.x) * (w.x - v.x) + (py - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (v.x + t * (w.x - v.x)), py - (v.y + t * (w.y - v.y)));
}

// ═══════════════════════════════════════════════════════
// PARTICLES & FLOATING TEXT
// ═══════════════════════════════════════════════════════
function createParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, size: Math.random() * 4 + 2, color, life: 1 });
  }
}

function addFloatingText(x, y, text, color) {
  floatingTexts.push({ x, y, text, color, life: 1, vy: -1.5 });
}

// ═══════════════════════════════════════════════════════
// UPDATE
// ═══════════════════════════════════════════════════════
function update() {
  if (!gameRunning) return;
  for (let step = 0; step < gameSpeed; step++) {
    updateEnemies();
    updateTowers();
    updateProjectiles();
    checkDeadEnemies();
    updateParticles();
    updateFloatingTexts();
    updatePowerUps();
    updateCombo();
    checkWaveComplete();
    updateShake();
  }
}

function updateShake() {
  if (shakeDuration > 0) {
    shakeDuration--;
    shakeAmount *= 0.9;
  } else {
    shakeAmount = 0;
  }
}

function triggerShake(amount, duration) {
  shakeAmount = amount;
  shakeDuration = duration;
}

function updateEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    if (enemy.frozenTimer > 0) { enemy.frozenTimer--; if (enemy.frozenTimer <= 0) enemy.frozen = false; continue; }
    if (enemy.poisonTimer > 0) { enemy.hp -= enemy.poisonDmg; enemy.poisonTimer--; if (enemy.poisonTimer % 10 === 0) createParticles(enemy.x, enemy.y, '#7cfc00', 2); }
    let speed = enemy.speed;
    if (isNight) speed *= 1.3; // Night speed boost
    if (enemy.slowTimer > 0) { speed *= enemy.slowAmount; enemy.slowTimer--; }
    if (enemy.type === 'healer') { enemies.forEach(e => { if (e !== enemy && e.hp > 0 && Math.hypot(e.x - enemy.x, e.y - enemy.y) < 80) { e.hp = Math.min(e.maxHp, e.hp + 0.3); } }); }
    // Flying enemies move in a straight line from start to end
    if (enemy.flying) {
      const endPt = PATH[PATH.length - 1];
      const dx = endPt.x - enemy.x, dy = endPt.y - enemy.y;
      const dist = Math.hypot(dx, dy);
      if (dist < speed + 5) { enemies.splice(i, 1); lives--; updateUI(); if (lives <= 0) endGame(false); continue; }
      enemy.x += (dx / dist) * speed;
      enemy.y += (dy / dist) * speed;
      continue;
    }
    const target = PATH[enemy.pathIndex + 1];
    if (!target) { enemies.splice(i, 1); lives--; updateUI(); if (lives <= 0) endGame(false); continue; }
    const dx = target.x - enemy.x; const dy = target.y - enemy.y;
    const dist = Math.hypot(dx, dy);
    if (dist < speed) { enemy.pathIndex++; } else { enemy.x += (dx / dist) * speed; enemy.y += (dy / dist) * speed; }
  }
}

function updateTowers() {
  laserBeams = [];
  const dmgBoost = activePowerUp && activePowerUp.type === 'damageBoost';
  towers.forEach(tower => {
    const type = TOWER_TYPES[tower.type];
    // Calculate effective range with night modifier
    let effectiveRange = tower.range;
    if (isNight) effectiveRange *= 0.7;
    // Calculate effective fire rate with shop and buff bonuses
    let effectiveFireRate = tower.fireRate;
    effectiveFireRate *= (1 + shopUpgrades.fireRateBonus * 0.1);
    // Check for nearby buff towers
    let buffDmgMult = 1;
    for (let b of towers) {
      if (b.type === 'buff' && b !== tower) {
        const bType = TOWER_TYPES[b.type];
        const bRadius = bType.buffRadius + (b.level - 1) * (bType.upgradeRange || 0);
        const dist = Math.hypot(b.x - tower.x, b.y - tower.y);
        if (dist < bRadius) {
          effectiveFireRate *= (bType.buffFireRateMult || 1);
          buffDmgMult *= (bType.buffDmgMult || 1);
        }
      }
    }
    // Buff towers don't attack
    if (type.isBuff) return;
    // Laser tower: continuous beam
    if (type.isLaser) {
      tower.cooldown = Math.max(0, tower.cooldown - 1);
      if (tower.cooldown <= 0) {
        let target = null; let minDist = effectiveRange;
        enemies.forEach(enemy => {
          if (enemy.flying && !type.antiAir) return;
          const dist = Math.hypot(enemy.x - tower.x, enemy.y - tower.y);
          if (dist < minDist) { minDist = dist; target = enemy; }
        });
        if (target) {
          tower.angle = Math.atan2(target.y - tower.y, target.x - tower.x);
          const dx = target.x - tower.x, dy = target.y - tower.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          const dirX = dx / len, dirY = dy / len;
          let beamEndX = tower.x + dirX * effectiveRange;
          let beamEndY = tower.y + dirY * effectiveRange;
          let dmg = tower.damage * (1 + shopUpgrades.dmgBonus * 0.1) * buffDmgMult;
          if (dmgBoost) dmg *= 2;
          enemies.forEach(enemy => {
            if (enemy.flying && !type.antiAir) return;
            const ex = enemy.x - tower.x, ey = enemy.y - tower.y;
            const proj = ex * dirX + ey * dirY;
            if (proj < 0 || proj > effectiveRange) return;
            const perpDist = Math.abs(ex * dirY - ey * dirX);
            if (perpDist < (enemy.size || 15) + 5) {
              enemy.hp -= dmg;
              createParticles(enemy.x, enemy.y, type.color, 2);
            }
          });
          laserBeams.push({ x1: tower.x, y1: tower.y, x2: beamEndX, y2: beamEndY, color: type.color });
          tower.cooldown = effectiveFireRate;
          if (type.sfx) type.sfx();
        }
      }
      return;
    }
    // Normal tower logic
    tower.cooldown = Math.max(0, tower.cooldown - 1);
    if (tower.cooldown === 0) {
      let target = null; let minDist = effectiveRange;
      enemies.forEach(enemy => {
        if (enemy.flying && !type.antiAir) return;
        const dist = Math.hypot(enemy.x - tower.x, enemy.y - tower.y);
        if (dist < minDist) { minDist = dist; target = enemy; }
      });
      if (target) {
        tower.angle = Math.atan2(target.y - tower.y, target.x - tower.x);
        fireProjectile(tower, target, dmgBoost);
        tower.cooldown = effectiveFireRate;
        if (type.sfx) type.sfx();
      }
    }
  });
}

function updateProjectiles() {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const proj = projectiles[i];
    proj.x += Math.cos(proj.angle) * proj.speed;
    proj.y += Math.sin(proj.angle) * proj.speed;
    // Remove if off screen
    if (proj.x < -50 || proj.x > BASE_W + 50 || proj.y < -50 || proj.y > BASE_H + 50) {
      projectiles.splice(i, 1);
      continue;
    }
    for (let j = enemies.length - 1; j >= 0; j--) {
      const enemy = enemies[j];
      if (Math.hypot(enemy.x - proj.x, enemy.y - proj.y) < enemy.size + 5) {
        let finalDmg = proj.damage;
        let isCrit = Math.random() < CRIT_CHANCE;
        if (isCrit) finalDmg = Math.floor(finalDmg * CRIT_MULTIPLIER);
        enemy.hp -= finalDmg;
        proj.sourceTower.kills = (proj.sourceTower.kills || 0);
        if (isCrit) {
          createParticles(enemy.x, enemy.y, '#ff00ff', 10);
          addFloatingText(enemy.x, enemy.y - 30, '💥CRIT! ' + finalDmg, '#ff00ff');
          sfxCrit();
          triggerShake(3, 5);
        }
        if (proj.splash) {
          enemies.forEach(e => {
            if (e !== enemy && Math.hypot(e.x - proj.x, e.y - proj.y) < proj.splash) {
              e.hp -= proj.damage * 0.5;
            }
          });
          createParticles(proj.x, proj.y, '#ff4500', 15);
        }
        if (proj.slow) { enemy.slowTimer = 60; enemy.slowAmount = proj.slow; }
        if (proj.chain) {
          let chains = proj.chain - 1;
          let lastTarget = enemy;
          enemies.forEach(e => {
            if (chains > 0 && e !== lastTarget && e.hp > 0 && Math.hypot(e.x - lastTarget.x, e.y - lastTarget.y) < 120) {
              e.hp -= proj.damage * 0.6;
              createParticles(e.x, e.y, '#ffff00', 5);
              chains--;
              lastTarget = e;
            }
          });
        }
        if (proj.poison) { enemy.poisonTimer = 180; enemy.poisonDmg = proj.poison; }
        projectiles.splice(i, 1);
        break;
      }
    }
  }
}

function checkDeadEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (enemies[i].hp <= 0) {
      const enemy = enemies[i];
      const diff = DIFFICULTY_SETTINGS[difficulty];
      let reward = enemy.reward;
      if (activePowerUp && activePowerUp.type === 'doubleGold') reward *= 2;
      gold += reward;
      killCount++;
      comboCount++;
      comboTimer = COMBO_TIMEOUT;
      const comboMult = getComboMultiplier();
      const comboBonus = Math.floor(enemy.reward * (comboMult - 1));
      if (comboBonus > 0) { gold += comboBonus; score += comboBonus; }
      score += Math.floor(enemy.reward * 2 * diff.scoreMult);
      createParticles(enemy.x, enemy.y, enemy.color, 15);
      addFloatingText(enemy.x, enemy.y - 20, '+' + reward + '💰', '#ffd700');
      if (comboCount >= 3) addFloatingText(enemy.x, enemy.y - 40, '🔥' + comboCount + ' COMBO x' + comboMult.toFixed(1), '#e040fb');
      // Sound & shake for boss kills
      if (enemy.type === 'boss') {
        sfxBossKill();
        triggerShake(8, 15);
        addFloatingText(enemy.x, enemy.y - 60, '👑 BOSS DEFEATED!', '#ffd700');
      } else {
        sfxKill();
      }
      enemies.splice(i, 1);
      updateUI();
      updateComboUI();
    }
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx; p.y += p.vy; p.life -= 0.03; p.size *= 0.95;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function updateFloatingTexts() {
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i];
    ft.y += ft.vy; ft.life -= 0.02;
    if (ft.life <= 0) floatingTexts.splice(i, 1);
  }
}

// ── Power-up Update ──
function updatePowerUps() {
  if (activePowerUp) {
    activePowerUp.timer--;
    if (activePowerUp.timer <= 0) activePowerUp = null;
    updatePowerUpUI();
  }
  if (!powerUpOnMap) {
    powerUpSpawnTimer--;
    if (powerUpSpawnTimer <= 0) spawnPowerUpOnMap();
  }
}

function spawnPowerUpOnMap() {
  let x, y, valid;
  for (let attempt = 0; attempt < 50; attempt++) {
    x = 50 + Math.random() * (BASE_W - 100);
    y = 50 + Math.random() * (BASE_H - 100);
    valid = true;
    for (let i = 0; i < PATH.length - 1; i++) {
      if (distToSegment(x, y, PATH[i], PATH[i + 1]) < 50) { valid = false; break; }
    }
    if (valid) break;
  }
  if (valid) {
    const type = POWER_UP_TYPES[Math.floor(Math.random() * POWER_UP_TYPES.length)];
    powerUpOnMap = { x, y, type, pulse: 0 };
  }
  powerUpSpawnTimer = 900 + Math.floor(Math.random() * 600);
}

function collectPowerUp(pu) {
  activePowerUp = { type: pu.type, timer: POWER_UP_DURATION, maxTimer: POWER_UP_DURATION };
  powerUpOnMap = null;
  sfxPowerUp();
  if (pu.type === 'heal') {
    lives = Math.min(lives + 5, 20 + DIFFICULTY_SETTINGS[difficulty].livesBonus);
    addFloatingText(350, 280, '❤️ +5 Lives!', '#ff6b6b');
  }
  if (pu.type === 'freeze') {
    enemies.forEach(e => { e.frozen = true; e.frozenTimer = 180; });
    addFloatingText(350, 280, '🧊 All Enemies Frozen!', '#00ffff');
    createParticles(350, 300, '#00ffff', 30);
  }
  if (pu.type === 'doubleGold') addFloatingText(350, 280, '💰 Double Gold Active!', '#ffd700');
  if (pu.type === 'damageBoost') addFloatingText(350, 280, '🔥 Damage Boost Active!', '#ff4500');
  if (pu.type === 'tripleGold') {
    const added = gold * 2;
    gold *= 3;
    addFloatingText(350, 280, '3️⃣ x3 Gold! +' + added + '💰', '#ffd700');
  }
  createParticles(pu.x, pu.y, '#ffd700', 20);
  updateUI();
  updatePowerUpUI();
}

// ── Combo Update ──
function updateCombo() {
  if (comboTimer > 0) {
    comboTimer--;
    if (comboTimer <= 0) { comboCount = 0; updateComboUI(); }
  }
}

function checkWaveComplete() {
  if (waveInProgress && enemiesSpawned >= totalWaveEnemies && enemies.length === 0) {
    waveInProgress = false;
    laserBeams = [];
    // Day/Night toggle every 3 waves
    if (currentWave % 3 === 0) {
      isNight = !isNight;
      nightTransition = isNight ? 0 : 1;
    }
    const bonus = currentWave * 15;
    gold += bonus;
    score += bonus;
    addFloatingText(350, 300, 'Wave ' + currentWave + ' Clear! +' + bonus + ' gold', '#00ff88');
    sfxWaveClear();
    updateUI();
    // Open shop between waves
    if (!autoWave) shopOpen = true;
    // Endless mode: continue after maxWaves
    if (currentWave >= maxWaves && !endlessMode) {
      endlessMode = true;
      addFloatingText(350, 260, 'ENDLESS MODE ACTIVATED!', '#ff4444');
    }
    if (autoWave && currentWave < maxWaves) {
      setTimeout(() => { if (gameRunning && autoWave) startWave(); }, 1500);
    } else if (endlessMode && autoWave) {
      setTimeout(() => { if (gameRunning && autoWave) startWave(); }, 2000);
    }
    if (currentWave >= maxWaves && !endlessMode) {
      // Will enter endless mode next call
    } else if (currentWave >= maxWaves && endlessMode && !autoWave) {
      // Wait for player to start next wave or use shop
    }
  }
}

// ═══════════════════════════════════════════════════════
// FIRE PROJECTILE
// ═══════════════════════════════════════════════════════
function fireProjectile(tower, target, dmgBoost) {
  const angle = Math.atan2(target.y - tower.y, target.x - tower.x);
  let dmg = tower.damage * (1 + shopUpgrades.dmgBonus * 0.1);
  if (dmgBoost) dmg = Math.floor(dmg * 1.5);
  projectiles.push({
    x: tower.x, y: tower.y, angle,
    speed: tower.projectileSpeed, damage: dmg,
    color: tower.projectileColor,
    splash: tower.splash, slow: tower.slow,
    chain: tower.chain, poison: tower.poison,
    sourceTower: tower
  });
}

// ═══════════════════════════════════════════════════════
// DRAW
// ═══════════════════════════════════════════════════════
function draw() {
  ctx.save();
  if (shakeAmount > 0) {
    const sx = (Math.random() - 0.5) * shakeAmount * 2;
    const sy = (Math.random() - 0.5) * shakeAmount * 2;
    ctx.translate(sx, sy);
  }
  if (currentMap === 'backrooms') { drawBackroomsBackground(); } else if (currentMap === 'zigzag') { drawZigzagPondBackground(); } else { drawNatureBackground(); }
  drawPath();
  drawPowerUps();
  drawTowers();
  drawEnemies();
  drawProjectiles();
  drawLaserBeams();
  drawParticles();
  drawFloatingTexts();
  drawPlacementPreview();
  drawWaveAnnouncement();
  drawMiniMap();
  drawDayNightOverlay();
  if (shopOpen) drawShop();
  ctx.restore();
}
function drawLaserBeams() {
  laserBeams.forEach(beam => {
    ctx.save();
    ctx.strokeStyle = beam.color || '#ff0000';
    ctx.lineWidth = 4;
    ctx.shadowColor = beam.color || '#ff0000';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(beam.x1, beam.y1);
    ctx.lineTo(beam.x2, beam.y2);
    ctx.stroke();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(beam.x1, beam.y1);
    ctx.lineTo(beam.x2, beam.y2);
    ctx.stroke();
    ctx.restore();
  });
}

function drawDayNightOverlay() {
  if (isNight) {
    if (nightTransition < 1) nightTransition = Math.min(1, nightTransition + 0.02);
  } else {
    if (nightTransition > 0) nightTransition = Math.max(0, nightTransition - 0.02);
  }
  if (nightTransition > 0) {
    ctx.fillStyle = 'rgba(10, 10, 50, ' + (nightTransition * 0.35) + ')';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Stars
    if (nightTransition > 0.5) {
      const starAlpha = (nightTransition - 0.5) * 2;
      ctx.fillStyle = 'rgba(255, 255, 255, ' + (starAlpha * 0.6) + ')';
      for (let i = 0; i < 30; i++) {
        const sx = (i * 137.5 + 50) % canvas.width;
        const sy = (i * 97.3 + 20) % (canvas.height * 0.4);
        ctx.beginPath();
        ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  // Day/Night indicator
  ctx.save();
  ctx.font = '14px Arial';
  ctx.textAlign = 'right';
  ctx.fillStyle = isNight ? '#8888ff' : '#ffcc00';
  ctx.fillText(isNight ? '🌙 Night' : '☀ Day', canvas.width - 10, 20);
  if (endlessMode) {
    ctx.fillStyle = '#ff4444';
    ctx.fillText('∞ Endless Wave ' + currentWave, canvas.width - 10, 40);
  }
  ctx.restore();
}

function drawShop() {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(50, 50, canvas.width - 100, canvas.height - 100);
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 3;
  ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100);
  // Close button (X) - top right corner of shop panel
  const closeBtnX = canvas.width - 100;
  const closeBtnY = 45;
  const closeBtnW = 50;
  const closeBtnH = 50;
  ctx.fillStyle = 'rgba(200, 0, 0, 0.8)';
  ctx.fillRect(closeBtnX, closeBtnY, closeBtnW, closeBtnH);
  ctx.strokeStyle = '#ff4444';
  ctx.lineWidth = 2;
  ctx.strokeRect(closeBtnX, closeBtnY, closeBtnW, closeBtnH);
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.fillText('X', closeBtnX + closeBtnW / 2, closeBtnY + closeBtnH / 2);
  ctx.textBaseline = 'alphabetic';
  ctx.font = 'bold 22px Arial';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd700';
  ctx.fillText('SHOP', canvas.width / 2, 85);
  ctx.font = '14px Arial';
  ctx.fillStyle = '#aaa';
  ctx.fillText('Gold: ' + gold, canvas.width / 2, 108);
  const items = SHOP_ITEMS;
  const startY = 130;
  const itemH = 55;
  items.forEach((item, i) => {
    const y = startY + i * itemH;
    const level = shopUpgrades[item.key];
    const maxed = level >= item.maxLevel;
    const cost = item.baseCost + level * item.costInc;
    const canBuy = gold >= cost && !maxed;
    ctx.fillStyle = canBuy ? 'rgba(0, 100, 0, 0.5)' : 'rgba(80, 0, 0, 0.5)';
    ctx.fillRect(80, y, canvas.width - 160, itemH - 5);
    ctx.strokeStyle = canBuy ? '#00ff88' : '#ff4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(80, y, canvas.width - 160, itemH - 5);
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.fillText(item.name, 100, y + 22);
    ctx.font = '12px Arial';
    ctx.fillStyle = '#aaa';
    ctx.fillText(item.desc, 100, y + 40);
    ctx.textAlign = 'right';
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = maxed ? '#888' : '#ffd700';
    ctx.fillText(maxed ? 'MAX' : cost + ' gold', canvas.width - 100, y + 22);
    ctx.font = '11px Arial';
    ctx.fillStyle = '#888';
    ctx.fillText('Lv ' + level + '/' + item.maxLevel, canvas.width - 100, y + 40);
  });
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#888';
  ctx.fillText('Tap an item to buy | Tap X or press S/ESC to close', canvas.width / 2, canvas.height - 65);
  ctx.restore();
}
function openShop() { shopOpen = true; }
function closeShop() { shopOpen = false; }

function buyShopItem(index) {
  const item = SHOP_ITEMS[index];
  if (!item) return;
  const level = shopUpgrades[item.key];
  if (level >= item.maxLevel) return;
  const cost = item.baseCost + level * item.costInc;
  if (gold < cost) return;
  gold -= cost;
  shopUpgrades[item.key]++;
  addFloatingText(350, 300, item.name + ' upgraded!', '#ffd700');
  sfxPlace();
  updateUI();
}

// ── Draw Power-ups on Map ──
function drawPowerUps() {
  if (!powerUpOnMap) return;
  const pu = powerUpOnMap;
  pu.pulse = (pu.pulse + 0.05) % (Math.PI * 2);
  const pulseSize = 18 + Math.sin(pu.pulse) * 4;
  ctx.beginPath();
  ctx.arc(pu.x, pu.y, pulseSize + 8, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(pu.x, pu.y, pulseSize, 0, Math.PI * 2);
  const grad = ctx.createRadialGradient(pu.x, pu.y, 0, pu.x, pu.y, pulseSize);
  grad.addColorStop(0, '#ffd700');
  grad.addColorStop(1, '#b8860b');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.font = '18px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(POWER_UP_ICONS[pu.type], pu.x, pu.y);
}

function drawTowers() {
  towers.forEach(tower => {
    const isSelected = selectedTower === tower;
    const type = TOWER_TYPES[tower.type];
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    // Buff tower radius on hover
    if (type.isBuff && isSelected) {
      const bRadius = type.buffRadius + (tower.level - 1) * (type.upgradeRange || 0);
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, bRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 215, 0, 0.08)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.beginPath();
    ctx.arc(tower.x, tower.y, 22, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(tower.x - 5, tower.y - 5, 0, tower.x, tower.y, 22);
    gradient.addColorStop(0, tower.color);
    gradient.addColorStop(1, '#222');
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = isSelected ? '#00ff88' : '#fff';
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.stroke();
    if (tower.level > 1) {
      ctx.font = '8px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd700';
      ctx.fillText('★'.repeat(tower.level - 1), tower.x, tower.y + 32);
    }
    ctx.save();
    ctx.translate(tower.x, tower.y);
    ctx.rotate(tower.angle);
    ctx.fillStyle = '#333';
    ctx.fillRect(0, -5, 25, 10);
    ctx.restore();
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(type.icon, tower.x, tower.y);
  });
}

function drawEnemies() {
  enemies.forEach(enemy => {
    // Flying enemies: draw shadow on ground and wings
    if (enemy.flying) {
      ctx.beginPath();
      ctx.ellipse(enemy.x, enemy.y + enemy.size + 8, enemy.size * 0.6, enemy.size * 0.2, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fill();
      // Wings
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      const wingFlap = Math.sin(Date.now() * 0.01) * 0.3;
      ctx.fillStyle = 'rgba(135, 206, 235, 0.6)';
      ctx.beginPath();
      ctx.ellipse(-enemy.size, -2, enemy.size * 0.8, enemy.size * 0.3 * (1 + wingFlap), -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(enemy.size, -2, enemy.size * 0.8, enemy.size * 0.3 * (1 - wingFlap), 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.ellipse(enemy.x, enemy.y + enemy.size, enemy.size * 0.8, enemy.size * 0.3, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(enemy.x - enemy.size * 0.3, enemy.y - enemy.size * 0.3, 0, enemy.x, enemy.y, enemy.size);
    gradient.addColorStop(0, enemy.color);
    gradient.addColorStop(1, '#111');
    ctx.fillStyle = gradient;
    ctx.fill();
    let borderColor = '#fff';
    if (enemy.frozenTimer > 0) borderColor = '#00ffff';
    else if (enemy.slowTimer > 0) borderColor = '#00ccff';
    else if (enemy.poisonTimer > 0) borderColor = '#7cfc00';
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    if (enemy.frozenTimer > 0) {
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.size + 3, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🧊', enemy.x, enemy.y);
    }
    if (enemy.type === 'healer') {
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, 80, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 255, 136, 0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    if (enemy.type === 'boss') {
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('👑', enemy.x, enemy.y - enemy.size - 8);
    }
    if (enemy.flying) {
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('✈', enemy.x, enemy.y - enemy.size - 8);
    }
    const hpWidth = enemy.size * 2, hpHeight = 4;
    const hpX = enemy.x - hpWidth / 2, hpY = enemy.y - enemy.size - 10;
    ctx.fillStyle = '#333';
    ctx.fillRect(hpX, hpY, hpWidth, hpHeight);
    const hpRatio = enemy.hp / enemy.maxHp;
    ctx.fillStyle = hpRatio > 0.5 ? '#00ff00' : hpRatio > 0.25 ? '#ffaa00' : '#ff0000';
    ctx.fillRect(hpX, hpY, hpWidth * hpRatio, hpHeight);
  });
}

function drawProjectiles() {
  projectiles.forEach(proj => {
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = proj.color;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = proj.color + '44';
    ctx.fill();
  });
}

function drawParticles() {
  particles.forEach(p => {
    ctx.globalAlpha = p.life;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawFloatingTexts() {
  floatingTexts.forEach(ft => {
    ctx.globalAlpha = ft.life;
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.x, ft.y);
  });
  ctx.globalAlpha = 1;
}

function drawPlacementPreview() {
  if (!selectedTowerType || !gameRunning) {
    canvas.style.cursor = selectedTower ? 'default' : 'default';
    return;
  }
  canvas.style.cursor = 'crosshair';
  const type = TOWER_TYPES[selectedTowerType];
  ctx.beginPath();
  ctx.arc(mouseX, mouseY, type.range, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = 'rgba(0, 255, 255, 0.05)';
  ctx.fill();
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.arc(mouseX, mouseY, 22, 0, Math.PI * 2);
  ctx.fillStyle = type.color;
  ctx.fill();
  ctx.strokeStyle = '#00ff88';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

// ── Wave Announcement ──
let waveAnnounceTimer = 0;
let waveAnnounceText = '';

function drawWaveAnnouncement() {
  if (waveAnnounceTimer <= 0) return;
  waveAnnounceTimer--;
  const alpha = Math.min(1, waveAnnounceTimer / 30);
  ctx.globalAlpha = alpha;
  ctx.font = 'bold 36px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#00ff88';
  ctx.shadowColor = '#00ff88';
  ctx.shadowBlur = 20;
  ctx.fillText(waveAnnounceText, canvas.width / 2, canvas.height / 2);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

// ═══════════════════════════════════════════════════════
// END GAME
// ═══════════════════════════════════════════════════════
function endGame(victory) {
  gameRunning = false;
  cancelAnimationFrame(animationId);
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('tdHighScore', highScore.toString());
  }
  if (victory) sfxVictory();
  else sfxGameOver();
  gameOverlay.classList.remove('hidden');
  gameOverlay.classList.add(victory ? 'victory' : 'defeat');
  gameOverlay.querySelector('h1').textContent = victory ? '🎉 Victory!' : '💀 Defeat';
  const waveText = endlessMode ? 'You reached endless wave ' + currentWave + '!' : (victory ? 'You survived all ' + maxWaves + ' waves!' : 'You reached wave ' + currentWave);
  gameOverlay.querySelector('p').textContent = waveText;
  document.getElementById('finalScore').textContent = 'Score: ' + score + ' | Kills: ' + killCount + ' | 🏆 Best: ' + highScore;
}

// ═══════════════════════════════════════════════════════
// GAME LOOP
// ═══════════════════════════════════════════════════════
function gameLoop() {
  update();
  draw();
  animationId = requestAnimationFrame(gameLoop);
}

// ═══════════════════════════════════════════════════════
// HELPER: Get canvas-relative coordinates from a touch/click
// ═══════════════════════════════════════════════════════
function getCanvasCoords(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left) * (canvas.width / rect.width),
    y: (clientY - rect.top) * (canvas.height / rect.height)
  };
}

// ═══════════════════════════════════════════════════════
// CANVAS CLICK / TAP HANDLER
// ═══════════════════════════════════════════════════════
function handleCanvasInteraction(x, y) {
  if (!gameRunning) return;
  if (shopOpen) {
    // Close button hit test
    const closeBtnX = canvas.width - 100;
    const closeBtnY = 45;
    const closeBtnW = 50;
    const closeBtnH = 50;
    if (x >= closeBtnX && x <= closeBtnX + closeBtnW && y >= closeBtnY && y <= closeBtnY + closeBtnH) {
      closeShop();
      return;
    }
    const items = SHOP_ITEMS;
    const startY = 130;
    const itemH = 55;
    for (let i = 0; i < items.length; i++) {
      const iy = startY + i * itemH;
      if (x >= 80 && x <= canvas.width - 80 && y >= iy && y <= iy + itemH - 5) {
        buyShopItem(i);
        return;
      }
    }
    return;
  }
  if (powerUpOnMap && Math.hypot(x - powerUpOnMap.x, y - powerUpOnMap.y) < 25) {
    collectPowerUp(powerUpOnMap);
    return;
  }
  if (selectedTowerType) {
    placeTower(x, y);
  } else {
    let clicked = null;
    towers.forEach(tower => {
      if (Math.hypot(x - tower.x, y - tower.y) < 25) clicked = tower;
    });
    if (clicked) {
      showTowerInfo(clicked);
    } else {
      hideTowerInfo();
      updateUI();
    }
  }
}

// ── Mouse Events ──
canvas.addEventListener('click', e => {
  initAudio();
  const { x, y } = getCanvasCoords(e.clientX, e.clientY);
  handleCanvasInteraction(x, y);
});

canvas.addEventListener('mousemove', e => {
  const { x, y } = getCanvasCoords(e.clientX, e.clientY);
  mouseX = x;
  mouseY = y;
});

// ── Touch Events ──
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  initAudio();
  const touch = e.touches[0];
  const { x, y } = getCanvasCoords(touch.clientX, touch.clientY);
  mouseX = x;
  mouseY = y;
  handleCanvasInteraction(x, y);
}, { passive: false });

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  const touch = e.touches[0];
  const { x, y } = getCanvasCoords(touch.clientX, touch.clientY);
  mouseX = x;
  mouseY = y;
}, { passive: false });

canvas.addEventListener('touchend', e => {
  e.preventDefault();
}, { passive: false });

// ── Button Events ──
restartBtn.addEventListener('click', init);
lobbyBtn.addEventListener('click', goToLobby);
startWaveBtn.addEventListener('click', startWave);
upgradeBtn.addEventListener('click', upgradeTower);
sellBtn.addEventListener('click', sellTower);
speedBtns.forEach(btn => {
  btn.addEventListener('click', () => setSpeed(parseInt(btn.dataset.speed)));
});

// ── Keyboard shortcuts ──
document.addEventListener('keydown', e => {
  if (e.key === '1') selectTower('arrow');
  if (e.key === '2') selectTower('cannon');
  if (e.key === '3') selectTower('ice');
  if (e.key === '4') selectTower('lightning');
  if (e.key === '5') selectTower('sniper');
  if (e.key === '6') selectTower('poison'); if (e.key === '7') selectTower('laser'); if (e.key === '8') selectTower('buff'); if (e.key === 's' || e.key === 'S') { if (shopOpen) closeShop(); else if (!waveInProgress) openShop(); }
  if (e.key === ' ') { e.preventDefault(); startWave(); }
  if (e.key === 'Escape') { selectedTowerType = null; hideTowerInfo(); updateUI(); }
});

// ═══════════════════════════════════════════════════════
// INITIAL — Show Lobby
// ═══════════════════════════════════════════════════════
document.getElementById('lobbyHighScore').textContent = '🏆 Best Score: ' + highScore;
document.getElementById('gameContainer').classList.add('hidden');

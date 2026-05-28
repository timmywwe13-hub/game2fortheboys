// ═══════════════════════════════════════════════════════
//  TOWER DEFENSE — game.js
// ═══════════════════════════════════════════════════════

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameOverlay = document.getElementById('gameOverlay');
const goldDisplay = document.getElementById('goldDisplay');
const livesDisplay = document.getElementById('livesDisplay');
const waveDisplay = document.getElementById('waveDisplay');
const scoreDisplay = document.getElementById('scoreDisplay');
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
let currentWave = 0;
let maxWaves = 15;
let waveInProgress = false;
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

// ── NEW: Lobby / Difficulty / Map ──
let difficulty = 'normal';
let currentMap = 'classic';
let autoWave = false;

// ── NEW: Power-ups ──
let activePowerUp = null;   // { type, timer, maxTimer }
let powerUpSpawnTimer = 0;
let powerUpOnMap = null;    // { x, y, type }
const POWER_UP_TYPES = ['doubleGold', 'damageBoost', 'heal', 'freeze'];
const POWER_UP_ICONS = { doubleGold: '💰', damageBoost: '🔥', heal: '❤️', freeze: '🧊' };
const POWER_UP_DURATION = 480; // 8 seconds at 60fps

// ── NEW: Combo System ──
let comboCount = 0;
let comboTimer = 0;
const COMBO_TIMEOUT = 120; // 2 seconds to keep combo alive

// ── NEW: Critical Hits ──
const CRIT_CHANCE = 0.12; // 12%
const CRIT_MULTIPLIER = 2.5;

// ── NEW: High Score ──
let highScore = parseInt(localStorage.getItem('tdHighScore') || '0');

// ── NEW: Map Paths ──
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
    { x: 300, y: 400 }, { x: 300, y: 300 }, { x: 700, y: 300 }
  ]
};

let PATH = MAP_PATHS.classic;

// ── Difficulty Settings ──
const DIFFICULTY_SETTINGS = {
  easy:   { goldMult: 1.5, hpMult: 0.7, livesBonus: 10, scoreMult: 0.8 },
  normal: { goldMult: 1.0, hpMult: 1.0, livesBonus: 0,  scoreMult: 1.0 },
  hard:   { goldMult: 0.7, hpMult: 1.5, livesBonus: -5, scoreMult: 1.5 }
};

// ── Tower Definitions ──
const TOWER_TYPES = {
  arrow:     { cost: 50,  damage: 15, range: 120, fireRate: 20, color: '#8b4513', name: 'Arrow Tower',     projectileColor: '#ffd700', projectileSpeed: 8,  icon: '🏹', desc: 'Fast attack, low damage',           upgradeCost: 40,  upgradeDmg: 10, upgradeRange: 15 },
  cannon:    { cost: 100, damage: 50, range: 100, fireRate: 60, color: '#444',    name: 'Cannon Tower',    projectileColor: '#ff4500', projectileSpeed: 5,  splash: 40, icon: '💣', desc: 'Slow attack, high damage + splash', upgradeCost: 75,  upgradeDmg: 25, upgradeRange: 10 },
  ice:       { cost: 75,  damage: 20, range: 110, fireRate: 35, color: '#00bfff', name: 'Ice Tower',       projectileColor: '#00ffff', projectileSpeed: 6,  slow: 0.5, icon: '❄️', desc: 'Slows enemies, medium damage',      upgradeCost: 55,  upgradeDmg: 8,  upgradeRange: 12 },
  lightning: { cost: 150, damage: 30, range: 150, fireRate: 50, color: '#9932cc', name: 'Lightning Tower',  projectileColor: '#ffff00', projectileSpeed: 20, chain: 3,  icon: '⚡', desc: 'Chain lightning to 3 enemies',      upgradeCost: 100, upgradeDmg: 15, upgradeRange: 15 },
  sniper:    { cost: 125, damage: 80, range: 250, fireRate: 90, color: '#2e8b57', name: 'Sniper Tower',    projectileColor: '#ff00ff', projectileSpeed: 15, icon: '🎯', desc: 'Very long range, massive damage',    upgradeCost: 90,  upgradeDmg: 40, upgradeRange: 20 },
  poison:    { cost: 90,  damage: 8,  range: 100, fireRate: 25, color: '#32cd32', name: 'Poison Tower',    projectileColor: '#7cfc00', projectileSpeed: 7,  poison: 3, icon: '☠️', desc: 'Poisons enemies — damage over time', upgradeCost: 60,  upgradeDmg: 4,  upgradeRange: 10 }
};

// ── Enemy Types ──
const ENEMY_TYPES = {
  basic:  { hp: 80,  speed: 1.5, reward: 10,  color: '#ff6b6b', size: 15, name: 'Grunt' },
  fast:   { hp: 50,  speed: 3,   reward: 15,  color: '#ffff00', size: 12, name: 'Scout' },
  tank:   { hp: 300, speed: 0.8, reward: 30,  color: '#8b0000', size: 22, name: 'Brute' },
  healer: { hp: 120, speed: 1.2, reward: 25,  color: '#00ff88', size: 16, name: 'Medic' },
  boss:   { hp: 1000,speed: 0.5, reward: 100,color: '#4a0080', size: 30, name: 'Overlord' }
};

// ═══════════════════════════════════════════════════════
// LOBBY
// ═══════════════════════════════════════════════════════
function setDifficulty(diff) {
  difficulty = diff;
  document.querySelectorAll('.diff-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.diff === diff));
}

function setMap(map) {
  currentMap = map;
  document.querySelectorAll('.map-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.map === map));
}

function startGame() {
  document.getElementById('lobby').classList.add('hidden');
  document.getElementById('gameContainer').classList.remove('hidden');
  PATH = MAP_PATHS[currentMap];
  init();
}

function goToLobby() {
  gameRunning = false;
  cancelAnimationFrame(animationId);
  document.getElementById('gameContainer').classList.add('hidden');
  document.getElementById('lobby').classList.remove('hidden');
  document.getElementById('lobbyHighScore').textContent = '🏆 Best Score: ' + highScore;
}

// ═══════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════
function init() {
  const diff = DIFFICULTY_SETTINGS[difficulty];
  gold = Math.floor(100 * diff.goldMult);
  lives = 20 + diff.livesBonus;
  score = 0;
  currentWave = 0;
  waveInProgress = false;
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
  waveDisplay.textContent = currentWave + ' / ' + maxWaves;
  scoreDisplay.textContent = score;
  startWaveBtn.disabled = waveInProgress;
  startWaveBtn.textContent = waveInProgress
    ? '⚔️ Wave in Progress...'
    : (autoWave ? '⚔️ Auto: ON (click to toggle)' : '⚔️ Start Wave (click to toggle auto)');
  towerBtns.forEach(btn => {
    const type = btn.dataset.tower;
    if (TOWER_TYPES[type]) {
      btn.disabled = gold < TOWER_TYPES[type].cost;
      btn.classList.toggle('selected', selectedTowerType === type);
    }
  });
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
  hideTowerInfo();
  updateUI();
}

function setSpeed(speed) {
  gameSpeed = speed;
  updateSpeedButtons();
}

function updateSpeedButtons() {
  speedBtns.forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.speed) === gameSpeed);
  });
}

// ── Power-up UI ──
function updatePowerUpUI() {
  if (activePowerUp) {
    puIndicator.textContent = POWER_UP_ICONS[activePowerUp.type] + ' ' + activePowerUp.type;
    puIndicator.classList.add('active');
    const pct = (activePowerUp.timer / activePowerUp.maxTimer) * 100;
    puTimerFill.style.width = pct + '%';
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
    const mult = getComboMultiplier();
    comboMultEl.textContent = 'x' + mult.toFixed(1);
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
  if (waveInProgress || currentWave >= maxWaves) {
    // Toggle auto-wave if not in progress
    if (!waveInProgress && currentWave < maxWaves) {
      autoWave = !autoWave;
      updateUI();
    }
    return;
  }
  autoWave = !autoWave || autoWave; // keep auto if already on
  currentWave++;
  waveInProgress = true;
  updateUI();
  spawnWave();
}

function spawnWave() {
  const enemyCount = 5 + currentWave * 2;
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
      if (currentWave >= 8 && i === enemyCount - 1) type = 'boss';
      spawnEnemy(type);
      enemiesSpawned++;
    }, spawnDelay);
    // BUG FIX: clamp spawn delay so it never goes below 200ms
    spawnDelay += Math.max(200, 800 - currentWave * 30);
  }
}

function spawnEnemy(type) {
  const template = ENEMY_TYPES[type];
  const diff = DIFFICULTY_SETTINGS[difficulty];
  const hpMult = (1 + currentWave * 0.15) * diff.hpMult;
  enemies.push({
    x: PATH[0].x, y: PATH[0].y,
    hp: template.hp * hpMult,
    maxHp: template.hp * hpMult,
    speed: template.speed,
    reward: template.reward,
    color: template.color,
    size: template.size,
    pathIndex: 0,
    slowTimer: 0, slowAmount: 1,
    poisonTimer: 0, poisonDmg: 0,
    type: type,
    frozen: false, frozenTimer: 0
  });
}

// ═══════════════════════════════════════════════════════
// TOWER PLACEMENT
// ═══════════════════════════════════════════════════════
function placeTower(x, y) {
  if (!selectedTowerType) return;
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
  }
}

function updateEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];

    // Frozen — can't move
    if (enemy.frozenTimer > 0) {
      enemy.frozenTimer--;
      if (enemy.frozenTimer <= 0) enemy.frozen = false;
      continue; // skip movement
    }

    // Poison tick
    if (enemy.poisonTimer > 0) {
      enemy.hp -= enemy.poisonDmg;
      enemy.poisonTimer--;
      if (enemy.poisonTimer % 10 === 0) createParticles(enemy.x, enemy.y, '#7cfc00', 2);
    }

    // Slow
    let speed = enemy.speed;
    if (enemy.slowTimer > 0) { speed *= enemy.slowAmount; enemy.slowTimer--; }

    // Healer ability
    if (enemy.type === 'healer') {
      enemies.forEach(e => {
        if (e !== enemy && e.hp > 0 && Math.hypot(e.x - enemy.x, e.y - enemy.y) < 80) {
          e.hp = Math.min(e.maxHp, e.hp + 0.3);
        }
      });
    }

    // Move towards next waypoint
    const target = PATH[enemy.pathIndex + 1];
    if (!target) {
      enemies.splice(i, 1);
      lives--;
      updateUI();
      if (lives <= 0) endGame(false);
      continue;
    }
    const dx = target.x - enemy.x;
    const dy = target.y - enemy.y;
    const dist = Math.hypot(dx, dy);
    if (dist < speed) { enemy.pathIndex++; }
    else { enemy.x += (dx / dist) * speed; enemy.y += (dy / dist) * speed; }
  }
}

function updateTowers() {
  const dmgBoost = activePowerUp && activePowerUp.type === 'damageBoost';
  towers.forEach(tower => {
    tower.cooldown = Math.max(0, tower.cooldown - 1);
    if (tower.cooldown === 0) {
      let target = null;
      let minDist = tower.range;
      enemies.forEach(enemy => {
        const dist = Math.hypot(enemy.x - tower.x, enemy.y - tower.y);
        if (dist < minDist) { minDist = dist; target = enemy; }
      });
      if (target) {
        tower.angle = Math.atan2(target.y - tower.y, target.x - tower.x);
        fireProjectile(tower, target, dmgBoost);
        tower.cooldown = tower.fireRate;
      }
    }
  });
}

function updateProjectiles() {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const proj = projectiles[i];
    proj.x += Math.cos(proj.angle) * proj.speed;
    proj.y += Math.sin(proj.angle) * proj.speed;

    for (let j = enemies.length - 1; j >= 0; j--) {
      const enemy = enemies[j];
      if (Math.hypot(enemy.x - proj.x, enemy.y - proj.y) < enemy.size + 5) {

        // ── NEW: Critical Hit ──
        let finalDmg = proj.damage;
        let isCrit = Math.random() < CRIT_CHANCE;
        if (isCrit) finalDmg = Math.floor(finalDmg * CRIT_MULTIPLIER);

        enemy.hp -= finalDmg;
        proj.sourceTower.kills = (proj.sourceTower.kills || 0);

        if (isCrit) {
          createParticles(enemy.x, enemy.y, '#ff00ff', 10);
          addFloatingText(enemy.x, enemy.y - 30, '💥CRIT! ' + finalDmg, '#ff00ff');
        }

        // Splash
        if (proj.splash) {
          enemies.forEach(e => {
            if (e !== enemy && Math.hypot(e.x - proj.x, e.y - proj.y) < proj.splash) {
              e.hp -= proj.damage * 0.5;
            }
          });
          createParticles(proj.x, proj.y, '#ff4500', 15);
        }

        // Slow
        if (proj.slow) { enemy.slowTimer = 60; enemy.slowAmount = proj.slow; }

        // Chain lightning
        if (proj.chain) {
          let chains = proj.chain - 1;
          let lastEnemy = enemy;
          while (chains > 0) {
            let nearest = null, nearestDist = 120;
            enemies.forEach(e => {
              if (e !== lastEnemy && e.hp > 0) {
                const d = Math.hypot(e.x - lastEnemy.x, e.y - lastEnemy.y);
                if (d < nearestDist) { nearestDist = d; nearest = e; }
              }
            });
            if (nearest) {
              nearest.hp -= proj.damage * 0.6;
              createParticles(nearest.x, nearest.y, '#ffff00', 5);
              lastEnemy = nearest; chains--;
            } else break;
          }
        }

        // Poison
        if (proj.poison) { enemy.poisonTimer = 90; enemy.poisonDmg = proj.poison; }

        createParticles(proj.x, proj.y, proj.color, 5);
        projectiles.splice(i, 1);
        break;
      }
    }

    // Off screen
    if (proj.x < -50 || proj.x > canvas.width + 50 || proj.y < -50 || proj.y > canvas.height + 50) {
      projectiles.splice(i, 1);
    }
  }
}

function checkDeadEnemies() {
  const diff = DIFFICULTY_SETTINGS[difficulty];
  const doubleGold = activePowerUp && activePowerUp.type === 'doubleGold';
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (enemies[i].hp <= 0) {
      const enemy = enemies[i];
      let reward = enemy.reward;
      if (doubleGold) reward *= 2;
      gold += reward;

      // ── NEW: Combo System ──
      comboCount++;
      comboTimer = COMBO_TIMEOUT;
      const comboMult = getComboMultiplier();
      const comboBonus = Math.floor(enemy.reward * (comboMult - 1));
      if (comboBonus > 0) {
        gold += comboBonus;
        score += comboBonus;
      }

      score += Math.floor(enemy.reward * 2 * diff.scoreMult);
      createParticles(enemy.x, enemy.y, enemy.color, 15);
      addFloatingText(enemy.x, enemy.y - 20, '+' + reward + '💰', '#ffd700');
      if (comboCount >= 3) {
        addFloatingText(enemy.x, enemy.y - 40, '🔥' + comboCount + ' COMBO x' + comboMult.toFixed(1), '#e040fb');
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
    p.x += p.vx; p.y += p.vy;
    p.life -= 0.03; p.size *= 0.95;
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

// ── NEW: Power-up Update ──
function updatePowerUps() {
  // Active power-up timer
  if (activePowerUp) {
    activePowerUp.timer--;
    if (activePowerUp.timer <= 0) {
      activePowerUp = null;
    }
    updatePowerUpUI();
  }

  // Spawn power-ups on the map periodically
  if (!powerUpOnMap && !waveInProgress) {
    powerUpSpawnTimer--;
    if (powerUpSpawnTimer <= 0) {
      spawnPowerUpOnMap();
    }
  }

  // Also spawn during waves but less frequently
  if (!powerUpOnMap && waveInProgress) {
    powerUpSpawnTimer--;
    if (powerUpSpawnTimer <= 0) {
      spawnPowerUpOnMap();
    }
  }
}

function spawnPowerUpOnMap() {
  // Find a random spot not on the path
  let x, y, valid;
  for (let attempt = 0; attempt < 50; attempt++) {
    x = 50 + Math.random() * (canvas.width - 100);
    y = 50 + Math.random() * (canvas.height - 100);
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
  powerUpSpawnTimer = 900 + Math.floor(Math.random() * 600); // 15-25 sec
}

function collectPowerUp(pu) {
  activePowerUp = { type: pu.type, timer: POWER_UP_DURATION, maxTimer: POWER_UP_DURATION };
  powerUpOnMap = null;

  // Immediate effects
  if (pu.type === 'heal') {
    lives = Math.min(lives + 5, 20 + DIFFICULTY_SETTINGS[difficulty].livesBonus);
    addFloatingText(350, 280, '❤️ +5 Lives!', '#ff6b6b');
  }
  if (pu.type === 'freeze') {
    enemies.forEach(e => { e.frozen = true; e.frozenTimer = 180; }); // 3 sec freeze
    addFloatingText(350, 280, '🧊 All Enemies Frozen!', '#00ffff');
    createParticles(350, 300, '#00ffff', 30);
  }
  if (pu.type === 'doubleGold') {
    addFloatingText(350, 280, '💰 Double Gold Active!', '#ffd700');
  }
  if (pu.type === 'damageBoost') {
    addFloatingText(350, 280, '🔥 Damage Boost Active!', '#ff4500');
  }

  createParticles(pu.x, pu.y, '#ffd700', 20);
  updateUI();
  updatePowerUpUI();
}

// ── NEW: Combo Update ──
function updateCombo() {
  if (comboTimer > 0) {
    comboTimer--;
    if (comboTimer <= 0) {
      comboCount = 0;
      updateComboUI();
    }
  }
}

// BUG FIX: wave only completes when all enemies spawned AND all enemies dead
function checkWaveComplete() {
  if (waveInProgress && enemiesSpawned >= totalWaveEnemies && enemies.length === 0) {
    waveInProgress = false;
    const bonus = currentWave * 15;
    gold += bonus;
    score += bonus;
    addFloatingText(350, 300, 'Wave ' + currentWave + ' Clear! +' + bonus + '💰', '#00ff88');
    updateUI();

    // ── NEW: Auto-wave ──
    if (autoWave && currentWave < maxWaves) {
      setTimeout(() => { if (gameRunning && autoWave) startWave(); }, 1500);
    }

    if (currentWave >= maxWaves) endGame(true);
  }
}

// ═══════════════════════════════════════════════════════
// FIRE PROJECTILE
// ═══════════════════════════════════════════════════════
function fireProjectile(tower, target, dmgBoost) {
  const angle = Math.atan2(target.y - tower.y, target.x - tower.x);
  let dmg = tower.damage;
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
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.07)';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
  for (let y = 0; y < canvas.height; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }

  drawPath();
  drawPowerUps();
  drawTowers();
  drawEnemies();
  drawProjectiles();
  drawParticles();
  drawFloatingTexts();
  drawPlacementPreview();
  drawWaveAnnouncement();
}

function drawPath() {
  ctx.strokeStyle = '#5d5d8c'; ctx.lineWidth = 44; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(PATH[0].x, PATH[0].y);
  for (let i = 1; i < PATH.length; i++) ctx.lineTo(PATH[i].x, PATH[i].y);
  ctx.stroke();

  ctx.strokeStyle = '#3d3d5c'; ctx.lineWidth = 40;
  ctx.beginPath(); ctx.moveTo(PATH[0].x, PATH[0].y);
  for (let i = 1; i < PATH.length; i++) ctx.lineTo(PATH[i].x, PATH[i].y);
  ctx.stroke();

  ctx.setLineDash([10, 15]); ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(PATH[0].x, PATH[0].y);
  for (let i = 1; i < PATH.length; i++) ctx.lineTo(PATH[i].x, PATH[i].y);
  ctx.stroke(); ctx.setLineDash([]);

  // Entry / Exit markers
  ctx.font = '20px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('🚪', PATH[0].x + 15, PATH[0].y);
  ctx.fillText('🏠', PATH[PATH.length - 1].x - 15, PATH[PATH.length - 1].y);
}

// ── NEW: Draw Power-ups on Map ──
function drawPowerUps() {
  if (!powerUpOnMap) return;
  const pu = powerUpOnMap;
  pu.pulse = (pu.pulse + 0.05) % (Math.PI * 2);
  const pulseSize = 18 + Math.sin(pu.pulse) * 4;

  // Glow
  ctx.beginPath(); ctx.arc(pu.x, pu.y, pulseSize + 8, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 215, 0, 0.15)'; ctx.fill();

  // Circle
  ctx.beginPath(); ctx.arc(pu.x, pu.y, pulseSize, 0, Math.PI * 2);
  const grad = ctx.createRadialGradient(pu.x, pu.y, 0, pu.x, pu.y, pulseSize);
  grad.addColorStop(0, '#ffd700'); grad.addColorStop(1, '#b8860b');
  ctx.fillStyle = grad; ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();

  // Icon
  ctx.font = '18px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(POWER_UP_ICONS[pu.type], pu.x, pu.y);
}

function drawTowers() {
  towers.forEach(tower => {
    const isSelected = selectedTower === tower;
    if (isSelected) {
      ctx.beginPath(); ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 255, 255, 0.1)'; ctx.fill();
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)'; ctx.lineWidth = 2; ctx.stroke();
    }

    // Tower base
    ctx.beginPath(); ctx.arc(tower.x, tower.y, 22, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(tower.x - 5, tower.y - 5, 0, tower.x, tower.y, 22);
    gradient.addColorStop(0, tower.color); gradient.addColorStop(1, '#222');
    ctx.fillStyle = gradient; ctx.fill();
    ctx.strokeStyle = isSelected ? '#00ff88' : '#fff';
    ctx.lineWidth = isSelected ? 3 : 2; ctx.stroke();

    // Level stars
    if (tower.level > 1) {
      ctx.font = '8px Arial'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffd700';
      ctx.fillText('★'.repeat(tower.level - 1), tower.x, tower.y + 32);
    }

    // Cannon
    ctx.save(); ctx.translate(tower.x, tower.y); ctx.rotate(tower.angle);
    ctx.fillStyle = '#333'; ctx.fillRect(0, -5, 25, 10); ctx.restore();

    // Icon
    ctx.font = '16px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(TOWER_TYPES[tower.type].icon, tower.x, tower.y);
  });
}

function drawEnemies() {
  enemies.forEach(enemy => {
    // Shadow
    ctx.beginPath(); ctx.ellipse(enemy.x, enemy.y + enemy.size, enemy.size * 0.8, enemy.size * 0.3, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; ctx.fill();

    // Body
    ctx.beginPath(); ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(
      enemy.x - enemy.size * 0.3, enemy.y - enemy.size * 0.3, 0,
      enemy.x, enemy.y, enemy.size
    );
    gradient.addColorStop(0, enemy.color); gradient.addColorStop(1, '#111');
    ctx.fillStyle = gradient; ctx.fill();

    // Border
    let borderColor = '#fff';
    if (enemy.frozenTimer > 0) borderColor = '#00ffff';
    else if (enemy.slowTimer > 0) borderColor = '#00ccff';
    else if (enemy.poisonTimer > 0) borderColor = '#7cfc00';
    ctx.strokeStyle = borderColor; ctx.lineWidth = 2; ctx.stroke();

    // Frozen overlay
    if (enemy.frozenTimer > 0) {
      ctx.beginPath(); ctx.arc(enemy.x, enemy.y, enemy.size + 3, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)'; ctx.lineWidth = 3; ctx.stroke();
      ctx.font = '12px Arial'; ctx.textAlign = 'center';
      ctx.fillText('🧊', enemy.x, enemy.y);
    }

    // Healer aura
    if (enemy.type === 'healer') {
      ctx.beginPath(); ctx.arc(enemy.x, enemy.y, 80, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 255, 136, 0.2)'; ctx.lineWidth = 2; ctx.stroke();
    }

    // Boss crown
    if (enemy.type === 'boss') {
      ctx.font = '14px Arial'; ctx.textAlign = 'center';
      ctx.fillText('👑', enemy.x, enemy.y - enemy.size - 8);
    }

    // HP bar
    const hpWidth = enemy.size * 2, hpHeight = 4;
    const hpX = enemy.x - hpWidth / 2, hpY = enemy.y - enemy.size - 10;
    ctx.fillStyle = '#333'; ctx.fillRect(hpX, hpY, hpWidth, hpHeight);
    const hpRatio = enemy.hp / enemy.maxHp;
    ctx.fillStyle = hpRatio > 0.5 ? '#00ff00' : hpRatio > 0.25 ? '#ffaa00' : '#ff0000';
    ctx.fillRect(hpX, hpY, hpWidth * hpRatio, hpHeight);
  });
}

function drawProjectiles() {
  projectiles.forEach(proj => {
    ctx.beginPath(); ctx.arc(proj.x, proj.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = proj.color; ctx.fill();
    ctx.beginPath(); ctx.arc(proj.x, proj.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = proj.color + '44'; ctx.fill();
  });
}

function drawParticles() {
  particles.forEach(p => {
    ctx.globalAlpha = p.life;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = p.color; ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawFloatingTexts() {
  floatingTexts.forEach(ft => {
    ctx.globalAlpha = ft.life;
    ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center';
    ctx.fillStyle = ft.color; ctx.fillText(ft.text, ft.x, ft.y);
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
  ctx.beginPath(); ctx.arc(mouseX, mouseY, type.range, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = 'rgba(0, 255, 255, 0.05)'; ctx.fill();
  ctx.globalAlpha = 0.5;
  ctx.beginPath(); ctx.arc(mouseX, mouseY, 22, 0, Math.PI * 2);
  ctx.fillStyle = type.color; ctx.fill();
  ctx.strokeStyle = '#00ff88'; ctx.lineWidth = 2; ctx.stroke();
  ctx.globalAlpha = 1;
}

// ── NEW: Wave Announcement ──
let waveAnnounceTimer = 0;
let waveAnnounceText = '';

function drawWaveAnnouncement() {
  if (waveAnnounceTimer <= 0) return;
  waveAnnounceTimer--;
  const alpha = Math.min(1, waveAnnounceTimer / 30);
  ctx.globalAlpha = alpha;
  ctx.font = 'bold 36px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#00ff88';
  ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 20;
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

  // ── NEW: High Score ──
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('tdHighScore', highScore.toString());
  }

  gameOverlay.classList.remove('hidden');
  gameOverlay.classList.add(victory ? 'victory' : 'defeat');
  gameOverlay.querySelector('h1').textContent = victory ? '🎉 Victory!' : '💀 Defeat';
  gameOverlay.querySelector('p').textContent = victory
    ? 'You survived all ' + maxWaves + ' waves!'
    : 'You reached wave ' + currentWave;
  document.getElementById('finalScore').textContent = 'Score: ' + score + '  |  🏆 Best: ' + highScore;
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
// EVENT LISTENERS
// ═══════════════════════════════════════════════════════
canvas.addEventListener('click', e => {
  if (!gameRunning) return;
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);

  // ── NEW: Check power-up collection ──
  if (powerUpOnMap) {
    if (Math.hypot(x - powerUpOnMap.x, y - powerUpOnMap.y) < 25) {
      collectPowerUp(powerUpOnMap);
      return;
    }
  }

  if (selectedTowerType) {
    placeTower(x, y);
  } else {
    let clicked = null;
    towers.forEach(tower => { if (Math.hypot(x - tower.x, y - tower.y) < 25) clicked = tower; });
    if (clicked) {
      showTowerInfo(clicked);
    } else if (selectedTowerType) {
      placeTower(x, y);
    } else {
      hideTowerInfo();
      updateUI();
    }
  }
});

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
  mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
});

restartBtn.addEventListener('click', init);
lobbyBtn.addEventListener('click', goToLobby);
startWaveBtn.addEventListener('click', startWave);
upgradeBtn.addEventListener('click', upgradeTower);
sellBtn.addEventListener('click', sellTower);
speedBtns.forEach(btn => { btn.addEventListener('click', () => setSpeed(parseInt(btn.dataset.speed))); });

// ── Keyboard shortcuts ──
document.addEventListener('keydown', e => {
  if (e.key === '1') selectTower('arrow');
  if (e.key === '2') selectTower('cannon');
  if (e.key === '3') selectTower('ice');
  if (e.key === '4') selectTower('lightning');
  if (e.key === '5') selectTower('sniper');
  if (e.key === '6') selectTower('poison');
  if (e.key === ' ') { e.preventDefault(); startWave(); }
  if (e.key === 'Escape') { selectedTowerType = null; hideTowerInfo(); updateUI(); }
});

// ═══════════════════════════════════════════════════════
// INITIAL — Show Lobby
// ═══════════════════════════════════════════════════════
document.getElementById('lobbyHighScore').textContent = '🏆 Best Score: ' + highScore;
document.getElementById('gameContainer').classList.add('hidden');

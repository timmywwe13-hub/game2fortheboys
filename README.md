# 🏰 Tower Defense

A browser-based Tower Defense game built with vanilla HTML, CSS, and JavaScript. No dependencies required — just open `index.html` and play!

![Tower Defense Game](https://img.shields.io/badge/Status-Playable-brightgreen) ![HTML5](https://img.shields.io/badge/HTML5-Canvas-orange) ![No Dependencies](https://img.shields.io/badge/Dependencies-None-blue)

### 🎮 [Play Now!](https://timmywwe13-hub.github.io/game2fortheboys/)

**Live Demo:** [https://timmywwe13-hub.github.io/game2fortheboys/](https://timmywwe13-hub.github.io/game2fortheboys/)

## 🎮 Features

- **6 Tower Types** — Arrow, Cannon, Ice, Lightning, Sniper, and Poison towers, each with unique mechanics
- **5 Enemy Types** — Grunts, Scouts, Brutes, Medics (healers), and Overlords (bosses)
- **3 Maps** — Classic, Zigzag, and Spiral path layouts
- **3 Difficulty Levels** — Easy, Normal, and Hard with scaled stats and scoring
- **Tower Upgrades** — Upgrade towers up to Level 5 for increased damage and range
- **Sell Towers** — Sell back towers for 60% of their invested cost
- **Power-ups** — Collect randomly spawning power-ups: Double Gold, Damage Boost, Heal, and Freeze
- **Combo System** — Chain kills for score multipliers (up to 3x)
- **Critical Hits** — 12% chance for 2.5x damage
- **Boss Fights** — Boss enemies appear in later waves
- **High Scores** — Best score saved locally in your browser
- **Speed Controls** — Play at 1x, 2x, or 3x speed
- **Auto-Wave** — Toggle automatic wave launching
- **Keyboard Shortcuts** — Quick tower selection and wave control

## 🕹️ How to Play

1. Open `index.html` in any modern web browser
2. Choose your **difficulty** and **map** in the lobby
3. Click **🎮 Start Game**
4. Select a tower from the sidebar (or press keys **1–6**)
5. Click on the map to place your tower
6. Press **Space** or click **Start Wave** to send enemies
7. Click placed towers to **upgrade** or **sell** them
8. Collect **power-ups** that appear on the map by clicking them
9. Survive all **15 waves** to win!

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1` | Arrow Tower |
| `2` | Cannon Tower |
| `3` | Ice Tower |
| `4` | Lightning Tower |
| `5` | Sniper Tower |
| `6` | Poison Tower |
| `Space` | Start Wave / Toggle Auto-Wave |
| `Esc` | Deselect |

## 🗼 Tower Guide

| Tower | Cost | Description |
|-------|------|-------------|
| 🏹 Arrow | 50💰 | Fast attack, low damage |
| 💣 Cannon | 100💰 | Slow attack, high damage + splash |
| ❄️ Ice | 75💰 | Slows enemies, medium damage |
| ⚡ Lightning | 150💰 | Chain lightning hits up to 3 enemies |
| 🎯 Sniper | 125💰 | Very long range, massive damage |
| ☠️ Poison | 90💰 | Damage over time effect |

## 👾 Enemy Guide

| Enemy | Description |
|-------|-------------|
| 🔴 Grunt | Basic enemy, balanced stats |
| 🟡 Scout | Fast but fragile |
| 🔴 Brute | Slow but very tanky |
| 🟢 Medic | Heals nearby enemies |
| 🟣 Overlord | Boss — massive HP, appears in later waves |

## 🛠️ Tech Stack

- **HTML5 Canvas** for game rendering
- **Vanilla JavaScript** — zero dependencies
- **CSS3** with gradients, animations, and flexbox

## 📂 Project Structure

```
├── index.html    # Game layout and UI
├── style.css     # Styling and animations
├── game.js       # All game logic
├── README.md     # This file
├── LICENSE       # MIT License
└── .gitignore    # Git ignore rules
```

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

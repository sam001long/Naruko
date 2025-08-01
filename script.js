// script.js

// ----- 配置区 -----
const maxLevel = 8;       // 你的关卡数
const winTarget = 3;      // 连赢几把算过关
let levelOrder = [];      // 随机关卡序列
let orderIndex = 0;       // 当前序列索引

// 全局状态
let playerScore      = 0;
let cpuScore         = 0;
let roundEnded       = false;
let soundOn          = false;
let level            = 1;
let stageVisualIndex = 1;
let countdownActive  = true;

let audioBgm;

// 加权随机函数
function weightedRandom(weights) {
  const entries = Object.entries(weights);
  const total   = entries.reduce((sum, [, w]) => sum + w, 0);
  let r = Math.random() * total;
  for (const [move, w] of entries) {
    if (r < w) return move;
    r -= w;
  }
}

// ----- 初始化 -----
function initGame() {
  // 洗牌生成序列
  levelOrder = Array.from({ length: maxLevel }, (_, i) => i + 1);
  for (let i = levelOrder.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [levelOrder[i], levelOrder[j]] = [levelOrder[j], levelOrder[i]];
  }
  orderIndex = 0;
  level = levelOrder[orderIndex];
  playerScore = cpuScore = 0;
  stageVisualIndex = 1;

  // BGM 初始化
  audioBgm = document.getElementById('audioBgm');
  audioBgm.loop = true;
  audioBgm.muted = true;
  audioBgm.play().catch(() => {});

  updateAssets();
  startCountdown();
}

// ----- 切换音效 -----
function toggleSound() {
  soundOn = !soundOn;
  document.getElementById('soundToggle').innerText = soundOn ? '🔊' : '🔇';
  document.getElementById('soundHint').style.display = soundOn ? 'none' : 'block';
  audioBgm.muted = !soundOn;
}

// ----- 播放音效 -----
function playSound(id) {
  if (!soundOn) return;
  const a = document.getElementById(id);
  a.currentTime = 0;
  a.play().catch(() => {});
}

// ----- 更新背景/角色 & UI -----
function updateAssets() {
  const base = `assets/levels/level${level}/stage${stageVisualIndex}`;

  // 背景图/视频载入同之前...

  // 更新“第几关”与分数
  document.getElementById('sequenceDisplay').innerText = orderIndex + 1;
  document.getElementById('playerScore').innerText      = playerScore;
  document.getElementById('cpuScore').innerText         = cpuScore;
}

// ----- 倒计时 -----
function startCountdown() {
  countdownActive = true;
  roundEnded = true;
  document.getElementById('result').innerText = '';
  const cd = document.getElementById('countdown');
  let t = 3;
  cd.innerText = t;
  cd.style.display = 'block';
  const iv = setInterval(() => {
    if (--t > 0) {
      cd.innerText = t;
    } else {
      clearInterval(iv);
      cd.style.display = 'none';
      document.querySelectorAll('.cpu-slot, .player-hands img')
        .forEach(el => el.style.visibility = 'visible');
      document.getElementById('result').innerText = '請出拳！';
      countdownActive = false;
      roundEnded = false;
    }
  }, 500);
}

// ----- 玩家出拳 -----
function play(playerMove) {
  if (countdownActive || roundEnded) return;
  playSound('audioClick');

  // 玩家动画
  document.querySelectorAll('.player-hands img').forEach(el => {
    if (el.src.includes(`${playerMove}.png`)) {
      el.style.visibility = 'visible';
      el.classList.add('scale');
    } else {
      el.style.visibility = 'hidden';
    }
  });

  // CPU 出拳：三次抽样，但当偏置生效时保证一个拳两次
  const biased = (level >= 5); // 示例：第5关以后偏置
  let cpuChoices;
  if (biased) {
    // 抽一次主拳，再抽一次辅拳
    const primary = weightedRandom({ rock:1, paper:2, scissors:1 });
    const others  = ['rock','paper','scissors'].filter(m=>m!==primary);
    const secondary = others[Math.floor(Math.random()*2)];
    cpuChoices = [primary, primary, secondary];
  } else {
    // 平均分布，等概率三拳
    cpuChoices = ['rock','paper','scissors'];
  }
  // 随机打乱展示位置
  cpuChoices.sort(() => Math.random() - 0.5);

  // 显示到三个槽位
  cpuChoices.forEach((move, i) => {
    const slot = document.getElementById(`cpu-slot-${i+1}`);
    slot.src = `assets/${move}.png`;
    slot.alt = move;
    slot.style.visibility = 'visible';
    slot.classList.add('scale');
  });

  // 停掉动画
  setTimeout(() => {
    document.querySelectorAll('.cpu-slot, .player-hands img')
      .forEach(el => el.classList.remove('scale'));
  }, 300);

  // 判定胜负
  const cpuMove = cpuChoices[0]; // 以第一个为“官方”出拳判定
  let res;
  if (playerMove === cpuMove) {
    res = '平手！';
  } else if (
    (playerMove==='rock'     && cpuMove==='scissors') ||
    (playerMove==='scissors' && cpuMove==='paper')    ||
    (playerMove==='paper'    && cpuMove==='rock')
  ) {
    res = '你贏啦！';
    playerScore++;
    stageVisualIndex = Math.min(stageVisualIndex + 1, maxLevel);
  } else {
    res = '你輸囉！再來!';
    cpuScore++;
    stageVisualIndex = 1;
  }

  document.getElementById('result').innerText = res;
  playSound(res.startsWith('你贏') ? 'audioWin' : 'audioLose');
  updateAssets();

  roundEnded = true;
  document.getElementById('continue').style.display = 'block';
}

// ----- 继续 / 下一关 / 重来 -----
function resetRound() {
  const btn = document.getElementById('continue');

  // 失败
  if (cpuScore >= winTarget) {
    document.getElementById('result').innerText = '💀 挑戰失敗！';
    btn.innerText = '重新開始';
    btn.onclick = () => {
      btn.onclick = resetRound;
      btn.style.display = 'none';
      initGame();
    };
    btn.style.display = 'block';
    return;
  }

  // 胜利或所有关卡打完逻辑同之前...
}

// 暴露给 HTML
window.initGame    = initGame;
window.toggleSound = toggleSound;
window.play        = play;
window.resetRound  = resetRound;

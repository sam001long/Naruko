// script.js

// ----- 配置区 -----
const maxLevel  = 8;
const winTarget = 3;
let levelOrder  = [];
let orderIndex  = 0;

// 游戏状态
let playerScore      = 0;
let cpuScore         = 0;
let roundEnded       = false;
let soundOn          = false;
let level            = 1;
let stageVisualIndex = 1;
let countdownActive  = true;

let audioBgm;

// 随机抽样
function weightedRandom(weights) {
  const entries = Object.entries(weights);
  const total   = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [move, w] of entries) {
    if (r < w) return move;
    r -= w;
  }
}

// 初始化
function initGame() {
  levelOrder = Array.from({ length: maxLevel }, (_, i) => i + 1);
  for (let i = levelOrder.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [levelOrder[i], levelOrder[j]] = [levelOrder[j], levelOrder[i]];
  }
  orderIndex = 0;
  level = levelOrder[orderIndex];
  playerScore = cpuScore = 0;
  stageVisualIndex = 1;

  audioBgm = document.getElementById('audioBgm');
  audioBgm.loop = true;
  audioBgm.muted = true;
  audioBgm.play().catch(() => {});

  updateAssets();
  startCountdown();
}

// 切换音效
function toggleSound() {
  soundOn = !soundOn;
  document.getElementById('soundToggle').innerText = soundOn ? '🔊' : '🔇';
  document.getElementById('soundHint').style.display = soundOn ? 'none' : 'block';
  audioBgm.muted = !soundOn;
}

// 播放音效
function playSound(id) {
  if (!soundOn) return;
  const a = document.getElementById(id);
  a.currentTime = 0;
  a.play().catch(() => {});
}

// 更新背景/角色 & UI
function updateAssets() {
  const base = `assets/levels/level${level}/stage${stageVisualIndex}`;

  // 背景载入逻辑同之前...

  // 角色载入逻辑同之前...

  // 更新分数/关卡显示
  document.getElementById('sequenceDisplay').innerText = orderIndex + 1;
  document.getElementById('playerScore').innerText      = playerScore;
  document.getElementById('cpuScore').innerText         = cpuScore;
}

// 倒计时
function startCountdown() {
  countdownActive = roundEnded = true;
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
      document.querySelectorAll('.cpu-hands img, .player-hands img')
        .forEach(el => el.style.visibility = 'visible');
      document.getElementById('result').innerText = '請出拳！';
      countdownActive = roundEnded = false;
    }
  }, 500);
}

// 玩家出拳
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

  // CPU 出拳：30% 概率放水
  const p = 0.3;
  const biased = Math.random() < p;
  let cpuChoices;
  if (biased) {
    // 放水：主拳出现两次，另一拳一次
    const primary = weightedRandom({ rock:1, paper:1, scissors:1 });
    const others  = ['rock','paper','scissors'].filter(m => m !== primary);
    const secondary = others[Math.floor(Math.random() * 2)];
    cpuChoices = [primary, primary, secondary];
  } else {
    cpuChoices = ['rock','paper','scissors'];
  }
  // 打乱顺序
  cpuChoices.sort(() => Math.random() - 0.5);

  // 渲染到三张 CPU 槽位图
  document.querySelectorAll('.cpu-hands img').forEach((el, idx) => {
    const move = cpuChoices[idx];
    el.src = `assets/${move}.png`;
    el.style.visibility = 'visible';
    el.classList.add('scale');
  });
  setTimeout(() => {
    document.querySelectorAll('.cpu-hands img, .player-hands img')
      .forEach(e => e.classList.remove('scale'));
  }, 300);

  // 判定胜负——以 cpuChoices[0] 为官方出拳
  const cpuMove = cpuChoices[0];
  let res;
  if (playerMove === cpuMove) {
    res = '平手！';
  } else if (
    (playerMove==='rock' && cpuMove==='scissors') ||
    (playerMove==='scissors' && cpuMove==='paper') ||
    (playerMove==='paper' && cpuMove==='rock')
  ) {
    res = '你贏了！';
    playerScore++;
    stageVisualIndex = Math.min(stageVisualIndex + 1, maxLevel);
  } else {
    res = '你輸了！';
    cpuScore++;
    stageVisualIndex = 1;
  }
  document.getElementById('result').innerText = res;
  playSound(res.startsWith('你贏') ? 'audioWin' : 'audioLose');
  updateAssets();

  roundEnded = true;
  document.getElementById('continue').style.display = 'block';
}

// 继续／下一关／重来
function resetRound() {
  const btn = document.getElementById('continue');
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
  if (playerScore >= winTarget) {
    orderIndex++;
    btn.style.display = 'none';
    if (orderIndex < levelOrder.length) {
      level = levelOrder[orderIndex];
      playerScore = cpuScore = 0;
      stageVisualIndex = 1;
      updateAssets();
      document.getElementById('result').innerText = `🎉 前往第 ${orderIndex+1} 關`;
      return startCountdown();
    } else {
      document.getElementById('result').innerText = '🎊 恭喜破關！';
      btn.innerText = '重新開始';
      btn.onclick = () => {
        btn.onclick = resetRound;
        btn.style.display = 'none';
        initGame();
      };
      btn.style.display = 'block';
      return;
    }
  }
  btn.style.display = 'none';
  document.querySelectorAll('.cpu-hands img, .player-hands img')
    .forEach(e => e.style.visibility = 'visible');
  document.getElementById('result').innerText = '請等待倒數...';
  startCountdown();
}

// 暴露给 HTML
window.initGame    = initGame;
window.toggleSound = toggleSound;
window.play        = play;
window.resetRound  = resetRound;

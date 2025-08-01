// script.js

// ----- 配置区 -----
const maxLevel = 8;       // 总关卡数，请按实际修改
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
  // 随机关卡序列并洗牌
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

  // 背景视频或图片
  const videoBg = document.getElementById('backgroundVideo');
  const imgBg   = document.getElementById('backgroundImage');
  videoBg.src = `${base}/background.mp4`;
  videoBg.load();
  videoBg.onloadeddata = () => {
    imgBg.style.display   = 'none';
    videoBg.style.display = 'block';
  };
  videoBg.onerror = () => {
    videoBg.style.display = 'none';
    imgBg.src             = `${base}/background.jpg`;
    imgBg.style.display   = 'block';
  };

  // 角色视频或图片
  const videoCh = document.getElementById('characterVideo');
  const imgCh   = document.getElementById('characterImage');
  videoCh.src = `${base}/character.mp4`;
  videoCh.load();
  videoCh.onloadeddata = () => {
    imgCh.style.display   = 'none';
    videoCh.style.display = 'block';
  };
  videoCh.onerror = () => {
    videoCh.style.display = 'none';
    imgCh.src             = `${base}/character.png`;
    imgCh.style.display   = 'block';
  };

  // 更新第几关与分数
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
      document.querySelectorAll('.cpu-hands img, .player-hands img')
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

  // CPU 出拳（加权示例：5 关后 paper 概率加倍）
  const biased = level >= 5;
  const weights = biased
    ? { rock: 1, paper: 2, scissors: 1 }
    : { rock: 1, paper: 1, scissors: 1 };
  const cpuMove = weightedRandom(weights);

  // CPU 动画
  document.querySelectorAll('.cpu-hands img').forEach(el => {
    if (el.src.includes(`${cpuMove}.png`)) {
      el.style.visibility = 'visible';
      el.classList.add('scale');
    } else {
      el.style.visibility = 'hidden';
    }
  });

  // 移除动画标签
  setTimeout(() => {
    document.querySelectorAll('.player-hands img, .cpu-hands img')
      .forEach(el => el.classList.remove('scale'));
  }, 300);

  // 判定胜负
  let res;
  if (playerMove === cpuMove) {
    res = '平手！';
  } else if (
    (playerMove === 'rock'     && cpuMove === 'scissors') ||
    (playerMove === 'scissors' && cpuMove === 'paper')    ||
    (playerMove === 'paper'    && cpuMove === 'rock')
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

// ----- 继续 / 下一关 / 重来 -----
function resetRound() {
  const btn = document.getElementById('continue');

  // 失败：显示“重新開始”
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

  // 胜利：下一关或通关
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

  // 普通下一轮
  btn.style.display = 'none';
  document.querySelectorAll('.player-hands img, .cpu-hands img')
    .forEach(el => el.style.visibility = 'visible');
  document.getElementById('result').innerText = '請等待倒數...';
  startCountdown();
}

// 暴露给 HTML
window.initGame    = initGame;
window.toggleSound = toggleSound;
window.play        = play;
window.resetRound  = resetRound;

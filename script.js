// script.js

const maxLevel  = 8;
const winTarget = 3;
let levelOrder = [], orderIndex = 0;

let playerScore = 0, cpuScore = 0, roundEnded = false;
let soundOn = false, level = 1, stageVisualIndex = 1, countdownActive = true;
let audioBgm;

// 加权随机，仅用于决定主拳
function weightedRandom(weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((s,[,w])=>s+w, 0);
  let r = Math.random() * total;
  for (const [move, w] of entries) {
    if (r < w) return move;
    r -= w;
  }
}

// 初始化
function initGame() {
  levelOrder = Array.from({length:maxLevel},(_,i)=>i+1).sort(()=>Math.random()-0.5);
  orderIndex = 0; level = levelOrder[0];
  playerScore = cpuScore = 0; stageVisualIndex = 1;

  audioBgm = document.getElementById('audioBgm');
  audioBgm.muted = true;
  audioBgm.play().catch(()=>{});

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
function playSound(id) {
  if (!soundOn) return;
  const a = document.getElementById(id);
  a.currentTime = 0;
  a.play().catch(()=>{});
}

// 更新背景/角色 & 分数/关卡
function updateAssets() {
  const base = `assets/levels/level${level}/stage${stageVisualIndex}`;

  // 背景
  const vb = document.getElementById('backgroundVideo'),
        ib = document.getElementById('backgroundImage');
  vb.src = `${base}/background.mp4`; vb.load();
  vb.onloadeddata = ()=>{ ib.style.display='none'; vb.style.display='block'; };
  vb.onerror = ()=>{ vb.style.display='none'; ib.src=`${base}/background.jpg`; ib.style.display='block'; };

  // 角色
  const vc = document.getElementById('characterVideo'),
        ic = document.getElementById('characterImage');
  vc.src = `${base}/character.mp4`; vc.load();
  vc.onloadeddata = ()=>{ ic.style.display='none'; vc.style.display='block'; };
  vc.onerror = ()=>{ vc.style.display='none'; ic.src=`${base}/character.png`; ic.style.display='block'; };

  // HUD
  document.getElementById('sequenceDisplay').innerText = `第 ${orderIndex+1} 關`;
  document.getElementById('playerScore').innerText = `玩家 ${playerScore}`;
  document.getElementById('cpuScore').innerText    = `電腦 ${cpuScore}`;
}

// 倒计时
function startCountdown() {
  countdownActive = roundEnded = true;
  document.getElementById('result').innerText = '';
  const cd = document.getElementById('countdown');
  let t = 3;
  cd.innerText = t; cd.style.display = 'block';
  const iv = setInterval(()=>{
    if (--t > 0) cd.innerText = t;
    else {
      clearInterval(iv);
      cd.style.display = 'none';
      document.querySelectorAll('.cpu-hands img, .player-hands img')
        .forEach(e=>e.style.visibility = 'visible');
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
  document.querySelectorAll('.player-hands img').forEach(el=>{
    if (el.src.includes(`${playerMove}.png`)) {
      el.style.visibility = 'visible';
      el.classList.add('scale');
    } else {
      el.style.visibility = 'hidden';
    }
  });

  // CPU 出拳：30% 概率放水（主拳权重翻倍）
  const p = 0.3;
  const biased = Math.random() < p;
  const weights = biased
    ? { rock:1, paper:2, scissors:1 }
    : { rock:1, paper:1, scissors:1 };
  const primary = weightedRandom(weights);
  let cpuChoices;
  if (biased) {
    const others = ['rock','paper','scissors'].filter(m=>m!==primary);
    const secondary = others[Math.floor(Math.random()*others.length)];
    cpuChoices = [primary, primary, secondary];
  } else {
    cpuChoices = ['rock','paper','scissors'];
  }
  cpuChoices.sort(()=>Math.random()-0.5);

  // 渲染 CPU 三槽位
  const cpuImgs = {
    rock:    document.getElementById('cpu-rock'),
    paper:   document.getElementById('cpu-paper'),
    scissors:document.getElementById('cpu-scissors')
  };
  // 先隐藏
  Object.values(cpuImgs).forEach(img=>img.style.visibility='hidden');
  // 再展示
  cpuChoices.forEach(m=>{
    const el = cpuImgs[m];
    el.style.visibility = 'visible';
    el.classList.add('scale');
  });
  setTimeout(()=>{
    document.querySelectorAll('.cpu-hands img, .player-hands img')
      .forEach(e=>e.classList.remove('scale'));
  },300);

  // 判定（以 cpuChoices[0] 为“官方”出拳）
  const cpuMove = cpuChoices[0];
  let res;
  if (playerMove === cpuMove) {
    res = '平手！';
  } else if (
    (playerMove==='rock'&&cpuMove==='scissors') ||
    (playerMove==='scissors'&&cpuMove==='paper') ||
    (playerMove==='paper'&&cpuMove==='rock')
  ) {
    res = '你贏了！';
    playerScore++;
    stageVisualIndex = Math.min(stageVisualIndex+1, maxLevel);
  } else {
    res = '你輸了！';
    cpuScore++;
    stageVisualIndex = 1;
  }

  document.getElementById('result').innerText = res;
  playSound(res.startsWith('你贏')?'audioWin':'audioLose');
  updateAssets();

  roundEnded = true;
  document.getElementById('continue').style.display = 'block';
}

// 继续 / 下一关 / 重来
function resetRound() {
  const btn = document.getElementById('continue');
  if (cpuScore >= winTarget) {
    document.getElementById('result').innerText = '💀 挑戰失敗！';
    btn.innerText = '重新開始';
    btn.onclick = ()=>{ btn.onclick=resetRound; btn.style.display='none'; initGame(); };
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
      btn.onclick = ()=>{ btn.onclick=resetRound; btn.style.display='none'; initGame(); };
      btn.style.display = 'block';
      return;
    }
  }
  btn.style.display = 'none';
  document.querySelectorAll('.cpu-hands img, .player-hands img')
    .forEach(e=>e.style.visibility='visible');
  document.getElementById('result').innerText = '請等待倒數...';
  startCountdown();
}

// 暴露给 HTML
window.initGame    = initGame;
window.toggleSound = toggleSound;
window.play        = play;
window.resetRound  = resetRound;

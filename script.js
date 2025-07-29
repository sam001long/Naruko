// script.js

// ----- 配置区 -----
// 你总共有多少关卡？请按实际数目修改
const maxLevel = 5;
// 每局游戏随机后的关卡顺序
let levelOrder = [];
// 当前在顺序数组中的索引
let orderIndex = 0;

// 以下是全局游戏变量
let playerScore      = 0,
    cpuScore         = 0,
    roundEnded       = false,
    winTarget        = 3,
    soundOn          = false,
    level            = 1,
    stageVisualIndex = 1,
    countdownActive  = true;

let audioBgm;

// ----- 初始化函数 -----
function initGame(){
  // 1. 生成 [1,2,…,maxLevel]
  levelOrder = Array.from({length: maxLevel}, (_, i) => i + 1);
  // 2. Fisher–Yates 随机打乱
  for(let i = levelOrder.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [levelOrder[i], levelOrder[j]] = [levelOrder[j], levelOrder[i]];
  }
  // 3. 从头开始
  orderIndex = 0;
  level = levelOrder[orderIndex];

  // 背景音乐初始化
  audioBgm = document.getElementById('audioBgm');
  audioBgm.loop = true;
  audioBgm.muted = true;
  audioBgm.play().catch(()=>{});

  // 加载当前关卡素材并开始倒计时
  updateAssets();
  startCountdown();
}

// ----- 切换静音/有声 -----
function toggleSound(){
  soundOn = !soundOn;
  const btn  = document.getElementById('soundToggle');
  const hint = document.getElementById('soundHint');

  btn.innerText = soundOn ? '🔊' : '🔇';
  hint.style.display = soundOn ? 'none' : 'block';

  audioBgm.muted = !soundOn;
}

// ----- 播放音效 -----
function playSound(id){
  if(!soundOn) return;
  const a = document.getElementById(id);
  a.currentTime = 0;
  a.play().catch(()=>{});
}

// ----- 更新背景与角色素材 -----
function updateAssets(){
  const base = `assets/levels/level${level}/stage${stageVisualIndex}`;

  // 背景
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

  // 角色
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

  // 更新关卡显示
  document.getElementById('levelDisplay').innerText = level;
}

// ----- 倒计时逻辑 -----
function startCountdown(){
  countdownActive = true;
  roundEnded = true;
  document.getElementById('result').innerText = '';
  const cd = document.getElementById('countdown');
  let t = 3; cd.innerText = t; cd.style.display = 'block';
  const iv = setInterval(()=>{
    if(--t > 0){
      cd.innerText = t;
    } else {
      clearInterval(iv);
      cd.style.display = 'none';
      document.querySelectorAll('.cpu-hands img, .player-hands img').forEach(el=>{
        el.style.visibility = 'visible';
      });
      document.getElementById('result').innerText = '請出拳！';
      countdownActive = false;
      roundEnded = false;
    }
  }, 500);
}

// ----- 玩家出拳 -----
function play(playerMove){
  if(countdownActive || roundEnded) return;

  playSound('audioClick');

  // 玩家动画
  document.querySelectorAll('.player-hands img').forEach(el=>{
    const cmd = `play('${playerMove}')`;
    if(el.getAttribute('onclick').includes(cmd)){
      el.style.visibility = 'visible';
      el.classList.add('scale');
    } else {
      el.style.visibility = 'hidden';
    }
  });

  // CPU 随机
  const moves = ['rock','paper','scissors'];
  const cpuMove = moves[Math.floor(Math.random()*3)];
  moves.forEach(m=>{
    const img = document.getElementById(`cpu-${m}`);
    if(m===cpuMove){
      img.style.visibility = 'visible';
      img.classList.add('scale');
    } else {
      img.style.visibility = 'hidden';
    }
  });

  // 移除动画
  setTimeout(()=>{
    document.querySelectorAll('.player-hands img, .cpu-hands img').forEach(el=>{
      el.classList.remove('scale');
    });
  }, 300);

  // 判定胜负
  let res = '';
  if(playerMove===cpuMove){
    res = '平手！';
  } else if(
    (playerMove==='rock'     && cpuMove==='scissors') ||
    (playerMove==='scissors' && cpuMove==='paper')    ||
    (playerMove==='paper'    && cpuMove==='rock')
  ){
    res = '你贏了！';
    playerScore++;
    stageVisualIndex = Math.min(1 + playerScore, maxLevel);
  } else {
    res = '你輸了！';
    cpuScore++;
    stageVisualIndex = 1;
  }

  document.getElementById('playerScore').innerText = playerScore;
  document.getElementById('cpuScore').innerText    = cpuScore;
  document.getElementById('result').innerText      = res;
  playSound(res.startsWith('你贏') ? 'audioWin' : 'audioLose');

  updateAssets();

  // 显示继续/下一关/重来按钮
  roundEnded = true;
  const btn = document.getElementById('continue');
  if(cpuScore >= winTarget){
    btn.innerText = '重新開始';
  } else {
    btn.innerText = '繼續';
  }
  btn.style.display = 'block';
}

// ----- 处理继续 / 下一关 / 重新开始 -----
function resetRound(){
  const btn = document.getElementById('continue');
  btn.style.display = 'none';

  // 输掉这一局：直接回合重来（本关不变）
  if(cpuScore >= winTarget){
    playerScore = cpuScore = 0;
    stageVisualIndex = 1;
    updateAssets();
    document.getElementById('playerScore').innerText = 0;
    document.getElementById('cpuScore').innerText    = 0;
    document.getElementById('result').innerText      = '💀 重新開始';
    return startCountdown();
  }

  // 赢掉这一局：进入下一个洗牌关卡
  if(playerScore >= winTarget){
    orderIndex++;
    if(orderIndex < levelOrder.length){
      level = levelOrder[orderIndex];
      playerScore = cpuScore = 0;
      stageVisualIndex = 1;
      updateAssets();
      document.getElementById('playerScore').innerText = 0;
      document.getElementById('cpuScore').innerText    = 0;
      document.getElementById('result').innerText      = `🎉 前往第 ${level} 關`;
      return startCountdown();
    } else {
      // 全部关卡打完 → 通关
      document.getElementById('result').innerText = '🎊 恭喜破關！';
      btn.innerText = '重新開始';
      btn.onclick = () => {
        initGame();
        btn.onclick = resetRound;
        btn.style.display = 'none';
      };
      btn.style.display = 'block';
      return;
    }
  }

  // 常规回合（未分胜负）
  document.querySelectorAll('.cpu-hands img, .player-hands img').forEach(el=>{
    el.style.visibility = 'visible';
  });
  document.getElementById('result').innerText = '請等待倒數...';
  startCountdown();
}

// 供 HTML 调用
window.initGame    = initGame;
window.toggleSound = toggleSound;
window.play        = play;
window.resetRound  = resetRound;

// script.js

let playerScore      = 0,
    cpuScore         = 0,
    roundEnded       = false,
    winTarget        = 3,
    soundOn          = false,
    level            = 1,
    stageVisualIndex = 1,
    maxStage         = 4,
    maxLevel         = 3,
    countdownActive  = true;

let audioBgm;

// 初始化
function initGame(){
  // 取 BGM 元素并初始化
  audioBgm = document.getElementById('audioBgm');
  audioBgm.loop = true;
  audioBgm.muted = true;
  audioBgm.play().catch(()=>{}); // 静音自动 play 以便后续 unmuted 时能立即听到

  updateAssets();
  startCountdown();
}

// 更新背景 & 角色（支持 MP4 或回退圖片）
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

  // 更新關卡顯示
  document.getElementById('levelDisplay').innerText = level;
}

// 播放音效（点击、胜利、失败）
function playSound(id){
  if(!soundOn) return;
  const a = document.getElementById(id);
  if(!a) return;
  a.currentTime = 0;
  a.play().catch(()=>{});
}

// 切換靜音/有聲
function toggleSound(){
  soundOn = !soundOn;
  const btn = document.getElementById('soundToggle');
  const hint = document.getElementById('soundHint');

  btn.innerText = soundOn ? '🔊' : '🔇';
  hint.style.display = soundOn ? 'none' : 'block';

  // 只用 muted 控制，不 pause
  audioBgm.muted = !soundOn;
}

// 倒計時（0.5s 一次，共 3 次）
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
      // 恢復所有拳頭可見
      document.querySelectorAll('.cpu-hands img, .player-hands img').forEach(el=>{
        el.style.visibility = 'visible';
      });
      document.getElementById('result').innerText = '請出拳！';
      countdownActive = false;
      roundEnded = false;
    }
  }, 500);
}

// 玩家出拳
function play(playerMove){
  if(countdownActive || roundEnded) return;

  // 点击音效
  playSound('audioClick');

  // 玩家动画
  document.querySelectorAll('.player-hands img').forEach(el=>{
    if(el.getAttribute('onclick')===`play('${playerMove}')`){
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

  // 动画结束移除
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
    (playerMove==='rock'     && cpuMove==='scissors')||
    (playerMove==='scissors' && cpuMove==='paper')   ||
    (playerMove==='paper'    && cpuMove==='rock')
  ){
    res = '你贏了！'; playerScore++;
    stageVisualIndex = Math.min(1+playerScore, maxStage);
  } else {
    res = '你輸了！'; cpuScore++;
    stageVisualIndex = 1;
  }

  // 更新分數與提示
  document.getElementById('playerScore').innerText = playerScore;
  document.getElementById('cpuScore').innerText    = cpuScore;
  document.getElementById('result').innerText      = res;
  playSound(res.startsWith('你贏') ? 'audioWin' : 'audioLose');

  updateAssets();

  // 顯示按鈕
  roundEnded = true;
  const btn = document.getElementById('continue');
  if(playerScore>=winTarget)   btn.innerText='進入下一關';
  else if(cpuScore>=winTarget) btn.innerText='重新開始';
  else                          btn.innerText='繼續';
  btn.style.display='block';
}

// 處理繼續/進關/重新開始
function resetRound(){
  const btn = document.getElementById('continue');
  btn.style.display='none';

  // 電腦三勝 → 重置
  if(cpuScore>=winTarget){
    level=1; playerScore=0; cpuScore=0; stageVisualIndex=1;
    updateAssets();
    document.querySelectorAll('.cpu-hands img, .player-hands img').forEach(el=>{
      el.style.visibility='visible';
    });
    document.getElementById('playerScore').innerText=0;
    document.getElementById('cpuScore').innerText=0;
    document.getElementById('result').innerText='💀 重新開始';
    return startCountdown();
  }

  // 玩家三勝
  if(playerScore>=winTarget){
    if(level<maxLevel){
      // 升關
      level++;
      playerScore=0; cpuScore=0; stageVisualIndex=1;
      updateAssets();
      document.getElementById('playerScore').innerText=0;
      document.getElementById('cpuScore').innerText=0;
      document.getElementById('result').innerText=`🎉 進入第${level}關`;
      return startCountdown();
    } else {
      // 通關
      document.getElementById('result').innerText = '🎊 恭喜破關！';
      btn.innerText = '重新開始';
      btn.onclick = ()=>{
        level=1; playerScore=0; cpuScore=0; stageVisualIndex=1;
        updateAssets();
        document.querySelectorAll('.cpu-hands img, .player-hands img').forEach(el=>{
          el.style.visibility='visible';
        });
        document.getElementById('playerScore').innerText=0;
        document.getElementById('cpuScore').innerText=0;
        btn.innerText='繼續';
        btn.onclick=resetRound;
        startCountdown();
      };
      btn.style.display='block';
      return;
    }
  }

  // 常規下一輪
  document.querySelectorAll('.cpu-hands img, .player-hands img').forEach(el=>{
    el.style.visibility='visible';
  });
  document.getElementById('result').innerText='請等待倒數...';
  startCountdown();
}

// 暴露給 HTML
window.initGame    = initGame;
window.toggleSound = toggleSound;
window.play        = play;
window.resetRound  = resetRound;

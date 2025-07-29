// script.js

// ----- 配置区 -----
const maxLevel = 5;       // 总关卡数，按实际修改
let levelOrder = [];      // 随机后的关卡序列
let orderIndex = 0;       // 当前在序列中的索引

// 全局游戏状态
let playerScore      = 0,
    cpuScore         = 0,
    roundEnded       = false,
    winTarget        = 3,
    soundOn          = false,
    level            = 1,
    stageVisualIndex = 1,
    countdownActive  = true;

let audioBgm;

// ----- 初始化 -----
function initGame(){
  // 1) 生成 [1,2,…,maxLevel]
  levelOrder = Array.from({length: maxLevel}, (_, i) => i + 1);
  // 2) 洗牌
  for(let i = levelOrder.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [levelOrder[i], levelOrder[j]] = [levelOrder[j], levelOrder[i]];
  }
  // 3) 重置索引与实际关卡编号
  orderIndex = 0;
  level = levelOrder[orderIndex];

  // BGM 初始化
  audioBgm = document.getElementById('audioBgm');
  audioBgm.loop  = true;
  audioBgm.muted = true;
  audioBgm.play().catch(()=>{});

  updateAssets();
  startCountdown();
}

// ----- 切换音效 -----
function toggleSound(){
  soundOn = !soundOn;
  document.getElementById('soundToggle').innerText = soundOn ? '🔊' : '🔇';
  document.getElementById('soundHint').style.display = soundOn ? 'none' : 'block';
  audioBgm.muted = !soundOn;
}

// ----- 播放音效 -----
function playSound(id){
  if(!soundOn) return;
  const a = document.getElementById(id);
  a.currentTime = 0;
  a.play().catch(()=>{});
}

// ----- 更新素材 & 关卡序号 -----
function updateAssets(){
  // 加载背景与角色 ...（省略，与之前相同）...

  // 只更新“第几关”序号
  document.getElementById('sequenceDisplay').innerText = orderIndex + 1;
}

// ----- 倒计时 -----
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

  // 玩家 & CPU 动画 ...（省略）...

  // 判定胜负并更新分数 ...（省略）...

  // 更新提示
  document.getElementById('result').innerText = res;
  playSound(res.startsWith('你贏') ? 'audioWin' : 'audioLose');

  updateAssets();

  // 显示继续按钮
  roundEnded = true;
  document.getElementById('continue').style.display = 'block';
}

// ----- 继续／下一关／重来 -----
function resetRound(){
  const btn = document.getElementById('continue');
  btn.style.display = 'none';

  // 失败重来
  if(cpuScore >= winTarget){
    playerScore = cpuScore = 0;
    stageVisualIndex = 1;
    updateAssets();
    document.getElementById('result').innerText = '💀 重新開始';
    return startCountdown();
  }

  // 胜利 → 下一个随机关卡
  if(playerScore >= winTarget){
    orderIndex++;
    if(orderIndex < levelOrder.length){
      // 设定新 level 并开始
      level = levelOrder[orderIndex];
      playerScore = cpuScore = 0;
      stageVisualIndex = 1;
      updateAssets();
      document.getElementById('result').innerText = `🎉 前往第 ${orderIndex + 1} 關`;
      return startCountdown();
    } else {
      // 通关
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

  // 常规下一轮
  document.querySelectorAll('.cpu-hands img, .player-hands img').forEach(el=>{
    el.style.visibility = 'visible';
  });
  document.getElementById('result').innerText = '請等待倒數...';
  startCountdown();
}

// 暴露给 HTML
window.initGame    = initGame;
window.toggleSound = toggleSound;
window.play        = play;
window.resetRound  = resetRound;

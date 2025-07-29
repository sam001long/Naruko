// ----- 配置区 -----
const maxLevel = 5;       // 总关卡数，请按实际修改
let levelOrder = [];      // 随机关卡序列
let orderIndex = 0;       // 当前序列索引

// 全局状态
let playerScore      = 0,
    cpuScore         = 0,
    roundEnded       = false,
    winTarget        = 3,
    soundOn          = false,
    level            = 1,
    stageVisualIndex = 1,
    countdownActive  = true;

let audioBgm;

// 初始化
function initGame(){
  // 洗牌生成序列
  levelOrder = Array.from({length: maxLevel}, (_, i) => i+1);
  for(let i = levelOrder.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [levelOrder[i], levelOrder[j]] = [levelOrder[j], levelOrder[i]];
  }
  orderIndex = 0;
  level = levelOrder[orderIndex];

  // BGM
  audioBgm = document.getElementById('audioBgm');
  audioBgm.loop  = true;
  audioBgm.muted = true;
  audioBgm.play().catch(()=>{});

  updateAssets();
  startCountdown();
}

// 切换音效
function toggleSound(){
  soundOn = !soundOn;
  document.getElementById('soundToggle').innerText = soundOn ? '🔊' : '🔇';
  document.getElementById('soundHint').style.display     = soundOn ? 'none' : 'block';
  audioBgm.muted = !soundOn;
}

// 播放音效
function playSound(id){
  if(!soundOn) return;
  const a = document.getElementById(id);
  a.currentTime = 0;
  a.play().catch(()=>{});
}

// 更新素材 & 关卡序号
function updateAssets(){
  // 背景与角色加载逻辑略（同前）

  // 更新第几关
  document.getElementById('sequenceDisplay').innerText = orderIndex + 1;
}

// 倒计时
function startCountdown(){
  countdownActive = true; roundEnded = true;
  document.getElementById('result').innerText = '';
  const cd = document.getElementById('countdown');
  let t = 3; cd.innerText = t; cd.style.display = 'block';
  const iv = setInterval(()=>{
    if(--t>0) cd.innerText = t;
    else {
      clearInterval(iv);
      cd.style.display = 'none';
      document.querySelectorAll('.cpu-hands img, .player-hands img')
        .forEach(el=>el.style.visibility='visible');
      document.getElementById('result').innerText = '請出拳！';
      countdownActive = false; roundEnded = false;
    }
  }, 500);
}

// 出拳
function play(playerMove){
  if(countdownActive||roundEnded) return;
  playSound('audioClick');
  // 动画与判定省略，同前
  // ...

  // 显示结果与分数
  // ...

  updateAssets();
  roundEnded = true;
  document.getElementById('continue').style.display = 'block';
}

// 继续/下一关/重来
function resetRound(){
  const btn = document.getElementById('continue');
  btn.style.display = 'none';

  // 失败重来
  if(cpuScore>=winTarget){
    playerScore=cpuScore=0; stageVisualIndex=1;
    updateAssets();
    document.getElementById('result').innerText = '💀 重新開始';
    return startCountdown();
  }

  // 胜利进入下个随机关卡
  if(playerScore>=winTarget){
    orderIndex++;
    if(orderIndex<levelOrder.length){
      level=levelOrder[orderIndex];
      playerScore=cpuScore=0; stageVisualIndex=1;
      updateAssets();
      document.getElementById('result').innerText = `🎉 前往第 ${orderIndex+1} 關`;
      return startCountdown();
    } else {
      document.getElementById('result').innerText = '🎊 恭喜破關！';
      btn.innerText = '重新開始';
      btn.onclick = ()=>{
        initGame();
        btn.onclick = resetRound;
        btn.style.display='none';
      };
      btn.style.display='block';
      return;
    }
  }

  // 常规下一轮
  document.querySelectorAll('.cpu-hands img, .player-hands img')
    .forEach(el=>el.style.visibility='visible');
  document.getElementById('result').innerText = '請等待倒數...';
  startCountdown();
}

// 暴露
window.initGame    = initGame;
window.toggleSound = toggleSound;
window.play        = play;
window.resetRound  = resetRound;

// script.js

const maxLevel  = 8;
const winTarget = 3;
let levelOrder  = [], orderIndex = 0;

let playerScore=0, cpuScore=0, roundEnded=false;
let soundOn=false, level=1, stageVisualIndex=1, countdownActive=true;
let audioBgm;

function weightedRandom(w) {
  const e = Object.entries(w), t = e.reduce((s,[,v])=>s+v,0);
  let r=Math.random()*t;
  for(const [m,v] of e){
    if(r<v) return m; r-=v;
  }
}

function initGame(){
  levelOrder = Array.from({length:maxLevel},(_,i)=>i+1)
    .sort(()=>Math.random()-0.5);
  orderIndex=0; level=levelOrder[0];
  playerScore=cpuScore=0; stageVisualIndex=1;
  audioBgm=document.getElementById('audioBgm');
  audioBgm.muted=true; audioBgm.play().catch(()=>{});
  updateAssets(); startCountdown();
}

function toggleSound(){
  soundOn=!soundOn;
  document.getElementById('soundToggle').innerText = soundOn?'🔊':'🔇';
  document.getElementById('soundHint').style.display = soundOn?'none':'block';
  audioBgm.muted = !soundOn;
}
function playSound(id){
  if(!soundOn)return;
  const a=document.getElementById(id);
  a.currentTime=0; a.play().catch(()=>{});
}

function updateAssets(){
  const b=`assets/levels/level${level}/stage${stageVisualIndex}`;
  const vb=document.getElementById('backgroundVideo'),
        ib=document.getElementById('backgroundImage');
  vb.src=`${b}/background.mp4`; vb.load();
  vb.onloadeddata=()=>{ ib.style.display='none'; vb.style.display='block'; };
  vb.onerror=()=>{ vb.style.display='none'; ib.src=`${b}/background.jpg`; ib.style.display='block'; };

  const vc=document.getElementById('characterVideo'),
        ic=document.getElementById('characterImage');
  vc.src=`${b}/character.mp4`; vc.load();
  vc.onloadeddata=()=>{ ic.style.display='none'; vc.style.display='block'; };
  vc.onerror=()=>{ vc.style.display='none'; ic.src=`${b}/character.png`; ic.style.display='block'; };

  document.getElementById('sequenceDisplay').innerText = `第 ${orderIndex+1} 關`;
  document.getElementById('playerScore').innerText = `玩家 ${playerScore}`;
  document.getElementById('cpuScore').innerText    = `電腦 ${cpuScore}`;
}

function startCountdown(){
  countdownActive=roundEnded=true;
  document.getElementById('result').innerText='';
  const cd=document.getElementById('countdown');
  let t=3; cd.innerText=t; cd.style.display='block';
  const iv=setInterval(()=>{
    if(--t>0) cd.innerText=t;
    else{
      clearInterval(iv); cd.style.display='none';
      document.querySelectorAll('.cpu-hands img, .player-hands img')
        .forEach(e=>e.style.visibility='visible');
      document.getElementById('result').innerText='請出拳！';
      countdownActive=roundEnded=false;
    }
  },500);
}

function play(move){
  if(countdownActive||roundEnded) return;
  playSound('audioClick');

  document.querySelectorAll('.player-hands img').forEach(el=>{
    el.style.visibility = el.src.includes(`${move}.png`) ? 'visible':'hidden';
    el.classList.toggle('scale', el.style.visibility==='visible');
  });

  const p=0.3; 
  const w = Math.random()<p
    ? {rock:1,paper:2,scissors:1}
    : {rock:1,paper:1,scissors:1};
  const cpu=weightedRandom(w);

  document.querySelectorAll('.cpu-hands img').forEach(el=>{
    el.style.visibility = el.src.includes(`${cpu}.png`) ? 'visible':'hidden';
    el.classList.toggle('scale', el.style.visibility==='visible');
  });

  setTimeout(()=>{
    document.querySelectorAll('.cpu-hands img, .player-hands img')
      .forEach(e=>e.classList.remove('scale'));
  },300);

  let res;
  if(move===cpu) res='平手！';
  else if(
    (move==='rock'&&cpu==='scissors')||
    (move==='scissors'&&cpu==='paper')||
    (move==='paper'&&cpu==='rock')
  ){
    res='你贏了！'; playerScore++; stageVisualIndex=Math.min(stageVisualIndex+1,maxLevel);
  } else {
    res='你輸了！'; cpuScore++; stageVisualIndex=1;
  }

  document.getElementById('result').innerText=res;
  playSound(res.startsWith('你贏')?'audioWin':'audioLose');
  updateAssets();

  roundEnded=true;
  document.getElementById('continue').style.display='block';
}

function resetRound(){
  const btn=document.getElementById('continue');
  if(cpuScore>=winTarget){
    document.getElementById('result').innerText='💀 挑戰失敗！';
    btn.innerText='重新開始';
    btn.onclick=()=>{
      btn.onclick=resetRound; btn.style.display='none'; initGame();
    };
    btn.style.display='block';
    return;
  }
  if(playerScore>=winTarget){
    orderIndex++; btn.style.display='none';
    if(orderIndex<levelOrder.length){
      level=levelOrder[orderIndex]; playerScore=cpuScore=0; stageVisualIndex=1;
      updateAssets();
      document.getElementById('result').innerText=`🎉 前往第 ${orderIndex+1} 關`;
      return startCountdown();
    } else {
      document.getElementById('result').innerText='🎊 恭喜破關！';
      btn.innerText='重新開始';
      btn.onclick=()=>{
        btn.onclick=resetRound; btn.style.display='none'; initGame();
      };
      btn.style.display='block';
      return;
    }
  }
  btn.style.display='none';
  document.querySelectorAll('.cpu-hands img, .player-hands img')
    .forEach(e=>e.style.visibility='visible');
  document.getElementById('result').innerText='請等待倒數...';
  startCountdown();
}

window.initGame=initGame;
window.toggleSound=toggleSound;
window.play=play;
window.resetRound=resetRound;

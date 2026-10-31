(() => {
'use strict';
const $=id=>document.getElementById(id), canvas=$('game'), ctx=canvas.getContext('2d');
const W=800,H=520,keys=new Set();
let mode='ready',score=0,best=0,wave=1,lives=3,player,shots=[],enemies=[],bolts=[],particles=[],drops=[],boss=null;
let spawnClock=0,spawned=0,waveClock=0,fireClock=0,power=0,invincible=0,last=0,time=0,toastClock=0,audio=null,sound=false;
try{best=Number(localStorage.getItem('retro-star-best'))||0}catch{}
const stars=Array.from({length:100},()=>({x:Math.random()*W,y:Math.random()*H,z:Math.random()*2+0.5}));
const ship=['000010000','000111000','000121000','100121001','110121011','111111111','012111210','001000100'];
const alien=['001000100','000101000','001111100','011212110','111111111','101000101','000101000'];
function sprite(pattern,x,y,scale,colors){pattern.forEach((row,iy)=>[...row].forEach((v,ix)=>{if(v!=='0'){ctx.fillStyle=colors[+v-1];ctx.fillRect(Math.round(x+(ix-row.length/2)*scale),Math.round(y+(iy-pattern.length/2)*scale),scale,scale)}}))}
function beep(freq=440,duration=.07,type='square',volume=.035){if(!sound)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(freq*.45,audio.currentTime+duration);g.gain.setValueAtTime(volume,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration)}catch{}}
function hud(){$('score').textContent=String(score).padStart(6,'0');$('best').textContent=String(best).padStart(6,'0');$('wave').textContent=String(wave).padStart(2,'0');$('lives').textContent='♥ '.repeat(lives)+'♡ '.repeat(3-lives)}
function announce(text){$('toast').textContent=text;toastClock=2}
function burst(x,y,color,n=18){for(let i=0;i<n;i++)particles.push({x,y,vx:(Math.random()-.5)*260,vy:(Math.random()-.5)*260,life:.3+Math.random()*.5,color})}
function addScore(n){score+=n;if(score>best){best=score;try{localStorage.setItem('retro-star-best',String(best))}catch{}}hud()}
function nextWave(){spawned=0;spawnClock=.8;waveClock=0;bolts=[];boss=null;if(wave%3===0)boss={x:W/2,y:74,hp:35+wave*6,max:35+wave*6,t:0,cool:1.5};announce(boss?'WARNING · BOSS APPROACHING':'WAVE '+String(wave).padStart(2,'0'))}
function start(){score=0;wave=1;lives=3;player={x:W/2,y:H-65};shots=[];enemies=[];bolts=[];particles=[];drops=[];power=0;invincible=2;fireClock=0;keys.clear();mode='playing';$('overlay').style.display='none';$('state').textContent='MISSION IN PROGRESS';$('pause').textContent='Ⅱ';hud();nextWave();beep(700,.2);canvas.focus()}
function overlay(title,message,button){$('title').innerHTML=title;$('message').textContent=message;$('start').innerHTML=button+' <span>↗</span>';$('overlay').style.display='flex';$('hint').textContent='กด ENTER เพื่อไปต่อ';$('toast').textContent=''}
function pause(){if(mode==='playing'){mode='paused';keys.clear();overlay('TAKE A<br><em>BREATH</em>','พักสักนิด แล้วกลับไปปกป้องอวกาศ','เล่นต่อ');$('pause').textContent='▶';$('state').textContent='MISSION PAUSED'}else if(mode==='paused'){mode='playing';$('overlay').style.display='none';$('pause').textContent='Ⅱ';$('state').textContent='MISSION IN PROGRESS'}}
function hit(){if(invincible>0||mode!=='playing')return;lives--;invincible=2.2;burst(player.x,player.y,'#ff7891',24);beep(110,.25,'sawtooth');hud();if(lives===0){mode='over';keys.clear();overlay('GAME<br><em>OVER</em>','คะแนน '+score.toLocaleString()+' · ไปถึงด่าน '+wave+' · สถิติสูงสุด '+best.toLocaleString(),'บินอีกครั้ง');$('state').textContent='MISSION COMPLETE'}}
function collide(a,b,r){return Math.hypot(a.x-b.x,a.y-b.y)<r}
function update(dt){time+=dt;for(const s of stars){s.y+=s.z*dt*(mode==='playing'?24:8);if(s.y>H){s.y=0;s.x=Math.random()*W}}
 if(mode!=='playing')return;
 power=Math.max(0,power-dt);invincible=Math.max(0,invincible-dt);fireClock-=dt;waveClock+=dt;toastClock-=dt;if(toastClock<=0)$('toast').textContent='';
 let dx=(keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0),dy=(keys.has('ArrowDown')||keys.has('KeyS')?1:0)-(keys.has('ArrowUp')||keys.has('KeyW')?1:0);const length=Math.hypot(dx,dy)||1;
 player.x=Math.max(22,Math.min(W-22,player.x+dx/length*315*dt));player.y=Math.max(120,Math.min(H-22,player.y+dy/length*315*dt));
 if(keys.has('Space')&&fireClock<=0){fireClock=.16;for(const vx of power>0?[-155,0,155]:[0])shots.push({x:player.x,y:player.y-20,vx});beep(780,.04,'square',.012)}
 if(!boss&&spawned<8+wave*3){spawnClock-=dt;if(spawnClock<=0){spawnClock=Math.max(.3,1.1-wave*.055);spawned++;enemies.push({x:40+Math.random()*(W-80),y:-25,t:Math.random()*6,hp:wave>=5?2:1,speed:45+wave*8,cool:1+Math.random()*2})}}
 for(const e of enemies){e.t+=dt;e.y+=e.speed*dt;e.x=Math.max(20,Math.min(W-20,e.x+Math.sin(e.t*2)*45*dt));e.cool-=dt;if(e.cool<=0&&e.y>20){e.cool=Math.max(.7,3-wave*.12);bolts.push({x:e.x,y:e.y+14,vx:0,vy:150+wave*8})}if(collide(e,player,28)){hit();e.hp=0;burst(e.x,e.y,'#ff8aaa')}if(e.y>H+30){e.hp=0;hit()}}
 if(boss){boss.t+=dt;boss.x=W/2+Math.sin(boss.t*.8)*270;boss.cool-=dt;if(boss.cool<=0){boss.cool=Math.max(.45,1.1-wave*.035);for(let i=-2;i<=2;i++)bolts.push({x:boss.x,y:boss.y+25,vx:i*65,vy:155+wave*5});beep(180,.1,'sawtooth',.02)}if(collide(player,boss,65))hit()}
 for(const s of shots){s.y-=490*dt;s.x+=s.vx*dt;for(const e of enemies){if(e.hp>0&&collide(s,e,23)){s.y=-100;e.hp--;if(e.hp<=0){burst(e.x,e.y,'#f6a4de');addScore(100);beep(220,.09);if(Math.random()<.14)drops.push({x:e.x,y:e.y})}break}}if(boss&&Math.abs(s.x-boss.x)<60&&Math.abs(s.y-boss.y)<28){s.y=-100;boss.hp--;burst(s.x,boss.y,'#b1ff73',3);if(boss.hp<=0){burst(boss.x,boss.y,'#b1ff73',70);addScore(1500);boss=null;spawned=8+wave*3;bolts=[];drops.push({x:W/2,y:100});beep(70,.5,'sawtooth')}}}
 for(const b of bolts){b.x+=b.vx*dt;b.y+=b.vy*dt;if(collide(b,player,16)){b.y=H+100;hit()}}
 for(const d of drops){d.y+=85*dt;if(collide(d,player,27)){power=8;d.y=H+100;addScore(50);announce('POWER UP · TRIPLE SHOT');beep(1100,.18,'triangle')}}
 for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt}
 shots=shots.filter(s=>s.y>-20&&s.x>-10&&s.x<W+10);enemies=enemies.filter(e=>e.hp>0);bolts=bolts.filter(b=>b.y<H+20&&b.x>-20&&b.x<W+20);particles=particles.filter(p=>p.life>0);drops=drops.filter(d=>d.y<H+20);
 if(mode==='playing'&&!boss&&spawned>=8+wave*3&&enemies.length===0&&waveClock>3){wave++;nextWave();hud()}
}
function draw(){ctx.fillStyle='#080d1b';ctx.fillRect(0,0,W,H);const glow=ctx.createRadialGradient(400,230,10,400,230,370);glow.addColorStop(0,'#152342');glow.addColorStop(1,'#080d1b');ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
 for(const s of stars){ctx.globalAlpha=s.z/3;ctx.fillStyle=s.z>2?'#cfdeff':'#8398bd';ctx.fillRect(s.x,s.y,s.z>2?2:1,s.z>2?2:1)}ctx.globalAlpha=1;
 ctx.strokeStyle='#7c99d00c';ctx.lineWidth=1;for(let x=0;x<W;x+=50){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}
 if(mode==='ready'){sprite(ship,W/2,H-70,4,['#b8d2ee','#b1ff73']);sprite(alien,125,140+Math.sin(time)*10,3,['#bb86c9','#f9d5ff']);sprite(alien,675,170+Math.cos(time)*10,3,['#bb86c9','#f9d5ff']);return}
 for(const s of shots){ctx.fillStyle=power>0?'#b1ff73':'#c1e7ff';ctx.fillRect(s.x-2,s.y-10,4,15)}
 for(const e of enemies)sprite(alien,e.x,e.y,3,[e.hp>1?'#ffab72':'#d589c5','#fff2ff']);
 for(const b of bolts){ctx.fillStyle='#ff7891';ctx.fillRect(b.x-3,b.y-4,6,11);ctx.fillStyle='#ffd3de';ctx.fillRect(b.x-1,b.y-2,2,4)}
 if(boss){sprite(['00110001100','01111111110','11121112111','11111111111','01122222110','00110101100'],boss.x,boss.y,10,['#b28ae0','#ff799b']);ctx.fillStyle='#332b48';ctx.fillRect(W/2-150,18,300,5);ctx.fillStyle='#ff7891';ctx.fillRect(W/2-150,18,300*boss.hp/boss.max,5)}
 for(const d of drops){ctx.fillStyle='#b1ff73';ctx.fillRect(d.x-10,d.y-10,20,20);ctx.fillStyle='#12231d';ctx.font='bold 16px monospace';ctx.fillText('✦',d.x-8,d.y+6)}
 if(lives>0&&(invincible<=0||Math.floor(time*12)%2===0)){sprite(ship,player.x,player.y,4,['#bfd8f1',power>0?'#b1ff73':'#7bc6ff']);ctx.fillStyle='#b1ff73';ctx.fillRect(player.x-5,player.y+16,10,7+Math.random()*12);if(invincible>0){ctx.strokeStyle='#96d9ff80';ctx.beginPath();ctx.arc(player.x,player.y,28,0,Math.PI*2);ctx.stroke()}}
 if(power>0){ctx.fillStyle='#253a2d';ctx.fillRect(player.x-20,player.y+36,40,3);ctx.fillStyle='#b1ff73';ctx.fillRect(player.x-20,player.y+36,40*power/8,3)}
 for(const p of particles){ctx.globalAlpha=Math.min(1,p.life*2);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,4,4)}ctx.globalAlpha=1;
}
function frame(stamp){const dt=Math.min(.04,(stamp-last)/1000||0);last=stamp;update(dt);draw();requestAnimationFrame(frame)}
document.addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)&&!(e.code==='Space'&&e.target.tagName==='BUTTON'))e.preventDefault();if(e.repeat)return;if(e.code==='Enter'&&e.target.tagName!=='BUTTON'){if(mode==='paused')pause();else if(mode!=='playing')start()}else if(e.code==='KeyP'||e.code==='Escape')pause();else if(!(e.code==='Space'&&e.target.tagName==='BUTTON'))keys.add(e.code)});
document.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();if(mode==='playing')pause()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='playing')pause()});
$('start').onclick=()=>mode==='paused'?pause():start();$('pause').onclick=pause;$('sound').onclick=()=>{sound=!sound;$('sound').textContent='เสียง: '+(sound?'เปิด':'ปิด');$('sound').setAttribute('aria-pressed',String(sound));$('sound').setAttribute('aria-label',sound?'ปิดเสียง':'เปิดเสียง');if(sound)beep(660,.1)};
document.querySelectorAll('[data-key]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.key)});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>keys.delete(b.dataset.key))});
let dragging=false;function steer(e){const r=canvas.getBoundingClientRect();player.x=Math.max(22,Math.min(W-22,(e.clientX-r.left)*W/r.width));player.y=Math.max(120,Math.min(H-22,(e.clientY-r.top)*H/r.height))}
canvas.addEventListener('pointerdown',e=>{if(mode!=='playing')return;dragging=true;canvas.setPointerCapture(e.pointerId);steer(e);keys.add('Space')});canvas.addEventListener('pointermove',e=>{if(dragging&&mode==='playing')steer(e)});for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>{dragging=false;keys.delete('Space')});
hud();requestAnimationFrame(frame);
})();

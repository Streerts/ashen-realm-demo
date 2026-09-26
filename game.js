const canvas=document.getElementById('c'), ctx=canvas.getContext('2d');
const mini=document.getElementById('minimap'), mctx=mini.getContext('2d');
let W=0,H=0,dpr=Math.min(2,devicePixelRatio||1);
function resize(){ W=innerWidth; H=innerHeight; canvas.width=W*dpr; canvas.height=H*dpr; canvas.style.width=W+'px'; canvas.style.height=H+'px'; ctx.setTransform(dpr,0,0,dpr,0,0); }
addEventListener('resize',resize); resize();
const T=48, WORLD=56;
const lerp=(a,b,t)=>a+(b-a)*t, dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y), clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const NAMES=['logs','oak','planks','tin','copper','stone','bronze_bar','bronze_sword','raw_fish','cooked_fish','bread','block','pick','axe'];
const player={x:28*T,y:36*T,tx:28*T,ty:36*T,speed:158,hp:42,maxhp:42,crowns:48,name:'Wanderer',
  skills:{woodcutting:1,mining:1,attack:1,smithing:1,crafting:1,cooking:1,fishing:1,construction:1},
  xp:{woodcutting:0,mining:0,attack:0,smithing:0,crafting:0,cooking:0,fishing:0,construction:0},
  inv:{logs:0,oak:0,planks:0,tin:0,copper:0,stone:0,bronze_bar:0,bronze_sword:0,raw_fish:0,cooked_fish:3,bread:2,block:4,pick:1,axe:1},
  bank:Object.fromEntries(NAMES.map(n=>[n,0]))};
const cam={x:player.x,y:player.y};
const feed=[], fx=[], floats=[], bubbles=[];
let time=0.28, marker=null;
const $=id=>document.getElementById(id);
function say(m){ feed.unshift(m); if(feed.length>8)feed.pop(); $('log').innerHTML=feed.join('<br>'); }
function need(s){ return Math.floor(40+player.skills[s]*player.skills[s]*16); }
function addXp(s,n){ player.xp[s]+=n; float(player.x,player.y-28,'+'+n+' '+s.slice(0,2).toUpperCase(),'#9ad0e8'); while(player.xp[s]>=need(s)&&player.skills[s]<99){ player.xp[s]-=need(s); player.skills[s]++; say(s+' '+player.skills[s]); } }
function has(k,n=1){ return (player.inv[k]||0)>=n; }
function take(k,n=1){ if(!has(k,n)) return false; player.inv[k]-=n; return true; }
function give(k,n=1){ player.inv[k]=(player.inv[k]||0)+n; }
function float(x,y,t,c){ floats.push({x,y,t,c,life:1.1}); }
function puff(x,y,c,n=6){ for(let i=0;i<n;i++) fx.push({x,y,vx:(Math.random()-.5)*40,vy:-20-Math.random()*30,c,life:.6+Math.random()*.4,r:2+Math.random()*3}); }
function bubble(who,text){ bubbles.push({who,text,life:2.6}); }
const trees=[],rocks=[],mobs=[],npcs=[],buildings=[],fishspots=[],placed=[],walkers=[],critters=[],torches=[];
const town={x:22*T,y:30*T,w:16*T,h:12*T};
const plot={x:18.4*T,y:33*T,w:4.2*T,h:4.2*T};
function addB(b){ buildings.push(b); npcs.push({x:b.x+b.w/2,y:b.y+b.h+12,name:b.keeper,role:b.role,home:b}); }
function seed(){
  addB({x:23.6*T,y:31.6*T,w:3.3*T,h:2.5*T,color:'#6e4c34',roof:'#8a3328',trim:'#d7b56a',label:'Market',role:'market',keeper:'Mira'});
  addB({x:28.2*T,y:31.2*T,w:3.5*T,h:2.7*T,color:'#5c5c5a',roof:'#3a3a38',trim:'#c45c30',label:'Forge',role:'forge',keeper:'Bram'});
  addB({x:32.6*T,y:31.8*T,w:3.3*T,h:2.5*T,color:'#6a5330',roof:'#3f6a38',trim:'#c4d48a',label:'Mill',role:'mill',keeper:'Nettle'});
  addB({x:23.6*T,y:36.1*T,w:3.4*T,h:2.5*T,color:'#4e3c32',roof:'#d2c29a',trim:'#efe6d4',label:'Kitchen',role:'kitchen',keeper:'Alba'});
  addB({x:28.3*T,y:36.2*T,w:3.7*T,h:2.7*T,color:'#3a4250',roof:'#242a32',trim:'#e8c56a',label:'Bank',role:'bank',keeper:'Rowan'});
  addB({x:33*T,y:36.3*T,w:3.3*T,h:2.5*T,color:'#4a4030',roof:'#6e3a28',trim:'#e8c56a',label:'Hall',role:'quest',keeper:'Ellis'});
  torches.push({x:27.2*T,y:35.2*T},{x:31.2*T,y:35.2*T},{x:25.2*T,y:34.4*T},{x:34.4*T,y:34.6*T});
  for(let i=0;i<86;i++){ let x=(2+Math.random()*52)*T,y=(2+Math.random()*24)*T; if(x>town.x-20&&x<town.x+town.w+20&&y>town.y-20&&y<town.y+town.h+20) continue; trees.push({x,y,hp:8,kind:Math.random()>.78?'oak':'tree',alive:true,t:0,s:.85+Math.random()*.35}); }
  for(let i=0;i<48;i++){ const k=Math.random(); rocks.push({x:(3+Math.random()*22)*T,y:(39+Math.random()*13)*T,hp:10,kind:k>.6?'copper':k>.3?'tin':'stone',alive:true,t:0}); }
  for(let i=0;i<8;i++) mobs.push({x:(40+Math.random()*12)*T,y:(21+Math.random()*16)*T,hp:14,max:14,alive:true,aggro:false});
  fishspots.push({x:17.5*T,y:44.2*T},{x:16.2*T,y:42.8*T},{x:19.4*T,y:45.1*T});
  const names=['Rook','Pebble','Ash','Iota','Gull','Moss','Pip','Fern'];
  for(let i=0;i<8;i++) walkers.push({x:town.x+30+Math.random()*(town.w-60),y:town.y+30+Math.random()*(town.h-60),tx:0,ty:0,name:names[i],c:['#9bb7c9','#c9a07a','#8fb39a','#c9b7d8'][i%4]});
  for(const w of walkers){ w.tx=w.x; w.ty=w.y; }
  for(let i=0;i<8;i++) critters.push({x:town.x+50+Math.random()*220,y:town.y+50+Math.random()*180,tx:0,ty:0,kind:i%3?'hen':'pup'});
}
seed();
const quest={step:0,text:'Find Ellis under the Hall sign.'};
function setQ(s,t){ quest.step=s; quest.text=t; hud(); }
function closest(list,p,r,alive=true){ let b=null,d=r; for(const o of list){ if(alive&&o.alive===false) continue; const n=dist(p,o); if(n<d){d=n;b=o;} } return b; }
function inRect(p,r){ return p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h; }
function tryAct(wx,wy){
  const p={x:wx,y:wy}; marker={x:wx,y:wy,life:.7};
  const b=buildings.find(o=>wx>o.x-10&&wx<o.x+o.w+10&&wy>o.y-12&&wy<o.y+o.h+26);
  const tr=closest(trees,p,28), rk=closest(rocks,p,28), mb=closest(mobs,p,32), np=closest(npcs,p,36,false), fs=closest(fishspots,p,30,false);
  const tc=closest(torches,p,22,false);
  if(b){ player.tx=b.x+b.w/2; player.ty=b.y+b.h+16; player.intent={type:'shop',obj:b}; return; }
  if(np){ player.tx=np.x; player.ty=np.y; player.intent={type:'shop',obj:np.home||np}; return; }
  if(tr){ player.tx=tr.x; player.ty=tr.y; player.intent={type:'chop',obj:tr}; return; }
  if(rk){ player.tx=rk.x; player.ty=rk.y; player.intent={type:'mine',obj:rk}; return; }
  if(mb){ player.tx=mb.x; player.ty=mb.y; player.intent={type:'fight',obj:mb}; return; }
  if(fs){ player.tx=fs.x; player.ty=fs.y; player.intent={type:'fish',obj:fs}; return; }
  if(tc) say('Warm torch. Emberford stays lit after dusk.');
  player.intent=null; player.tx=clamp(wx,T,WORLD*T-T); player.ty=clamp(wy,T,WORLD*T-T);
}
function chop(o,dt){ if(dist(player,o)>40) return; if(!has('axe')){ say('Need an axe — Mira.'); player.intent=null; return; } o.t+=dt; if(o.t<.4) return; o.t=0; o.hp--; puff(o.x,o.y-10,'#6b4428',4); if(o.hp<=0){ o.alive=false; if(o.kind==='oak'){ give('oak'); addXp('woodcutting',30); say('Oak comes down.'); } else { give('logs'); addXp('woodcutting',16); say('Timber.'); } if(quest.step===1) setQ(2,'Mill the wood, or mine south.'); setTimeout(()=>{o.alive=true;o.hp=8;},20000); } }
function mine(o,dt){ if(dist(player,o)>40) return; if(!has('pick')){ say('Need a pick — Mira.'); player.intent=null; return; } o.t+=dt; if(o.t<.46) return; o.t=0; o.hp--; puff(o.x,o.y,'#c9c4b8',5); if(o.hp<=0){ o.alive=false; give(o.kind); addXp('mining',o.kind==='stone'?10:22); say(o.kind+' breaks.'); if(quest.step===2&&(o.kind==='tin'||o.kind==='copper')) setQ(3,'Smelt at Bram\'s Forge.'); setTimeout(()=>{o.alive=true;o.hp=10;},22000); } }
function fish(o,dt){ if(dist(player,o)>38) return; o.t=(o.t||0)+dt; if(o.t<1.05) return; o.t=0; if(Math.random()<.58){ give('raw_fish'); addXp('fishing',18); puff(o.x,o.y,'#7ec3e0',8); say('A fish.'); if(quest.step===4) setQ(5,'Cook it at Alba\'s Kitchen.'); } else say('Ripple, no bite.'); }
function fight(o,dt){ if(!o.alive) return; o.aggro=true; if(dist(player,o)>44){ player.tx=o.x; player.ty=o.y; return; } o.atk=(o.atk||0)+dt; player.atk=(player.atk||0)+dt; if(player.atk>.66){ player.atk=0; const dmg=3+player.skills.attack+(has('bronze_sword')?5:0); o.hp-=dmg; addXp('attack',8); float(o.x,o.y-18,''+dmg,'#e8c56a'); puff(o.x,o.y,'#4a6b3a',4); if(o.hp<=0){ o.alive=false; const g=6+Math.floor(Math.random()*10); player.crowns+=g; say('Goblin falls. +'+g+'c'); if(quest.step===6) setQ(7,'Back to Ellis.'); setTimeout(()=>{o.alive=true;o.hp=o.max;},15000); } } if(o.atk>1.02){ o.atk=0; const d=2+Math.floor(Math.random()*4); player.hp=Math.max(0,player.hp-d); float(player.x,player.y-18,''+d,'#e07a62'); if(player.hp<=0){ player.hp=player.maxhp; player.x=28*T; player.y=36.6*T; player.tx=player.x; player.ty=player.y; player.crowns=Math.max(0,player.crowns-10); say('Wake at the Hall. -10c'); } } }
function openModal(html){ const m=$('modal'); m.innerHTML=html; m.style.display='block'; }
function closeModal(){ $('modal').style.display='none'; }
function itemRows(obj){ return NAMES.filter(k=>obj[k]>0).map(k=>'<div class="slot">'+k.replace('_',' ')+'<br><b>'+obj[k]+'</b></div>').join('')||'<div class="slot">empty</div>'; }
function bind(){ setTimeout(()=>{ const x=$('x'); if(x) x.onclick=closeModal; },0); }
function buy(item,cost){ if(player.crowns<cost){ say('Short on Crowns.'); return; } player.crowns-=cost; give(item); say('Bought '+item.replace('_',' ')+'.'); }
function sellRaw(){ const g=player.inv.logs*3+player.inv.oak*6+player.inv.tin*5+player.inv.copper*5+player.inv.stone*2+player.inv.raw_fish*4; if(!g){ say('Nothing Mira wants.'); return; } player.crowns+=g; player.inv.logs=player.inv.oak=player.inv.tin=player.inv.copper=player.inv.stone=player.inv.raw_fish=0; say('Sold for '+g+'c.'); }
function eatFish(){ if(take('cooked_fish')){ player.hp=Math.min(player.maxhp,player.hp+12); say('Warm.'); hud(); } }
function eatBread(){ if(take('bread')){ player.hp=Math.min(player.maxhp,player.hp+8); hud(); } }
function shopMarket(){ openModal('<h3>Mira\'s Market</h3><p>Lantern light on copper scales.</p><button class="ui wide" id="b1">Axe — 18c</button><button class="ui wide" id="b2">Pick — 18c</button><button class="ui wide" id="b3">Bread — 5c</button><button class="ui wide" id="b4">Block — 8c</button><button class="ui wide" id="b5">Sell raw goods</button><button class="ui wide" id="x">Close</button>'); setTimeout(()=>{ $('b1').onclick=()=>{buy('axe',18);hud();}; $('b2').onclick=()=>{buy('pick',18);hud();}; $('b3').onclick=()=>{buy('bread',5);hud();}; $('b4').onclick=()=>{buy('block',8);hud();}; $('b5').onclick=()=>{sellRaw();hud();}; bind(); },0); }
function shopForge(){ openModal('<h3>Bram\'s Forge</h3><p>The hearth never quite sleeps.</p><button class="ui wide" id="b1">Smelt bronze bar (tin + copper)</button><button class="ui wide" id="b2">Smith bronze sword (1 bar)</button><button class="ui wide" id="x">Close</button>'); setTimeout(()=>{ $('b1').onclick=()=>{ if(take('tin')&&take('copper')){ give('bronze_bar'); addXp('smithing',28); puff(player.x,player.y,'#c45c30',10); say('Bar cools.'); if(quest.step===3) setQ(4,'Fish the south pond.'); hud(); } else say('Need tin and copper.'); }; $('b2').onclick=()=>{ if(take('bronze_bar')){ give('bronze_sword'); addXp('smithing',36); say('Blade fitted.'); hud(); } else say('Need a bar.'); }; bind(); },0); }
function shopMill(){ openModal('<h3>Nettle\'s Mill</h3><p>Sawdust in the air.</p><button class="ui wide" id="b1">2 logs → 2 planks</button><button class="ui wide" id="b2">1 oak → 2 planks</button><button class="ui wide" id="b3">2 planks + stone → block</button><button class="ui wide" id="x">Close</button>'); setTimeout(()=>{ $('b1').onclick=()=>{ if(take('logs',2)){ give('planks',2); addXp('crafting',16); say('Planks.'); hud(); } else say('Need 2 logs.'); }; $('b2').onclick=()=>{ if(take('oak')){ give('planks',2); addXp('crafting',22); hud(); } else say('Need oak.'); }; $('b3').onclick=()=>{ if(take('planks',2)&&take('stone')){ give('block'); addXp('construction',18); hud(); } else say('Need planks and stone.'); }; bind(); },0); }
function shopKitchen(){ openModal('<h3>Alba\'s Kitchen</h3><p>Broth and woodsmoke.</p><button class="ui wide" id="b1">Cook raw fish</button><button class="ui wide" id="b2">Eat cooked fish +12</button><button class="ui wide" id="b3">Eat bread +8</button><button class="ui wide" id="x">Close</button>'); setTimeout(()=>{ $('b1').onclick=()=>{ if(take('raw_fish')){ give('cooked_fish'); addXp('cooking',20); say('Crisp.'); if(quest.step===5) setQ(6,'Clear a goblin east.'); hud(); } else say('Catch a fish.'); }; $('b2').onclick=eatFish; $('b3').onclick=eatBread; bind(); },0); }
function shopBank(){ openModal('<h3>Rowan\'s Vault</h3><div class="grid">'+itemRows(player.bank)+'</div><button class="ui wide" id="b1">Deposit extras</button><button class="ui wide" id="b2">Withdraw all</button><button class="ui wide" id="x">Close</button>'); setTimeout(()=>{ $('b1').onclick=()=>{ NAMES.forEach(k=>{ player.bank[k]+=player.inv[k]; player.inv[k]=0; }); if(!has('axe')) give('axe'); if(!has('pick')) give('pick'); shopBank(); hud(); }; $('b2').onclick=()=>{ NAMES.forEach(k=>{ give(k,player.bank[k]); player.bank[k]=0; }); shopBank(); hud(); }; bind(); },0); }
function shopQuest(){ if(quest.step===0){ setQ(1,'Chop a tree north of town.'); bubble(npcs.find(n=>n.role==='quest'),'Timber first.'); } else if(quest.step===7){ setQ(8,'Keep Emberford working.'); player.crowns+=60; give('block',6); say('Ellis pays 60c and timber-stone.'); } else say('Ellis: '+quest.text); openModal('<h3>Warden\'s Hall</h3><p>'+quest.text+'</p><button class="ui wide" id="x">Close</button>'); bind(); }
function openShop(b){ player.intent=null; if(dist(player,{x:b.x+b.w/2,y:b.y+b.h+12})>58 && dist(player,b)>86) return; ({market:shopMarket,forge:shopForge,mill:shopMill,kitchen:shopKitchen,bank:shopBank,quest:shopQuest}[b.role]||shopMarket)(); }
$('btnInv').onclick=()=>{ openModal('<h3>Pack</h3><div class="grid">'+itemRows(player.inv)+'</div><p>Crowns '+player.crowns+'</p><button class="ui wide" id="x">Close</button>'); bind(); };
$('btnBank').onclick=shopBank;
$('btnSkills').onclick=()=>{ openModal('<h3>Skills</h3>'+Object.keys(player.skills).map(s=>'<div class="row"><span>'+s+'</span><b>'+player.skills[s]+' · '+player.xp[s]+'/'+need(s)+'</b></div>').join('')+'<button class="ui wide" id="x">Close</button>'); bind(); };
$('btnPlace').onclick=()=>{ if(!inRect(player,plot)){ say('Stand on your gold plot.'); return; } if(!take('block')){ say('Need a block.'); return; } placed.push({x:player.x,y:player.y}); addXp('construction',22); puff(player.x,player.y,'#7a5a3a',8); say('Set.'); };
$('btnEat').onclick=()=>{ if(has('cooked_fish')) eatFish(); else eatBread(); };
function worldFromEvent(e){ const r=canvas.getBoundingClientRect(), t=e.touches?e.touches[0]:e; return {x:t.clientX-r.left+cam.x-W/2, y:t.clientY-r.top+cam.y-H/2}; }
function onPtr(e){ if($('title').style.display==='none'){ const p=worldFromEvent(e); tryAct(p.x,p.y); } }
canvas.addEventListener('mousedown',onPtr); canvas.addEventListener('touchstart',e=>onPtr(e),{passive:true});
$('btnStart').onclick=()=>{ $('title').style.display='none'; say('Dusk over Emberford.'); bubble(walkers[0],'Market\'s still open.'); };
function hud(){ $('stats').innerHTML='<b>'+player.name+'</b><br>Crowns '+player.crowns+'<br>Atk '+player.skills.attack+' · WC '+player.skills.woodcutting+' · Mn '+player.skills.mining; $('quest').innerHTML='<b>Emberford</b><br>'+quest.text; $('hpbar').style.width=(player.hp/player.maxhp*100)+'%'; $('xpbar').style.width=(player.xp.woodcutting/need('woodcutting')*100)+'%'; const hour=(time%1)*24, h=Math.floor(hour), m=Math.floor((hour-h)*60); const name=hour<5?'Night':hour<7?'Dawn':hour<17?'Day':hour<19.5?'Dusk':'Night'; $('clock').textContent=name+'  '+String(h).padStart(2,'0')+':'+String(m).padStart(2,'0'); }
function dayTint(){ const h=(time%1)*24; if(h>=7&&h<=17) return [0,0,0,0]; if(h>17&&h<19.5){ const t=(h-17)/2.5; return [40*t,18*t,8*t,.18*t]; } if(h>=19.5||h<5) return [8,12,28,.34]; const t=(7-h)/2; return [40*t,22*t,10*t,.16*t]; }
function drawB(b){ ctx.fillStyle='#0006'; ctx.fillRect(b.x+8,b.y+b.h-2,b.w,10); ctx.fillStyle=b.color; ctx.fillRect(b.x,b.y,b.w,b.h); ctx.fillStyle=b.roof; ctx.beginPath(); ctx.moveTo(b.x-10,b.y+10); ctx.lineTo(b.x+b.w/2,b.y-20); ctx.lineTo(b.x+b.w+10,b.y+10); ctx.closePath(); ctx.fill(); ctx.strokeStyle=b.trim; ctx.lineWidth=2; ctx.strokeRect(b.x+10,b.y+18,16,12); ctx.strokeRect(b.x+b.w-26,b.y+18,16,12); ctx.fillStyle='#1a120c'; ctx.fillRect(b.x+b.w/2-9,b.y+b.h-24,18,24); if(b.role==='forge'){ ctx.fillStyle='rgba(255,120,40,'+(.35+.25*Math.sin(time*40))+')'; ctx.beginPath(); ctx.arc(b.x+b.w*.3,b.y+b.h*.55,7,0,7); ctx.fill(); } ctx.fillStyle='#e8c56a'; ctx.font='12px Georgia'; ctx.textAlign='center'; ctx.fillText(b.label,b.x+b.w/2,b.y-24); }
function drawTree(t){ if(!t.alive)return; const s=t.s||1; ctx.fillStyle='#1d331c88'; ctx.beginPath(); ctx.ellipse(t.x,t.y+8,16*s,7*s,0,0,7); ctx.fill(); ctx.fillStyle='#5a3a22'; ctx.fillRect(t.x-4*s,t.y-10*s,8*s,18*s); ctx.fillStyle=t.kind==='oak'?'#2c6a36':'#3a7a40'; ctx.beginPath(); ctx.arc(t.x,t.y-18*s,17*s,0,7); ctx.fill(); }
function drawRock(r){ if(!r.alive)return; ctx.fillStyle=r.kind==='copper'?'#b56a3a':r.kind==='tin'?'#9aa4b0':'#6d7270'; ctx.beginPath(); ctx.moveTo(r.x-14,r.y+8); ctx.lineTo(r.x-8,r.y-12); ctx.lineTo(r.x+10,r.y-16); ctx.lineTo(r.x+16,r.y+6); ctx.closePath(); ctx.fill(); }
function body(p,col,me){ ctx.fillStyle='#0005'; ctx.beginPath(); ctx.ellipse(p.x,p.y+11,11,5,0,0,7); ctx.fill(); ctx.fillStyle=col; ctx.beginPath(); ctx.arc(p.x,p.y-7,8.2,0,7); ctx.fill(); ctx.fillRect(p.x-7.5,p.y-2,15,13); ctx.fillStyle='#f2d2b0'; ctx.beginPath(); ctx.arc(p.x,p.y-16,5.2,0,7); ctx.fill(); if(me&&has('bronze_sword')){ ctx.fillStyle='#d0d8de'; ctx.fillRect(p.x+8,p.y-12,3,20); } ctx.fillStyle='#efe6d4'; ctx.font='11px Georgia'; ctx.textAlign='center'; ctx.fillText(p.name||'',p.x,p.y-24); }
function drawMob(m){ if(!m.alive)return; ctx.fillStyle='#3f5e32'; ctx.beginPath(); ctx.arc(m.x,m.y-4,9,0,7); ctx.fill(); ctx.fillRect(m.x-8,m.y,16,10); ctx.fillStyle='#c45c4a'; ctx.fillRect(m.x-12,m.y-22,24*(m.hp/m.max),3); }
let last=performance.now();
function tick(now){
  const dt=Math.min(.05,(now-last)/1000); last=now; time+=dt/90;
  const dx=player.tx-player.x, dy=player.ty-player.y, d=Math.hypot(dx,dy);
  if(d>3){ const s=player.speed*dt/d; player.x+=dx*s; player.y+=dy*s; }
  else if(player.intent){ const t=player.intent.type; if(t==='chop')chop(player.intent.obj,dt); if(t==='mine')mine(player.intent.obj,dt); if(t==='fight')fight(player.intent.obj,dt); if(t==='fish')fish(player.intent.obj,dt); if(t==='shop')openShop(player.intent.obj); }
  for(const m of mobs){ if(!m.alive||!m.aggro||dist(m,player)>220) continue; const a=Math.atan2(player.y-m.y,player.x-m.x); m.x+=Math.cos(a)*52*dt; m.y+=Math.sin(a)*52*dt; }
  for(const o of walkers){ if(Math.random()<.007){ const b=buildings[Math.floor(Math.random()*buildings.length)]; o.tx=b.x+b.w/2+(Math.random()-0.5)*40; o.ty=b.y+b.h+18; } const od=Math.hypot(o.tx-o.x,o.ty-o.y); if(od>2){ o.x+=(o.tx-o.x)/od*34*dt; o.y+=(o.ty-o.y)/od*34*dt; } if(Math.random()<.0009) bubble(o, ['Need nails.','Market smell.','Watch the east.','Bar is warm.'][Math.floor(Math.random()*4)]); }
  for(const c of critters){ if(Math.random()<.012){ c.tx=c.x+(Math.random()-.5)*90; c.ty=c.y+(Math.random()-.5)*90; } const od=Math.hypot((c.tx||c.x)-c.x,(c.ty||c.y)-c.y); if(od>1){ c.x+=((c.tx||c.x)-c.x)/od*26*dt; c.y+=((c.ty||c.y)-c.y)/od*26*dt; } }
  if(player.hp<player.maxhp) player.hp=Math.min(player.maxhp,player.hp+1.5*dt);
  if(marker){ marker.life-=dt; if(marker.life<=0) marker=null; }
  for(let i=fx.length-1;i>=0;i--){ const p=fx[i]; p.life-=dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=40*dt; if(p.life<=0) fx.splice(i,1); }
  for(let i=floats.length-1;i>=0;i--){ floats[i].life-=dt; floats[i].y-=18*dt; if(floats[i].life<=0) floats.splice(i,1); }
  for(let i=bubbles.length-1;i>=0;i--){ bubbles[i].life-=dt; if(bubbles[i].life<=0) bubbles.splice(i,1); }
  cam.x=lerp(cam.x,player.x,.11); cam.y=lerp(cam.y,player.y,.11);
  ctx.fillStyle='#10180f'; ctx.fillRect(0,0,W,H);
  ctx.save(); ctx.translate(W/2-cam.x,H/2-cam.y);
  for(let y=0;y<WORLD;y++) for(let x=0;x<WORLD;x++){ const px=x*T, py=y*T; let col=(x+y)%2?'#2b402e':'#263a2a'; if(py>42*T){ const w=.45+.08*Math.sin(time*12+x*.4+y*.3); col='rgb('+(30+10*w|0)+','+(70+20*w|0)+','+(88+30*w|0)+')'; } if(px>town.x&&px<town.x+town.w&&py>town.y&&py<town.y+town.h) col=(x+y)%2?'#3e3c34':'#35332c'; if(Math.abs(px-29*T)<T && py>30*T && py<43*T) col='#4a463c'; ctx.fillStyle=col; ctx.fillRect(px,py,T,T); }
  ctx.strokeStyle='#e8c56a99'; ctx.lineWidth=2; ctx.strokeRect(plot.x,plot.y,plot.w,plot.h);
  ctx.fillStyle='#e8c56a'; ctx.font='12px Georgia'; ctx.textAlign='left'; ctx.fillText('Your plot',plot.x+4,plot.y-6);
  for(const b of placed){ ctx.fillStyle='#7a5a3a'; ctx.fillRect(b.x-13,b.y-13,26,26); ctx.fillStyle='#5a3e28'; ctx.fillRect(b.x-13,b.y-18,26,7); }
  if(marker){ ctx.strokeStyle='rgba(232,197,106,'+marker.life+')'; ctx.beginPath(); ctx.arc(marker.x,marker.y,8,0,7); ctx.stroke(); }
  buildings.forEach(drawB); trees.forEach(drawTree); rocks.forEach(drawRock);
  fishspots.forEach(f=>{ ctx.strokeStyle='#b7e4f4aa'; ctx.beginPath(); ctx.arc(f.x,f.y,9+Math.sin(time*18+f.x)*2,0,7); ctx.stroke(); });
  for(const tch of torches){ const g=.45+.3*Math.sin(time*25+tch.x); ctx.fillStyle='rgba(255,150,40,'+g+')'; ctx.beginPath(); ctx.arc(tch.x,tch.y-10,8,0,7); ctx.fill(); ctx.fillStyle='#3a2a18'; ctx.fillRect(tch.x-2,tch.y-6,4,14); }
  critters.forEach(c=>{ ctx.fillStyle=c.kind==='hen'?'#e0c8a0':'#8a7a68'; ctx.beginPath(); ctx.arc(c.x,c.y,5.5,0,7); ctx.fill(); });
  walkers.forEach(o=>body(o,o.c)); npcs.forEach(n=>body(n,'#c4a46a')); mobs.forEach(drawMob); body(player,'#6a9ad4',true);
  for(const p of fx){ ctx.globalAlpha=Math.max(0,p.life); ctx.fillStyle=p.c; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,7); ctx.fill(); ctx.globalAlpha=1; }
  for(const f of floats){ ctx.globalAlpha=Math.max(0,f.life); ctx.fillStyle=f.c; ctx.font='12px Georgia'; ctx.textAlign='center'; ctx.fillText(f.t,f.x,f.y); ctx.globalAlpha=1; }
  for(const b of bubbles){ const p=b.who; if(!p) continue; ctx.fillStyle='#efe6d4ee'; ctx.fillRect(p.x-46,p.y-48,92,18); ctx.fillStyle='#1a1810'; ctx.font='10px Georgia'; ctx.textAlign='center'; ctx.fillText(b.text,p.x,p.y-36); }
  ctx.restore();
  const tint=dayTint(); if(tint[3]>0){ ctx.fillStyle='rgba('+tint[0]+','+tint[1]+','+tint[2]+','+tint[3]+')'; ctx.fillRect(0,0,W,H); }
  mctx.fillStyle='#0c1412'; mctx.fillRect(0,0,92,92);
  const sc=92/(WORLD*T);
  mctx.fillStyle='#3e3c34'; mctx.fillRect(town.x*sc,town.y*sc,town.w*sc,town.h*sc);
  mctx.fillStyle='#2a4450'; mctx.fillRect(0,42*T*sc,92,92);
  mctx.fillStyle='#6a9ad4'; mctx.fillRect(player.x*sc-2,player.y*sc-2,4,4);
  mctx.fillStyle='#c45c4a'; for(const m of mobs) if(m.alive) mctx.fillRect(m.x*sc-1,m.y*sc-1,2,2);
  hud(); requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

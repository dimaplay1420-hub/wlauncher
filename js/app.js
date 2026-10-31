// Логика сайта: аккаунты, кабинет, промокоды, коины, отзывы, админ панель.
// Настройки лежат в js/config.js (подключается раньше).
const mem={};
const st={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return k in mem?mem[k]:d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){mem[k]=v}}};
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let mode="login";
const isAdm=u=>u&&u.email===CONFIG.ADMIN_EMAIL.toLowerCase();
const me=()=>{const us=st.get("wl_users",[]),now=Date.now();let ch=false;us.forEach(u=>{if(u.sponsorUntil&&u.sponsorUntil<=now){u.sponsor=false;delete u.sponsorUntil;ch=true}});if(ch)st.set("wl_users",us);const e=st.get("wl_session",null);return us.find(u=>u.email===e)||null};
function toast(t){const e=$("toast");e.textContent=t;e.style.display="block";clearTimeout(toast.t);toast.t=setTimeout(()=>e.style.display="none",3500)}
async function hash(p,s){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s+p));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}
const bd=u=>u&&u.sponsor&&u.badge!==false?'<i class="mk ck i5" title="Спонсор"></i>':"";
const role=u=>[isAdm(u)?"Администратор":"",u.sponsor?"Спонсор":""].filter(Boolean).join(", ")||"Пользователь";
function applyPrefs(){const u=me();document.body.classList.toggle("noanim",!!u&&u.anim===false)}
function nav(){applyPrefs();renderReviews();renderWall();const u=me();$("navR").innerHTML=u?(isAdm(u)?'<button class="btn g s" onclick="show(\'admin\')">Админ панель</button>':'')+'<button class="btn g s" onclick="show(\'cabinet\')">'+avh(u,22)+nk(u)+bd(u)+'</button>':'<button class="btn g s" onclick="openAuth(\'login\')">Войти</button><button class="btn p s" onclick="openAuth(\'reg\')">Регистрация</button>'}
function show(v){const u=me();if(v==="cabinet"&&!u)return openAuth("login");if(v==="admin"&&!isAdm(u))v=u?"cabinet":"home";
  $("v-home").style.display=v==="home"?"block":"none";["cabinet","admin"].forEach(n=>$("v-"+n).style.display=v===n?"block":"none");
  if(v==="cabinet")renderCab();if(v==="admin")renderAdmin();if(v!=="home")scrollTo(0,0)}
function openAuth(m){mode=m;const r=m==="reg";$("aTitle").textContent=r?"Регистрация":"Вход";$("aSub").textContent=r?"Создайте аккаунт WLauncher":"Войдите в свой аккаунт";$("nickW").style.display=r?"block":"none";$("aBtn").textContent=r?"Создать аккаунт":"Войти";$("aErr").textContent="";
  $("aSw").innerHTML=r?'Уже есть аккаунт? <a onclick="openAuth(\'login\')">Войти</a>':'Нет аккаунта? <a onclick="openAuth(\'reg\')">Регистрация</a>';$("authM").classList.add("open")}
function closeAuth(){$("authM").classList.remove("open")}
async function submitAuth(){
  const mail=$("fMail").value.trim().toLowerCase(),pass=$("fPass").value,nick=$("fNick").value.trim(),E=$("aErr");
  if(!/^\S+@\S+\.\S+$/.test(mail))return E.textContent="Введите корректную почту";
  if(pass.length<6)return E.textContent="Пароль — минимум 6 символов";
  const users=st.get("wl_users",[]);let u=users.find(x=>x.email===mail);
  if(mode==="reg"){
    if(nick.length<3)return E.textContent="Ник — минимум 3 символа";
    if(u)return E.textContent="Эта почта уже зарегистрирована";
    if(users.some(x=>x.nick.toLowerCase()===nick.toLowerCase()))return E.textContent="Этот ник уже занят";
    const salt=crypto.randomUUID();u={email:mail,nick,salt,h:await hash(pass,salt),created:Date.now(),coins:CONFIG.REG_COINS};users.push(u);st.set("wl_users",users);toast("+"+CONFIG.REG_COINS+" коинов за регистрацию");
  }else if(!u||u.h!==await hash(pass,u.salt))return E.textContent="Неверная почта или пароль";
  st.set("wl_session",mail);closeAuth();$("fPass").value="";nav();show(isAdm(u)?"admin":"cabinet");toast(mode==="reg"?"Аккаунт создан":"С возвращением, "+u.nick+"!")}

const promoText=k=>{const p=CONFIG.PROMOS[k];return p?"W+ на "+p.days+" дн. и "+p.coins+" коинов":"активирован"};
const wpTxt=u=>u.sponsor?(u.sponsorUntil?"активен до "+new Date(u.sponsorUntil).toLocaleDateString("ru-RU"):"навсегда"):"нет";
function promoTab(u){const used=u.promos||[];return '<div class="rows"><div class="sub">Активировать промокод</div><div class="row fm"><input id="pIn" placeholder="Введите промокод" maxlength="32" onkeydown="if(event.key===\'Enter\')redeem()"><button class="btn p s" onclick="redeem()">Активировать</button></div>'+(used.length?'<div class="sub">Активированные</div>'+used.map(k=>row(esc(k),promoText(k))).join(""):"")+"</div>"}
function redeem(){const raw=$("pIn").value.trim().toLowerCase(),u=me();if(!raw)return toast("Введите промокод");
  const key=Object.keys(CONFIG.PROMOS).find(k=>k.toLowerCase()===raw);if(!key)return toast("Такого промокода нет");
  const p=CONFIG.PROMOS[key],cnt=st.get("wl_promo",{});
  if((u.promos||[]).includes(key))return toast("Вы уже активировали этот промокод");
  if((cnt[key]||0)>=p.max)return toast("Промокод закончился: он уже использован "+p.max+" раз");
  cnt[key]=(cnt[key]||0)+1;st.set("wl_promo",cnt);let perm=false;
  upd(x=>{x.coins=(x.coins||0)+p.coins;perm=!!x.sponsor&&!x.sponsorUntil;if(!perm){x.sponsor=true;x.sponsorUntil=Math.max(Date.now(),x.sponsorUntil||0)+p.days*864e5}(x.promos=x.promos||[]).push(key)});
  nav();renderCab();showReward(key,p,perm)}
function showReward(key,p,perm){$("rwCode").textContent=key;
  $("rwItems").innerHTML='<div class="ri" style="--i:0"><img src="assets/coin.png" alt="" width="56" height="56"><b>+<span id="rwN">0</span></b><span>коинов</span></div>'+(perm?"":'<div class="ri" style="--i:1"><div class="wpb">W+</div><b>'+p.days+' дней</b><span>статус спонсора</span></div>');
  $("rwM").classList.add("open");burst();const el=$("rwN");
  setTimeout(()=>{const s=performance.now();(function f(n){const t=Math.min((n-s)/1200,1);el.textContent=fmt(Math.round(p.coins*(1-Math.pow(1-t,3))));if(t<1)requestAnimationFrame(f)})(s)},550)}
function burst(){const fx=$("rwFx");fx.innerHTML="";const C=["#ff6a00","#ffa04d","#ffd54a","#ffffff","#ff3d00"];for(let i=0;i<48;i++){const e=document.createElement("i"),a=Math.random()*Math.PI*2,d=140+Math.random()*260;e.style.cssText="--dx:"+Math.cos(a)*d+"px;--dy:"+(Math.sin(a)*d-60)+"px;--r:"+Math.round(Math.random()*720-360)+"deg;background:"+C[i%C.length]+";animation-delay:"+(Math.random()*.25).toFixed(2)+"s;width:"+Math.round(6+Math.random()*6)+"px;height:"+Math.round(10+Math.random()*8)+"px";fx.appendChild(e)}}
function closeReward(){$("rwM").classList.remove("open");$("rwFx").innerHTML="";document.querySelectorAll(".coinp").forEach(e=>{e.classList.remove("bump");void e.offsetWidth;e.classList.add("bump")})}
function renderAdPromo(){const cnt=st.get("wl_promo",{});$("adPromo").innerHTML=Object.keys(CONFIG.PROMOS).map(k=>"<tr><td>"+esc(k)+"</td><td>"+(cnt[k]||0)+" / "+CONFIG.PROMOS[k].max+"</td><td>"+promoText(k)+"</td></tr>").join("")}
let cfFn=null;function ask(t,f){cfFn=f;$("cfT").textContent=t;$("cfM").classList.add("open")}
function cfNo(){cfFn=null;$("cfM").classList.remove("open")}function cfYes(){const f=cfFn;cfNo();if(f)f()}
function logout(){st.set("wl_session",null);nav();show("home")}
let cab="profile";
const row=(a,b)=>'<div class="row"><span>'+a+"</span><b>"+b+"</b></div>";
const mask=u=>u.hideMail?esc(u.email.replace(/^(.).*(@.*)$/,"$1•••$2")):esc(u.email);
function cabTab(t){cab=t;renderCab()}
function upd(f){const us=st.get("wl_users",[]),u=us.find(x=>x.email===st.get("wl_session",null));if(u){f(u);st.set("wl_users",us)}return u}
function renderCab(){const u=me();if(!u)return show("home");
  const T=[["profile","Профиль"],["look","Косметика"],["promo","Промокоды"],["dl","Загрузки"],["set","Настройки"]];
  $("cTabs").innerHTML=T.map(t=>'<button class="'+(cab===t[0]?"on":"")+'" onclick="cabTab(\''+t[0]+'\')">'+t[1]+"</button>").join("")+(isAdm(u)?'<button onclick="show(\'admin\')">Админ панель</button>':"");
  $("cAv").innerHTML=avh(u,38);
  const d=st.get("wl_dl",{windows:0,macos:0,linux:0}),tot=d.windows+d.macos+d.linux,dt=new Date(u.created).toLocaleDateString("ru-RU");let h="";
  if(cab==="profile"){const ban=u.banner?"background-image:url('"+u.banner+"')":"";
    h='<div class="ban" style="'+ban+'"></div><div class="pgrid"><div class="pcard"><div style="display:grid;justify-items:center;margin:-64px 0 16px">'+avh(u,92)+"</div><b>"+nk(u)+bd(u)+'</b><span class="chip">'+role(u)+'</span><div style="color:var(--mute);font-size:13px">на сайте с '+dt+'</div></div><div class="rows">'+row("Почта",mask(u))+row("Роль",role(u))+row("Коины",fmt(u.coins||0))+row("W+",wpTxt(u))+row("Регистрация",dt)+row("Скачиваний в этом браузере",tot)+"</div></div>"}
  else if(cab==="look"){const cur=u.color||(u.sponsor?"gold":""),fcur=u.frame||(u.sponsor?"flame":"none");
    const sw=(kind,tbl,c2)=>'<div class="swt">'+Object.keys(tbl).map(k=>{const e=tbl[k],lock=(kind==="color"?e[2]:e[1])&&!u.sponsor;return '<button class="'+((kind==="color"?cur:fcur)===k?"on":"")+(lock?" lk":"")+'" onclick="setLook(\''+kind+"','"+k+'\')">'+(kind==="color"?nk({nick:e[0],color:k,sponsor:true}):avh({nick:u.nick,avatar:u.avatar,frame:k,sponsor:true},34)+"<span>"+e[0]+"</span>")+(lock?"<small>только спонсоры</small>":"")+"</button>"}).join("")+"</div>";
    h='<div class="rows"><div class="sub">Аватар</div><div class="row"><span class="rowf">'+avh(u,56)+'<span>JPG, PNG или GIF</span></span><span class="rowf"><button class="btn g s" onclick="$(\'fAv\').click()">Загрузить</button>'+(u.avatar?'<button class="btn d" onclick="clr(\'avatar\')">Убрать</button>':"")+'</span></div>'+
    '<div class="sub">Баннер</div><div class="row"><span class="rowf"><span class="bprev" style="'+(u.banner?"background-image:url('"+u.banner+"')":"")+'"></span></span><span class="rowf"><button class="btn g s" onclick="$(\'fBn\').click()">Загрузить</button>'+(u.banner?'<button class="btn d" onclick="clr(\'banner\')">Убрать</button>':"")+"</span></div>"+
    '<div class="sub">Цвет ника</div>'+sw("color",COLORS)+'<div class="sub">Рамка аватара</div>'+sw("frame",FRAMES)+
    '<input type="file" id="fAv" accept="image/*" hidden onchange="upImg(this,\'avatar\',160,160)"><input type="file" id="fBn" accept="image/*" hidden onchange="upImg(this,\'banner\',720,240)"></div>'}
  else if(cab==="promo")h=promoTab(u);
  else if(cab==="dl")h='<div class="rows">'+[["Windows","Windows 10 и новее","windows"]].map(r=>'<div class="row"><span><b style="display:block;text-align:left">'+r[0]+"</b>"+r[1]+'</span><button class="btn p s" onclick="dl(\''+r[2]+'\')"><i class="mk di i1"></i>Скачать</button></div>').join("")+row("Актуальная версия",CONFIG.VERSION)+"</div>";
  else{const tr=(k,l,on)=>'<div class="row t'+(on?" on":"")+'" onclick="pref(\''+k+'\')"><span>'+l+'</span><i class="tg"></i></div>';
    h='<div class="rows"><div class="sub">Сайт</div>'+tr("anim","Анимации на сайте",u.anim!==false)+tr("hideMail","Скрывать почту в кабинете",!!u.hideMail)+(u.sponsor?tr("badge","Показывать галочку спонсора",u.badge!==false):"")+
    '<div class="sub">Аккаунт</div><div class="frm"><div class="row fm"><input id="sNick" maxlength="16" value="'+esc(u.nick)+'" placeholder="Новый ник"><button class="btn g s" onclick="saveNick()">Сменить ник</button></div>'+
    '<div class="row fm"><input id="sP0" type="password" placeholder="Текущий пароль"><input id="sP1" type="password" placeholder="Новый пароль"><button class="btn g s" onclick="savePass()">Сменить пароль</button></div></div>'+
    '<div class="cta" style="margin-top:8px"><button class="btn g s" onclick="logout()">Выйти</button><button class="btn d" onclick="delAcc()">Удалить аккаунт</button></div></div>'}
  $("cBody").innerHTML=h}
const COLORS={orange:["Оранжевый","#ff8a2a",0],white:["Белый","#f6f0e9",0],blue:["Голубой","#5ab0ff",0],green:["Зелёный","#4ade80",0],pink:["Розовый","#ff6ad5",0],gold:["Золото","",1],aurora:["Аврора","",1]};
const FRAMES={none:["Без рамки",0],ring:["Оранжевая",0],blue:["Голубая",0],dash:["Пунктир",0],flame:["Пламя",1]};
const nk=u=>{const k=u.color||(u.sponsor?"gold":""),c=COLORS[k];if(!c||(c[2]&&!u.sponsor))return esc(u.nick);return c[2]?'<span class="nk-'+k+'">'+esc(u.nick)+"</span>":'<span style="color:'+c[1]+'">'+esc(u.nick)+"</span>"};
const avh=(u,z)=>{const k=u.frame||(u.sponsor?"flame":"none"),f=FRAMES[k],fr=f&&(!f[1]||u.sponsor)?k:"none";return '<span class="avw fr-'+fr+'" style="width:'+z+"px;height:"+z+"px;font-size:"+Math.round(z*.42)+'px"><span class="av">'+(u.avatar?'<img alt="" src="'+u.avatar+'">':esc(u.nick[0].toUpperCase()))+"</span></span>"};
function setLook(kind,k){const e=(kind==="color"?COLORS:FRAMES)[k];if((kind==="color"?e[2]:e[1])&&!me().sponsor)return toast("Это доступно только спонсорам");upd(u=>u[kind]=k);nav();renderCab()}
function clr(k){upd(u=>{delete u[k]});nav();renderCab()}
function upImg(inp,key,w,h){const f=inp.files[0];inp.value="";if(!f||!/^image\//.test(f.type))return toast("Выберите картинку");if(f.size>8e6)return toast("Файл больше 8 МБ");
  const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const c=document.createElement("canvas");c.width=w;c.height=h;const sc=Math.max(w/im.width,h/im.height),dw=im.width*sc,dh=im.height*sc;c.getContext("2d").drawImage(im,(w-dw)/2,(h-dh)/2,dw,dh);upd(u=>u[key]=c.toDataURL("image/jpeg",.85));nav();renderCab();toast("Сохранено")};im.onerror=()=>toast("Не удалось открыть картинку");im.src=r.result};r.readAsDataURL(f)}
const dlTotal=()=>{const d=st.get("wl_dl",{windows:0,macos:0,linux:0});return CONFIG.BASE_DOWNLOADS+d.windows+d.macos+d.linux};
function updCount(){const e=$("dlCount");if(!e)return;e.dataset.to=dlTotal();e.textContent=dlTotal()}
let rvS=5;const revs=()=>st.get("wl_reviews",[]);const stars=n=>"★".repeat(n)+"☆".repeat(5-n);
function renderReviews(){const R=revs(),us=st.get("wl_users",[]),u=me();
  $("revSum").textContent=R.length?"Средняя оценка "+(R.reduce((a,r)=>a+r.stars,0)/R.length).toFixed(1)+" из 5 · отзывов: "+R.length:"Отзывов пока нет — станьте первым";
  $("revList").innerHTML=R.length?R.slice().sort((a,b)=>b.ts-a.ts).map(r=>{const a=us.find(x=>x.email===r.email),can=u&&(isAdm(u)||u.email===r.email);return '<div class="rev'+(a&&a.sponsor?" sp":"")+'"><div class="rh">'+(a?avh(a,40):'<span class="av" style="width:40px;height:40px">?</span>')+"<div><b>"+(a?nk(a)+bd(a):esc(r.nick))+"</b><small>"+new Date(r.ts).toLocaleDateString("ru-RU")+'</small></div><span class="stars">'+stars(r.stars)+"</span></div><p>"+esc(r.text)+"</p>"+(can?'<button class="btn d" data-e="'+esc(r.email)+'" onclick="delRev(this.dataset.e)">Удалить</button>':"")+"</div>"}).join(""):'<div class="empty">Пока здесь пусто.</div>';
  const mine=u&&R.find(r=>r.email===u.email);if(mine)rvS=mine.stars;
  $("revForm").innerHTML=u?'<h3>'+(mine?"Ваш отзыв":"Оставить отзыв")+'</h3><div class="stp">'+[1,2,3,4,5].map(n=>'<button class="'+(n<=rvS?"on":"")+'" onclick="setStars('+n+')">★</button>').join("")+'</div><textarea id="rText" maxlength="400" placeholder="Расскажите о лаунчере">'+(mine?esc(mine.text):"")+'</textarea><button class="btn p" onclick="sendRev()">'+(mine?"Обновить отзыв":"Отправить")+"</button>":'<h3>Оставить отзыв</h3><p>Войдите в аккаунт, чтобы написать отзыв.</p><button class="btn p" onclick="openAuth(\'login\')">Войти</button>'}
function setStars(n){rvS=n;document.querySelectorAll(".stp button").forEach((b,i)=>b.classList.toggle("on",i<n))}
function sendRev(){const u=me(),t=$("rText").value.trim();if(t.length<5)return toast("Напишите хотя бы пару слов");const R=revs().filter(r=>r.email!==u.email);R.push({email:u.email,nick:u.nick,stars:rvS,text:t,ts:Date.now()});st.set("wl_reviews",R);renderReviews();toast("Спасибо за отзыв!")}
function delRev(e){ask("Удалить отзыв?",()=>{st.set("wl_reviews",revs().filter(r=>r.email!==e));renderReviews();if($("v-admin").style.display==="block")renderAdmin();toast("Отзыв удалён")})}
function renderWall(){const sp=st.get("wl_users",[]).filter(x=>x.sponsor);
  const h=sp.map(u=>'<div class="spc">'+avh(u,72)+"<span>"+nk(u)+bd(u)+"</span></div>").join("")+CONFIG.SPONSORS.map(n=>'<div class="spc">'+avh({nick:String(n),sponsor:true},72)+'<span class="nk-gold">'+esc(n)+"</span></div>").join("");
  $("spWall").innerHTML=h||'<div class="empty" style="grid-column:1/-1">Здесь может быть ваше имя. Чтобы стать спонсором, напишите администрации WLauncher.</div>'}
function pref(k){upd(u=>{if(k==="hideMail")u.hideMail=!u.hideMail;else u[k]=u[k]===false});nav();renderCab()}
function saveNick(){const n=$("sNick").value.trim(),me0=me();if(n.length<3||n.length>16)return toast("Ник: от 3 до 16 символов");
  if(st.get("wl_users",[]).some(x=>x.email!==me0.email&&x.nick.toLowerCase()===n.toLowerCase()))return toast("Этот ник уже занят");
  upd(u=>u.nick=n);nav();renderCab();toast("Ник изменён")}
async function savePass(){const u=me(),a=$("sP0").value,b=$("sP1").value;if(await hash(a,u.salt)!==u.h)return toast("Текущий пароль неверный");if(b.length<6)return toast("Новый пароль — минимум 6 символов");
  const salt=crypto.randomUUID(),h=await hash(b,salt);upd(x=>{x.salt=salt;x.h=h});renderCab();toast("Пароль изменён")}
function delAcc(){const u=me();ask("Удалить аккаунт безвозвратно?",()=>{st.set("wl_users",st.get("wl_users",[]).filter(x=>x.email!==u.email));st.set("wl_reviews",revs().filter(r=>r.email!==u.email));logout();toast("Аккаунт удалён")})}
function renderAdRevs(){const R=revs().slice().sort((a,b)=>b.ts-a.ts);$("adRevs").innerHTML=R.length?R.map(r=>"<tr><td>"+esc(r.nick)+"</td><td>"+stars(r.stars)+'</td><td style="white-space:normal;min-width:200px">'+esc(r.text)+'</td><td><button class="btn d" data-e="'+esc(r.email)+'" onclick="delRev(this.dataset.e)">Удалить</button></td></tr>').join(""):'<tr><td colspan="4">Отзывов нет</td></tr>'}
function renderAdmin(){renderAdRevs();renderAdPromo();const us=st.get("wl_users",[]),d=st.get("wl_dl",{windows:0,macos:0,linux:0}),tot=d.windows+d.macos+d.linux;
  $("adStats").innerHTML=[[us.length,"Пользователей"],[us.filter(isAdm).length,"Админов"],[us.filter(x=>x.sponsor).length,"Спонсоров"],[tot,"Скачиваний"],[revs().length,"Отзывов"],[CONFIG.VERSION,"Версия"]].map(s=>'<div class="stat"><b>'+s[0]+"</b><span>"+s[1]+"</span></div>").join("");
  $("adUsers").innerHTML=us.map(u=>"<tr><td>"+nk(u)+bd(u)+"</td><td>"+esc(u.email)+'</td><td><span class="badge'+(isAdm(u)||u.sponsor?" a":"")+'">'+role(u)+"</span></td><td>"+new Date(u.created).toLocaleDateString("ru-RU")+"</td><td>"+'<button class="btn sp" data-e="'+esc(u.email)+'" onclick="toggleSp(this.dataset.e)">'+(u.sponsor?"Снять спонсора":"Спонсор")+'</button> '+(isAdm(u)?"":'<button class="btn d" data-e="'+esc(u.email)+'" onclick="delUser(this.dataset.e)">Удалить</button>')+"</td></tr>").join("");
  $("adDl").innerHTML=[["Windows",d.windows]].map(r=>"<span>"+r[0]+"</span><span>"+r[1]+"</span>").join("")}
function toggleSp(e){const us=st.get("wl_users",[]),u=us.find(x=>x.email===e);if(!u)return;u.sponsor=!u.sponsor;delete u.sponsorUntil;st.set("wl_users",us);nav();renderAdmin()}
function delUser(e){ask("Удалить пользователя "+e+"?",()=>{st.set("wl_users",st.get("wl_users",[]).filter(u=>u.email!==e));st.set("wl_reviews",revs().filter(r=>r.email!==e));renderAdmin();renderReviews();renderWall()})}
function dl(os){const d=st.get("wl_dl",{windows:0,macos:0,linux:0});const url=CONFIG.DOWNLOADS[os];
  if(!url)return toast("Файл лаунчера для этой системы скоро появится");
  d[os]++;st.set("wl_dl",d);updCount();const a=document.createElement("a");a.href=url;a.download="";document.body.appendChild(a);a.click();a.remove();toast("Загрузка началась")}
$("verTxt").textContent=CONFIG.VERSION;document.querySelectorAll(".vtag").forEach(e=>e.textContent=CONFIG.VERSION);updCount();nav();
document.querySelectorAll(".head,.tc,.f,.dc,.st,.stat,.panel,details,.mock,.st2").forEach((e,i)=>{e.classList.add("rv");e.style.transitionDelay=(i%4)*80+"ms"});
function count(e){const t=+e.dataset.to,s=performance.now();(function f(n){const p=Math.min((n-s)/1400,1);e.textContent=Math.round(t*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(f)})(s)}
const io=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){x.target.classList.add("in");x.target.querySelectorAll(".cnt").forEach(count);io.unobserve(x.target)}}),{threshold:.15});
document.querySelectorAll(".rv").forEach(e=>io.observe(e));
setTimeout(()=>document.querySelectorAll(".rv:not(.tc)").forEach(e=>e.classList.add("in")),2500);
document.addEventListener("pointermove",e=>{const t=e.target.closest&&e.target.closest(".f,.tc,.dc");if(t){const r=t.getBoundingClientRect();t.style.setProperty("--x",e.clientX-r.left+"px");t.style.setProperty("--y",e.clientY-r.top+"px")}});
const gl=$("glow");let gx=0,gy=0,gq=0;document.addEventListener("pointermove",e=>{gx=e.clientX;gy=e.clientY;gl.style.opacity=1;if(!gq){gq=1;requestAnimationFrame(()=>{gl.style.transform="translate("+gx+"px,"+gy+"px)";gq=0})}});document.documentElement.addEventListener("pointerleave",()=>gl.style.opacity=0);
document.addEventListener("keydown",e=>{if(e.key==="Enter"&&$("authM").classList.contains("open"))submitAuth();if(e.key==="Escape")closeAuth()});
/* Тема */
function setTheme(t){document.documentElement.dataset.theme=t;st.set("wl_theme",t)}
function toggleTheme(){setTheme(document.documentElement.dataset.theme==="dark"?"light":"dark")}
/* Коины и ежедневная награда */
const fmt=n=>String(n).replace(/\B(?=(\d{3})+(?!\d))/g," ");
const slotOf=d=>{const s=new Date(d);s.setHours(CONFIG.DAILY_HOUR,0,0,0);if(d<s)s.setDate(s.getDate()-1);return s.getTime()};
const prevSlot=t=>{const s=new Date(t);s.setDate(s.getDate()-1);return s.getTime()};
function dailyState(u){const now=new Date(),sl=slotOf(now),ls=u.lastSlot||0,act=(ls===sl||ls===prevSlot(sl))?(u.streak||0):0,claimed=ls===sl,done=claimed?((act-1)%7)+1:act%7,nx=new Date(sl);nx.setDate(nx.getDate()+1);return{claimed,done,next:nx.getTime()-now.getTime(),reward:CONFIG.DAILY_REWARDS[done]}}
function pill(){document.querySelectorAll(".coinp").forEach(e=>e.remove());const u=me(),n=$("navR");if(u&&n)n.insertAdjacentHTML("afterbegin",'<button class="coinp" onclick="openDaily()" aria-label="Коины и ежедневная награда"><img src="assets/coin.png" alt="" width="20" height="20"><b>'+fmt(u.coins||0)+"</b>"+(dailyState(u).claimed?"":'<i class="dotn"></i>')+"</button>")}
const _nav=nav;nav=function(){_nav();pill();const pa=$("plusAct"),u=me();if(pa)pa.innerHTML=u&&u.sponsor?'<button class="btn p" disabled>Вы спонсор W+</button>':'<button class="btn p" onclick="payPlus()">Стать спонсором за '+CONFIG.PLUS_PRICE_RUB+"₽/мес</button>"};
function openDaily(){if(!me())return openAuth("login");renderDaily();$("dailyM").classList.add("open")}
function closeDaily(){$("dailyM").classList.remove("open")}
function renderDaily(){const u=me();if(!u)return;const s=dailyState(u),R=CONFIG.DAILY_REWARDS,t=Math.max(0,s.next),hh=Math.floor(t/3600000),mm=Math.floor(t%3600000/60000);
  const tiles=R.map((r,i)=>'<div class="dy'+(i<s.done?" ok":"")+(!s.claimed&&i===s.done?" cur":"")+'"><small>День '+(i+1)+'</small><img src="assets/coin.png" alt="" width="28" height="28"><b>+'+r+"</b></div>").join("");
  $("dailyBody").innerHTML='<div class="dbal"><img class="coin" src="assets/coin.png" alt="" width="48" height="48"><div><b>'+fmt(u.coins||0)+"</b><span>коинов на счету</span></div></div><div class=\"dgrid\">"+tiles+"</div>"+(s.claimed?'<button class="btn g" disabled>Следующая награда через '+hh+" ч "+mm+" мин</button>":'<button class="btn p" onclick="claimDaily()">Забрать +'+s.reward+" коинов</button>")+'<p class="dn">Новая награда каждый день в '+CONFIG.DAILY_HOUR+":00. Пропустите день, и серия начнётся заново. На 7-й день награда больше. Скоро коины можно будет тратить на особые вещи.</p>"}
function claimDaily(){const u=me();if(!u||dailyState(u).claimed)return;const sl=slotOf(new Date());let g=0;upd(x=>{x.streak=x.lastSlot===prevSlot(sl)?((x.streak||0)%7)+1:1;x.lastSlot=sl;g=CONFIG.DAILY_REWARDS[x.streak-1];x.coins=(x.coins||0)+g});pill();renderDaily();toast("+"+g+" коинов")}
function payPlus(){if(!me())return openAuth("login");toast("Оплата рублями скоро появится")}
setInterval(()=>{pill();if($("dailyM").classList.contains("open"))renderDaily()},60000);
nav();

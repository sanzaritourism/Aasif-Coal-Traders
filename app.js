const $=s=>document.querySelector(s)
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))
const num=v=>{const x=parseFloat(String(v??"").replace(/,/g,""))
return isFinite(x)?x:0}
const inr=n=>"₹"+Math.round(Math.abs(n)).toLocaleString("en-IN")
const qn=n=>(+num(n).toFixed(3)).toLocaleString("en-IN")
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7)
const iso=d=>{const x=new Date(d)
x.setMinutes(x.getMinutes()-x.getTimezoneOffset())
return x.toISOString().slice(0,10)}
const today=()=>iso(new Date)
const DAYS=["Itwar","Somwar","Mangal","Budh","Jumerat","Jumma","Shanivar"]
const MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
function dlabel(s,short){if(!s)return""
const[y,m,d]=s.split("-").map(Number)
const dt=new Date(y,m-1,d)
const base=(short?"":DAYS[dt.getDay()]+", ")+d+" "+MON[m-1]+(y!==(new Date).getFullYear()?" "+y:"")
if(short)return base
const t=today(),yd=iso(new Date(Date.now()-864e5))
return s===t?"Aaj · "+base:s===yd?"Kal · "+base:base}const ICON={buy:'<svg class="i" viewBox="0 0 24 24"><path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 20h14"/></svg>',sell:'<svg class="i" viewBox="0 0 24 24"><path d="M12 15V4m0 0L7.5 8.5M12 4l4.5 4.5M5 20h14"/></svg>',in:'<svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 8v8m-3.2-3.2L12 16l3.2-3.2"/></svg>',out:'<svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 16V8m-3.2 3.2L12 8l3.2 3.2"/></svg>',truck:'<svg class="i" viewBox="0 0 24 24"><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></svg>'}
const PT={supplier:{l:"Supplier",c:"amber"},tempo:{l:"Tempo",c:"violet"},buyer:{l:"Grahak",c:"blue"}}
const TT={buy:{l:"Kharidi",s:"Kharidi",sub:"Maal liya",c:"amber"},sell:{l:"Bikri",s:"Bikri",sub:"Maal becha",c:"blue"},in:{l:"Payment mila",s:"Paisa mila",sub:"Grahak se aaya",c:"green"},out:{l:"Payment diya",s:"Paisa diya",sub:"Party / tempo ko",c:"red"}}
const DEF_PT={buy:"supplier",sell:"buyer",in:"buyer",out:"supplier"}
const PLBL={buy:"Kis party se maal liya?",sell:"Kisko becha? (Grahak)",in:"Kisse paisa mila?",out:"Kisko paisa diya? (party ya tempo)"}
function toast(m){const t=$("#toast")
t.textContent=m
t.classList.add("show")
clearTimeout(toast._t)
toast._t=setTimeout(()=>t.classList.remove("show"),2800)}const S={parties:{},txns:{},cfg:{},bin:{}}
const ui={tab:"home",hq:"",hf:"all",hp:"all",pq:"",pf:"all",ptab:"orders"}
const LK="coalHisab_v1"
let col=null,live=false,localMode=false
const pend={}
let wq=Promise.resolve()
function loadLocal(){try{const j=JSON.parse(localStorage.getItem(LK)||"null")
if(j){S.parties=j.parties||{}
S.txns=j.txns||{}
S.cfg=j.cfg||{}
S.bin=j.bin||{}}}catch(e){}}function saveLocal(){if(!localMode)return
try{localStorage.setItem(LK,JSON.stringify({parties:S.parties,txns:S.txns,cfg:S.cfg,bin:S.bin}))}catch(e){}}const clean=d=>JSON.parse(JSON.stringify(d))
function queue(id,doc){if(!col){saveLocal()
return}const p=doc?col.doc(id).set(clean(doc)):col.doc(id).delete()
p.catch(e=>{console.error(e)
fail(e)})}function fail(e){toast(e&&e.code==="permission-denied"?"Save nahi hua — login / rules check karo":"Save nahi hua, dubara try karo")}const bucket=d=>d.kind==="party"?S.parties:d.kind==="bin"?S.bin:S.txns
function put(d){if(d.kind==="settings")S.cfg=d
else bucket(d)[d.id]=d
saveLocal()
queue(d.id,d)
render()}function delDoc(d){delete bucket(d)[d.id]
saveLocal()
queue(d.id,null)
render()}function remove(d){const b={kind:"bin",id:"b_"+d.id,item:clean(d),at:Date.now()}
S.bin[b.id]=b
queue(b.id,b)
delDoc(d)}function setSync(t,c){const e=$("#sync")
e.textContent=t
e.className="sync "+(c||"")}function goLocal(msg){localMode=true
col=null
if(!Object.keys(S.parties).length&&!Object.keys(S.txns).length)loadLocal()
setSync(msg||"Is phone pe save","warn")
render()}let FBU=null,unsubSnap=null
function fbReady(){return new Promise(r=>{if(window.FB)return r(window.FB)
window.addEventListener("fb-ready",()=>r(window.FB),{once:true})})}function docsToState(snap){const P={},T={},Bn={}
let C={}
snap.docs.forEach(d=>{const x={...d.data(),id:d.id}
if(x.kind==="party")P[d.id]=x
else if(x.kind==="txn")T[d.id]=x
else if(x.kind==="settings")C=x
else if(x.kind==="bin")Bn[d.id]=x})
S.parties=P
S.txns=T
S.cfg=C
S.bin=Bn}async function connect(){setSync("Load ho raha he…")
let FB
try{FB=await Promise.race([fbReady(),new Promise((_,j)=>setTimeout(()=>j(new Error("timeout")),15e3))])}catch(e){setSync("Internet check karo","warn")
showLogin("Firebase load nahi hua. Internet check karke page reload karo.")
return}FB.onAuth(user=>{if(unsubSnap){unsubSnap()
unsubSnap=null}FBU=user
if(!user){col=null
S.parties={}
S.txns={}
S.cfg={}
S.bin={}
render()
FB.anon().catch(e=>{console.error(e)
showLogin(["auth/admin-restricted-operation","auth/operation-not-allowed","auth/configuration-not-found"].includes(e.code)?"Firebase setup baaki he: Firebase console → Authentication → Get started → Sign-in method → Anonymous ko Enable karo, phir ye page reload karo.":e.code==="auth/network-request-failed"?"Internet nahi he. Net on karke page reload karo.":"Connect nahi hua: "+(e.code||e.message))})
return}hideLogin()
const base=["shops","aasif-coal","docs"]
col={doc:id=>({set:d=>FB.set(base,id,d),delete:()=>FB.del(base,id)})}
unsubSnap=FB.listen(base,snap=>{docsToState(snap)
live=true
const m=snap.metadata
setSync(m.fromCache?"Offline — internet aate hi sync":m.hasPendingWrites?"Sync ho raha he…":"Saved · Firebase",m.fromCache||m.hasPendingWrites?"warn":"ok")
render()},err=>{console.error(err)
setSync("Data nahi mila — rules check karo","warn")
toast(err.code==="permission-denied"?"Permission nahi — Firestore Rules publish karo":err.code==="not-found"||err.code==="failed-precondition"?"Firestore Database abhi bana nahi — Firebase console me Create database karo":"Sync error: "+(err.code||""))})})}function migrateLocal(empty){let j=null
try{j=JSON.parse(localStorage.getItem(LK)||"null")}catch(e){}if(!j)return
if(empty){const all=[...Object.values(j.parties||{}),...Object.values(j.txns||{})]
all.forEach(d=>{(d.kind==="party"?S.parties:S.txns)[d.id]=d
queue(d.id,d)})
if(j.cfg&&j.cfg.kind){S.cfg=j.cfg
queue("cfg",j.cfg)}if(all.length)toast(all.length+" purani entries sync ki")}try{localStorage.removeItem(LK)}catch(e){}}function showLogin(msg){let d=$("#login")
if(!d){d=document.createElement("div")
d.id="login"
d.className="lock"
document.body.appendChild(d)}
d.innerHTML=`<div class="logo" style="width:72px;height:72px;border-radius:22px"><span style="width:22px;height:22px"></span></div>\n  <b style="font-size:22px;letter-spacing:-.02em">Aasif Coal Traders</b><div style="color:#A6AAB2;font-size:14px;text-align:center;max-width:280px">${msg?esc(msg):"Apna hisab dekhne ke liye Google se login karo"}</div>\n  ${msg?"":`<button class="gbtn" id="gLogin"><svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>Google se login karo</button>`}\n  <div style="color:#6F737B;font-size:12px;margin-top:6px">Data aapke Firebase me safe rahega</div>`
const b=$("#gLogin")
if(b)b.onclick=async()=>{b.disabled=true
b.style.opacity=.6
try{await window.FB.login()}catch(e){console.error(e)
toast(e.code==="auth/unauthorized-domain"?"Firebase me ye domain allow karo (Authorized domains)":e.code==="auth/popup-closed-by-user"?"Login band kar diya":"Login nahi hua: "+(e.code||e.message))}b.disabled=false
b.style.opacity=1}}function hideLogin(){const d=$("#login")
if(d)d.remove()}const isGoods=t=>t==="buy"||t==="sell"
const byDateAsc=(a,b)=>(a.date||"").localeCompare(b.date||"")||(a.ts||0)-(b.ts||0)
const txList=()=>Object.values(S.txns).filter(t=>t.t!=="exp").sort((a,b)=>byDateAsc(b,a))
const tons=t=>t.unit==="Kg"?num(t.qty)/1e3:num(t.qty)
const partyTempoPaid=o=>(o.advBy==="party"?num(o.adv):0)+(o.khaliBy==="party"?num(o.khali):0)
function effects(t){const r=[],a=num(t.amount)
if(t.t==="in")r.push([t.party,-a])
else if(t.t==="out")r.push([t.party,a])
else if(isGoods(t.t)){r.push([t.party,(t.t==="sell"?1:-1)*(a-num(t.paid))])
const pt=partyTempoPaid(t)
if(pt)r.push([t.party,-pt])
if(t.tempo){const tp=-num(t.bhada)+num(t.adv)+num(t.khali)
if(num(t.bhada)||num(t.adv)||num(t.khali))r.push([t.tempo,tp])}}return r}function deltaFor(t,pid){let s=0
for(const[p,d]of effects(t))if(p===pid)s+=d
return s}function balances(){const B={}
for(const p of Object.values(S.parties))B[p.id]=num(p.open)
for(const t of Object.values(S.txns))for(const[pid,d]of effects(t))if(pid)B[pid]=(B[pid]||0)+d
return B}function allocIndex(exclude){const A={}
for(const t of Object.values(S.txns)){if(t.id===exclude||!t.alloc)continue
for(const[oid,v]of Object.entries(t.alloc)){const k=oid+"|"+t.party
A[k]=(A[k]||0)+num(v)}}return A}function orderBill(o,pid){return pid===o.tempo&&pid!==o.party?num(o.bhada):num(o.amount)}function orderDue(o,pid,A){if(pid===o.party){const pt=partyTempoPaid(o)
const d=num(o.amount)-num(o.paid)+(o.t==="sell"?-pt:pt)
return d-(A[o.id+"|"+pid]||0)}if(pid===o.tempo)return num(o.bhada)-num(o.adv)-num(o.khali)-(A[o.id+"|"+pid]||0)
return 0}function ordersOf(pid){return Object.values(S.txns).filter(o=>isGoods(o.t)&&(o.party===pid||o.tempo===pid)).sort(byDateAsc)}function payOrdersFor(pid,t){return ordersOf(pid).filter(o=>t==="in"?o.party===pid&&o.t==="sell":o.tempo===pid||o.party===pid&&o.t==="buy")}const olabel=o=>`${dlabel(o.date,true)} ka ${qn(o.qty)} ${o.unit||"Ton"}`
function balTag(v,plain){if(v>.5)return`<span class="c-g">${plain?"":"Lena "}${inr(v)}</span>`
if(v<-.5)return`<span class="c-r">${plain?"":"Dena "}${inr(v)}</span>`
return`<span class="c-m">${plain?"₹0":"Barabar"}</span>`}const pname=id=>S.parties[id]?S.parties[id].name:"—"
function pfull(id){const p=S.parties[id]
if(!p)return"—"
return p.name+(p.city?" ("+p.city+")":"")}const byWho=(by,t)=>by==="party"?t==="sell"?"grahak ne":"supplier ne":"aapne"
function sentence(t){const n=pfull(t.party)
return t.t==="buy"?n+" se maal liya":t.t==="sell"?n+" ko sale kiya":t.t==="in"?n+" se paisa mila":n+" ko paisa diya"}function allocText(t){if(!t.alloc)return""
const ks=Object.keys(t.alloc).map(id=>S.txns[id]).filter(Boolean).sort(byDateAsc)
return ks.length?ks.map(o=>olabel(o)).join(", ")+" ka":""}function detail(t){if(isGoods(t.t)){let s=`${qn(t.qty)} ${t.unit||"Ton"}${num(t.rate)?" × ₹"+num(t.rate).toLocaleString("en-IN")+"/Ton":""}`
if(num(t.paid))s+=` · turant ${t.t==="sell"?"mila":"diya"} ${inr(t.paid)}`
if(t.tempo||t.vehicle)s+=` · 🚚 ${t.tempo?pname(t.tempo):""}${t.vehicle?" "+t.vehicle:""}`
return s}const a=allocText(t)
return(t.mode||"Cash")+(a?" · "+a:"")}let RA={}
function txRow(t,showDate){const T=TT[t.t]||TT.sell
let right=`${inr(t.amount)}<small class="c-m">${esc(T.s)}</small>`
if(isGoods(t.t)){const d=orderDue(t,t.party,RA)
right=`${inr(t.amount)}<small class="${d>.5?"c-o":"c-g"}">${d>.5?"Baki "+inr(d):"✓ Pura"}</small>`}return`<div class="item" data-tx="${esc(t.id)}"><div class="av ${T.c}">${ICON[t.t]}</div>\n  <div class="mid"><div class="t1">${esc(sentence(t))}</div><div class="t2">${showDate?esc(dlabel(t.date,true))+" · ":""}${esc(detail(t))}</div>${t.note?`<div class="t3">“${esc(t.note)}”</div>`:""}</div>\n  <div class="amt">${right}</div></div>`}function render(){RA=allocIndex()
document.querySelectorAll(".tabs button").forEach(b=>b.classList.toggle("on",b.dataset.tab===ui.tab))
if(ui.tab==="home")renderHome()
else if(ui.tab==="hist")renderHist()
else renderParties()
if(sheetMode&&sheetMode.type==="party")openParty(sheetMode.id,true)
if(pageMode)renderPage()
checkLock()}const localBanner=()=>false?`<div class="banner">Data abhi sirf is phone/browser me save ho raha he. Backup ke liye ☰ menu → “Backup / Restore” se copy kar lena.</div>`:""
function homeRow(t){const T=TT[t.t]||TT.sell
const g=isGoods(t.t)
let st=""
if(g){const d=orderDue(t,t.party,RA)
st=d>.5?`<small class="c-o">Baki ${inr(d)}</small>`:`<small class="c-g">✓ Pura</small>`}else st=`<small class="c-m">${esc(t.mode||"Cash")}</small>`
const amt=g?inr(t.amount):`<span class="${t.t==="in"?"c-g":"c-r"}">${t.t==="in"?"+":"−"}${inr(t.amount)}</span>`
return`<div class="item" data-tx="${esc(t.id)}"><div class="av ${T.c}">${ICON[t.t]}</div>\n  <div class="mid"><div class="t1">${esc(pname(t.party))}</div><div class="t2">${T.s}${g?" · "+qn(t.qty)+" "+(t.unit||"Ton"):""} · ${esc(dlabel(t.date,true))}</div></div>\n  <div class="amt">${amt}${st}</div></div>`}function renderHome(){const v=$("#view")
v.dataset.v="home"
const B=balances()
let lena=0,dena=0
for(const x of Object.values(B)){if(x>.5)lena+=x
else if(x<-.5)dena-=x}const tx=txList()
const mk=today().slice(0,7)
let mb=0,ms=0,mh=0
tx.filter(t=>(t.date||"").startsWith(mk)).forEach(t=>{if(t.t==="buy")mb+=num(t.amount)
if(t.t==="sell")ms+=num(t.amount)
if(isGoods(t.t))mh+=num(t.bhada)})
const mex=expList().filter(t=>(t.date||"").startsWith(mk)).reduce((a,t)=>a+num(t.amount),0)
const prof=ms-mb-mh-mex
v.innerHTML=`${localBanner()}\n  <section class="hero"><div class="row">\n    <div><div class="lbl">Aapko milega</div><div class="big lena">${inr(lena)}</div></div>\n    <div><div class="lbl">Aapko dena he</div><div class="big dena">${inr(dena)}</div></div></div></section>\n  <div class="qrow">${Object.entries(TT).map(([k,T])=>`<button class="qb" data-new="${k}"><span class="ic ${T.c}">${ICON[k]}</span>${T.s}</button>`).join("")}</div>\n  <div class="mcard"><div class="mhead">${MON[+mk.slice(5)-1]} ka hisab</div><div class="m3">\n    <div><span>Bikri</span><b>${inr(ms)}</b></div><div><span>Kharidi</span><b>${inr(mb)}</b></div>\n    <div><span>Munafa</span><b class="${prof>=0?"c-g":"c-r"}">${prof<0?"−":""}${inr(prof)}</b></div></div></div>\n  <div class="sec-h"><h2>Haal ki entries</h2>${tx.length?'<button class="link" data-tab="hist">Sab dekho →</button>':""}</div>\n  ${tx.length?`<div class="list">${tx.slice(0,5).map(homeRow).join("")}</div>`:`<div class="list"><div class="empty"><b>Abhi koi entry nahi</b>Upar Kharidi / Bikri dabao. Party ka naam likhte hi nayi party ban jayegi.</div></div>`}`}function inPeriod(d,p){if(p==="all")return true
const t=today()
d=d||""
if(p==="today")return d===t
if(p==="week")return d>=iso(new Date(Date.now()-6*864e5))
if(p==="month")return d.startsWith(t.slice(0,7))
if(p==="last"){const x=new Date
x.setDate(1)
x.setMonth(x.getMonth()-1)
return d.startsWith(iso(x).slice(0,7))}return true}const SEARCH_SVG='<svg class="i" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'
function histRow(t){const T=TT[t.t]||TT.sell
const p=S.parties[t.party]||{}
const nm=`${esc(p.name||"—")}${p.city?` <span class="c-m" style="font-weight:500;font-size:13px">· ${esc(p.city)}</span>`:""}`
if(isGoods(t.t)){const bill=num(t.amount),due=orderDue(t,t.party,RA),got=bill-due,pct=bill?Math.max(0,Math.min(100,got/bill*100)):0
return`<div class="hcard" data-tx="${esc(t.id)}"><div class="av ${T.c}">${ICON[t.t]}</div><div class="mid">\n      <div class="hl"><span class="t1">${nm}</span><b>${inr(bill)}</b></div>\n      <div class="t2">${T.l} · ${qn(t.qty)} ${t.unit||"Ton"}${num(t.rate)?" × ₹"+num(t.rate).toLocaleString("en-IN"):""}${t.tempo?" · 🚚 "+esc(pname(t.tempo)):""}</div>\n      <div class="bar"><i style="width:${pct}%;${due>.5?"background:#E89B3C":""}"></i></div>\n      <div class="hl sm"><span>${t.t==="sell"?"Mila":"Diya"} ${inr(got)}</span><span class="${due>.5?"c-o":"c-g"}">${due>.5?"Baki "+inr(due):"✓ Pura "+(t.t==="sell"?"mila":"diya")}</span></div>\n      ${t.note?`<div class="t3">“${esc(t.note)}”</div>`:""}</div></div>`}const a=allocText(t)
const inn=t.t==="in"
return`<div class="hcard" data-tx="${esc(t.id)}"><div class="av ${T.c}">${ICON[t.t]}</div><div class="mid">\n    <div class="hl"><span class="t1">${nm}</span><b class="${inn?"c-g":"c-r"}">${inn?"+":"−"} ${inr(t.amount)}</b></div>\n    <div class="t2">${inn?"Paisa mila":"Paisa diya"} · ${esc(t.mode||"Cash")}</div>\n    ${a?`<div class="t2" style="margin-top:4px"><span class="tag gray">${esc(a)} maal</span></div>`:""}\n    ${t.note?`<div class="t3">“${esc(t.note)}”</div>`:""}</div></div>`}function renderHist(){const v=$("#view")
if(v.dataset.v!=="hist"){v.dataset.v="hist"
v.innerHTML=`${localBanner()}<div class="search">${SEARCH_SVG}<input id="hq" placeholder="Party, sheher, gadi no, note dhundo…" value="${esc(ui.hq)}"></div>\n    <div class="chips">${[["all","Sab"],["sell","Bikri"],["buy","Kharidi"],["in","Paisa mila"],["out","Paisa diya"],["due","⏳ Baki wale"]].map(([k,l])=>`<button class="chip ${ui.hf===k?"on":""}" data-hf="${k}">${l}</button>`).join("")}</div>\n    <div class="prow"><span class="c-m" style="font-size:13px">Samay:</span><select id="hpsel" class="psel">${[["all","Hamesha"],["today","Aaj"],["week","Pichle 7 din"],["month","Is mahina"],["last","Pichla mahina"]].map(([k,l])=>`<option value="${k}" ${ui.hp===k?"selected":""}>${l}</option>`).join("")}</select></div>\n    <div id="hsum"></div><div id="hlist"></div>`}const q=ui.hq.trim().toLowerCase()
const tx=txList().filter(t=>t.t!=="exp"&&(ui.hf==="all"||t.t===ui.hf||ui.hf==="due"&&isGoods(t.t)&&orderDue(t,t.party,RA)>.5)&&inPeriod(t.date,ui.hp)&&(!q||[pfull(t.party),t.tempo?pname(t.tempo):"",t.vehicle,t.note,TT[t.t]?.l].join(" ").toLowerCase().includes(q)))
let sb=0,sk=0,sq=0,bq=0,sd=0,pin=0,pout=0
tx.forEach(t=>{if(t.t==="sell"){sb+=num(t.amount)
sq+=tons(t)
sd+=Math.max(0,orderDue(t,t.party,RA))}if(t.t==="buy"){sk+=num(t.amount)
bq+=tons(t)}if(t.t==="in")pin+=num(t.amount)
if(t.t==="out")pout+=num(t.amount)})
const cards=[]
if(ui.hf==="in"||ui.hf==="out"){cards.push(["Paisa mila",inr(pin),"","c-g"],["Paisa diya",inr(pout),"","c-r"])}else{cards.push(["Bikri",inr(sb),qn(sq)+" Ton",""],["Kharidi",inr(sk),qn(bq)+" Ton",""],["Grahak pe baki",inr(sd),"bikri ka","c-o"])}$("#hsum").innerHTML=tx.length?`<div class="mini3" style="grid-template-columns:repeat(${cards.length},1fr)">${cards.map(([l,vv,s,c])=>`<div><span>${l}</span><b class="${c}">${vv}</b>${s?`<small>${s}</small>`:""}</div>`).join("")}</div>`:""
if(!tx.length){$("#hlist").innerHTML=`<div class="list" style="margin-top:14px"><div class="empty"><b>Kuch nahi mila</b>Filter ya samay badal ke dekho.</div></div>`
return}const groups={}
tx.forEach(t=>(groups[t.date]=groups[t.date]||[]).push(t))
$("#hlist").innerHTML=Object.entries(groups).map(([d,arr])=>`<div class="day"><span>${esc(dlabel(d))}</span><span>${arr.length} entry</span></div><div class="hlist">${arr.map(histRow).join("")}</div>`).join("")}function renderParties(){const v=$("#view")
const B=balances()
if(v.dataset.v!=="parties"){v.dataset.v="parties"
v.innerHTML=`${localBanner()}<div id="ptot"></div><div class="search" style="margin-top:12px">${SEARCH_SVG}<input id="pq" placeholder="Party ka naam, sheher, phone…" value="${esc(ui.pq)}"></div>\n    <div class="chips" id="pchips"></div><div id="plist" style="margin-top:12px"></div>\n    <button class="btn ghost" style="width:100%;margin-top:12px" data-addparty>+ Nayi party add karo</button>`}const all=Object.values(S.parties)
let l=0,d=0,ln=0,dn=0
all.forEach(p=>{const x=B[p.id]||0
if(x>.5){l+=x
ln++}else if(x<-.5){d-=x
dn++}})
$("#ptot").innerHTML=`<div class="kpis"><div class="kpi"><div class="l">Aapko milega</div><div class="v c-g">${inr(l)}</div><div class="s">${ln} parties se</div></div><div class="kpi"><div class="l">Aapko dena he</div><div class="v c-r">${inr(d)}</div><div class="s">${dn} parties ko</div></div></div>`
const cnt=k=>k==="all"?all.length:all.filter(p=>p.type===k).length
$("#pchips").innerHTML=[["all","Sab"],["buyer","Grahak"],["supplier","Supplier"],["tempo","Tempo"]].map(([k,lb])=>`<button class="chip ${ui.pf===k?"on":""}" data-pf="${k}">${lb} <span style="opacity:.6">${cnt(k)}</span></button>`).join("")
const q=ui.pq.trim().toLowerCase()
const ps=all.filter(p=>(ui.pf==="all"||p.type===ui.pf)&&(!q||(p.name+" "+(p.city||"")+" "+(p.phone||"")).toLowerCase().includes(q))).sort((a,b)=>Math.abs(B[b.id]||0)-Math.abs(B[a.id]||0)||a.name.localeCompare(b.name))
$("#plist").innerHTML=ps.length?`<div class="list">${ps.map(p=>{const T=PT[p.type]||PT.buyer
const x=B[p.id]||0
const pendN=ordersOf(p.id).filter(o=>orderDue(o,p.id,RA)>.5).length
const over=num(p.limit)&&x>num(p.limit)
const right=x>.5?`<small class="c-g">Milega</small><span class="c-g">${inr(x)}</span>`:x<-.5?`<small class="c-r">Dena he</small><span class="c-r">${inr(x)}</span>`:`<small class="c-m">Hisab</small><span class="c-m" style="font-size:14px">✓ Barabar</span>`
return`<div class="item" data-party="${esc(p.id)}"><div class="av ${T.c}">${esc((p.name[0]||"?").toUpperCase())}</div>\n    <div class="mid"><div class="t1">${esc(p.name)}${over?' <span class="pill late">Limit cross</span>':""}</div><div class="t2"><span class="tag ${T.c}">${T.l}</span>${p.city?" · "+esc(p.city):""}${pendN?` · <span class="c-o">${pendN} order baki</span>`:""}</div></div>\n    <div class="amt pamt">${right}</div></div>`}).join("")}</div>`:`<div class="list"><div class="empty"><b>Koi party nahi</b>Supplier, tempo wale aur grahak yahan dikhenge.</div></div>`}let sheetMode=null
function openSheet(html,mode){sheetMode=mode||null
const b=$("#sheetBody")
b.innerHTML='<div class="grab"></div>'+html
$("#sheet").hidden=false
b.scrollTop=0
document.body.style.overflow="hidden"}function closeSheet(){$("#sheet").hidden=true
sheetMode=null
document.body.style.overflow=""}const title=t=>`<div class="sh-title"><h3>${t}</h3><button class="x" data-close aria-label="Band karo">✕</button></div>`
function picker(key,id,ph){const p=S.parties[id]
return`<div class="pick" data-k="${key}" data-id="${esc(p?id:"")}"><input autocomplete="off" placeholder="${esc(ph)}" value="${esc(p?p.name:"")}"><div class="sug"></div></div>`}function pickType(el){return el.dataset.k==="tempo"?"tempo":DEF_PT[entryType]||"buyer"}function showSug(el){const inp=el.querySelector("input"),box=el.querySelector(".sug")
const q=inp.value.trim().toLowerCase()
const want=pickType(el)
const list=Object.values(S.parties).filter(p=>!q||(p.name+" "+(p.city||"")).toLowerCase().includes(q)).sort((a,b)=>(b.type===want)-(a.type===want)||a.name.localeCompare(b.name)).slice(0,8)
const exact=Object.values(S.parties).some(p=>p.name.toLowerCase()===q)
let h=list.map(p=>`<div data-pid="${esc(p.id)}"><span>${esc(p.name)}${p.city?` <small>· ${esc(p.city)}</small>`:""}</span><small>${(PT[p.type]||PT.buyer).l}</small></div>`).join("")
if(q&&!exact)h+=`<div class="new" data-newname="1">+ Nayi party “${esc(inp.value.trim())}” <small>${PT[want].l}</small></div>`
box.innerHTML=h
box.classList.toggle("show",!!h)}function pickedId(el){if(!el)return""
const name=el.querySelector("input").value.trim()
if(!name)return""
const cur=S.parties[el.dataset.id]
if(cur&&cur.name===name)return cur.id
const m=Object.values(S.parties).find(p=>p.name.toLowerCase()===name.toLowerCase())
return m?m.id:""}function resolvePick(el,type){const name=el.querySelector("input").value.trim()
if(!name)return""
const id=pickedId(el)
if(id)return id
const p={kind:"party",id:"p_"+uid(),name:name,type:type,city:"",phone:"",open:0,ts:Date.now()}
put(p)
return p.id}let entryType="sell",editId=null,backTo=null,allocSel=new Set
const F=n=>{const f=$("#eForm")
return f?f.elements.namedItem(n):null}
const fv=n=>{const e=F(n)
return e?e.value:""}
function bySeg(name,val,t){return`<input type="hidden" name="${name}" value="${val||"me"}"><div class="seg sm" data-byseg="${name}">\n  <button type="button" data-by="me" class="${(val||"me")==="me"?"on":""}">Aapne</button><button type="button" data-by="party" class="byp ${val==="party"?"on":""}">${t==="buy"?"Supplier ne":"Grahak ne"}</button></div>`}let eStep=0
function goStep(){}function openEntry(o={}){const e=o.id?{...S.txns[o.id]}:{t:o.t||"sell",date:today(),unit:"Ton",party:o.party||"",mode:"Cash"}
entryType=e.t
editId=o.id||null
backTo=o.back||null
allocSel=new Set(o.id?Object.keys(e.alloc||{}):o.orders||[])
const g=isGoods(e.t)
openSheet(`${title(o.id?"Entry badlo":"Nayi entry")}\n  <div class="ttabs" id="eType">${Object.entries(TT).map(([k,T])=>`<button type="button" data-et="${k}" class="${T.c} ${k===e.t?"on":""}"><span class="ic">${ICON[k]}</span>${T.s}</button>`).join("")}</div>\n  <form id="eForm" onsubmit="return false">\n    <div class="f"><label id="pLbl">${PLBL[e.t]}</label>${picker("party",e.party,"Naam likho — jaise Ashok bhai")}</div>\n    <div class="goods" ${g?"":"hidden"}>\n      <input type="hidden" name="unit" value="${esc(e.unit||"Ton")}"><input type="hidden" name="pmode" value="${esc(e.pmode||"Cash")}">\n      <div class="f g2">\n        <div><label>Maal (${esc(e.unit||"Ton")})</label><input name="qty" inputmode="decimal" placeholder="Kitna Ton?" value="${e.qty??""}"></div>\n        <div><label>Bhav ₹/Ton</label><input name="rate" inputmode="decimal" placeholder="Bhav" value="${e.rate??""}"></div>\n      </div>\n      <div class="totbox"><div><span>Total bill</span><b id="totv">₹0</b></div><button type="button" data-edtot>✎ Badlo</button></div>\n      <div class="f" id="totIn" ${g&&e.amount&&Math.abs(num(e.amount)-tons(e)*num(e.rate))>1?"":"hidden"}><label>Total bill khud likho (₹)</label><input name="gamt" inputmode="decimal" placeholder="₹" value="${g&&e.amount?e.amount:""}" ${g&&e.amount&&Math.abs(num(e.amount)-tons(e)*num(e.rate))>1?'data-man="1"':""}></div>\n      <div class="f"><label id="paidLbl">${e.t==="buy"?"Abhi kitna paisa diya?":"Abhi kitna paisa mila?"}</label><input name="paid" inputmode="decimal" placeholder="₹0 — nahi to khali chhodo" value="${e.paid||""}"></div>\n      <button type="button" class="addrow" data-tempotog ${e.tempo||num(e.bhada)?"hidden":""}>${ICON.truck} Tempo / bhada add karo</button>\n      <div class="box" id="tempoBox" ${e.tempo||num(e.bhada)?"":"hidden"}><div class="box-h"><span style="color:var(--ink);font-size:13.5px;font-weight:700;display:flex;gap:6px;align-items:center">${ICON.truck} Tempo</span></div>\n        ${picker("tempo",e.tempo,"Tempo wale ka naam")}\n        <div class="g2" style="margin-top:8px"><input name="vehicle" placeholder="Gadi no." value="${esc(e.vehicle||"")}"><input name="bhada" inputmode="decimal" placeholder="Total bhada ₹" value="${e.bhada||""}"></div>\n        <div class="prow2"><div><div class="lab">Advance</div><input name="adv" inputmode="decimal" placeholder="₹0" value="${e.adv||""}"></div><div><div class="lab">Kisne diya?</div>${bySeg("advBy",e.advBy,e.t)}</div></div>\n        <div class="prow2"><div><div class="lab">Khali hone pe</div><input name="khali" inputmode="decimal" placeholder="₹0" value="${e.khali||""}"></div><div><div class="lab">Kisne diya?</div>${bySeg("khaliBy",e.khaliBy,e.t)}</div></div>\n        <div class="hint">Khali ka paisa baad me ho to abhi khali chhodo.</div>\n      </div>\n    </div>\n    <div class="pay" ${g?"hidden":""}>\n      <div class="f"><label>Amount (₹)</label><input name="pamt" inputmode="decimal" placeholder="0" value="${!g&&e.amount?e.amount:""}" ${!g&&e.amount?'data-man="1"':""}></div>\n      <div class="f"><label>Kaise?</label><div class="seg" id="eMode">${["Cash","UPI","Bank","Cheque"].map(m=>`<button type="button" data-mode="${m}" class="${m===(e.mode||"Cash")?"on":""}">${m}</button>`).join("")}</div></div>\n      <div id="allocBox"></div>\n    </div>\n    <div class="f g2"><div><label>Tarikh</label><input type="date" name="date" value="${esc(e.date||today())}"></div>\n      <div><label>Note <span style="font-weight:500">(optional)</span></label><input name="note" placeholder="Jumma ka maal" value="${esc(e.note||"")}"></div></div>\n    <div class="hint" id="dayHint">${esc(dlabel(e.date||today()))}</div>\n    <div id="eSum"></div>\n    ${o.id&&g?`<button type="button" class="btn ghost" style="width:100%;margin-top:12px" data-billtx>🧾 Is order ka bill bhejo (WhatsApp)</button>`:""}\n    <div class="actions">\n      ${o.id?`<button type="button" class="btn danger" data-deltx>Delete</button>`:`<button type="button" class="btn ghost" data-save="again">Save + Nayi</button>`}\n      <button type="button" class="btn" data-save="1">Save</button>\n    </div>\n  </form>`,{
type:"entry"})
if(!o.id&&o.party)fillFromParty($("#eForm [data-k=party]"))
renderAlloc()
updCalc()
if(!o.id&&!o.party)setTimeout(()=>{const i=$("#eForm .pick input")
i&&i.focus()},280)}function setEntryType(t){const prev=entryType
entryType=t
document.querySelectorAll("#eType button").forEach(b=>b.classList.toggle("on",b.dataset.et===t))
const g=isGoods(t)
$("#eForm .goods").hidden=!g
$("#eForm .pay").hidden=g
$("#pLbl").textContent=PLBL[t]
$("#paidLbl").textContent=t==="buy"?"Abhi kitna paisa diya?":"Abhi kitna paisa mila?"
document.querySelectorAll("#eForm .byp").forEach(b=>b.textContent=t==="buy"?"Supplier ne":"Grahak ne")
if(g&&!editId&&prev!==t){F("rate").value=""
fillFromParty($("#eForm [data-k=party]"))}if(prev!==t)allocSel.clear()
renderAlloc()
updCalc()}function lastRate(pid,t){const x=txList().find(x=>x.party===pid&&x.t===t&&num(x.rate))
return x?num(x.rate):0}function fillFromParty(pk){if(!$("#eForm")||!pk)return
const p=S.parties[pk.dataset.id]
if(!p)return
if(pk.dataset.k==="party"&&isGoods(entryType)&&!F("rate").value){const r=lastRate(p.id,entryType)||num(p.rate)
if(r)F("rate").value=r}if(pk.dataset.k==="tempo"&&!F("bhada").value&&num(p.rate))F("bhada").value=num(p.rate)
updCalc()}const formTons=()=>{const q=num(fv("qty"))
return fv("unit")==="Kg"?q/1e3:q}
function updCalc(){if(!$("#eForm"))return
const a=F("gamt")
if(a&&!a.dataset.man){const v=formTons()*num(fv("rate"))
a.value=v?+v.toFixed(2):""}const tv=$("#totv")
if(tv)tv.textContent=inr(num(fv("gamt"))||formTons()*num(fv("rate")))
entrySummary()}function bw(v,name){return v>.5?`<b class="c-g">${esc(name)} se ${inr(v)} lena</b>`:v<-.5?`<b class="c-r">${esc(name)} ko ${inr(v)} dena</b>`:`<b>Hisab barabar</b>`}function renderAlloc(){const box=$("#allocBox")
if(!box)return
if(isGoods(entryType)){box.innerHTML=""
return}const pid=pickedId($("#eForm [data-k=party]"))
if(!pid){box.innerHTML=""
return}const A=allocIndex(editId)
const os=payOrdersFor(pid,entryType).filter(o=>orderDue(o,pid,A)>.5||allocSel.has(o.id))
if(!os.length){box.innerHTML=`<div class="hint" style="margin-top:12px">Is party ka koi baki order nahi — payment seedha hisab me jayega.</div>`
return}box.innerHTML=`<div class="f"><label>Kis maal ka payment he? <span style="font-weight:500">(select karo)</span></label>\n    <div class="olist">${os.map(o=>{const d=orderDue(o,pid,A)
const isT=o.tempo===pid&&o.party!==pid
return`<div class="orow ${allocSel.has(o.id)?"on":""}" data-oid="${esc(o.id)}"><span class="ck">✓</span>\n      <div class="mid"><div class="t1" style="font-size:14px">${esc(olabel(o))}${isT?" · bhada":""}</div>\n      <div class="t2">${isT?"Bhada "+inr(o.bhada)+" · "+esc(pname(o.party)):"Bill "+inr(o.amount)}${o.note?" · "+esc(o.note):""}</div></div>\n      <div class="amt" style="font-size:14px">${inr(d)}<small class="c-o">baki</small></div></div>`}).join("")}</div>\n    <div id="ainfo"></div></div>`
allocInfo()}function allocPlan(pid,amount){const A=allocIndex(editId)
const os=[...allocSel].map(id=>S.txns[id]).filter(Boolean).sort(byDateAsc)
let rem=amount
const plan=[]
for(const o of os){const due=Math.max(0,orderDue(o,pid,A))
const x=Math.min(rem,due)
plan.push([o,x,due])
rem-=x}return{plan:plan,rem:rem}}function allocInfo(){const el=$("#ainfo")
if(!el)return
const pid=pickedId($("#eForm [data-k=party]"))
if(!allocSel.size||!pid){el.innerHTML=""
return}const amt=num(fv("pamt"))
if(!amt){el.innerHTML=""
return}const{plan:plan,rem:rem}=allocPlan(pid,amt)
el.innerHTML=`<div class="ainfo">${plan.map(([o,x,due])=>`${esc(olabel(o))}: ${x>=due-.5?"✓ pura":inr(x)+" (baki "+inr(due-x)+")"}`).join(" · ")}${rem>.5?` · ${inr(rem)} extra (advance)`:""}</div>`}function toggleOrder(oid){if(allocSel.has(oid))allocSel.delete(oid)
else allocSel.add(oid)
document.querySelectorAll(".orow").forEach(r=>r.classList.toggle("on",allocSel.has(r.dataset.oid)))
const a=F("pamt")
const pid=pickedId($("#eForm [data-k=party]"))
if(a&&!a.dataset.man){const A=allocIndex(editId)
let s=0
allocSel.forEach(id=>{const o=S.txns[id]
if(o)s+=Math.max(0,orderDue(o,pid,A))})
a.value=s?+s.toFixed(2):""}allocInfo()
entrySummary()}function entrySummary(){const box=$("#eSum")
if(!box)return
const t=entryType,g=isGoods(t)
const pk=$("#eForm [data-k=party]")
const name=pk.querySelector("input").value.trim()
const amt=g?num(fv("gamt"))||formTons()*num(fv("rate")):num(fv("pamt"))
const paid=g?num(fv("paid")):0
if(!amt&&!name){box.innerHTML=""
return}const pid=pickedId(pk)
let old=pid?balances()[pid]||0:0
if(editId&&S.txns[editId])old-=deltaFor(S.txns[editId],pid)
const nm=name||"Party"
let h='<div class="box" style="background:#FBFBF9">',delta
if(g){const adv=num(fv("adv")),kh=num(fv("khali")),bh=num(fv("bhada"))
const pt=(fv("advBy")==="party"?adv:0)+(fv("khaliBy")==="party"?kh:0)
const sg=t==="sell"?1:-1
delta=sg*(amt-paid)-pt
const odue=amt-paid-sg*pt
h+=`<div class="srow"><span>Bill (${qn(formTons())} Ton)</span><b>${inr(amt)}</b></div>`
if(paid)h+=`<div class="srow"><span>Abhi ${t==="sell"?"mila":"diya"}</span><b>− ${inr(paid)}</b></div>`
if(pt)h+=`<div class="srow"><span>Tempo ko ${t==="sell"?"grahak":"supplier"} ne diya</span><b>${t==="sell"?"−":"+"} ${inr(pt)}</b></div>`
h+=`<div class="srow"><span>Is maal ka baki</span><b>${inr(odue)}</b></div>`
if(bh||adv||kh){const tb=bh-adv-kh
const tn=$("#eForm [data-k=tempo] input").value.trim()||"Tempo"
h+=`<div class="srow sub"><span>🚚 ${esc(tn)}: bhada ${inr(bh)}, diya ${inr(adv+kh)}</span><b class="${tb>.5?"c-r":""}">${tb>.5?"baki "+inr(tb):"✓ pura"}</b></div>`}}else delta=t==="in"?-amt:amt
if(pid&&Math.abs(old)>.5)h+=`<div class="srow"><span>Pehle ka baki</span><span>${bw(old,nm)}</span></div>`
h+=`<div class="srow tot"><span>Total baki</span><span>${bw(old+delta,nm)}</span></div></div>`
box.innerHTML=h}function saveEntry(again){const t=entryType
const g=isGoods(t)
const pEl=$("#eForm [data-k=party]")
if(!pEl.querySelector("input").value.trim()){toast("Party ka naam daalo")
pEl.querySelector("input").focus()
return}const amount=g?num(fv("gamt"))||formTons()*num(fv("rate")):num(fv("pamt"))
if(!amount){toast("Amount daalo")
F(g?fv("qty")?"rate":"qty":"pamt").focus()
return}const old=editId?S.txns[editId]:null
const d={kind:"txn",id:editId||"t_"+uid(),t:t,date:fv("date")||today(),party:resolvePick(pEl,DEF_PT[t]),amount:+amount.toFixed(2),note:fv("note").trim(),ts:old?.ts||Date.now()}
if(g){d.qty=num(fv("qty"))
d.unit=fv("unit")
d.rate=num(fv("rate"))
d.paid=Math.min(num(fv("paid")),d.amount)
if(d.paid)d.pmode=fv("pmode")
const tp=resolvePick($("#eForm [data-k=tempo]"),"tempo")
if(tp)d.tempo=tp
d.vehicle=fv("vehicle").trim()
d.adv=num(fv("adv"))
d.khali=num(fv("khali"))
d.bhada=num(fv("bhada"))
if(!d.bhada&&(d.adv||d.khali))d.bhada=d.adv+d.khali
if(d.adv)d.advBy=fv("advBy")
if(d.khali){d.khaliBy=fv("khaliBy")
d.khaliDate=old&&num(old.khali)&&old.khaliDate||today()}const pp=S.parties[d.party]
if(pp&&d.rate&&num(pp.rate)!==d.rate)put({...pp,rate:d.rate})
const tt=S.parties[d.tempo]
if(tt&&d.bhada&&num(tt.rate)!==d.bhada)put({...tt,rate:d.bhada})}else{d.mode=(document.querySelector("#eMode button.on")||{}).dataset?.mode||"Cash"
if(allocSel.size){const{plan:plan}=allocPlan(d.party,d.amount)
const al={}
plan.forEach(([o,x])=>{if(x>0)al[o.id]=+x.toFixed(2)})
if(Object.keys(al).length)d.alloc=al}}put(d)
const nb=balances()[d.party]||0,nm=pname(d.party)
toast(nb>.5?`✓ ${nm} se ${inr(nb)} lena baki`:nb<-.5?`✓ ${nm} ko ${inr(nb)} dena baki`:`✓ ${nm} ka hisab barabar`)
if(again){const keepDate=fv("date")
openEntry({t:t})
F("date").value=keepDate
$("#dayHint").textContent=dlabel(keepDate)}else if(backTo)openParty(backTo)
else closeSheet()}function ledger(id){const p=S.parties[id]
let run=num(p.open)
const out=[]
for(const t of Object.values(S.txns).sort(byDateAsc)){if(t.party!==id&&t.tempo!==id)continue
const d=deltaFor(t,id)
run+=d
out.push({t:t,d:d,run:run})}return out}function ledDesc(t,id){if(isGoods(t.t)&&t.party===id){let s=`${TT[t.t].l} · ${qn(t.qty)} ${t.unit||"Ton"}${num(t.rate)?" × ₹"+num(t.rate).toLocaleString("en-IN"):""} = ${inr(t.amount)}`
if(num(t.paid))s+=` · turant ${t.t==="sell"?"mila":"diya"} ${inr(t.paid)}`
const pt=partyTempoPaid(t)
if(pt)s+=` · tempo ko inhone diya ${inr(pt)}`
return s}if(isGoods(t.t)&&t.tempo===id){let s=`Bhada ${inr(t.bhada)} · ${pfull(t.party)} ${t.t==="sell"?"ko":"se"} ${qn(t.qty)} ${t.unit||"Ton"}${t.vehicle?" · "+t.vehicle:""}`
if(num(t.adv))s+=` · advance ${inr(t.adv)} (${byWho(t.advBy,t.t)})`
if(num(t.khali))s+=` · khali pe ${inr(t.khali)} (${byWho(t.khaliBy,t.t)})`
return s}const a=allocText(t)
return`${TT[t.t].l} · ${t.mode||"Cash"}${a?" · "+a:""}`}function openParty(id,refresh){const p=S.parties[id]
if(!p){if(sheetMode&&sheetMode.type==="party")closeSheet()
return}const bal=balances()[id]||0
const T=PT[p.type]||PT.buyer
const A=allocIndex()
const orders=ordersOf(id)
let tb=0,tq=0,dueSum=0
orders.forEach(o=>{tb+=orderBill(o,id)
if(o.party===id)tq+=tons(o)
dueSum+=orderDue(o,id,A)})
const paidTot=tb-dueSum
let unalloc=0
Object.values(S.txns).forEach(t=>{if(!isGoods(t.t)&&t.party===id){const al=Object.values(t.alloc||{}).reduce((s,v)=>s+num(v),0)
unalloc+=num(t.amount)-al}})
const payT=p.type==="buyer"?"in":"out"
const isB=p.type==="buyer"
const rows=ledger(id)
const ordersHtml=orders.length?`${unalloc>.5?`<div class="onacc">${inr(unalloc)} ka payment kisi order se link nahi he (advance / on-account). Wo upar ke total baki me already kat chuka he.</div>`:""}\n    <div class="list">${orders.slice().reverse().map(o=>{const d=orderDue(o,id,A)
const isT=o.tempo===id&&o.party!==id
const bill=orderBill(o,id)
return`<div class="item wrap" data-tx="${esc(o.id)}"><div class="av ${isT?"violet":TT[o.t].c}">${isT?ICON.truck:ICON[o.t]}</div>\n      <div class="mid"><div class="t1" style="font-size:14.5px">${esc(dlabel(o.date,true))} · ${qn(o.qty)} ${o.unit||"Ton"}${isT?" · "+esc(pname(o.party)):""}${o.note?` <span class="c-m" style="font-weight:500">· ${esc(o.note)}</span>`:""}</div>\n      <div class="t2">${isT?"Bhada":"Bill"} ${inr(bill)} · ${isB?"Mila":"Diya"} ${inr(bill-d)}${o.vehicle?" · "+esc(o.vehicle):""}</div></div>\n      <div class="amt">${d>.5?`<span class="c-o">${inr(d)}</span><small><span class="pill due">Baki</span></small>`:d<-.5?`<span class="c-g">+${inr(d)}</span><small><span class="pill done">Extra</span></small>`:`<span class="pill done">✓ Pura</span>`}\n      ${d>.5?`<div><button class="link" style="padding:4px 0 0;color:var(--green)" data-payorder="${esc(o.id)}">₹ Payment</button></div>`:""}</div></div>`}).join("")}</div>`:`<div class="list"><div class="empty">Is party ka abhi koi order (maal) nahi.</div></div>`
const khataHtml=rows.length||num(p.open)?`<div class="list">${rows.slice().reverse().map(r=>`<div class="item wrap" data-tx="${esc(r.t.id)}">\n    <div class="mid"><div class="t1" style="font-weight:500;font-size:13.5px;white-space:normal">${esc(ledDesc(r.t,id))}</div><div class="t2">${esc(dlabel(r.t.date,true))}${r.t.note?" · “"+esc(r.t.note)+"”":""}</div></div>\n    <div class="amt"><span class="${r.d>.5?"c-g":r.d<-.5?"c-r":"c-m"}">${r.d>.5?"+":r.d<-.5?"−":""}${inr(r.d)}</span><small class="c-m">Baki ${inr(r.run)} ${r.run>.5?"lena":r.run<-.5?"dena":""}</small></div></div>`).join("")}\n    ${num(p.open)?`<div class="item"><div class="mid"><div class="t1" style="font-weight:500;font-size:13.5px">Purana baki (opening)</div></div><div class="amt">${balTag(num(p.open))}</div></div>`:""}</div>`:`<div class="list"><div class="empty">Koi entry nahi.</div></div>`
const html=`<div class="sh-title" style="align-items:flex-start"><div class="phead" style="margin:0"><div class="av ${T.c}">${esc((p.name[0]||"?").toUpperCase())}</div><div class="mid"><div class="t1" style="font-size:18px;font-weight:800">${esc(p.name)}</div>\n    <div class="t2"><span class="tag ${T.c}">${T.l}</span>${p.city?" · "+esc(p.city):""}${p.phone?" · "+esc(p.phone):""}${num(p.rate)?` · ${p.type==="tempo"?"Bhada":"Bhav"} ₹${num(p.rate).toLocaleString("en-IN")}${p.type==="tempo"?"/trip":"/Ton"}`:""}</div></div></div><button class="x" data-close aria-label="Band karo">✕</button></div>\n  <div class="pcard"><div class="lab" style="margin:0">${bal>.5?"Inse lena baki he":bal<-.5?"Inko dena baki he":"Hisab barabar"}</div>\n    <div class="big">${balTag(bal,true)}</div>\n    <div class="pgrid"><div><span>${p.type==="tempo"?"Total bhada":"Maal ka total"}</span><b>${inr(tb)}</b>${tq?`<small>${qn(tq)} Ton</small>`:""}</div>\n      <div><span>${isB?"Paisa mila":"Paisa diya"}</span><b>${inr(paidTot+unalloc)}</b></div>\n      <div><span>Baki</span><b class="${bal>.5?"c-g":bal<-.5?"c-r":""}">${inr(bal)}</b>${num(p.open)?"<small>purana milake</small>":""}</div></div></div>\n  <div class="pact">\n    ${p.type==="tempo"?"":`<button class="btn sm" data-pentry="${p.type==="supplier"?"buy":"sell"}">+ ${p.type==="supplier"?"Kharidi":"Bikri"}</button>`}\n    <button class="btn sm ${p.type==="tempo"?"":"ghost"}" data-pentry="${payT}">₹ ${payT==="in"?"Paisa mila":"Paisa diya"}</button>\n    <button class="btn sm ghost" data-receipt>🧾 Receipt / WhatsApp</button><button class="btn sm ghost" data-editp>✎ Edit</button></div>\n  <div class="seg" style="margin:12px 0 10px"><button data-ptab="orders" class="${ui.ptab==="orders"?"on":""}">Orders (${orders.length})</button><button data-ptab="khata" class="${ui.ptab==="khata"?"on":""}">Pura khata</button></div>\n  ${ui.ptab==="orders"?ordersHtml:khataHtml}\n  <div style="height:28px"></div>`
if(refresh){const b=$("#sheetBody"),st=b.scrollTop
b.innerHTML='<div class="grab"></div>'+html
b.scrollTop=st}else openSheet(html,{type:"party",id:id})}function partyText(id){const p=S.parties[id]
const A=allocIndex()
const bal=balances()[id]||0
let s=`*${p.name}${p.city?" ("+p.city+")":""}* — Hisab\n`
if(num(p.open))s+=`Purana baki: ${inr(p.open)} ${num(p.open)>0?"lena":"dena"}\n`
ledger(id).forEach(r=>{s+=`${dlabel(r.t.date,true)} · ${ledDesc(r.t,id)}\n`})
const pend=ordersOf(id).filter(o=>orderDue(o,id,A)>.5)
if(pend.length){s+=`\n_Baki orders:_\n`
pend.forEach(o=>s+=`• ${olabel(o)} — ${inr(orderDue(o,id,A))}\n`)}s+=`\n*Total baki: ${inr(bal)} ${bal>.5?"(aapse lena)":bal<-.5?"(aapko dena)":"(barabar)"}*`
return s}let pfType="buyer",pfDir=1
function openPartyForm(id,preset){const p=id?S.parties[id]:{type:preset||"buyer",name:"",city:"",phone:"",open:0}
pfType=p.type
pfDir=num(p.open)?num(p.open)<0?-1:1:p.type==="buyer"?1:-1
const used=id&&Object.values(S.txns).some(t=>t.party===id||t.tempo===id)
openSheet(`${title(id?"Party edit":"Nayi party")}\n  <div class="seg" id="pType">${Object.entries(PT).map(([k,T])=>`<button type="button" data-pt="${k}" class="${k===p.type?"on":""}">${T.l}</button>`).join("")}</div>\n  <form id="pForm" onsubmit="return false">\n    <div class="f"><label>Naam</label><input name="pname" placeholder="Ashok bhai" value="${esc(p.name)}"></div>\n    <div class="f g2"><div><label>Sheher</label><input name="city" placeholder="Mumbai" value="${esc(p.city||"")}"></div>\n      <div><label>Phone</label><input name="phone" inputmode="tel" placeholder="98…" value="${esc(p.phone||"")}"></div></div>\n    <div class="f"><label id="pRateLbl">${p.type==="tempo"?"Bhada ₹ per trip (fix ho to)":"Bhav ₹/Ton (iska rate)"}</label><input name="prate" inputmode="decimal" placeholder="${p.type==="tempo"?"3000":"8500"}" value="${num(p.rate)||""}">\n      <div class="hint">Entry me apne aap bhar jayega. Entry me bhav badloge to naya yaad rahega.</div></div>\n    <div class="f"><label>Purana baki (agar he)</label><div class="g2"><input name="popen" inputmode="decimal" placeholder="₹0" value="${num(p.open)?Math.abs(num(p.open)):""}">\n      <div class="seg" id="pDir"><button type="button" data-dir="1" class="${pfDir>0?"on":""}">Inse lena</button><button type="button" data-dir="-1" class="${pfDir<0?"on":""}">Inko dena</button></div></div></div>\n    <div class="f"><label>Udhaar limit (optional)</label><input name="plimit" inputmode="decimal" placeholder="₹ — isse zyada baki hua to warning" value="${num(p.limit)||""}"></div>\n    <div class="actions">${id&&!used?`<button type="button" class="btn danger" data-delp="${esc(id)}">Delete</button>`:""}\n      <button type="button" class="btn" data-savep="${esc(id||"")}">Save</button></div>\n    ${used?'<div class="hint" style="margin-top:-8px;padding-bottom:16px">Is party ki entries he, isliye delete nahi hogi.</div>':""}\n  </form>`,{
type:"pform"})
if(!id)setTimeout(()=>{const i=$("#pForm [name=pname]")
i&&i.focus()},280)}function saveParty(id){const f=$("#pForm").elements
const name=f.namedItem("pname").value.trim()
if(!name){toast("Naam daalo")
f.namedItem("pname").focus()
return}const dup=Object.values(S.parties).find(p=>p.id!==id&&p.name.toLowerCase()===name.toLowerCase())
if(dup){toast("Is naam ki party pehle se he")
return}const old=id?S.parties[id]:null
const p={kind:"party",id:id||"p_"+uid(),name:name,type:pfType,city:f.namedItem("city").value.trim(),phone:f.namedItem("phone").value.trim(),rate:num(f.namedItem("prate").value),limit:num(f.namedItem("plimit").value),open:Math.abs(num(f.namedItem("popen").value))*pfDir,ts:old?.ts||Date.now()}
put(p)
toast("Party save ✓")
openParty(p.id)}function openMenu(){
openSheet(`${title("Menu")}\n  <div class="list" style="margin-bottom:12px">\n    <div class="item" data-act="biz"><div class="av gray">🏷</div><div class="mid"><div class="t1">${esc(bizName())}</div><div class="t2">Receipt pe aane wala naam / phone badlo</div></div></div>\n  </div>\n  <div class="list">\n    <div class="item" data-act="csv"><div class="av gray">⇩</div><div class="mid"><div class="t1">Saari entries copy (Excel ke liye)</div><div class="t2">CSV text copy hoga — Excel/Sheets me paste karo</div></div></div>\n    <div class="item" data-act="backup"><div class="av gray">⎘</div><div class="mid"><div class="t1">Backup copy</div><div class="t2">Pura data text me copy — WhatsApp pe khud ko bhej do</div></div></div>\n    <div class="item" data-act="restore"><div class="av gray">↺</div><div class="mid"><div class="t1">Backup restore</div><div class="t2">Copy kiya backup paste karke wapas lao</div></div></div>\n  </div>\n  <div class="hint" style="margin:14px 4px 24px">${localMode?"Data abhi sirf is browser me save he.":"Data aapke Claude account me private save hota he — sirf aap dekh sakte ho, kisi bhi device se."} ${Object.keys(S.txns).length} entries · ${Object.keys(S.parties).length} parties.</div>`,{
type:"menu"})}async function copyText(s,ok){try{await navigator.clipboard.writeText(s)
toast(ok||"Copy ho gaya ✓")}catch(e){openSheet(`${title("Copy karo")}<div class="hint" style="margin-bottom:8px">Text ko lamba daba ke “Select all → Copy” karo.</div><textarea readonly id="cpy">${esc(s)}</textarea><div style="height:24px"></div>`,{type:"copy"})
setTimeout(()=>{const t=$("#cpy")
t&&t.select()},200)}}function csv(flt){const q=v=>'"'+String(v??"").replace(/"/g,'""')+'"'
const A=allocIndex()
const rows=[["Tarikh","Din","Type","Party","Sheher","Maal","Unit","Bhav/Ton","Amount","Turant paisa","Order baki","Tempo","Gadi","Bhada","Advance","Advance kisne","Khali pe","Khali kisne","Mode","Kis order ka","Note"]]
Object.values(S.txns).filter(t=>!flt||flt(t)).sort(byDateAsc).forEach(t=>{const p=S.parties[t.party]||{}
const[y,m,d]=(t.date||"").split("-").map(Number)
const g=isGoods(t.t)
rows.push([t.date,DAYS[new Date(y,m-1,d).getDay()],t.t==="exp"?"Kharcha · "+(t.cat||""):TT[t.t]?.l,p.name,p.city,t.qty,t.unit,t.rate,t.amount,t.paid,g?Math.round(orderDue(t,t.party,A)):"",t.tempo?pname(t.tempo):"",t.vehicle,t.bhada,t.adv,t.adv?byWho(t.advBy,t.t):"",t.khali,t.khali?byWho(t.khaliBy,t.t):"",t.mode||t.pmode,allocText(t),t.note])})
return rows.map(r=>r.map(q).join(",")).join("\n")}const bizName=()=>S.cfg&&S.cfg.biz||"Aasif Coal Traders"
let DL=null,rState={},rBlob=null
function openBiz(){const c=S.cfg||{}
openSheet(`${title("Receipt ki details")}\n  <form id="bForm" onsubmit="return false">\n  <div class="f"><label>Business / dukaan ka naam</label><input name="biz" placeholder="Sanzari Coal Traders" value="${esc(c.biz||"")}"></div>\n  <div class="f g2"><div><label>Phone</label><input name="bphone" inputmode="tel" value="${esc(c.bphone||"")}"></div><div><label>Sheher</label><input name="bcity" value="${esc(c.bcity||"")}"></div></div>\n  <div class="actions"><button type="button" class="btn" data-savebiz>Save</button></div></form>`,{type:"biz"})}function payRowFor(t,pid){return{date:t.date,title:`${TT[t.t].l} · ${t.mode||"Cash"}`,sub:allocText(t),amt:"− "+inr(t.amount),tone:"g"}}function partySpec(id,mode){const p=S.parties[id]
const A=allocIndex()
const bal=balances()[id]||0
const isB=p.type==="buyer"
const all=Object.values(S.txns).filter(t=>t.party===id||t.tempo===id).sort(byDateAsc)
const list=mode==="due"?all.filter(t=>isGoods(t.t)&&orderDue(t,id,A)>.5):all
let rows=list.map(o=>{if(!isGoods(o.t))return payRowFor(o,id)
const asT=o.tempo===id&&o.party!==id
const due=orderDue(o,id,A)
const extra=[]
if(!asT&&num(o.paid))extra.push(`turant ${o.t==="sell"?"mila":"diya"} ${inr(o.paid)}`)
if(!asT&&partyTempoPaid(o))extra.push(`tempo ko aapne diya ${inr(partyTempoPaid(o))}`)
if(asT&&(num(o.adv)||num(o.khali)))extra.push(`diya ${inr(num(o.adv)+num(o.khali))}`)
if(o.vehicle)extra.push(o.vehicle)
if(o.note)extra.push(o.note)
return{date:o.date,title:asT?`Bhada · ${pname(o.party)} · ${qn(o.qty)} ${o.unit||"Ton"}`:`${TT[o.t].l} · ${qn(o.qty)} ${o.unit||"Ton"}${num(o.rate)?" × ₹"+num(o.rate).toLocaleString("en-IN"):""}`,sub:extra.join(" · "),amt:inr(orderBill(o,id)),status:due>.5?"Baki "+inr(due):due<-.5?"Extra "+inr(due):"✓ Pura",stone:due>.5?"o":"g"}})
let note=""
if(rows.length>45){note=`Sirf aakhri 45 entries dikhayi he (kul ${rows.length})`
rows=rows.slice(-45)}let tb=0,dueSum=0
ordersOf(id).forEach(o=>{tb+=orderBill(o,id)
dueSum+=orderDue(o,id,A)})
let unalloc=0
all.forEach(t=>{if(!isGoods(t.t)&&t.party===id){unalloc+=num(t.amount)-Object.values(t.alloc||{}).reduce((s,v)=>s+num(v),0)}})
const totals=[[p.type==="tempo"?"Total bhada":"Maal ka total",inr(tb)],[isB?"Paisa mila":"Paisa diya",inr(tb-dueSum+unalloc)]]
if(num(p.open))totals.push(["Purana baki",inr(p.open)])
if(mode==="due"&&unalloc>.5)totals.push(["Advance / bina order payment","− "+inr(unalloc)])
return{kind:mode==="due"?"BAKI HISAB":"PURA HISAB",party:p,rows:rows,totals:totals,note:note,big:{label:"Total baki",val:inr(bal),tone:bal>.5?"g":bal<-.5?"r":"m",note:bal>.5?"aapki taraf se dena baki he":bal<-.5?"hamari taraf se dena baki he":"hisab barabar ✓"},empty:mode==="due"?"Koi order baki nahi — sab clear ✓":"Koi entry nahi"}}function orderSpec(oid){const o=S.txns[oid]
const pid=o.party
const p=S.parties[pid]||{name:"—"}
const A=allocIndex()
const rows=[{date:o.date,title:`${TT[o.t].l} · ${qn(o.qty)} ${o.unit||"Ton"}${num(o.rate)?" × ₹"+num(o.rate).toLocaleString("en-IN")+"/Ton":""}`,sub:[o.tempo?"🚚 "+pname(o.tempo):"",o.vehicle,o.note].filter(Boolean).join(" · "),amt:inr(o.amount)}]
if(num(o.paid))rows.push({date:o.date,title:`Turant payment · ${o.pmode||"Cash"}`,amt:"− "+inr(o.paid),tone:"g"})
const pt=partyTempoPaid(o)
if(pt)rows.push({date:o.khaliDate||o.date,title:"Tempo ko aapne diya (bhada)",amt:(o.t==="sell"?"− ":"+ ")+inr(pt),tone:"g"})
Object.values(S.txns).filter(t=>t.alloc&&t.alloc[oid]&&t.party===pid).sort(byDateAsc).forEach(t=>rows.push({date:t.date,title:`${TT[t.t].l} · ${t.mode||"Cash"}`,amt:"− "+inr(t.alloc[oid]),tone:"g"}))
const due=orderDue(o,pid,A)
const bal=balances()[pid]||0
return{kind:"BILL",party:p,rows:rows,totals:[["Bill",inr(o.amount)],[o.t==="sell"?"Mila":"Diya",inr(num(o.amount)-due)]],big:{label:"Is order ka baki",val:inr(due),tone:due>.5?"o":"g",note:Math.abs(bal-due)>.5?`Aapka total baki (sab orders): ${inr(bal)}`:due>.5?"":"Payment pura mila ✓ Shukriya"}}}function specText(sp){const p=sp.party
const L=[]
L.push(`🧾 *${bizName()}* — ${sp.kind==="BILL"?"Bill":"Hisab"}`)
L.push(`👤 *${p.name}${p.city?" ("+p.city+")":""}*`)
L.push(`📅 ${dlabel(today())}`)
L.push("━━━━━━━━━━━━━━")
if(!sp.rows.length)L.push(sp.empty||"")
sp.rows.forEach(r=>{L.push(`▫️ ${dlabel(r.date,true)} · ${r.title}`)
L.push(`      *${r.amt}*${r.status?"  ·  "+(r.stone==="o"?"⏳ ":"")+r.status:""}${r.sub?"\n      _"+r.sub+"_":""}`)})
L.push("━━━━━━━━━━━━━━")
sp.totals.forEach(([a,b])=>L.push(`${a}: ${b}`))
L.push("")
L.push(`💰 *${sp.big.label}: ${sp.big.val}*`)
if(sp.big.note)L.push(`_${sp.big.note}_`)
L.push("")
L.push("Shukriya 🙏"+(S.cfg?.bphone?"  ·  📞 "+S.cfg.bphone:""))
return L.join("\n")}async function drawReceipt(sp){try{await document.fonts.load("700 30px Inter")
await document.fonts.ready}catch(e){}const W=1080,X0=40,X1=W-40,P=90,R=X1-50,FF="Inter, system-ui, -apple-system, sans-serif"
const c=document.createElement("canvas")
c.width=W
c.height=200
let x=c.getContext("2d")
const font=(w,s)=>{x.font=`${w} ${s}px ${FF}`}
const wrap=(s,maxW,w,size,max)=>{font(w,size)
const out=[]
let line=""
for(const word of String(s||"").split(" ")){const t=line?line+" "+word:word
if(x.measureText(t).width>maxW&&line){out.push(line)
line=word}else line=t}if(line)out.push(line)
if(max&&out.length>max){out.length=max
out[max-1]+="…"}return out}
const TONE={g:["#0E8A4F","#E7F7EE"],r:["#CF3A2D","#FDECEA"],o:["#C2610C","#FFF1E2"],m:["#6A6E76","#F1F1ED"]}
function rr(X,Y,w,h,r){x.beginPath()
x.moveTo(X+r,Y)
x.arcTo(X+w,Y,X+w,Y+h,r)
x.arcTo(X+w,Y+h,X,Y+h,r)
x.arcTo(X,Y+h,X,Y,r)
x.arcTo(X,Y,X+w,Y,r)
x.closePath()}function paint(draw,H){const T=(s,X,Y,w,sz,col,al)=>{if(!draw)return
font(w,sz)
x.fillStyle=col
x.textAlign=al||"left"
x.fillText(s,X,Y)}
if(draw){x.fillStyle="#E9E8E1"
x.fillRect(0,0,W,H)
x.save()
x.shadowColor="rgba(0,0,0,.12)"
x.shadowBlur=30
x.shadowOffsetY=8
x.fillStyle="#fff"
x.beginPath()
x.moveTo(X0,76)
x.arcTo(X0,40,X0+36,40,36)
x.lineTo(X1-36,40)
x.arcTo(X1,40,X1,76,36)
x.lineTo(X1,H-70)
const n=Math.round((X1-X0)/30),st=(X1-X0)/n
for(let i=n;i>0;i--){x.lineTo(X0+(i-.5)*st,H-46)
x.lineTo(X0+(i-1)*st,H-70)}x.closePath()
x.fill()
x.restore()
const g=x.createLinearGradient(0,40,W,330)
g.addColorStop(0,"#262930")
g.addColorStop(1,"#111215")
x.fillStyle=g
x.beginPath()
x.moveTo(X0,76)
x.arcTo(X0,40,X0+36,40,36)
x.lineTo(X1-36,40)
x.arcTo(X1,40,X1,76,36)
x.lineTo(X1,330)
x.lineTo(X0,330)
x.closePath()
x.fill()
x.save()
x.clip()
const rg=x.createRadialGradient(X1-80,60,10,X1-80,60,260)
rg.addColorStop(0,"rgba(255,122,48,.35)")
rg.addColorStop(1,"rgba(255,122,48,0)")
x.fillStyle=rg
x.fillRect(X0,40,X1-X0,290)
x.restore()
x.save()
x.translate(P+22,118)
x.rotate(Math.PI/4)
const dg=x.createRadialGradient(-6,-6,2,0,0,22)
dg.addColorStop(0,"#FFB86B")
dg.addColorStop(.6,"#F0641E")
dg.addColorStop(1,"#9C2A0A")
x.fillStyle=dg
x.shadowColor="rgba(255,120,40,.8)"
x.shadowBlur=24
rr(-16,-16,32,32,8)
x.fill()
x.restore()}const cfg=S.cfg||{}
T(bizName(),P+64,134,800,46,"#fff")
T([cfg.bphone,cfg.bcity].filter(Boolean).join("  ·  ")||"Coal trading",P+64,174,500,25,"#A6AAB2")
T(sp.kind,R,112,800,22,"#FF9A52","right")
T(dlabel(today(),true)+" "+(new Date).getFullYear(),R,150,600,26,"#E6E6E0","right")
T("PARTY",P,240,700,21,"#8F939B")
const p=sp.party
T(p.name+(p.city?"  ·  "+p.city:""),P,290,800,42,"#fff")
let y=390
T("TARIKH",P,y,700,20,"#9A9EA5")
T("VIGAT",P+180,y,700,20,"#9A9EA5")
T("RAKAM",R,y,700,20,"#9A9EA5","right")
y+=24
if(draw){x.strokeStyle="#D9D9D2"
x.setLineDash([10,8])
x.lineWidth=2
x.beginPath()
x.moveTo(P,y)
x.lineTo(R,y)
x.stroke()
x.setLineDash([])}y+=20
if(!sp.rows.length){y+=60
T(sp.empty||"",W/2,y,600,30,"#6A6E76","center")
y+=50}sp.rows.forEach((r,i)=>{const tl=wrap(r.title,560,600,29,2),sl=r.sub?wrap(r.sub,560,400,23,2):[]
const h=Math.max(tl.length*38+sl.length*31,r.status?92:56)+30
if(draw&&i%2===1){x.fillStyle="#FAFAF7"
x.fillRect(P-20,y,R-P+40,h)}T(dlabel(r.date,true),P,y+42,600,26,"#4C5057")
tl.forEach((l,k)=>T(l,P+180,y+42+k*38,600,29,"#14161B"))
sl.forEach((l,k)=>T(l,P+180,y+42+tl.length*38+k*31-4,400,23,"#7A7E85"))
const tc=r.tone?TONE[r.tone][0]:"#14161B"
T(r.amt,R,y+42,800,31,tc,"right")
if(r.status&&draw){font(700,21)
const tw=x.measureText(r.status).width+30
const[fc,bc]=TONE[r.stone||"o"]
x.fillStyle=bc
rr(R-tw,y+60,tw,38,19)
x.fill()
T(r.status,R-15,y+86,700,21,fc,"right")}y+=h})
y+=16
if(draw){x.strokeStyle="#D9D9D2"
x.setLineDash([10,8])
x.lineWidth=2
x.beginPath()
x.moveTo(P,y)
x.lineTo(R,y)
x.stroke()
x.setLineDash([])}y+=20
sp.totals.forEach(([a,b])=>{y+=46
T(a,P,y,500,28,"#6A6E76")
T(b,R,y,700,30,"#14161B","right")})
y+=36
const[bc1,bc2]=TONE[sp.big.tone||"m"]
if(draw){x.fillStyle=bc2
rr(P-20,y,R-P+40,150,24)
x.fill()}T(sp.big.label,P+8,y+62,700,28,"#14161B")
if(sp.big.note)T(sp.big.note,P+8,y+104,500,23,"#6A6E76")
T(sp.big.val,R-8,y+98,800,62,bc1,"right")
y+=150
if(sp.note){y+=46
T(sp.note,W/2,y,500,22,"#8F939B","center")}y+=86
T("Shukriya 🙏",W/2,y,800,32,"#14161B","center")
y+=40
T(bizName()+" · "+dlabel(today(),true),W/2,y,500,21,"#9A9EA5","center")
return y+110}const H=paint(false)
c.height=H
x=c.getContext("2d")
paint(true,H)
return c}function waLink(text,phone){let d=String(phone||"").replace(/\D/g,"")
if(d.length===10)d="91"+d
return`https://wa.me/${d}?text=${encodeURIComponent(text)}`}async function openReceipt(o){rState={...o}
const sp=o.order?orderSpec(o.order):partySpec(o.party,o.mode||"due")
const text=specText(sp)
rState.text=text
const p=sp.party
const fn=`${sp.kind==="BILL"?"Bill":"Hisab"}-${(p.name||"party").replace(/[^\wऀ-ॿ]+/g,"-")}-${today()}.png`
rState.fn=fn
openSheet(`${title(o.order?"Order ka bill":"Receipt bhejo")}\n  ${o.order?"":`<div class="seg" style="margin-bottom:12px"><button data-rmode="due" class="${(o.mode||"due")==="due"?"on":""}">Sirf baki wale</button><button data-rmode="all" class="${o.mode==="all"?"on":""}">Pura hisab</button></div>`}\n  <div style="background:#E9E8E1;border-radius:18px;padding:10px;min-height:200px;display:grid;place-items:center"><img id="rimg" alt="Receipt" style="width:100%;border-radius:10px;display:block"><span id="rload" class="hint">Receipt ban rahi he…</span></div>\n  <div class="hint" style="text-align:center">Image pe lamba daba ke bhi Save / Share kar sakte ho.</div>\n  <div class="hint" style="text-align:center;margin:4px 0 0">Pehle image bhejo, phir “WhatsApp message” se pura hisab text me.${p.phone?"":" (Party ka phone add karoge to seedha unki chat khulegi.)"}</div>\n  <div class="actions" style="flex-wrap:wrap">\n    <button class="btn" data-rsave style="flex:1 1 100%">📲 Image share karo</button>\n    <a class="btn" style="background:#1FA855;text-align:center;text-decoration:none;flex:1 1 60%" href="${esc(waLink(text,p.phone))}" target="_blank" rel="noopener">WhatsApp message${p.phone?"":" →"}</a>\n    <button class="btn ghost" data-rcopytxt style="flex:1 1 30%">Text copy</button>\n  </div>\n`,{
type:"receipt"})
try{const c=await drawReceipt(sp)
rBlob=await new Promise(r=>c.toBlob(r,"image/png"))
const img=$("#rimg")
if(img){img.src=c.toDataURL("image/png")
const l=$("#rload")
l&&l.remove()}}catch(e){const l=$("#rload")
if(l)l.textContent="Image nahi bani — Text copy / WhatsApp message use karo"}}function downloadBlob(blob,name){const u=URL.createObjectURL(blob)
const a=document.createElement("a")
a.href=u
a.download=name
document.body.appendChild(a)
a.click()
a.remove()
setTimeout(()=>URL.revokeObjectURL(u),4e3)}async function saveImg(){if(!rBlob){toast("Ruko, image ban rahi he…")
return}const file=new File([rBlob],rState.fn,{type:"image/png"})
if(navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:rState.fn})
return}catch(e){if(e.name==="AbortError")return}}downloadBlob(rBlob,rState.fn)
toast("✓ Image download ho gayi — WhatsApp me bhejo")}const pst={rdate:null,km:null,rm:null,mm:null,bf:"all",tp:"all",ef:null,et:null}
let pageMode=null
const MKEY=d=>(d||today()).slice(0,7)
function mlabel(k){const[y,m]=k.split("-").map(Number)
return MON[m-1]+" "+y}function mshift(k,n){const[y,m]=k.split("-").map(Number)
const d=new Date(y,m-1+n,1)
return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")}const mnav=(key,k)=>`<div class="mnav"><button data-mshift="${key}|-1">‹</button><b>${mlabel(k)}</b><button data-mshift="${key}|1" ${k>=MKEY()?'disabled style="opacity:.35"':""}>›</button></div>`
const kpi=(l,v,s,cls)=>`<div class="kpi"><div class="l">${l}</div><div class="v ${cls||""}">${v}</div>${s?`<div class="s">${s}</div>`:""}</div>`
const daysAgo=d=>Math.max(0,Math.round((Date.parse(today())-Date.parse(d))/864e5))
const goodsList=()=>Object.values(S.txns).filter(t=>isGoods(t.t))
const expList=()=>Object.values(S.txns).filter(t=>t.t==="exp")
function avgBuyRate(upto){let a=0,q=0
goodsList().forEach(t=>{if(t.t==="buy"&&(!upto||t.date<=upto)){a+=num(t.amount)
q+=tons(t)}})
return q?a/q:0}function flows(){const F=[]
for(const t of Object.values(S.txns)){if(t.t==="in")F.push({d:t.date,v:num(t.amount),m:t.mode||"Cash",l:`${pname(t.party)} se paisa mila`,id:t.id})
else if(t.t==="out")F.push({d:t.date,v:-num(t.amount),m:t.mode||"Cash",l:`${pname(t.party)} ko paisa diya`,id:t.id})
else if(t.t==="exp")F.push({d:t.date,v:-num(t.amount),m:t.mode||"Cash",l:`Kharcha · ${t.cat||"Other"}${t.note?" · "+t.note:""}`,id:t.id,exp:1})
else if(isGoods(t.t)){if(num(t.paid))F.push({d:t.date,v:(t.t==="sell"?1:-1)*num(t.paid),m:t.pmode||"Cash",l:`${pname(t.party)} — turant ${t.t==="sell"?"mila":"diya"}`,id:t.id})
if(num(t.adv)&&t.advBy!=="party")F.push({d:t.date,v:-num(t.adv),m:"Cash",l:`Tempo advance${t.tempo?" · "+pname(t.tempo):""}`,id:t.id})
if(num(t.khali)&&t.khaliBy!=="party")F.push({d:t.khaliDate||t.date,v:-num(t.khali),m:"Cash",l:`Tempo khali pe${t.tempo?" · "+pname(t.tempo):""}`,id:t.id})}}return F.sort((a,b)=>(b.d||"").localeCompare(a.d||""))}const flowRow=f=>`<div class="item" ${f.exp?`data-exp="${esc(f.id)}"`:`data-tx="${esc(f.id)}"`}><div class="av ${f.v>0?"green":"red"}">${f.v>0?ICON.in:ICON.out}</div>\n  <div class="mid"><div class="t1" style="font-size:14px">${esc(f.l)}</div><div class="t2">${esc(dlabel(f.d,true))} · ${esc(f.m)}</div></div>\n  <div class="amt ${f.v>0?"c-g":"c-r"}">${f.v>0?"+":"−"}${inr(f.v)}</div></div>`
const PAGES={baki:{t:"Baki vasooli",sec:"Hisab",i:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'},rojmel:{t:"Rojmel (din ka hisab)",sec:"Hisab",i:'<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v18H6.5A1.5 1.5 0 0 1 5 19.5z"/><path d="M9 7h6M9 11h6"/>'},cash:{t:"Cash / Bank",sec:"Hisab",i:'<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M16 15h2"/>'},kharche:{t:"Kharche",sec:"Hisab",i:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>'},stock:{t:"Stock",sec:"Maal",i:'<path d="M12 3 3 8l9 5 9-5z"/><path d="m3 13 9 5 9-5"/>'},tempo:{t:"Tempo trips",sec:"Maal",i:'<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>'},munafa:{t:"Munafa",sec:"Maal",i:'<path d="m3 17 6-6 4 4 8-8"/><path d="M14 7h7v7"/>'},report:{t:"Mahine ki report",sec:"Report",i:'<path d="M5 20V11M11 20V5M17 20v-6M3 20h18"/>'},export:{t:"Excel export",sec:"Report",i:'<path d="M12 4v11m0 0-4-4m4 4 4-4M4 20h16"/>'},biz:{t:"Business details",sec:"Settings",i:'<path d="M4 9 5.5 4h13L20 9M5 9v11h14V9M4 9h16"/><path d="M10 20v-5h4v5"/>'},pin:{t:"PIN lock",sec:"Settings",
i:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'},bin:{t:"Recycle bin",sec:"Settings",i:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'},backup:{t:"Backup / Restore",sec:"Settings",i:'<path d="M20 12a8 8 0 1 1-2.3-5.7L20 8.5"/><path d="M20 4v4.5h-4.5"/>'}}
const CHEV='<svg class="chev" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>'
function renderDrawer(){const secs={}
Object.entries(PAGES).forEach(([k,p])=>(secs[p.sec]=secs[p.sec]||[]).push([k,p]))
const u=null
$("#drawer .dbody").innerHTML=Object.entries(secs).map(([s,arr])=>`<div class="dsec">${s}</div><div class="dgroup">`+arr.map(([k,p])=>`<button class="dlink" data-page="${k}"><svg class="i" viewBox="0 0 24 24">${p.i}</svg><span>${p.t}</span>${CHEV}</button>`).join("")+"</div>").join("")+(u?`<div class="dsec">Account</div><div class="dgroup"><div class="dlink" style="cursor:default"><svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(u.email||u.displayName||"")}</span></div>\n      <button class="dlink" data-logout style="color:var(--red)"><svg class="i" viewBox="0 0 24 24"><path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11"/></svg><span>Logout</span></button></div>`:"")+`<div class="hint" style="margin:18px 10px 30px">Aasif Coal Traders · Data Firebase me safe</div>`}document.addEventListener("click",async e=>{if(!e.target.closest("[data-logout]"))return
toggleDrawer(false)
unlocked=false
try{await window.FB.logout()}catch(err){}})
function openPage(k){if(k==="biz"){openBiz()
return}pageMode=k
const pg=$("#page")
pg.hidden=false
renderPage(true)}function closePage(){pageMode=null
$("#page").hidden=true
render()}function renderPage(fresh){if(!pageMode)return
const pg=$("#page")
const st=fresh?0:pg.scrollTop
const P=PAGES[pageMode]
const fn={baki:pgBaki,rojmel:pgRojmel,cash:pgCash,kharche:pgKharche,stock:pgStock,tempo:pgTempo,munafa:pgMunafa,report:pgReport,export:pgExport,pin:pgPin,bin:pgBin,backup:pgBackup}[pageMode]
pg.innerHTML=`<div class="phd"><button class="icon-btn" data-pback aria-label="Wapas">‹</button><h2>${P.t}</h2></div><div class="pbody">${fn()}</div>`
pg.scrollTop=st}function remindText(p,amt,oldest){return`Assalamu alaikum / Namaste ${p.name} ji,\n\n${bizName()} me aapka *${inr(amt)}* baki he${oldest?` (sabse purana ${dlabel(oldest,true)} ka maal)`:""}.\nMeherbani karke jaldi payment kar dijiye.\n\nShukriya 🙏${S.cfg?.bphone?"\n📞 "+S.cfg.bphone:""}`}function pgBaki(){const B=balances(),A=allocIndex()
const rows=Object.values(S.parties).map(p=>{const b=B[p.id]||0
const pend=ordersOf(p.id).filter(o=>orderDue(o,p.id,A)>.5)
const oldest=pend[0]?.date
return{p:p,b:b,n:pend.length,oldest:oldest,days:oldest?daysAgo(oldest):null}})
let rec=rows.filter(r=>r.b>.5).sort((a,b)=>(b.days??-1)-(a.days??-1)||b.b-a.b)
const pay=rows.filter(r=>r.b<-.5).sort((a,b)=>a.b-b.b)
const tot=rec.reduce((s,r)=>s+r.b,0),totP=pay.reduce((s,r)=>s-r.b,0)
if(pst.bf!=="all")rec=rec.filter(r=>(r.days??0)>=+pst.bf)
const dayPill=d=>d==null?"":`<span class="pill ${d>=30?"late":d>=15?"due":"done"}">${d} din</span>`
return`<div class="kpis">${kpi("Aapko milna he",inr(tot),rows.filter(r=>r.b>.5).length+" parties se","c-g")}${kpi("Aapko dena he",inr(totP),pay.length+" parties ko","c-r")}</div>\n  <div class="chips" style="margin:14px 0 10px">${[["all","Sab"],["15","15+ din"],["30","30+ din"]].map(([k,l])=>`<button class="chip ${pst.bf===k?"on":""}" data-bf="${k}">${l}</button>`).join("")}</div>\n  ${rec.length?`<div class="list">${rec.map(r=>{const over=num(r.p.limit)&&r.b>num(r.p.limit)
return`<div class="item wrap" style="align-items:flex-start">\n    <div class="av ${(PT[r.p.type]||PT.buyer).c}">${esc((r.p.name[0]||"?").toUpperCase())}</div>\n    <div class="mid"><div class="t1">${esc(r.p.name)} ${dayPill(r.days)} ${over?'<span class="pill late">Limit cross</span>':""}</div>\n      <div class="t2">${r.n?`${r.n} order baki${r.oldest?" · sabse purana "+esc(dlabel(r.oldest,true)):""}`:"Purana baki"}${r.p.phone?" · "+esc(r.p.phone):""}</div>\n      <div style="display:flex;gap:8px;margin-top:10px"><a class="btn sm" style="background:#1FA855;text-decoration:none;text-align:center;flex:1" target="_blank" rel="noopener" href="${esc(waLink(remindText(r.p,r.b,r.oldest),r.p.phone))}">WhatsApp yaad dilao</a><button class="btn sm ghost" data-party="${esc(r.p.id)}">Khata</button></div></div>\n    <div class="amt c-g">${inr(r.b)}</div></div>`
}).join("")}</div>`:`<div class="list"><div class="empty"><b>Koi baki nahi 🎉</b>Is filter me kisi ka paisa baki nahi.</div></div>`}\n  ${pay.length?`<div class="sec-h"><h2>Aapko dena he</h2></div><div class="list">${pay.map(r=>`<div class="item" data-party="${esc(r.p.id)}"><div class="av ${(PT[r.p.type]||PT.buyer).c}">${esc((r.p.name[0]||"?").toUpperCase())}</div>\n    <div class="mid"><div class="t1">${esc(r.p.name)}</div><div class="t2">${(PT[r.p.type]||PT.buyer).l}${r.n?` · ${r.n} order baki`:""}</div></div><div class="amt c-r">${inr(r.b)}</div></div>`).join("")}</div>`:""}`}function pgRojmel(){const d=pst.rdate||today()
const F=flows().filter(f=>f.d===d)
let inA=0,outA=0,cIn=0,cOut=0
F.forEach(f=>{if(f.v>0){inA+=f.v
if(f.m==="Cash")cIn+=f.v}else{outA-=f.v
if(f.m==="Cash")cOut-=f.v}})
const g=goodsList().filter(t=>t.date===d)
let sq=0,bq=0
g.forEach(t=>{if(t.t==="sell")sq+=tons(t)
else bq+=tons(t)})
return`<div class="mnav"><button data-rday="-1">‹</button><label style="display:flex;flex-direction:column;align-items:center"><b>${esc(dlabel(d))}</b><input type="date" id="rdate" value="${d}" style="border:0;padding:0;font-size:12px;width:auto;background:none;color:var(--mut);text-align:center"></label><button data-rday="1" ${d>=today()?'disabled style="opacity:.35"':""}>›</button></div>\n  <div class="kpis">${kpi("Aaya",inr(inA),"Cash "+inr(cIn)+" · Bank "+inr(inA-cIn),"c-g")}${kpi("Gaya",inr(outA),"Cash "+inr(cOut)+" · Bank "+inr(outA-cOut),"c-r")}\n  ${kpi("Din ka bacha",(inA-outA<0?"−":"")+inr(inA-outA),"Galle me cash: "+(cIn-cOut<0?"−":"+")+inr(cIn-cOut))}${kpi("Maal",qn(sq)+" Ton becha",qn(bq)+" Ton liya")}</div>\n  <div class="sec-h"><h2>Paise ka len-den (${F.length})</h2></div>\n  ${F.length?`<div class="list">${F.map(flowRow).join("")}</div>`:`<div class="list"><div class="empty">Is din koi paisa aaya/gaya nahi.</div></div>`}\n  ${g.length?`<div class="sec-h"><h2>Maal ki entries (${g.length})</h2></div><div class="list">${g.map(t=>txRow(t)).join("")}</div>`:""}`}function pgCash(){const o=S.cfg?.cashOpen||{}
const F=flows()
let c=num(o.cash),b=num(o.bank)
F.forEach(f=>{if(f.m==="Cash")c+=f.v
else b+=f.v})
return`${S.cfg?.cashOpen?"":'<div class="banner">Pehli baar? Neeche “Shuruaati balance” me aaj galle me kitna cash he aur bank me kitna, wo daal do — tabhi sahi balance dikhega.</div>'}<div class="kpis">${kpi("💵 Galle me cash",(c<0?"−":"")+inr(c),"Shuruaat: "+inr(o.cash||0),c<0?"c-r":"")}${kpi("🏦 Bank / UPI",(b<0?"−":"")+inr(b),"Shuruaat: "+inr(o.bank||0),b<0?"c-r":"")}</div>\n  <div class="kpi" style="margin-top:10px;display:flex;justify-content:space-between;align-items:center"><div><div class="l">Kul paisa haath me</div><div class="v">${c+b<0?"−":""}${inr(c+b)}</div></div><button class="btn sm ghost" data-cashopen>Shuruaati balance</button></div>\n  <div class="hint" style="margin:8px 4px 0">UPI, Bank aur Cheque — teeno “Bank” me gine jaate he. Pehli baar use kar rahe ho to “Shuruaati balance” me aaj ka cash aur bank daal do.</div>\n  <div class="sec-h"><h2>Haal ka len-den</h2></div>\n  ${F.length?`<div class="list">${F.slice(0,30).map(flowRow).join("")}</div>`:`<div class="list"><div class="empty">Abhi koi len-den nahi.</div></div>`}`}function openCashOpen(){const o=S.cfg?.cashOpen||{}
openSheet(`${title("Shuruaati balance")}<form id="coForm" onsubmit="return false">\n  <div class="f"><label>Galle me cash (₹)</label><input name="cash" inputmode="decimal" value="${num(o.cash)||""}" placeholder="₹0"></div>\n  <div class="f"><label>Bank / UPI me (₹)</label><input name="bank" inputmode="decimal" value="${num(o.bank)||""}" placeholder="₹0"></div>\n  <div class="actions"><button type="button" class="btn" data-savecash>Save</button></div></form>`,{type:"co"})}const CATS=["Diesel","Mazdoor","Kiraya","Chai-paani","Bijli","Gadi repair","Phone","Other"]
function pgKharche(){const k=pst.km||MKEY()
const L=expList().filter(t=>(t.date||"").startsWith(k)).sort((a,b)=>byDateAsc(b,a))
const tot=L.reduce((s,t)=>s+num(t.amount),0)
const byC={}
L.forEach(t=>byC[t.cat||"Other"]=(byC[t.cat||"Other"]||0)+num(t.amount))
const mx=Math.max(1,...Object.values(byC))
return`<button class="btn" style="width:100%;margin-bottom:12px" data-addexp>+ Naya kharcha likho</button>${mnav("km",k)}\n  <div class="kpis">${kpi("Is mahine kharcha",inr(tot),L.length+" entries","c-r")}${kpi("Roz ka average",inr(tot/Math.max(1,k===MKEY()?(new Date).getDate():new Date(+k.slice(0,4),+k.slice(5),0).getDate())),"")}</div>\n  ${Object.keys(byC).length?`<div class="box">${Object.entries(byC).sort((a,b)=>b[1]-a[1]).map(([c,v])=>`<div class="hbar"><span>${esc(c)}</span><div class="bar"><i style="width:${v/mx*100}%;background:var(--red)"></i></div><b>${inr(v)}</b></div>`).join("")}</div>`:""}\n  <div class="sec-h"><h2>Kharche</h2></div>\n  ${L.length?`<div class="list">${L.map(t=>`<div class="item" data-exp="${esc(t.id)}"><div class="av red">🧾</div><div class="mid"><div class="t1">${esc(t.cat||"Other")}</div><div class="t2">${esc(dlabel(t.date,true))} · ${esc(t.mode||"Cash")}${t.note?" · "+esc(t.note):""}</div></div><div class="amt c-r">${inr(t.amount)}</div></div>`).join("")}</div>`:`<div class="list"><div class="empty">Is mahine koi kharcha nahi likha.</div></div>`}`}let expCat="Diesel",expMode="Cash",expId=null
function openExpense(id){const e=id?S.txns[id]:{cat:"Diesel",mode:"Cash",date:today()}
expId=id||null
expCat=e.cat||"Other"
expMode=e.mode||"Cash"
openSheet(`${title(id?"Kharcha badlo":"Naya kharcha")}<form id="xForm" onsubmit="return false">\n  <div class="lab">Kis cheez ka?</div><div class="chips" style="flex-wrap:wrap">${CATS.map(c=>`<button type="button" class="chip ${c===expCat?"on":""}" data-xcat="${c}">${c}</button>`).join("")}</div>\n  <div class="f"><label>Kitna (₹)</label><input name="xamt" inputmode="decimal" placeholder="₹0" value="${e.amount||""}"></div>\n  <div class="f"><label>Kaise diya?</label><div class="seg" id="xMode">${["Cash","UPI","Bank"].map(m=>`<button type="button" data-xmode="${m}" class="${m===expMode?"on":""}">${m}</button>`).join("")}</div></div>\n  <div class="f g2"><div><label>Tarikh</label><input type="date" name="xdate" value="${esc(e.date||today())}"></div><div><label>Note</label><input name="xnote" placeholder="optional" value="${esc(e.note||"")}"></div></div>\n  <div class="actions">${id?`<button type="button" class="btn danger" data-delexp>Delete</button>`:""}<button type="button" class="btn" data-saveexp>Save</button></div></form>`,{type:"exp"})
if(!id)setTimeout(()=>{const i=$("#xForm [name=xamt]")
i&&i.focus()},280)}function saveExpense(){const f=$("#xForm").elements
const a=num(f.namedItem("xamt").value)
if(!a){toast("Amount daalo")
return}const old=expId?S.txns[expId]:null
put({kind:"txn",t:"exp",id:expId||"t_"+uid(),cat:expCat,amount:a,mode:expMode,date:f.namedItem("xdate").value||today(),note:f.namedItem("xnote").value.trim(),ts:old?.ts||Date.now()})
toast("Kharcha save ✓")
closeSheet()}function pgStock(){const G=goodsList()
let bq=0,ba=0,sq=0,sa=0
const sup={},cus={}
G.forEach(t=>{const q=tons(t)
if(t.t==="buy"){bq+=q
ba+=num(t.amount)
const r=sup[t.party]=sup[t.party]||{q:0,a:0,d:""}
r.q+=q
r.a+=num(t.amount)
if(t.date>r.d)r.d=t.date}else{sq+=q
sa+=num(t.amount)
const r=cus[t.party]=cus[t.party]||{q:0,a:0,d:""}
r.q+=q
r.a+=num(t.amount)
if(t.date>r.d)r.d=t.date}})
const st=bq-sq,avg=bq?ba/bq:0
const tbl=(o,lbl)=>Object.entries(o).sort((a,b)=>b[1].q-a[1].q).map(([id,r])=>`<div class="item" data-party="${esc(id)}"><div class="mid"><div class="t1">${esc(pname(id))}</div><div class="t2">Aakhri ${esc(dlabel(r.d,true))} · avg ₹${Math.round(r.q?r.a/r.q:0).toLocaleString("en-IN")}/Ton</div></div><div class="amt">${qn(r.q)} Ton<small class="c-m">${inr(r.a)}</small></div></div>`).join("")
return`<div class="pcard" style="text-align:center"><div class="lab" style="margin:0">Abhi stock (andaaz)</div><div class="big ${st<0?"c-r":""}" style="font-size:34px">${qn(st)} Ton</div>\n    <div class="hint">${st<0?"Bikri kharidi se zyada he — shayad kuch kharidi entry baki he.":`Kimat (avg kharidi bhav se): ${inr(st*avg)}`}</div></div>\n  <div class="kpis" style="margin-top:10px">${kpi("Kul kharida",qn(bq)+" Ton","Avg ₹"+Math.round(avg).toLocaleString("en-IN")+"/Ton")}${kpi("Kul becha",qn(sq)+" Ton","Avg ₹"+Math.round(sq?sa/sq:0).toLocaleString("en-IN")+"/Ton")}</div>\n  <div class="sec-h"><h2>Supplier se kitna aaya</h2></div>${Object.keys(sup).length?`<div class="list">${tbl(sup)}</div>`:'<div class="list"><div class="empty">Abhi koi kharidi nahi.</div></div>'}\n  <div class="sec-h"><h2>Grahak ko kitna gaya</h2></div>${Object.keys(cus).length?`<div class="list">${tbl(cus)}</div>`:'<div class="list"><div class="empty">Abhi koi bikri nahi.</div></div>'}`}function pgTempo(){const A=allocIndex()
const all=goodsList().filter(t=>t.tempo||num(t.bhada)).sort((a,b)=>byDateAsc(b,a))
const temps=[...new Set(all.map(t=>t.tempo).filter(Boolean))]
const L=pst.tp==="all"?all:all.filter(t=>t.tempo===pst.tp)
let tb=0,tdue=0
const due=t=>t.tempo?orderDue(t,t.tempo,A):num(t.bhada)-num(t.adv)-num(t.khali)
L.forEach(t=>{tb+=num(t.bhada)
tdue+=Math.max(0,due(t))})
return`<div class="kpis">${kpi("Trips",L.length,"")}${kpi("Kul bhada",inr(tb),"Baki: "+inr(tdue),tdue>.5?"":"")}</div>\n  ${temps.length>1?`<div class="chips" style="margin:12px 0 0">${[["all","Sab"]].concat(temps.map(id=>[id,pname(id)])).map(([k,l])=>`<button class="chip ${pst.tp===k?"on":""}" data-tpf="${esc(k)}">${esc(l)}</button>`).join("")}</div>`:""}\n  <div class="sec-h"><h2>Trips</h2></div>\n  ${L.length?`<div class="list">${L.map(t=>{const d=due(t)
return`<div class="item wrap" data-tx="${esc(t.id)}"><div class="av violet">${ICON.truck}</div>\n    <div class="mid"><div class="t1">${esc(t.tempo?pname(t.tempo):"Tempo")}${t.vehicle?` <span class="c-m" style="font-weight:500">· ${esc(t.vehicle)}</span>`:""}</div>\n    <div class="t2">${esc(dlabel(t.date,true))} · ${esc(pname(t.party))} ${t.t==="sell"?"ko":"se"} ${qn(t.qty)} Ton</div>\n    <div class="t2">Advance ${inr(t.adv||0)} · Khali pe ${inr(t.khali||0)}</div></div>\n    <div class="amt">${inr(t.bhada)}<small>${d>.5?`<span class="pill due">Baki ${inr(d)}</span>`:'<span class="pill done">✓ Pura</span>'}</small></div></div>`}).join("")}</div>`:`<div class="list"><div class="empty">Abhi koi tempo trip nahi. Bikri/Kharidi me “Tempo / bhada add karo” se daalo.</div></div>`}`}function saleProfit(t){const avg=avgBuyRate(t.date)||avgBuyRate()
const cost=tons(t)*avg
return{cost:cost,profit:num(t.amount)-cost-num(t.bhada),avg:avg}}function pgMunafa(){const k=pst.mm||MKEY()
const S1=goodsList().filter(t=>t.t==="sell"&&(t.date||"").startsWith(k)).sort((a,b)=>byDateAsc(b,a))
let gp=0
S1.forEach(t=>gp+=saleProfit(t).profit)
const ex=expList().filter(t=>(t.date||"").startsWith(k)).reduce((s,t)=>s+num(t.amount),0)
const net=gp-ex
const noBuy=!avgBuyRate()
return`${mnav("mm",k)}<div class="kpis">${kpi("Bikri se munafa",(gp<0?"−":"")+inr(gp),S1.length+" bikri",gp>=0?"c-g":"c-r")}${kpi("Kharche",inr(ex),"Kharche page se","c-r")}</div>\n  <div class="pcard" style="margin-top:10px;display:flex;justify-content:space-between;align-items:center"><div><div class="lab" style="margin:0">Asli munafa (kharche ke baad)</div><div class="big ${net>=0?"c-g":"c-r"}">${net<0?"−":""}${inr(net)}</div></div></div>\n  <div class="hint" style="margin:8px 4px 0">${noBuy?"⚠️ Abhi koi kharidi entry nahi, isliye maal ki lagat ₹0 maani he.":"Lagat = becha hua Ton × aapka average kharidi bhav. Bhada bhi ghataya he."}</div>\n  <div class="sec-h"><h2>Har bikri ka munafa</h2></div>\n  ${S1.length?`<div class="list">${S1.map(t=>{const p=saleProfit(t)
return`<div class="item wrap" data-tx="${esc(t.id)}"><div class="av blue">${ICON.sell}</div>\n    <div class="mid"><div class="t1">${esc(pname(t.party))} · ${qn(t.qty)} Ton</div><div class="t2">${esc(dlabel(t.date,true))} · Becha ₹${num(t.rate).toLocaleString("en-IN")} · Liya ~₹${Math.round(p.avg).toLocaleString("en-IN")}${num(t.bhada)?" · bhada "+inr(t.bhada):""}</div></div>\n    <div class="amt ${p.profit>=0?"c-g":"c-r"}">${p.profit<0?"−":"+"}${inr(p.profit)}<small class="c-m">bill ${inr(t.amount)}</small></div></div>`}).join("")}</div>`:`<div class="list"><div class="empty">Is mahine koi bikri nahi.</div></div>`}`}function monthStats(k){const G=goodsList().filter(t=>(t.date||"").startsWith(k))
let s=0,sq=0,b=0,bq=0,bh=0,gp=0
G.forEach(t=>{if(t.t==="sell"){s+=num(t.amount)
sq+=tons(t)
gp+=saleProfit(t).profit}else{b+=num(t.amount)
bq+=tons(t)}bh+=num(t.bhada)})
const ex=expList().filter(t=>(t.date||"").startsWith(k)).reduce((a,t)=>a+num(t.amount),0)
let fin=0,fout=0
flows().forEach(f=>{if((f.d||"").startsWith(k)){if(f.v>0)fin+=f.v
else fout-=f.v}})
return{s:s,sq:sq,b:b,bq:bq,bh:bh,ex:ex,gp:gp,net:gp-ex,fin:fin,fout:fout,sr:sq?s/sq:0,br:bq?b/bq:0,G:G}}function lineChart(series,labels){const W=320,H=150,P=28
const all=series.flatMap(s=>s.v).filter(v=>v>0)
if(!all.length)return'<div class="hint">Graph ke liye abhi data kam he.</div>'
const mx=Math.max(...all)*1.1,mn=Math.min(...all)*.9
const X=i=>P+i*(W-P-10)/Math.max(1,labels.length-1),Y=v=>H-22-(v-mn)/Math.max(1,mx-mn)*(H-40)
let g=`<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto">`;[0,.5,1].forEach(f=>{const v=mn+(mx-mn)*f
g+=`<line x1="${P}" x2="${W-6}" y1="${Y(v)}" y2="${Y(v)}" stroke="#ECECE6"/><text x="2" y="${Y(v)+4}" font-size="9" fill="#999">${Math.round(v/100)/10}k</text>`})
labels.forEach((l,i)=>g+=`<text x="${X(i)}" y="${H-6}" font-size="10" fill="#888" text-anchor="middle">${l}</text>`)
series.forEach(s=>{const pts=s.v.map((v,i)=>v>0?[X(i),Y(v)]:null).filter(Boolean)
if(pts.length>1)g+=`<polyline fill="none" stroke="${s.c}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" points="${pts.map(p=>p.join(",")).join(" ")}"/>`
pts.forEach(p=>g+=`<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="${s.c}"/>`)})
return g+"</svg>"+`<div style="display:flex;gap:14px;justify-content:center;font-size:12px;color:var(--mut)">${series.map(s=>`<span><i style="display:inline-block;width:10px;height:3px;background:${s.c};vertical-align:middle;margin-right:5px;border-radius:2px"></i>${s.n}</span>`).join("")}</div>`}function reportText(k,m){return`📊 *${bizName()} — ${mlabel(k)} report*\n\nBikri: ${inr(m.s)} (${qn(m.sq)} Ton)\nKharidi: ${inr(m.b)} (${qn(m.bq)} Ton)\nBhada: ${inr(m.bh)}\nKharche: ${inr(m.ex)}\n*Munafa (andaaz): ${m.net<0?"−":""}${inr(m.net)}*\n\nPaisa aaya: ${inr(m.fin)}\nPaisa gaya: ${inr(m.fout)}`}function pgReport(){const k=pst.rm||MKEY()
const m=monthStats(k)
const top=t=>{const o={}
m.G.filter(x=>x.t===t).forEach(x=>o[x.party]=(o[x.party]||0)+num(x.amount))
return Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,5)}
const bars=(arr,c)=>{const mx=Math.max(1,...arr.map(a=>a[1]))
return arr.length?`<div class="box">${arr.map(([id,v])=>`<div class="hbar"><span>${esc(pname(id))}</span><div class="bar"><i style="width:${v/mx*100}%;background:${c}"></i></div><b>${inr(v)}</b></div>`).join("")}</div>`:'<div class="hint">Is mahine koi nahi.</div>'}
const ms=[]
for(let i=5;i>=0;i--)ms.push(mshift(k,-i))
const st=ms.map(monthStats)
return`${mnav("rm",k)}\n  <div class="kpis">${kpi("Bikri",inr(m.s),qn(m.sq)+" Ton")}${kpi("Kharidi",inr(m.b),qn(m.bq)+" Ton")}${kpi("Bhada + Kharche",inr(m.bh+m.ex),"Bhada "+inr(m.bh)+" · Kharche "+inr(m.ex),"c-r")}${kpi("Munafa (andaaz)",(m.net<0?"−":"")+inr(m.net),"kharche ke baad",m.net>=0?"c-g":"c-r")}\n  ${kpi("Paisa aaya",inr(m.fin),"","c-g")}${kpi("Paisa gaya",inr(m.fout),"","c-r")}</div>\n  <a class="btn" style="display:block;text-align:center;text-decoration:none;background:#1FA855;margin-top:12px" target="_blank" rel="noopener" href="${esc(waLink(reportText(k,m),""))}">Report WhatsApp pe bhejo</a>\n  <div class="sec-h"><h2>Bhav ka graph (₹/Ton)</h2></div><div class="box">${lineChart([{n:"Bikri bhav",c:"#1D43A6",v:st.map(x=>x.sr)},{n:"Kharidi bhav",c:"#C2610C",v:st.map(x=>x.br)}],ms.map(x=>MON[+x.slice(5)-1]))}</div>\n  <div class="sec-h"><h2>Top grahak</h2></div>${bars(top("sell"),"var(--green)")}\n  <div class="sec-h"><h2>Top supplier</h2></div>${bars(top("buy"),"#C2610C")}`}function pgExport(){const f=pst.ef||today().slice(0,8)+"01",t=pst.et||today()
const n=Object.values(S.txns).filter(x=>x.date>=f&&x.date<=t).length
return`<div class="box"><div class="g2"><div><div class="lab">Kab se</div><input type="date" id="ef" value="${f}"></div><div><div class="lab">Kab tak</div><input type="date" id="et" value="${t}"></div></div>\n  <div class="chips" style="margin-top:10px">${[["m","Is mahina"],["lm","Pichla mahina"],["y","Is saal"],["all","Sab"]].map(([k,l])=>`<button class="chip" data-eq="${k}">${l}</button>`).join("")}</div></div>\n  <div class="hint" style="margin:10px 4px">${n} entries milengi (kharidi, bikri, payment, kharche — sab).</div>\n  <button class="btn" style="width:100%" data-exdl>⇩ Excel file (CSV) download</button>\n  <button class="btn ghost" style="width:100%;margin-top:10px" data-excp>Text copy karo</button>\n  <div class="hint" style="margin:10px 4px">CSV file Excel / Google Sheets me seedha khulti he.</div>`}function csvRange(f,t){return csv(x=>x.date>=f&&x.date<=t)}async function pinHash(p){try{const b=await crypto.subtle.digest("SHA-256",(new TextEncoder).encode("coalhisab:"+p))
return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}catch(e){let h=0
for(const c of"coalhisab:"+p)h=h*31+c.charCodeAt(0)|0
return"x"+h}}function pgPin(){const on=!!S.cfg?.pinH
return`<div class="pcard" style="text-align:center"><div style="font-size:40px">${on?"🔒":"🔓"}</div><div class="t1" style="font-size:17px;margin-top:6px">${on?"PIN lock chalu he":"PIN lock band he"}</div>\n  <div class="hint">${on?"App kholte hi PIN poocha jayega.":"4 digit PIN lagao taaki koi aur hisab na dekh sake."}</div></div>\n  <div class="box"><div class="lab">${on?"Naya PIN":"PIN"} (4 number)</div><input id="pin1" type="password" inputmode="numeric" maxlength="4" placeholder="••••">\n  <div class="lab" style="margin-top:10px">Dobara likho</div><input id="pin2" type="password" inputmode="numeric" maxlength="4" placeholder="••••"></div>\n  <button class="btn" style="width:100%;margin-top:12px" data-setpin>${on?"PIN badlo":"PIN lagao"}</button>\n  ${on?'<button class="btn ghost" style="width:100%;margin-top:10px;color:var(--red)" data-offpin>PIN hatao</button>':""}\n  <div class="hint" style="margin:10px 4px">PIN bhool gaye to Claude se kehke hata sakte ho. Ye simple lock he, bank jaisi security nahi.</div>`}let unlocked=false
function checkLock(){if(unlocked||!S.cfg?.pinH||$("#lock"))return
const d=document.createElement("div")
d.id="lock"
d.className="lock"
d.innerHTML=`<div class="logo" style="width:64px;height:64px;border-radius:20px"><span style="width:20px;height:20px"></span></div><b style="font-size:20px">${esc(bizName())}</b><div style="color:#A6AAB2;font-size:14px">PIN daalo</div>\n  <div class="pdots" id="pdots"><i></i><i></i><i></i><i></i></div><div class="keypad">${[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map(k=>k===""?"<span></span>":`<button data-k="${k}">${k}</button>`).join("")}</div>`
document.body.appendChild(d)
let v=""
d.addEventListener("click",async e=>{const b=e.target.closest("[data-k]")
if(!b)return
const k=b.dataset.k
if(k==="⌫")v=v.slice(0,-1)
else if(v.length<4)v+=k
d.querySelectorAll("#pdots i").forEach((x,i)=>x.classList.toggle("on",i<v.length))
if(v.length===4){if(await pinHash(v)===S.cfg.pinH){unlocked=true
d.remove()}else{d.querySelector("#pdots").classList.add("shake")
setTimeout(()=>{v=""
d.querySelectorAll("#pdots i").forEach(x=>x.classList.remove("on"))
d.querySelector("#pdots").classList.remove("shake")},450)}}})}function binDesc(it){if(it.kind==="party")return["Party · "+it.name,(PT[it.type]||PT.buyer).l]
if(it.t==="exp")return["Kharcha · "+(it.cat||""),inr(it.amount)]
return[(TT[it.t]?.l||"Entry")+" · "+pname(it.party),(isGoods(it.t)?qn(it.qty)+" Ton · ":"")+inr(it.amount)]}function pgBin(){const L=Object.values(S.bin||{}).sort((a,b)=>(b.at||0)-(a.at||0))
return`<div class="hint" style="margin:0 4px 10px">Delete ki hui entries yahan aati he. “Wapas lao” se dobara hisab me aa jayegi.</div>\n  ${L.length?`<div class="list">${L.map(b=>{const[t1,t2]=binDesc(b.item)
return`<div class="item wrap" style="cursor:default"><div class="mid"><div class="t1">${esc(t1)}</div><div class="t2">${esc(t2)} · ${esc(dlabel(b.item.date||iso(new Date(b.at)),true))} · delete: ${esc(dlabel(iso(new Date(b.at||Date.now())),true))}</div>\n    <div style="display:flex;gap:8px;margin-top:8px"><button class="btn sm" data-restore="${esc(b.id)}">↺ Wapas lao</button><button class="btn sm danger" data-purge="${esc(b.id)}">Delete</button></div></div></div>`}).join("")}</div>`:`<div class="list"><div class="empty">Recycle bin khali he.</div></div>`}`}function pgBackup(){
return`<div class="list">\n  <div class="item" data-act="backup"><div class="av gray">⎘</div><div class="mid"><div class="t1">Backup copy</div><div class="t2">Pura data text me copy — WhatsApp pe khud ko bhej do</div></div></div>\n  <div class="item" data-act="restore"><div class="av gray">↺</div><div class="mid"><div class="t1">Backup restore</div><div class="t2">Copy kiya backup paste karke wapas lao</div></div></div>\n  <div class="item" data-page="export"><div class="av gray">⇩</div><div class="mid"><div class="t1">Excel export</div><div class="t2">Tarikh ke hisab se CSV file</div></div></div></div>\n  <div class="hint" style="margin:14px 4px">Data aapke Firebase account me save he — sirf aap (Google login se) dekh sakte ho. ${Object.keys(S.txns).length} entries · ${Object.keys(S.parties).length} parties.</div>`}document.addEventListener("click",async e=>{
const el=e.target.closest("[data-page],[data-pback],[data-mshift],[data-bf],[data-rday],[data-cashopen],[data-savecash],[data-addexp],[data-exp],[data-xcat],[data-xmode],[data-saveexp],[data-delexp],[data-tpf],[data-eq],[data-exdl],[data-excp],[data-setpin],[data-offpin],[data-restore],[data-purge]")
if(!el)return
const ds=el.dataset
if(ds.page){toggleDrawer(false)
openPage(ds.page)
return}if(ds.pback!==undefined){closePage()
return}if(ds.mshift){const[k,n]=ds.mshift.split("|")
pst[k]=mshift(pst[k]||MKEY(),+n)
if(pst[k]>MKEY())pst[k]=MKEY()
renderPage()
return}if(ds.bf){pst.bf=ds.bf
renderPage()
return}if(ds.tpf){pst.tp=ds.tpf
renderPage()
return}if(ds.rday){const d=new Date(pst.rdate||today())
d.setDate(d.getDate()+ +ds.rday)
pst.rdate=iso(d)>today()?today():iso(d)
renderPage()
return}if(ds.cashopen!==undefined){openCashOpen()
return}if(ds.savecash!==undefined){const f=$("#coForm").elements
put({...S.cfg||{},kind:"settings",id:"cfg",cashOpen:{cash:num(f.namedItem("cash").value),bank:num(f.namedItem("bank").value)}})
toast("Save ✓")
closeSheet()
return}if(ds.addexp!==undefined){openExpense()
return}if(ds.exp){openExpense(ds.exp)
return}if(ds.xcat){expCat=ds.xcat
document.querySelectorAll("[data-xcat]").forEach(b=>b.classList.toggle("on",b===el))
return}if(ds.xmode){expMode=ds.xmode
document.querySelectorAll("[data-xmode]").forEach(b=>b.classList.toggle("on",b===el))
return}if(ds.saveexp!==undefined){saveExpense()
return}if(ds.delexp!==undefined){arm(el,()=>{const t=S.txns[expId]
if(t)remove(t)
toast("Kharcha delete")
closeSheet()})
return}if(ds.eq){const t=today()
let f=t.slice(0,8)+"01",to=t
if(ds.eq==="lm"){const k=mshift(MKEY(),-1)
f=k+"-01"
to=iso(new Date(+k.slice(0,4),+k.slice(5),0))}if(ds.eq==="y")f=t.slice(0,4)+"-01-01"
if(ds.eq==="all")f="2000-01-01"
pst.ef=f
pst.et=to
renderPage()
return}if(ds.exdl!==undefined||ds.excp!==undefined){const f=$("#ef").value,t=$("#et").value
const data=csvRange(f,t)
if(ds.excp!==undefined){copyText(data,"CSV copy ✓")
return}downloadBlob(new Blob(["\ufeff"+data],{type:"text/csv;charset=utf-8"}),`Hisab-${f}-to-${t}.csv`)
toast("✓ File download ho gayi")
return}if(ds.setpin!==undefined){const a=$("#pin1").value,b=$("#pin2").value
if(!/^\d{4}$/.test(a)){toast("4 number ka PIN daalo")
return}if(a!==b){toast("Dono PIN alag he")
return}put({...S.cfg||{},kind:"settings",id:"cfg",pinH:await pinHash(a)})
unlocked=true
toast("🔒 PIN lag gaya")
return}if(ds.offpin!==undefined){const c={...S.cfg||{},kind:"settings",id:"cfg"}
delete c.pinH
put(c)
toast("PIN hata diya")
return}if(ds.restore){const b=S.bin[ds.restore]
if(b){put(b.item)
delDoc(b)
toast("↺ Wapas aa gaya")}return}if(ds.purge){arm(el,()=>{const b=S.bin[ds.purge]
if(b)delDoc(b)
toast("Hamesha ke liye delete")})
return}})
document.addEventListener("change",e=>{if(e.target.id==="rdate"&&e.target.value){pst.rdate=e.target.value>today()?today():e.target.value
renderPage()}if(e.target.id==="ef"){pst.ef=e.target.value
renderPage()}if(e.target.id==="et"){pst.et=e.target.value
renderPage()}})
function arm(el,fn){if(!el.classList.contains("arm")){el.classList.add("arm")
el.textContent="Pakka?"
setTimeout(()=>{el.classList.remove("arm")
el.textContent="Delete"},2500)
return}fn()}document.addEventListener("click",e=>{if(e.target.id==="rstBtn"){restore()
return}const el=e.target.closest("[data-tab],[data-close],[data-new],[data-payorder],[data-tx],[data-party],[data-addparty],[data-hf],[data-hp],[data-pf],[data-et],[data-edtot],[data-tempotog],[data-mode],[data-by],[data-oid],[data-save],[data-deltx],[data-pentry],[data-editp],[data-receipt],[data-billtx],[data-rmode],[data-rsave],[data-rcopyimg],[data-rcopytxt],[data-savebiz],[data-ptab],[data-pt],[data-dir],[data-savep],[data-delp],[data-act]")
if(!el)return
const ds=el.dataset
if(ds.close!==undefined){if(sheetMode&&sheetMode.type==="receipt"){if(rState.backTx){openEntry({id:rState.backTx,back:rState.back})
return}if(rState.back){openParty(rState.back)
return}}if(sheetMode&&(sheetMode.type==="entry"||sheetMode.type==="pform")&&backTo){openParty(backTo)
backTo=null
return}closeSheet()
return}if(ds.tab){ui.tab=ds.tab
$("#view").dataset.v=""
render()
window.scrollTo(0,0)
return}if(ds.new){openEntry({t:ds.new})
return}if(ds.payorder){e.stopPropagation()
const o=S.txns[ds.payorder]
const pid=sheetMode.id
openEntry({t:o.party===pid&&o.t==="sell"?"in":"out",party:pid,back:pid,orders:[o.id]})
toggleOrder(o.id)
toggleOrder(o.id)
return}if(ds.tx){openEntry({id:ds.tx,back:sheetMode&&sheetMode.type==="party"?sheetMode.id:null})
return}if(ds.party){ui.ptab="orders"
openParty(ds.party)
return}if(ds.addparty!==undefined){openPartyForm(null,ui.pf!=="all"?ui.pf:"buyer")
return}if(ds.hf){ui.hf=ds.hf
document.querySelectorAll("[data-hf]").forEach(b=>b.classList.toggle("on",b===el))
renderHist()
return}if(ds.hp){ui.hp=ds.hp
document.querySelectorAll("[data-hp]").forEach(b=>b.classList.toggle("on",b===el))
renderHist()
return}if(ds.pf){ui.pf=ds.pf
document.querySelectorAll("[data-pf]").forEach(b=>b.classList.toggle("on",b===el))
renderParties()
return}if(ds.et){setEntryType(ds.et)
return}if(ds.edtot!==undefined){$("#totIn").hidden=false
const i=F("gamt")
i.focus()
return}if(ds.tempotog!==undefined){el.hidden=true
$("#tempoBox").hidden=false
$("#tempoBox .pick input").focus()
return}if(ds.mode){document.querySelectorAll("#eMode button").forEach(b=>b.classList.toggle("on",b===el))
return}if(ds.by){const seg=el.closest("[data-byseg]")
seg.querySelectorAll("button").forEach(b=>b.classList.toggle("on",b===el))
F(seg.dataset.byseg).value=ds.by
entrySummary()
return}if(ds.oid){toggleOrder(ds.oid)
return}if(ds.save){saveEntry(ds.save==="again")
return}if(ds.deltx!==undefined){arm(el,()=>{const t=S.txns[editId]
if(t)remove(t)
toast("Entry delete ho gayi")
if(backTo)openParty(backTo)
else closeSheet()})
return}if(ds.pentry){openEntry({t:ds.pentry,party:sheetMode.id,back:sheetMode.id})
return}if(ds.editp!==undefined){backTo=sheetMode.id
openPartyForm(sheetMode.id)
return}if(ds.receipt!==undefined){openReceipt({party:sheetMode.id,mode:"due",back:sheetMode.id})
return}if(ds.billtx!==undefined){openReceipt({order:editId,back:backTo,backTx:editId})
return}if(ds.rmode){openReceipt({...rState,mode:ds.rmode})
return}if(ds.rsave!==undefined){saveImg()
return}if(ds.rcopytxt!==undefined){copyText(rState.text,"Text copy ✓ — WhatsApp pe paste karo")
return}if(ds.act==="biz"){openBiz()
return}if(ds.savebiz!==undefined){const f=$("#bForm").elements
put({kind:"settings",id:"cfg",biz:f.namedItem("biz").value.trim(),bphone:f.namedItem("bphone").value.trim(),bcity:f.namedItem("bcity").value.trim()})
toast("Save ✓")
closeSheet()
return}if(ds.ptab){ui.ptab=ds.ptab
openParty(sheetMode.id,true)
return}if(ds.pt){pfType=ds.pt
document.querySelectorAll("#pType button").forEach(b=>b.classList.toggle("on",b===el))
$("#pRateLbl").textContent=pfType==="tempo"?"Bhada ₹ per trip (fix ho to)":"Bhav ₹/Ton (iska rate)"
return}if(ds.dir){pfDir=+ds.dir
document.querySelectorAll("#pDir button").forEach(b=>b.classList.toggle("on",b===el))
return}if(ds.savep!==undefined){saveParty(ds.savep||null)
return}if(ds.delp){arm(el,()=>{const p=S.parties[ds.delp]
if(p)remove(p)
toast("Party delete")
closeSheet()})
return}if(ds.act==="csv"){copyText(csv(),"CSV copy ✓ — Excel me paste karo")
return}if(ds.act==="backup"){copyText(JSON.stringify({app:"coal-hisab",v:1,parties:S.parties,txns:S.txns,cfg:S.cfg}),"Backup copy ✓")
return}if(ds.act==="restore"){openSheet(`${title("Backup restore")}<textarea id="rst" placeholder="Backup text yahan paste karo"></textarea><div class="actions"><button class="btn" id="rstBtn">Restore karo</button></div>`,{type:"restore"})
return}})
function restore(){try{const j=JSON.parse($("#rst").value)
let n=0
Object.values(j.parties||{}).forEach(p=>{if(p&&p.kind==="party"&&p.id){S.parties[p.id]=p
queue(p.id,p)
n++}})
Object.values(j.txns||{}).forEach(t=>{if(t&&t.kind==="txn"&&t.id){S.txns[t.id]=t
queue(t.id,t)
n++}})
saveLocal()
render()
toast(n+" cheezein restore ✓")
closeSheet()}catch(err){toast("Backup text sahi nahi he")}}$("#fab").addEventListener("click",()=>openEntry({t:"sell"}))
document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(!$("#drawer").hidden)toggleDrawer(false)
else if(!$("#sheet").hidden)closeSheet()}})
function toggleDrawer(on){const d=$("#drawer")
if(on){renderDrawer()
d.hidden=false
requestAnimationFrame(()=>d.classList.add("open"))}else{d.classList.remove("open")
setTimeout(()=>d.hidden=true,220)}}$("#hamBtn").addEventListener("click",()=>toggleDrawer(true))
$("#drawer").addEventListener("click",e=>{if(e.target.closest("[data-dclose]"))toggleDrawer(false)})
document.addEventListener("input",e=>{const t=e.target
if(t.id==="hq"){ui.hq=t.value
renderHist()
return}if(t.id==="hpsel"){ui.hp=t.value
renderHist()
return}if(t.id==="pq"){ui.pq=t.value
renderParties()
return}const pk=t.closest(".pick")
if(pk){pk.dataset.id=""
showSug(pk)
if(pk.dataset.k==="party"){allocSel.clear()
renderAlloc()}entrySummary()
return}if(t.form&&t.form.id==="eForm"){if(t.name==="gamt"||t.name==="pamt"){if(t.value)t.dataset.man="1"
else delete t.dataset.man}if(t.name==="pamt")allocInfo()
if(t.name==="date")$("#dayHint").textContent=dlabel(t.value)
updCalc()}})
document.addEventListener("change",e=>{if(e.target.name==="date"&&$("#dayHint"))$("#dayHint").textContent=dlabel(e.target.value)
if(e.target.name==="unit")updCalc()})
document.addEventListener("focusin",e=>{const pk=e.target.closest&&e.target.closest(".pick")
if(pk)showSug(pk)})
document.addEventListener("focusout",e=>{const pk=e.target.closest&&e.target.closest(".pick")
if(pk)setTimeout(()=>{pk.querySelector(".sug").classList.remove("show")
if(pk.dataset.k==="party")renderAlloc()},150)})
document.addEventListener("pointerdown",e=>{const s=e.target.closest(".sug [data-pid],.sug [data-newname]")
if(!s)return
e.preventDefault()
const pk=s.closest(".pick")
const inp=pk.querySelector("input")
if(s.dataset.pid){const p=S.parties[s.dataset.pid]
inp.value=p.name
pk.dataset.id=p.id}else pk.dataset.id=resolvePick(pk,pickType(pk))
pk.querySelector(".sug").classList.remove("show")
if(pk.dataset.k==="party"){allocSel.clear()
renderAlloc()}fillFromParty(pk)
entrySummary()
if(pk.dataset.k==="party"&&isGoods(entryType))setTimeout(()=>F("qty").focus(),50)})
window.addEventListener("offline",()=>{setSync("Offline — data phone me save ho raha he","warn")
toast("📴 Net chala gaya — entries phone me save hongi")})
window.addEventListener("online",()=>{setSync("Sync ho raha he…","warn")
toast("📶 Net aa gaya — sync ho raha he")})
render()
setTimeout(connect,0)

;(function(){const vv=window.visualViewport;if(!vv)return
const upd=()=>{const kb=Math.max(0,window.innerHeight-vv.height-vv.offsetTop)
document.documentElement.style.setProperty("--kb",kb+"px")
document.documentElement.style.setProperty("--vvh",vv.height+"px")}
vv.addEventListener("resize",upd)
vv.addEventListener("scroll",upd)
upd()})()
document.addEventListener("focusin",e=>{const t=e.target
if(!t.matches||!t.matches(".sheet input,.sheet select,.sheet textarea"))return
setTimeout(()=>{try{t.scrollIntoView({block:"center",behavior:"smooth"})}catch(err){}},320)})

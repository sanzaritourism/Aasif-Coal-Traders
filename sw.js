const C='coal-v2';
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(['/','/app.js','/app.css','/fb.js','/manifest.webmanifest','/icon-192.png','/icon.svg'])))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
  const ok=u.origin===location.origin||u.hostname==='www.gstatic.com'||u.hostname.endsWith('fonts.googleapis.com')||u.hostname.endsWith('fonts.gstatic.com');
  if(!ok||u.pathname.startsWith('/__'))return;
  e.respondWith(fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp))}return res}).catch(()=>caches.match(r).then(m=>m||(r.mode==='navigate'?caches.match('/'):undefined))))});

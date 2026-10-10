// Nido: guarda la app para abrirla sin conexión. Los datos van en el navegador, no aquí.
const C="nido-v5";
const FILES=["./","./index.html","./styles.css","./app.js","./manifest.webmanifest","./icon-192.png","./icon-512.png","./apple-touch-icon.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(FILES)));self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim();});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET") return;
  const mismo=new URL(e.request.url).origin===location.origin;
  e.respondWith((mismo?fetch(e.request.url,{cache:"no-cache",credentials:"same-origin"}):fetch(e.request)).then(r=>{ if(r.ok&&new URL(e.request.url).origin===location.origin){const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));} return r; }).catch(()=>caches.match(e.request).then(r=>r||caches.match("./index.html"))));
});

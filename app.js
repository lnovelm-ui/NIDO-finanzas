// ===== Categorizador (compartido entre la página y las pruebas en node) =====
const CATS = {
  "Nómina":                   {k:"ing",  c:"#0e9f6e", e:"💼"},
  "Aportación Cisco":         {k:"ing",  c:"#10b981", e:"🤝"},
  "Otros ingresos":           {k:"ing",  c:"#34d399", e:"💶"},
  "Ingreso extraordinario":   {k:"ingx", c:"#5bd6a6", e:"🎁"},
  "Hucha Guille":             {k:"aho",  c:"#ec4899", e:"🐷"},
  "Cuenta Laura":             {k:"aho",  c:"#8b5cf6", e:"👛"},
  "Hucha viajes":             {k:"aho",  c:"#06b6d4", e:"✈️"},
  "Inversión":                {k:"aho",  c:"#2f6fed", e:"📈"},
  "Traspaso a cuenta propia": {k:"aho",  c:"#94a3b8", e:"🔁"},
  "Colegio y Guille":         {k:"fijo", c:"#f59e0b", e:"🎒"},
  "Telefonía e internet":     {k:"fijo", c:"#3b82f6", e:"📱"},
  "Luz y agua":               {k:"fijo", c:"#eab308", e:"💡"},
  "Comunidades":              {k:"fijo", c:"#64748b", e:"🏢"},
  "Impuestos y tasas":        {k:"fijo", c:"#6366f1", e:"🏛️"},
  "Pilates":                  {k:"fijo", c:"#d946ef", e:"🧘"},
  "Actividades de Guille":    {k:"fijo", c:"#84cc16", e:"🎾"},
  "Limpieza del hogar":       {k:"fijo", c:"#14b8a6", e:"🧹"},
  "Suscripciones":            {k:"fijo", c:"#a855f7", e:"📺"},
  "Supermercado":             {k:"var",  c:"#22c55e", e:"🛒"},
  "Restaurantes y cafés":     {k:"var",  c:"#f97316", e:"☕"},
  "Combustible y coche":      {k:"var",  c:"#ef4444", e:"⛽"},
  "Farmacia y salud":         {k:"var",  c:"#06b6d4", e:"💊"},
  "Compras online":           {k:"var",  c:"#c026d3", e:"📦"},
  "Ropa y cuidado personal":  {k:"var",  c:"#f472b6", e:"👗"},
  "Ocio":                     {k:"var",  c:"#0ea5e9", e:"🎡"},
  "Efectivo":                 {k:"var",  c:"#78716c", e:"💵"},
  "Bizum a personas":         {k:"var",  c:"#0891b2", e:"📲"},
  "Tabaco":                   {k:"ext",  c:"#57534e", e:"🚭"},
  "PayPal (varios)":          {k:"var",  c:"#1d4ed8", e:"💳"},
  "Otros gastos":             {k:"var",  c:"#a8a29e", e:"🧾"},
  "Seguros":                  {k:"anual",c:"#4f46e5", e:"🛡️"},
  "Coche (mantenimiento)":    {k:"anual",c:"#b91c1c", e:"🔧"},
  "Cuotas anuales":           {k:"anual",c:"#7c3aed", e:"📅"},
  "Viajes":                   {k:"ext",  c:"#e11d48", e:"🧳"},
  "Comunión Guille":          {k:"ext",  c:"#fbbf24", e:"🕊️"},
  "Extraordinario":           {k:"ext",  c:"#db2777", e:"✨"},
};
const KINDS = {ing:"Ingreso", ingx:"Ingreso extraordinario", aho:"Ahorro / traspaso", fijo:"Fijo mensual", var:"Variable", anual:"Periódico (provisionar)", ext:"Extraordinario"};

function limpiar(raw){
  const parts = String(raw).split(/\s*\|\s*|\n/).map(s=>s.trim()).filter(Boolean);
  const head = parts[0]||"";
  let rest = parts.slice(1).join(" ");
  if (/^OP\.TARJ|^DEVOL\.OP\.TARJ|^CANCELACION OP\.TARJ/.test(head)) {
    let m = rest.replace(/^\d{6}\*+\d{4}\s+/,"").replace(/\s{2,}\d{6,}\s*$/,"").replace(/\s+\d{6,}$/,"").trim();
    return (head.startsWith("OP")?"":head.startsWith("DEVOL")?"Devolución · ":"Cancelación · ") + m;
  }
  if (/^RECIBO/.test(head)) return "Recibo · " + head.replace(/^RECIBO\s+/,"").replace(/\s+-\s+FYN\d+$/,"");
  if (/^BIZUM ENVIADO/.test(head)) return "Bizum a " + rest.replace(/^:\s*\d+\s+/,"").replace(/\s+\d{10,}$/,"").trim();
  if (/^BIZUM RECIBIDO/.test(head)) return "Bizum de " + rest.replace(/^:\s*\d+\s+/,"").replace(/\s+\d{10,}$/,"").trim();
  if (/^COMPRA BIZUM/.test(head)) return "Compra Bizum · " + rest.replace(/^:\s*\d+\s+/,"").replace(/\s+\d{10,}$/,"").trim();
  if (/^REINTEGRO CAJERO/.test(head)) return "Retirada de efectivo";
  if (/^NOMINA/.test(head)) return "Nómina " + (rest.match(/EULEN[^|]*/)||[""])[0].trim();
  if (/^TRASPASO/.test(head)) { const note = rest.replace(/ES\d{22}/,"").trim(); return "Traspaso" + (note? " · " + note : ""); }
  if (/^S\/ORD\.TRASPASO/.test(head)) return "Traspaso a " + (rest.replace(/BENEF:\s*/,"").trim());
  if (/^S\/ORD\.TRANSFERENCIA/.test(head)) return "Transferencia · " + head.replace(/^S\/ORD\.TRANSFERENCIA\s*/,"");
  if (/^COMIS\.COMPRA EXTRANJERO/.test(head)) return "Comisión compra en el extranjero";
  if (/^TRANSFERENCIA RECIBIDA/.test(head)) return "Transferencia recibida · " + rest.replace(/^TRANSFERENCIA\s+/,"").replace(/PAGO A PROVEEDORES\s+/,"").trim();
  return (head + (rest? " · " + rest : "")).replace(/\s{2,}/g," ");
}

// Reglas: [regex sobre concepto original en mayúsculas, categoría, condición opcional (importe)]
const RULES = [
  [/^NOMINA/, "Nómina"],
  [/HERENCIA/, "Ingreso extraordinario"],
  [/DEVOLUCION DE INGRESOS|TESORERI/, "Ingreso extraordinario"],
  [/INGRESO EFECTIVO.*COMUNION/, "Ingreso extraordinario"],
  [/^TRASPASO.*(VUELOS NYC|\bVIAJE\b|REVISION VOLVO)/, "Ingreso extraordinario", a=>a>0],
  [/^TRASPASO.*REGALITOS COMUNI/, "Comunión Guille"],
  [/^TRASPASO.*AHORRO GUILLERMO|S\/ORD\.TRASPASO 9910592825/, "Hucha Guille"],
  [/^TRASPASO.*\| *LAURA\s*$|S\/ORD\.TRASPASO 9911325622|TRANSFERENCIA TRASPASO LAURA/, "Cuenta Laura"],
  [/VIAJES FUTUROS/, "Hucha viajes"],
  [/S\/ORD\.TRANSFERENCIA INVERSIONES/, "Inversión"],
  [/S\/ORD\.TRANSFERENCIA VIAJE\b/, "Viajes"],
  [/^TRASPASO/, "Aportación Cisco", a=>a>0],
  [/^TRASPASO/, "Traspaso a cuenta propia", a=>a<0],
  [/^TRSF\.DE|TRANSF\. INMEDIATA RECIBIDA/, "Otros ingresos"],
  [/PAGO A PROVEEDORES/, "Otros ingresos"],
  [/REMUNERACI.N CAPITAL|IMPUESTO DE RENTAS DE CAPITAL|ABONO CANC\.CTA/, "Otros ingresos"],
  [/INGRESO EFECTIVO/, "Otros ingresos"],
  [/COLEGIO DE LA ASUNCION|GRUPO EDUCATIVO ASUNCION|AMPA COLEGIO|AUTOBUS|GUILLE(RMO)? DIAZ|ASUNTILLOS|JOSEFINA ALDECOA|SUDADERA/, "Colegio y Guille"],
  [/TELEFONICA/, "Telefonía e internet"],
  [/ENDESA|GANA ENERGIA|HIDRALIA/, "Luz y agua"],
  [/CDAD/, "Comunidades"],
  [/PATRONATO|AYUNTAMIENTO/, "Impuestos y tasas"],
  [/OCCIDENT|HELVETIA|SENASSUR|CAJAMAR SEGUROS/, "Seguros"],
  [/ARCHICOFRADIA/, "Cuotas anuales"],
  [/CASA DIOCESANA/, "Comunión Guille"],
  [/MEFIEM/, "Pilates"],
  // viajes: comercios y comisiones fuera de España
  [/NEW YORK|NYC|GOCITY|NUEVAYORK|BUDAPEST|SAILY|EIVISSA|IBIZA|FORMENTERA|SA CREU|HOTEL CARIBE|CAMPING|PRADILLO|ZAHARA|VUELING|AEROPUERTO|COMIS\.COMPRA EXTRANJERO|RAPID EROSKI|TAXI ESTACIONAL|TAXI 1043|TAXI NUM 10|SOUVENIR|^OP\.TARJ.*\bOLGA\b|PARKING PICASSO MALAGA|ROOM MATE/, "Viajes"],
  [/VYPSA/, "Coche (mantenimiento)"],
  [/CLAUDE\.AI SUBSCRIPTION|AMAZON PRIME\*CC8J/, "Cuotas anuales"],
  [/OPENAI|ANTHROPIC|APPLE\.COM|GOOGLE.*PLAY|SAVE ?FAMILY|SAVEFAMILY|PRIME VIDEO|AMAZON PRIME/, "Suscripciones"],
  [/^RECIBO PAYPAL/, "Suscripciones", a=>Math.round(-a*100)/100===11.99],
  [/^RECIBO PAYPAL/, "Viajes", a=>Math.round(-a*100)/100===1382.54],
  [/^RECIBO PAYPAL|^TRANSFERENCIA RECIBIDA.*PAYPAL/, "PayPal (varios)"],
  [/MERCADONA|CARREF|EROSKI|SUPER ?ESTRELLA|SUPERMERCADOS|LA CANASTA|DUNNES|CASH RINCON|PANADERIA|SUPERESTRELLA|LOS PASTORES|IBERICOS/, "Supermercado"],
  [/^ADEUDO.*MERCADONA|^ABONO\b.*BENAGA/, "Supermercado"],
  [/TAMOIL|E\.S\.|ES SANTA|ES EL CARMEN|ES MOLANDRI|ESTAC SERVICIO|GUEROIL|ECONOIL|PLENERGY|E S ALCAMPO|VISANTE|CEPSA|AUTOPISTA|PARKING|PARKIA|APARCAM|SMASSA|M LAGA - EL VISO|26064 MALAGA JAEN|LICENCIA 1082|TAXI/, "Combustible y coche"],
  [/FARMACIA|ORIGENES FARMACIA|MP EYEWEAR/, "Farmacia y salud"],
  [/ESTANCO|EXPENDEDURIA/, "Tabaco"],
  [/AMAZON|ALIEXPRESS|MIRAVIA|ZARA INTERNET|ZARA\.COM/, "Compras online"],
  [/EL CORTE INGLES|ZARA|PRIMOR|WOMENS SECRETS|PELUQUERIA|KB NAILS|CALZEDONIA|PARFOIS|MAYORAL|DECATHLON|PRIMARK|MARTONELLA|DNI\/PASAPORTE/, "Ropa y cuidado personal"],
  [/REINTEGRO CAJERO/, "Efectivo"],
  [/BIZUM RECIBIDO/, "Otros ingresos"],
  [/BIZUM ENVIADO.*GUILLERMO L\./, "Actividades de Guille"],
  [/BIZUM ENVIADO.*ALVARO P\. P\./, "Actividades de Guille"],
  [/BIZUM ENVIADO.*ROSA MARIA G\. F\./, "Limpieza del hogar"],
  [/BIZUM ENVIADO/, "Bizum a personas"],
  [/AQUAVELIS|SOUL GAMES|SOULD PARK|QUICKETS|FUSION MALAGA|TENNESSEE|FNAC|LA FABRICA DEL EJERCICIO|ALLIANCE VENDING|FLORISTERIA|COPYCAT|PLIM|PINTURAS|SECOSHOP|LATIGO|NEW BE|MGI/, "Ocio"],
  [/^OP\.TARJ|DEVOL\.OP\.TARJ|ABONO COMERCIO|CANCELACION OP\.TARJ/, "Restaurantes y cafés"],
];

// marcas puntuales que no se pueden deducir por comercio (comunión, abril)
function ajustesPuntuales(m){
  const C = m.raw.toUpperCase();
  if (m.f>="2026-04-11" && m.f<="2026-04-20" && /BIZUM RECIBIDO/.test(C)) return "Ingreso extraordinario";
  if (/CAROLINA R\. N\.|MANUEL ANTONIO M\. N\./.test(C)) return "Comunión Guille";
  if (/LA CALMA BEACH|TRATTORIA LORENZO/.test(C)) return "Extraordinario";
  if (/SP SAVE FAMILY/.test(C) && m.i<-100) return "Extraordinario";
  if (/DESARROLLO WEB/.test(C)) return "Traspaso a cuenta propia";
  if (/^RECIBO PAYPAL/.test(C) && Math.round(-m.i*100)===138254) return "Viajes";
  if (/^TRASPASO.*ES4830580811522720016518/.test(C)) return "Aportación Cisco";
  return null;
}

function categorizar(m, userRules){
  const C = m.raw.toUpperCase();
  if (userRules) for (const r of userRules){ try{ if (C.includes(r.t.toUpperCase())) return r.cat; }catch(e){} }
  const p = ajustesPuntuales(m); if (p) return p;
  for (const [re,cat,cond] of RULES){ if (re.test(C) && (!cond || cond(m.i))) return cat; }
  return m.i>0 ? "Otros ingresos" : "Otros gastos";
}

if (typeof module !== "undefined") module.exports = {CATS,KINDS,limpiar,categorizar};
// ===== Nido =====
const $ = s => document.querySelector(s);
const F0 = new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR",maximumFractionDigits:0,useGrouping:"always"});
const F2 = new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR",minimumFractionDigits:2,maximumFractionDigits:2,useGrouping:"always"});
const e0 = n => F0.format(Math.round(n||0));
const e2 = n => F2.format(n||0);
const esc = s => String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const MES=["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
const MESL=["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const mLabel = ym => MES[+ym.slice(5)-1];
const mLong = ym => MESL[+ym.slice(5)-1]+" "+ym.slice(0,4);
const hoyYM = () => { const d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0"); };
const kindOf = c => (CATS[c]||{k:"var"}).k;
const colOf = c => (CATS[c]||{c:"#999"}).c;
const emOf = c => (CATS[c]||{e:"🧾"}).e;
const cic = (c,cls="") => `<span class="cic ${cls}" style="background:${colOf(c)}24" aria-hidden="true">${emOf(c)}</span>`;
const tic = (e,bg) => `<div class="ti" style="background:${bg}" aria-hidden="true">${e}</div>`;
const CAT_ORDER = Object.keys(CATS);
const numTxt = v => (Math.round((+v||0)*100)/100).toString().replace(".",",");
const parseNum = s => { s=String(s||"").trim().replace(/\s|€/g,""); if(s.includes(",")) s=s.replace(/\./g,"").replace(",","."); const n=parseFloat(s); return isNaN(n)?0:n; };
const COL={fijoHero:"#2dd4bf",fijo:"var(--mint)",anual:"var(--plum)",var:"var(--sun)",aho:"var(--sea)",ext:"var(--coral)",libre:"#ffffff",ahoHero:"#34d399",anualHero:"#a78bfa",varHero:"#f5c451"};

const S={db:null,meses:{},plan:null,metas:null,alto:null,tab:"inicio",mesSel:null,f:{q:"",cat:"",mes:"",kind:""},imp:null,ready:{meses:false,plan:false,metas:false,alto:false},writable:true};
try{ const t=localStorage.getItem("dino_tab"); if(t) S.tab=t; }catch(e){}

// ---------- cálculos ----------
const mesesOrden = () => Object.keys(S.meses).sort();
function mesesCerrados(){ const h=hoyYM(); const c=mesesOrden().filter(m=>m<h); return c.length?c:mesesOrden(); }
function mediaCat(){ const ms=mesesCerrados(), n=ms.length||1, r={}; for(const m of ms){ for(const x of S.meses[m].movs) r[x.cat]=(r[x.cat]||0)-x.i; r["Efectivo"]=(r["Efectivo"]||0)-movidoEfectivo(m); } for(const c in r) r[c]/=n; return r; }
const FREC={mensual:"cada mes",curso:"cada mes, sep–jun",octmay:"cada mes, oct–may",semanal:"cada semana, sep–jun",bimestral:"cada dos meses",plazos:"5 plazos, feb–jun",trimestral:"cada tres meses"};
const costeMes = f => { const v=+f.importe||0; return f.frec==="semanal"? v*52/12 : f.frec==="bimestral"? v/2 : f.frec==="trimestral"? v/3 : f.frec==="plazos"? v*5/12 : f.frec==="octmay"? v*8/12 : v; };
// meses en los que toca pagar cada fijo
const toca=(f,nm)=>f.frec==="curso"||f.frec==="semanal"?(nm>=9||nm<=6):f.frec==="octmay"?(nm>=10||nm<=5):true;
const esperadoMes=(f,nm)=>!toca(f,nm)?0:f.frec==="semanal"?(+f.importe||0)*52/12:(f.frec==="mensual"||f.frec==="curso"||f.frec==="octmay"||!f.frec)?(+f.importe||0):0;
const pagaEfectivo=f=>!!f.ef||!f.match;
// parte de un fijo que no se ha pagado por el banco ese mes: se da por pagada con el efectivo retirado
const enEfectivo=(f,m)=>{ if(!pagaEfectivo(f)) return 0; const esp=esperadoMes(f,+m.slice(5)); const banco=cargos(f,m).reduce((s,c)=>s+c.a,0); return Math.max(0,esp-banco); };
function movidoEfectivo(m){ if(!S.meses[m]) return 0; const sacado=S.meses[m].movs.filter(x=>x.cat==="Efectivo").reduce((s,x)=>s-x.i,0); const cub=(S.plan.fijos||[]).reduce((s,f)=>s+enEfectivo(f,m),0); return Math.max(0,Math.min(sacado,cub)); }
// gasto de los fijos en el último mes con cargos (suma todos los recibos de ese mes)
function ultimoCobro(f){ const cs=cargos(f); if(!cs.length) return null; const m=cs[cs.length-1].f.slice(0,7); const del=cs.filter(c=>c.f.startsWith(m)); return {f:del[del.length-1].f,a:del.reduce((s,c)=>s+c.a,0)}; }
function cargos(f, soloMes){
  if(!f.match) return []; const M=f.match.toUpperCase(); const out=[];
  for(const m of mesesOrden()){ if(soloMes&&m!==soloMes) continue; for(const x of S.meses[m].movs){ const a=-x.i; const kk=kindOf(x.cat); if(kk==="ext"||kk==="ingx") continue; if(x.i<0&&x.c.toUpperCase().includes(M)&&(f.min==null||a>=f.min)&&(f.max==null||a<=f.max)) out.push({f:x.f,a}); } }
  return out.sort((p,q)=>p.f.localeCompare(q.f));
}
function recibosAuto(){
  const g={}, ocul=S.plan.recibosOcultos||{}, ovr=S.plan.recibosImporte||{};
  for(const m of mesesOrden()) for(const x of S.meses[m].movs){ if(kindOf(x.cat)==="anual"&&x.i<0){ const o=(g[x.c]??={c:x.c,cat:x.cat,det:0,meses:[]}); o.det+=-x.i; o.meses.push(+m.slice(5)); } }
  return Object.values(g).filter(o=>!ocul[o.c]).map(o=>({...o,importe: ovr[o.c]!=null? +ovr[o.c] : o.det}));
}
// La nómina que entra a partir del día 25 es la del mes siguiente
const sigMes=ym=>{ let [y,m]=ym.split("-").map(Number); m++; if(m>12){m=1;y++;} return y+"-"+String(m).padStart(2,"0"); };
const mesImputado=x=>x.cat==="Nómina"&&+x.f.slice(8)>=25?sigMes(x.f.slice(0,7)):x.f.slice(0,7);
function ingresosMes(m){ let t=0; for(const mm of [m, ...mesesOrden().filter(z=>sigMes(z)===m)]) for(const x of (S.meses[mm]||{movs:[]}).movs) if(kindOf(x.cat)==="ing"&&mesImputado(x)===m) t+=x.i; return t; }
const presMes=(c,nm)=>(+(S.plan.presupuesto||{})[c]||0);
function totales(){
  const p=S.plan, b=p.presupuesto||{};
  const ingresos=(+p.nomina||0)+(+p.cisco||0);
  const huchas=(p.huchas||[]).reduce((s,h)=>s+(+h.v||0),0);
  const fijos=(p.fijos||[]).reduce((s,f)=>s+costeMes(f),0);
  const anual=(recibosAuto().reduce((s,r)=>s+r.importe,0)+(p.recibosManuales||[]).reduce((s,r)=>s+(+r.importe||0),0))/12;
  const variable=CAT_ORDER.filter(c=>kindOf(c)==="var").reduce((s,c)=>s+(+b[c]||0),0);
  const margen=ingresos-huchas-fijos-anual-variable;
  const r=mediaCat(); const varReal=Math.max(0,CAT_ORDER.filter(c=>kindOf(c)==="var").reduce((s,c)=>s+(r[c]||0),0));
  return {ingresos,huchas,fijos,anual,variable,margen,varReal,margenReal:ingresos-huchas-fijos-anual-varReal};
}

// ---------- guardado ----------
let tPlan=null,tMetas=null;
// Los cambios quedan pendientes hasta pulsar «Guardar»; «Descartar» vuelve a lo último guardado.
S.dirty=new Set();
const DOCS={"config/plan":"plan","config/metas":"metas","config/altovelo":"alto"};
const docData=p=>p.startsWith("meses/")?S.meses[p.slice(6)]:S[DOCS[p]];
const ETQ=p=>p==="config/plan"?"Presupuesto":p==="config/metas"?"Metas de ahorro":p==="config/altovelo"?"Altovelo":p.startsWith("meses/")?"Movimientos de "+mLong(p.slice(6)):p;
function marcar(p){ S.dirty.add(p); pintarBarra(); }
function guardarPlan(){ marcar("config/plan"); }
function guardarMetas(){ marcar("config/metas"); }
function guardarAlto(){ marcar("config/altovelo"); }
async function guardarMes(m){ marcar("meses/"+m); }
async function guardarYa(p){ if(!S.db) return; try{ await S.db.doc(p).set(JSON.parse(JSON.stringify(docData(p)))); }catch(e){ errW(e); } }
async function guardarCambios(){
  if(!S.db||!S.dirty.size) return;
  const antes={}, st=S.db.dump(); const paths=[...S.dirty];
  for(const p of paths) antes[p]=st[p]===undefined?null:st[p];
  setStatus("Guardando…");
  try{ for(const p of paths) await S.db.doc(p).set(JSON.parse(JSON.stringify(docData(p)))); }catch(e){ errW(e); return; }
  S.dirty.clear(); S.ultimo={paths,antes}; await apuntarHistorial(paths,antes,"Cambios guardados");
  setStatus("Guardado"); pintarBarra(); toast("Cambios guardados",true);
}
function descartarCambios(){
  const st=S.db.dump();
  for(const p of S.dirty){ const d=st[p]===undefined?null:JSON.parse(JSON.stringify(st[p])); if(p.startsWith("meses/")){ if(d) S.meses[p.slice(6)]=d; else delete S.meses[p.slice(6)]; } else S[DOCS[p]]=d||S[DOCS[p]]; }
  S.dirty.clear(); S.catAplicar=null; pintarBarra(); render(); toast("Cambios descartados");
}
async function restaurar(paths,antes,motivo){
  const st=S.db.dump(), ahora={};
  for(const p of paths) ahora[p]=st[p]===undefined?null:st[p];
  for(const p of paths){ if(antes[p]!=null) await S.db.doc(p).set(antes[p]); }
  await apuntarHistorial(paths,ahora,motivo);
}
async function deshacerUltimo(){ if(!S.ultimo) return; const u=S.ultimo; S.ultimo=null; await restaurar(u.paths,u.antes,"Deshacer"); toast("Cambio deshecho"); }
async function apuntarHistorial(paths,antes,motivo){
  try{ const st=S.db.dump(); const h=st["config/historial"]||{items:[]}; const items=[{t:new Date().toISOString(),u:S.user||"",motivo,paths,antes},...(h.items||[])].slice(0,12); await S.db.doc("config/historial").set({items}); }catch(e){}
}
function pintarBarra(){
  let b=document.getElementById("savebar");
  if(!S.dirty.size){ if(b) b.remove(); return; }
  if(!b){ b=document.createElement("div"); b.id="savebar"; b.className="savebar"; document.body.appendChild(b); }
  b.innerHTML=`<span>✏️ Tienes cambios sin guardar <span class="small" style="opacity:.75">(${[...S.dirty].map(ETQ).join(", ")})</span></span><span class="row" style="gap:8px;flex-wrap:nowrap"><button class="btn ghost" id="sb-no" style="color:#fff">Descartar</button><button class="btn" id="sb-ok" style="background:var(--gold);color:#2a2005">Guardar</button></span>`;
  b.querySelector("#sb-ok").onclick=guardarCambios; b.querySelector("#sb-no").onclick=descartarCambios;
}
let tToast=null;
function toast(t,deshacer){
  let el=document.getElementById("toast"); if(!el){ el=document.createElement("div"); el.id="toast"; el.className="toast"; document.body.appendChild(el); }
  el.innerHTML=`<span>${esc(t)}</span>${deshacer&&S.ultimo?`<button class="btn ghost" id="tt-undo" style="color:var(--gold)">Deshacer</button>`:""}`;
  el.classList.add("on"); const u=el.querySelector("#tt-undo"); if(u) u.onclick=()=>{ el.classList.remove("on"); deshacerUltimo(); };
  clearTimeout(tToast); tToast=setTimeout(()=>el.classList.remove("on"),deshacer?10000:3000);
}
window.addEventListener("beforeunload",e=>{ if(S.dirty&&S.dirty.size){ e.preventDefault(); e.returnValue=""; } });
function errW(e){ if(e&&e.code==="invalid_argument"){ S.writable=false; setStatus("Solo lectura"); render(); } else setStatus("No se pudo guardar; prueba otra vez en un momento"); }
function setStatus(t){ const el=$("#status"); if(el) el.textContent=t; }

// ---------- render ----------
let tRender=null;
function renderSoon(){ clearTimeout(tRender); tRender=setTimeout(render,300); }
function render(){
  clearTimeout(tRender);
  const a=document.activeElement; const act=a&&a.id; let keep=null;
  if(a&&a.tagName==="INPUT"&&a.id){ keep={v:a.value,s:a.selectionStart,e:a.selectionEnd}; }
  document.querySelectorAll("#tabs button").forEach(b=>b.setAttribute("aria-selected",String(b.dataset.t===S.tab)));
  const TT={inicio:"Inicio",presupuesto:"Presupuesto",mes:"Este mes",movs:"Movimientos",historico:"Histórico",ahorro:"Ahorro e inversión",altovelo:"Altovelo",importar:"Subir extracto"};
  const TI={inicio:"🐷",presupuesto:"🧮",mes:"📅",movs:"🧾",historico:"📊",ahorro:"🎯",altovelo:"🏡",importar:"📥"};
  const pt=$("#page-title"); if(pt) pt.textContent=TT[S.tab]||""; const pi=$("#page-ic"); if(pi) pi.textContent=TI[S.tab]||"🐷";
  const main=$("#main");
  if(S.login){ main.innerHTML=vLogin(); if(pt) pt.textContent="Entrar"; const pi2=$("#page-ic"); if(pi2) pi2.textContent="🔐"; bindLogin(); return; }
  if(!S.db){ main.innerHTML=`<div class="empty">Cargando…</div>`; return; }
  if(!(S.ready.meses&&S.ready.plan&&S.ready.metas&&S.ready.alto)){ main.innerHTML=`<div class="empty">Cargando…</div>`; return; }
  if(!S.plan){ main.innerHTML=`<div class="empty">Falta la configuración del plan.</div>`; return; }
  if(!mesesOrden().length && S.tab!=="importar" && S.tab!=="altovelo") S.tab="importar";
  main.innerHTML=({inicio:vInicio,presupuesto:vPresupuesto,mes:vMes,movs:vMovs,historico:vHistorico,ahorro:vAhorro,altovelo:vAltovelo,importar:vImportar}[S.tab]||vInicio)();
  bind();
  if(act){ const el=document.getElementById(act); if(el){ el.focus(); if(keep&&el.tagName==="INPUT"){ el.value=keep.v; try{ el.setSelectionRange(keep.s,keep.e); }catch(e){} } } }
}
function irA(t){ S.tab=t; try{localStorage.setItem("dino_tab",t);}catch(e){} render(); window.scrollTo({top:0}); }
const dis = () => S.writable?"":"disabled";
const inNum = (id,path,val,doc="plan") => `<input class="n" type="text" inputmode="decimal" id="${id}" data-path="${esc(path)}" data-doc="${doc}" data-num="1" value="${numTxt(val)}" aria-label="importe" ${dis()}>`;
const inTxt = (id,path,val,ph="",doc="plan") => `<input class="t" type="text" id="${id}" data-path="${esc(path)}" data-doc="${doc}" value="${esc(val)}" placeholder="${esc(ph)}" ${dis()}>`;

// ---------- INICIO ----------
function vInicio(){
  const T=totales(), p=S.plan;
  const partes=[["Fijos",T.fijos,COL.fijoHero],["Recibos anuales",T.anual,COL.anualHero],["Día a día",T.variable,COL.varHero],["Huchas",T.huchas,COL.ahoHero],["Para ahorrar",Math.max(0,T.margen),COL.libre]];
  const pct=v=>Math.max(0,v)/Math.max(T.ingresos,1)*100;
  // avisos
  const av=[];
  for(const f of (p.fijos||[])){ if(f.var) continue; const u=ultimoCobro(f); if(u&&Math.abs(u.a-(+f.importe||0))>0.5) av.push(["warn","📈",`<b>${esc(f.n)}</b> ha cobrado ${e2(u.a)} y tienes apuntado ${e2(f.importe)}. Actualízalo en Presupuesto si es el precio nuevo.`]); }
  const m=mesesOrden().slice(-1)[0]; const g={};
  if(m){ for(const x of S.meses[m].movs){ if(kindOf(x.cat)==="var") g[x.cat]=(g[x.cat]||0)-x.i; } if(g["Efectivo"]) g["Efectivo"]=Math.max(0,g["Efectivo"]-movidoEfectivo(m)); }
  for(const c in g){ const pr=presMes(c,+m.slice(5)); if(pr>0&&g[c]>pr) av.push(["warn","🔥",`En ${MESL[+m.slice(5)-1]} <b>${esc(c)}</b> va por ${e0(g[c])}, por encima de los ${e0(pr)} previstos.`]); }
  const mesAct=new Date().getMonth()+1; const dist=mm=>(mm-mesAct+12)%12;
  const recs=recibosAuto().map(r=>({n:(p.etiquetas||{})[r.c]||r.c.replace(/^Recibo · /,""),imp:r.importe,mes:Math.min(...r.meses.map(dist))})).concat((p.recibosManuales||[]).map(r=>({n:r.n,imp:+r.importe||0,mes:dist(+r.mes||1)}))).filter(r=>r.mes>0&&r.mes<=3).sort((a,b)=>a.mes-b.mes);
  for(const r of recs) av.push(["info","🗓️",`En ${r.mes===1?"un mes":r.mes+" meses"} llega <b>${esc(r.n)}</b>${r.imp?` (${e0(r.imp)})`:", todavía sin importe apuntado"}.`]);
  if(!av.length) av.push(["ok","✅","Todo en orden: ningún precio ha cambiado y el gasto del mes va dentro de lo previsto."]);
  return `<section class="panel dash"><div class="col">
    <div class="hero">
      <div><div class="lbl">Cada mes os quedan para ahorrar</div><div class="big">${e0(T.margen)}</div>
      <div class="sub">de ${e0(T.ingresos)} que entran, si cumplís el presupuesto. Gastando como hasta ahora serían ${e0(T.margenReal)}.</div></div>
      <div class="split" role="img" aria-label="Reparto del dinero que entra">${partes.map(x=>`<span style="width:${pct(x[1])}%;background:${x[2]}" title="${x[0]}: ${e0(x[1])}"></span>`).join("")}</div>
      <div class="legend">${partes.map(x=>`<span><span class="dot" style="background:${x[2]}"></span>${x[0]} ${e0(x[1])}</span>`).join("")}</div>
    </div>
    <div class="tiles">
      <div class="tile">${tic("🏠","var(--mint-soft)")}<div class="l">Fijos</div><div class="v">${e0(T.fijos)}</div><div class="s">${(p.fijos||[]).length} gastos al mes</div></div>
      <div class="tile">${tic("📅","var(--plum-soft)")}<div class="l">Recibos anuales</div><div class="v">${e0(T.anual)}</div><div class="s">a apartar cada mes</div></div>
      <div class="tile">${tic("🛒","var(--sun-soft)")}<div class="l">Día a día</div><div class="v">${e0(T.variable)}</div><div class="s">presupuesto; real ${e0(T.varReal)}</div></div>
      <div class="tile">${tic("🐷","var(--sea-soft)")}<div class="l">Huchas</div><div class="v">${e0(T.huchas)}</div><div class="s">Guille, Laura y viajes</div></div>
    </div>
    </div>    <div class="card"><div class="card-h"><h2>Avisos</h2></div><div class="alerts">${av.map(a=>`<div class="alert ${a[0]}"><span class="ic em">${a[1]}</span><div>${a[2]}</div></div>`).join("")}</div></div>
  </section>`;
}

// ---------- PRESUPUESTO ----------
function vPresupuesto(){
  const p=S.plan, T=totales(), r=mediaCat(), b=p.presupuesto||{};
  const fijoCats=CAT_ORDER.filter(c=>kindOf(c)==="fijo");
  const L=p.fijos||[]; const grupos=[...new Set(L.map(f=>f.cat))];
  const fFila=(f,i)=>{ const cs=cargos(f), u=ultimoCobro(f), pr=cs[0];
    const cambia=!f.var&&u&&Math.abs(u.a-(+f.importe||0))>0.5;
    const va=f.var?null:pr&&u&&Math.abs(u.a-pr.a)>0.5?(u.a-pr.a)/pr.a:null;
    return `<div class="it"><div class="main">${inTxt("fn-"+i,`fijos.${i}.n`,f.n)}</div>
      <div class="right">${inNum("fi-"+i,`fijos.${i}.importe`,f.importe)}<button class="x" data-act="del-fijo" data-i="${i}" title="Quitar" ${dis()}>×</button></div>
      <div class="meta"><select class="s" id="ff-${i}" data-path="fijos.${i}.frec" data-doc="plan" ${dis()}>${Object.entries(FREC).map(([k,v])=>`<option value="${k}" ${k===f.frec?"selected":""}>${v}</option>`).join("")}</select>
        <select class="s" id="fc-${i}" data-path="fijos.${i}.cat" data-doc="plan" ${dis()}>${fijoCats.map(c=>`<option ${c===f.cat?"selected":""}>${esc(c)}</option>`).join("")}</select>
        ${f.frec&&f.frec!=="mensual"?`<span>${e2(costeMes(f))} al mes</span>`:""}
        ${u?`<span class="chip ${cambia?"up":""}">último cargo ${e2(u.a)} · ${u.f.slice(8)}/${u.f.slice(5,7)}</span>`:`<span class="chip cash">${f.match?"todavía sin cargo":"en efectivo"}</span>`}
        <label class="tog"><input type="checkbox" id="fe-${i}" data-path="fijos.${i}.ef" data-doc="plan" data-bool="1" ${pagaEfectivo(f)?"checked":""} ${!f.match?"disabled":""} ${dis()}>Se puede pagar en efectivo</label>
        ${va!==null?`<span class="chip ${va>0?"up":"down"}">${va>0?"sube":"baja"} ${(Math.abs(va)*100).toFixed(1).replace(".",",")}% este año</span>`:""}</div></div>`; };
  const fijosHtml=grupos.map(c=>{ const its=L.map((f,i)=>[f,i]).filter(([f])=>f.cat===c); return `<div class="grp"><span style="display:flex;align-items:center;gap:8px">${cic(c,"sm")}${esc(c)}</span><span>${e0(its.reduce((s,[f])=>s+costeMes(f),0))}</span></div>`+its.map(([f,i])=>fFila(f,i)).join(""); }).join("");
  const et=p.etiquetas||{};
  const ra=recibosAuto().sort((a,b)=>Math.min(...a.meses)-Math.min(...b.meses));
  const rHtml=ra.map((o,i)=>`<div class="it"><div class="main">${inTxt("re-"+i,`etiquetas.${o.c}`,et[o.c]||"",o.c.replace(/^Recibo · /,""))}</div>
      <div class="right">${inNum("ri-"+i,`recibosImporte.${o.c}`,o.importe)}<button class="x" data-act="hide-rec" data-c="${esc(o.c)}" title="Quitar" ${dis()}>×</button></div>
      <div class="meta"><span>${esc(o.c.replace(/^Recibo · /,""))}</span><span>${[...new Set(o.meses)].sort((a,b)=>a-b).map(mm=>MESL[mm-1]).join(" y ")}</span><span>${e2(o.importe/12)} al mes</span></div></div>`).join("")
    +(p.recibosManuales||[]).map((o,j)=>`<div class="it"><div class="main">${inTxt("mn-"+j,`recibosManuales.${j}.n`,o.n)}</div>
      <div class="right">${inNum("mi-"+j,`recibosManuales.${j}.importe`,o.importe)}<button class="x" data-act="del-rec" data-i="${j}" title="Quitar" ${dis()}>×</button></div>
      <div class="meta"><select class="s" id="mm-${j}" data-path="recibosManuales.${j}.mes" data-doc="plan" data-num="1" ${dis()}>${MESL.map((nm,k)=>`<option value="${k+1}" ${k+1===+o.mes?"selected":""}>${nm}</option>`).join("")}</select><span class="chip">añadido a mano</span>${+o.importe?`<span>${e2(o.importe/12)} al mes</span>`:`<span class="chip pend">falta el importe</span>`}</div></div>`).join("");
  const vHtml=CAT_ORDER.filter(c=>kindOf(c)==="var").map(c=>{ const m=r[c]||0, pr=+b[c]||0; return `<div class="it"><div class="main">${cic(c)}${esc(c)}</div><div class="right">${inNum("pv-"+c.replace(/\W/g,"_"),`presupuesto.${c}`,pr)}</div><div class="meta"><span>media real ${e0(m)}</span>${m-pr>=5?`<span class="chip down">ahorras ${e0(m-pr)}</span>`:pr-m>=5?`<span class="chip">margen ${e0(pr-m)}</span>`:""}</div></div>`; }).join("");
  return `<section class="panel cols"><div class="col">
    <div class="grid2">
      <div class="card"><div class="card-h"><h2>💶 Entra cada mes</h2><span class="tot">${e0(T.ingresos)}</span></div>
        <div class="list">
          <div class="it"><div class="main">Tu nómina fija</div><div class="right">${inNum("in-nom","nomina",p.nomina)}</div></div>
          <div class="it"><div class="main">Aportación de Cisco</div><div class="right">${inNum("in-cis","cisco",p.cisco)}</div></div>
          <div class="it"><div class="main">Paga extra (cada una)</div><div class="right">${inNum("in-pe","pagaExtra",p.pagaExtra)}</div><div class="meta"><span>Pagas al año</span>${inNum("in-npe","nPagasExtra",p.nPagasExtra)}<span>fuera del plan mensual</span></div></div>
        </div></div>
      <div class="card"><div class="card-h"><h2>🐷 Huchas</h2><span class="tot">${e0(T.huchas)}</span></div>
        <div class="list">${(p.huchas||[]).map((h,i)=>`<div class="it"><div class="main">${inTxt("hn-"+i,`huchas.${i}.n`,h.n)}</div><div class="right">${inNum("hv-"+i,`huchas.${i}.v`,h.v)}<button class="x" data-act="del-hucha" data-i="${i}" title="Quitar" ${dis()}>×</button></div></div>`).join("")}</div>
        <button class="add" data-act="add-hucha" style="margin-top:10px" ${dis()}>+ Añadir hucha</button></div>
    </div>
    <div class="card"><div class="card-h"><h2>🏠 Gastos fijos</h2><span class="tot">${e0(T.fijos)} al mes</span></div>
      <div class="list">${fijosHtml}</div>
      <button class="add" data-act="add-fijo" style="margin-top:10px" ${dis()}>+ Añadir gasto fijo</button></div>
    </div><div class="col">
    <div class="card"><div class="card-h"><h2>📅 Recibos anuales</h2><span class="tot">${e0(T.anual)} al mes</span></div>
      <p class="note">Se cobran de golpe; aquí se aparta cada mes la doceava parte. Escribe qué cubre cada uno.</p>
      <div class="list">${rHtml}</div>
      <button class="add" data-act="add-rec" style="margin-top:10px" ${dis()}>+ Añadir recibo (IBI, seguro de otra cuenta…)</button></div>
    <div class="card"><div class="card-h"><h2>🛒 Día a día</h2><span class="tot">${e0(T.variable)} al mes</span></div>
      <div class="list">${vHtml}</div></div>
  </div></section>`;
}

// ---------- ESTE MES ----------
function vMes(){
  const ms=mesesOrden(); const m=S.mesSel&&S.meses[S.mesSel]?S.mesSel:ms[ms.length-1];
  const movs=S.meses[m].movs, b=S.plan.presupuesto||{}, nm=+m.slice(5);
  const g={}; let ing=0,ext=0;
  ing=ingresosMes(m);
  for(const x of movs){ const k=kindOf(x.cat); if(k==="ing") {} else if(k==="ext") ext-=x.i; else if(k==="var") g[x.cat]=(g[x.cat]||0)-x.i; }
  const mov=movidoEfectivo(m); if(g["Efectivo"]) g["Efectivo"]=Math.max(0,g["Efectivo"]-mov);
  const esAct=m===hoyYM(); const dias=new Date(+m.slice(0,4),nm,0).getDate(); const ritmo=esAct?new Date().getDate()/dias:1;
  const vcats=CAT_ORDER.filter(c=>kindOf(c)==="var"&&(presMes(c,nm)>0||g[c]));
  const tv=vcats.reduce((s,c)=>s+(g[c]||0),0), pv=vcats.reduce((s,c)=>s+presMes(c,nm),0);
  const fila=c=>{ const gs=g[c]||0, pr=presMes(c,nm), q=pr?gs/pr:(gs>0?1.1:0); const cl=q>1?"over":q>ritmo+.15?"warn":"";
    return `<div class="brow" data-vercat="${esc(c)}" data-vermes="${m}"><div>${cic(c)}<span>${esc(c)}</span></div><div class="bar"><i class="${cl}" style="width:${Math.min(100,q*100)}%"></i></div><div class="amt"><span class="eur">${e0(gs)}</span> <span class="muted">/ ${e0(pr)}</span></div></div>${c==="Efectivo"&&mov?`<div class="small muted" style="margin:-4px 0 6px">Solo efectivo suelto: se descuentan ${e0(mov)} pagados en efectivo a fijos (tenis, Rosa, profe…).</div>`:""}`; };
  const curso=nm>=9||nm<=6;
  const fx=(S.plan.fijos||[]).map(f=>{ const cs=cargos(f,m); const banco=cs.reduce((s,c)=>s+c.a,0); const ef=enEfectivo(f,m);
    const st=!toca(f,nm)?["","no toca"]:pagaEfectivo(f)&&esperadoMes(f,nm)>0?(banco>0&&ef>0.5?["cash",`${e2(banco)} por banco y ${e2(ef)} en efectivo`]:banco>0?["ok","cobrado "+e2(banco)]:["cash","pagado en efectivo"]):cs.length?["ok","cobrado "+e2(banco)]:(f.frec==="bimestral"||f.frec==="plazos"||f.frec==="trimestral")?["","este mes no"]:["pend","pendiente"];
    return `<div class="it"><div class="main">${esc(f.n)}</div><div class="right"><span class="chip ${st[0]}">${st[1]}</span></div></div>`; }).join("");
  return `<section class="panel">
    <div class="row" style="justify-content:space-between;align-items:center"><select class="s" id="sel-mes" style="font-size:1rem;max-width:none">${ms.slice().reverse().map(x=>`<option value="${x}" ${x===m?"selected":""}>${mLong(x)}</option>`).join("")}</select>
      <span class="small muted">${esAct?`Día ${new Date().getDate()} de ${dias}`:"Mes cerrado"}</span></div>
    <div class="tiles">
      <div class="tile">${tic("💶","var(--sea-soft)")}<div class="l">Ha entrado</div><div class="v">${e0(ing)}</div><div class="s">previsto ${e0((+S.plan.nomina||0)+(+S.plan.cisco||0))}</div></div>
      <div class="tile">${tic("🛒","var(--sun-soft)")}<div class="l">Día a día</div><div class="v" style="color:${tv>pv?"var(--coral)":"inherit"}">${e0(tv)}</div><div class="s">de ${e0(pv)}${esAct&&ritmo<1?` · a este ritmo ${e0(tv/ritmo)}`:""}</div></div>
      <div class="tile">${tic("✨","var(--coral-soft)")}<div class="l">Extraordinario</div><div class="v">${e0(ext)}</div><div class="s">fuera del plan</div></div>
    </div>
    <div class="grid2">
      <div class="card"><div class="card-h"><h2>🛒 Día a día</h2></div><div>${vcats.map(fila).join("")}</div>
        <p class="note" style="margin-top:8px">Ámbar: va más rápido que el mes. Rojo: ya ha pasado el presupuesto. Toca una fila para ver los movimientos.</p></div>
      <div class="card"><div class="card-h"><h2>🏠 Fijos del mes</h2></div><div class="list">${fx}</div></div>
    </div></section>`;
}

// ---------- MOVIMIENTOS ----------
function vMovs(){
  const f=S.f; let rows=[];
  for(const m of mesesOrden()){ if(f.mes&&m!==f.mes) continue; S.meses[m].movs.forEach((x,i)=>{ if(f.cat&&x.cat!==f.cat) return; if(f.kind&&kindOf(x.cat)!==f.kind) return; if(f.q&&!x.c.toLowerCase().includes(f.q.toLowerCase())) return; rows.push({m,i,x}); }); }
  rows.sort((a,b)=>b.x.f.localeCompare(a.x.f)); const tot=rows.reduce((s,r)=>s+r.x.i,0); const sh=rows.slice(0,300);
  const KN={fijo:"Fijos",var:"Día a día",anual:"Recibos anuales",ext:"Extraordinario",ing:"Ingresos",ingx:"Ingresos extra",aho:"Huchas y traspasos"};
  return `<section class="panel"><div class="card">
    <div class="row">
      <label class="field" style="flex:1 1 180px">Buscar<input class="n" style="width:100%;text-align:left;font-family:var(--body);font-weight:400" type="search" id="f-q" value="${esc(f.q)}" placeholder="Mercadona, bizum…"></label>
      <label class="field">Mes<select class="s" id="f-mes"><option value="">Todos</option>${mesesOrden().reverse().map(m=>`<option value="${m}" ${m===f.mes?"selected":""}>${mLong(m)}</option>`).join("")}</select></label>
      <label class="field">Categoría<select class="s" id="f-cat"><option value="">Todas</option>${CAT_ORDER.map(c=>`<option ${c===f.cat?"selected":""}>${esc(c)}</option>`).join("")}</select></label>
      <label class="field">Tipo<select class="s" id="f-kind"><option value="">Todos</option>${Object.entries(KN).map(([k,v])=>`<option value="${k}" ${k===f.kind?"selected":""}>${v}</option>`).join("")}</select></label>
    </div>
    <p class="small muted" style="margin:10px 0 0">${rows.length} movimientos · saldo ${e2(tot)}. Al cambiar una categoría se aplica a ese concepto en todos los meses y en las próximas importaciones.</p>
    <div class="list" style="margin-top:6px">${sh.map(({m,i,x})=>`<div class="it"><div class="main">${cic(x.cat)}<div style="display:flex;flex-direction:column;min-width:0"><span>${esc(x.c)}</span><span class="small muted">${x.f.slice(8)}/${x.f.slice(5,7)}/${x.f.slice(2,4)}${mesImputado(x)!==x.f.slice(0,7)?` · <span class="chip ok">cuenta para ${MESL[+mesImputado(x).slice(5)-1]}</span>`:""}</span></div></div>
      <div class="right"><span class="eur" style="color:${x.i>0?"var(--mint)":"inherit"}">${e2(x.i)}</span></div>
      <div class="meta"><select class="s" id="c-${m}-${i}" data-m="${m}" data-i="${i}" data-cat="1" ${dis()}>${CAT_ORDER.map(c=>`<option ${c===x.cat?"selected":""}>${esc(c)}</option>`).join("")}</select>
        <input class="t" style="flex:1 1 180px;max-width:360px;font-size:.82rem" id="n-${m}-${i}" data-m="${m}" data-i="${i}" data-nota="1" value="${esc(x.nota||"")}" placeholder="📝 Añadir nota (regalo, error…)" ${dis()}>
        ${x.i<0?`<button class="btn ghost" data-dividir="${m}|${i}" style="padding:2px 6px;font-size:.8rem" title="Separar parte del importe en otro movimiento" ${dis()}>✂️ Dividir</button>`:""}
        ${S.catAplicar&&S.catAplicar.m===m&&S.catAplicar.i===i?`<button class="btn soft" id="aplicar-todos" style="padding:4px 10px;font-size:.8rem">Aplicar también a los otros ${S.catAplicar.n} de este comercio</button>`:""}</div></div>`).join("")}</div>
    ${rows.length>300?`<p class="note">Se ven los 300 más recientes; filtra para ver el resto.</p>`:""}
  </div></section>`;
}
function claveRegla(c){ return c.replace(/^(Bizum a |Bizum de |Recibo · |Compra Bizum · |Transferencia · |Traspaso · |Devolución · )/,"").replace(/\s*\(.*\)\s*$/,"").replace(/\s+-\s+\+?\d[\d ]+$/,"").trim(); }
async function cambiarCat(m,i,cat){
  const x=S.meses[m].movs[i]; const prev=x.cat; x.cat=cat; guardarMes(m);
  const otros=mesesOrden().reduce((n,mm)=>n+S.meses[mm].movs.filter(y=>y!==x&&y.c===x.c&&y.cat!==cat).length,0);
  S.catAplicar=otros?{m,i,c:x.c,cat,n:otros}:null; render();
}
function aplicarATodos(){
  const A=S.catAplicar; if(!A) return;
  for(const mm of mesesOrden()) S.meses[mm].movs.forEach(y=>{ if(y.c===A.c&&y.cat!==A.cat){ y.cat=A.cat; guardarMes(mm); } });
  const t=claveRegla(A.c); if(t.length>=3){ S.plan.reglas=(S.plan.reglas||[]).filter(r=>r.t!==t); S.plan.reglas.push({t,cat:A.cat}); guardarPlan(); }
  S.catAplicar=null; render();
}

// ---------- HISTÓRICO ----------
function vHistorico(){
  const all=mesesOrden(); const cerr=mesesCerrados();
  const pk=all.map(m=>{ const o={m,fijo:0,anual:0,var:0,ext:0}; for(const x of S.meses[m].movs){ const k=kindOf(x.cat); if(o[k]!==undefined) o[k]-=x.i; } const mv=movidoEfectivo(m); o.var-=mv; o.fijo+=mv; for(const k of ["fijo","anual","var","ext"]) o[k]=Math.max(0,o[k]); return o; });
  const K=[["fijo","Fijos",COL.fijo],["var","Día a día",COL.var],["anual","Recibos anuales",COL.anual],["ext","Extraordinario",COL.coral||COL.ext]];
  const W=700,H=240,pl=40,pb=24,pt=8; const mx=Math.max(...pk.map(o=>o.fijo+o.var+o.anual+o.ext),1); const top=Math.ceil(mx/1000)*1000; const y=v=>pt+(H-pt-pb)*(1-v/top); const bw=(W-pl-6)/Math.max(pk.length,1);
  let svg=`<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Gasto por mes">`;
  for(let v=0;v<=top;v+=1000) svg+=`<line x1="${pl}" x2="${W-6}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${pl-6}" y="${y(v)+4}" text-anchor="end">${v/1000}k</text>`;
  pk.forEach((o,i)=>{ let acc=0; const x=pl+i*bw+bw*.2, w=bw*.6; for(const [k,,c] of K){ const v=o[k]; if(v>0){ svg+=`<rect x="${x}" y="${y(acc+v)}" width="${w}" height="${y(acc)-y(acc+v)}" rx="3" fill="${c}"><title>${mLong(o.m)} · ${e0(v)}</title></rect>`; acc+=v; } } svg+=`<text x="${x+w/2}" y="${H-7}" text-anchor="middle">${mLabel(o.m)}</text>`; });
  svg+="</svg>";
  const tab={}; for(const m of all){ for(const x of S.meses[m].movs){ (tab[x.cat]??={})[m]=(tab[x.cat][m]||0)-x.i; } const mv=movidoEfectivo(m); if(mv&&tab["Efectivo"]) tab["Efectivo"][m]=(tab["Efectivo"][m]||0)-mv; }
  const r=mediaCat();
  const filas=k=>CAT_ORDER.filter(c=>kindOf(c)===k&&tab[c]).map(c=>`<tr data-vercat="${esc(c)}" style="cursor:pointer"><td style="white-space:nowrap">${cic(c,"sm")} ${esc(c)}</td>${all.map(m=>`<td class="r">${tab[c][m]?Math.round(tab[c][m]).toLocaleString("es-ES"):"·"}</td>`).join("")}<td class="r"><b>${Math.round(r[c]||0).toLocaleString("es-ES")}</b></td></tr>`).join("");
  const sec=(t,k)=>`<tr><td colspan="${all.length+2}" style="font-size:.74rem;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);font-weight:700;padding-top:14px">${t}</td></tr>${filas(k)}`;
  return `<section class="panel">
    <div class="card"><div class="card-h"><h2>📊 Gasto por mes</h2></div>
      <div class="legend" style="margin-bottom:8px">${K.map(k=>`<span><span class="dot" style="background:${k[2]}"></span>${k[1]}</span>`).join("")}</div>
      <div class="tbl">${svg}</div></div>
    <div class="card"><div class="card-h"><h2>En qué se va, mes a mes</h2><span class="small muted">media de ${cerr.length} meses cerrados</span></div>
      <div class="tbl"><table><thead><tr><th>Categoría</th>${all.map(m=>`<th class="r">${mLabel(m)}</th>`).join("")}<th class="r">Media</th></tr></thead>
      <tbody>${sec("Fijos","fijo")}${sec("Día a día","var")}${sec("Recibos anuales","anual")}${sec("Extraordinario","ext")}</tbody></table></div></div>
  </section>`;
}

// ---------- AHORRO ----------
function vAhorro(){
  const M=S.metas, T=totales(), sim=M.sim||{ini:0,mes:100,anos:10,r:4};
  const asig=(M.metas||[]).reduce((s,m)=>s+(+m.mes||0),0);
  const card=(m,i)=>{ const obj=+m.obj||0, act=+m.act||0, mes=+m.mes||0; const q=obj?Math.min(1,act/obj):0; const falta=obj>act&&mes>0?Math.ceil((obj-act)/mes):null;
    let cuando=""; if(falta){ const d=new Date(); d.setMonth(d.getMonth()+falta); cuando=`Lo alcanzáis en ${MESL[d.getMonth()]} de ${d.getFullYear()}`; } else if(obj&&act>=obj) cuando="Objetivo cumplido";
    return `<div class="card meta-card"><div class="row" style="justify-content:space-between;align-items:center;flex-wrap:nowrap">${inTxt("mt-n-"+i,`metas.${i}.n`,m.n,"",'metas')}<button class="x" data-act="del-meta" data-i="${i}" title="Quitar" ${dis()}>×</button></div>
      ${obj?`<div class="prog"><i style="width:${q*100}%"></i></div>`:""}
      <div class="row"><label class="field">Tengo${inNum("mt-a-"+i,`metas.${i}.act`,act,"metas")}</label><label class="field">Objetivo${inNum("mt-o-"+i,`metas.${i}.obj`,obj,"metas")}</label><label class="field">Al mes${inNum("mt-m-"+i,`metas.${i}.mes`,mes,"metas")}</label></div>
      <div class="small muted">${cuando||(obj?"":"Sin objetivo")}</div></div>`; };
  const proy=r=>{ const pts=[]; let v=+sim.ini||0; const rm=Math.pow(1+r/100,1/12)-1; pts.push(v); for(let k=1;k<=sim.anos*12;k++){ v=v*(1+rm)+(+sim.mes||0); if(k%12===0) pts.push(v);} return pts; };
  const sc=[[0,"Sin rentabilidad","var(--muted)"],[+sim.r,`Al ${numTxt(sim.r)}%`,"var(--sea)"],[+sim.r+2,`Al ${numTxt(+sim.r+2)}%`,"var(--sun)"]]; const se=sc.map(([r])=>proy(r)); const mx=Math.max(...se.flat(),1);
  const W=620,H=210,pl=44,pb=22,pt=8; const xs=i=>pl+(W-pl-12)*i/Math.max(sim.anos,1), ys=v=>pt+(H-pt-pb)*(1-v/mx); const st=mx>200000?50000:mx>80000?20000:mx>30000?10000:5000;
  let svg=`<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Proyección">`; for(let v=0;v<=mx;v+=st) svg+=`<line x1="${pl}" x2="${W-12}" y1="${ys(v)}" y2="${ys(v)}" stroke="var(--line)"/><text x="${pl-6}" y="${ys(v)+4}" text-anchor="end">${Math.round(v/1000)}k</text>`;
  for(let a=0;a<=sim.anos;a+=Math.max(1,Math.round(sim.anos/8))) svg+=`<text x="${xs(a)}" y="${H-5}" text-anchor="middle">${a}a</text>`;
  se.forEach((s,j)=>{ svg+=`<polyline fill="none" stroke="${sc[j][2]}" stroke-width="2.4" stroke-linecap="round" points="${s.map((v,i)=>xs(i)+","+ys(v)).join(" ")}"/><circle cx="${xs(s.length-1)}" cy="${ys(s[s.length-1])}" r="4" fill="${sc[j][2]}"/>`; }); svg+="</svg>";
  const fin=se[1][se[1].length-1], apor=(+sim.ini||0)+(+sim.mes||0)*12*sim.anos;
  return `<section class="panel">
    <div class="alert ${asig>T.margen?"warn":"ok"}"><span class="ic">${asig>T.margen?"!":"✓"}</span><div>Margen del plan: <b>${e0(T.margen)}</b> al mes. Asignado a metas: <b>${e0(asig)}</b>${asig>T.margen?`, ${e0(asig-T.margen)} más de lo que queda`:`, quedan ${e0(T.margen-asig)} libres`}.</div></div>
    <div class="grid2">${(M.metas||[]).map(card).join("")}</div>
    <button class="add" data-act="add-meta" ${dis()}>+ Añadir meta</button>
    <div class="card"><div class="card-h"><h2>📈 Simulador de inversión</h2></div>
      <div class="row"><label class="field">Capital inicial${inNum("sim-ini","sim.ini",sim.ini,"metas")}</label><label class="field">Al mes${inNum("sim-mes","sim.mes",sim.mes,"metas")}</label><label class="field">Años${inNum("sim-anos","sim.anos",sim.anos,"metas")}</label><label class="field">Rentabilidad %${inNum("sim-r","sim.r",sim.r,"metas")}</label></div>
      <div class="legend" style="margin:12px 0 4px">${sc.map((s,j)=>`<span><span class="dot" style="background:${s[2]}"></span>${s[1]}: <b>${e0(se[j][se[j].length-1])}</b></span>`).join("")}</div>
      <div class="tbl">${svg}</div>
      <p class="note">Aportáis ${e0(apor)} y al ${numTxt(sim.r)}% acabaríais con ${e0(fin)}. La ganancia tributa entre el 19% y el 30% al rescatarla. Son estimaciones, no rentabilidades garantizadas.</p></div>
  </section>`;
}


// ---------- ALTOVELO ----------
const ALTO_DEF={precio:240000,arras:48000,itp:6.75,valorRef:0,notaria:2750,otros:0,reservado:0,colchon:0,tipo:2.3,anos:30,fechaFirma:"2027-03-22",fechaArras:"2026-10-29",
  cuentas:[
    {n:"Trade Republic · Cisco",saldo:50000,interes:0,desde:"2026-07-01",fin:"",nota:"",incl:true},
    {n:"Revolut · Laura",saldo:25000,interes:0,desde:"2026-07-01",fin:"2026-10-16",nota:"Promoción del 3,51 % hasta el 16 de octubre; después, alrededor del 1,15 %.",incl:true},
    {n:"Revolut · Cisco",saldo:25000,interes:0,desde:"2026-07-01",fin:"",nota:"",incl:true},
    {n:"Trade Republic · Laura",saldo:20000,interes:0,desde:"2026-07-01",fin:"",nota:"",incl:true},
    {n:"Bankinter",saldo:68000,interes:0,desde:"2026-10-17",fin:"2027-04-30",nota:"3 % con abono mensual hasta abril de 2027 (confirmar el día). Comprobar si este dinero sale de otras cuentas para no contarlo dos veces.",incl:true}
  ]};
const inDate=(id,path,val,doc="alto")=>`<input class="d" type="date" id="${id}" data-path="${esc(path)}" data-doc="${doc}" value="${esc(val||"")}" ${dis()}>`;
const fechaL=f=>{ if(!f) return "sin fecha"; const [y,m,d]=f.split("-"); return `${+d} de ${MESL[+m-1]} de ${y}`; };
const diasA=f=>{ if(!f) return null; const t=new Date(f+"T00:00:00"), h=new Date(); h.setHours(0,0,0,0); return Math.round((t-h)/864e5); };
function calcAlto(){
  const A=S.alto, precio=+A.precio||0, arras=+A.arras||0, pend=Math.max(0,precio-arras);
  const base=Math.max(precio,+A.valorRef||0), itp=base*(+A.itp||0)/100, gastos=(+A.notaria||0)+(+A.otros||0);
  const total=pend+itp+gastos;
  const cs=(A.cuentas||[]).filter(c=>c.incl!==false);
  const saldos=cs.reduce((s,c)=>s+(+c.saldo||0),0), intereses=cs.reduce((s,c)=>s+(+c.interes||0),0);
  const fondos=Math.max(0,saldos+intereses-(+A.reservado||0));
  const necesaria=Math.max(0,total-fondos);
  const H=necesaria+(+A.colchon||0), r=(+A.tipo||0)/1200, n=(+A.anos||0)*12;
  const cuota=H&&n?(r?H*r/(1-Math.pow(1+r,-n)):H/n):0;
  const intTot=Math.max(0,cuota*n-H), ltv=precio?H/precio*100:0;
  return {precio,arras,pend,base,itp,gastos,total,saldos,intereses,fondos,necesaria,H,cuota,intTot,ltv};
}
function vAltovelo(){
  const A=S.alto, C=calcAlto(), df=diasA(A.fechaFirma), da=diasA(A.fechaArras);
  const av=[];
  if(A.fechaFirma&&A.fechaArras&&A.fechaFirma>A.fechaArras) av.push(["warn","📝",`La firma prevista (${fechaL(A.fechaFirma)}) es posterior al plazo de las arras (${fechaL(A.fechaArras)}). Tened la prórroga firmada por escrito antes de esa fecha${da!=null&&da>=0?`: quedan ${da} días`:""}.`]);
  for(const c of (A.cuentas||[])){ const d=diasA(c.fin); if(d==null) continue; if(d<0) av.push(["info","⏰",`La promoción de <b>${esc(c.n)}</b> terminó el ${fechaL(c.fin)}. Revisa si compensa mover el dinero.`]); else if(d<=45) av.push(["warn","⏰",`La promoción de <b>${esc(c.n)}</b> termina en ${d} días (${fechaL(c.fin)}).`]); }
  if((+A.valorRef||0)>C.precio) av.push(["info","🏛️",`El valor de referencia es mayor que el precio: el ITP se calcula sobre ${e0(C.base)}.`]);
  if(C.ltv>80) av.push(["warn","⚠️",`La hipoteca supera el 80 % del precio (${numTxt(Math.round(C.ltv))} %). Los bancos no suelen financiar tanto.`]);
  for(const c of (A.cuentas||[])) if((+c.saldo||0)>200000) av.push(["warn","🔎",`Revisa el saldo de <b>${esc(c.n)}</b>: ${e0(c.saldo)} parece demasiado. ¿Sobra algún cero?`]);
  const fld=(lab,em,ctrl,help="",cls="")=>`<div class="fld ${cls}"><div class="lab"><span class="cic" style="background:var(--surface-2)" aria-hidden="true">${em}</span><span>${lab}</span></div><div>${ctrl}</div>${help?`<div class="help">${help}</div>`:""}</div>`;
  const calc=v=>`<span class="calc">${e0(v)}</span>`;
  const n2=(id,path,val)=>inNum(id,path,val,"alto");
  const partes=[["Resto del precio",C.pend,"#5eead4"],["ITP",C.itp,"#f5c451"],["Notaría y gastos",C.gastos,"#a78bfa"]];
  const ctas=(A.cuentas||[]).map((c,i)=>`<div class="acc ${c.incl===false?"off":""}">
      <div class="top"><span class="cic lg" style="background:var(--blue-soft)" aria-hidden="true">🏦</span><div style="flex:1;min-width:0">${inTxt("an-"+i,`cuentas.${i}.n`,c.n,"Nombre de la cuenta","alto")}</div>
        <label class="tog"><input type="checkbox" id="ai-${i}" data-path="cuentas.${i}.incl" data-doc="alto" data-bool="1" ${c.incl!==false?"checked":""} ${dis()}>Cuenta para la firma</label>
        <button class="x" data-act="del-cta" data-i="${i}" title="Quitar" ${dis()}>×</button></div>
      <div class="row"><label class="field">Saldo${n2("as-"+i,`cuentas.${i}.saldo`,c.saldo)}</label><label class="field">Interés neto generado${n2("ar-"+i,`cuentas.${i}.interes`,c.interes)}</label><label class="field">Desde${inDate("ad-"+i,`cuentas.${i}.desde`,c.desde)}</label><label class="field">Fin de la promoción${inDate("af-"+i,`cuentas.${i}.fin`,c.fin)}</label></div>
      ${inTxt("ao-"+i,`cuentas.${i}.nota`,c.nota,"Nota (tipo, condiciones…)","alto")}
    </div>`).join("");
  return `<section class="panel">
    <div class="hero alto-hero">
      <div><div class="lbl">Lo que hay que pagar el día de la firma</div><div class="big">${e0(C.total)}</div>
      <div class="sub">${A.fechaFirma?`Firma prevista el ${fechaL(A.fechaFirma)}${df!=null&&df>=0?` · faltan ${df} días`:""}`:"Pon la fecha prevista de la firma"}. Las arras (${e0(C.arras)}) ya están pagadas.</div></div>
      <div class="split" role="img" aria-label="Reparto del pago de la firma">${partes.map(x=>`<span style="width:${x[1]/Math.max(C.total,1)*100}%;background:${x[2]}" title="${x[0]}: ${e0(x[1])}"></span>`).join("")}</div>
      <div class="legend">${partes.map(x=>`<span><span class="dot" style="background:${x[2]}"></span>${x[0]} ${e0(x[1])}</span>`).join("")}</div>
    </div>
    <div class="kpis">
      <div class="kpi">${tic("🏦","var(--blue-soft)")}<div class="l">Vuestro dinero para la firma</div><div class="v">${e0(C.fondos)}</div><div class="s">ahorro ${e0(C.saldos)} + intereses ${e0(C.intereses)}${+A.reservado?` − ${e0(A.reservado)} reservados`:""}</div></div>
      <div class="kpi gold">${tic("✨","var(--sun-soft)")}<div class="l">Intereses generados (neto)</div><div class="v">${e0(C.intereses)}</div><div class="s">dinero extra que ya suma</div></div>
      <div class="kpi ${C.necesaria>0?"":"good"}">${tic("🔑","var(--coral-soft)")}<div class="l">Hipoteca necesaria</div><div class="v">${e0(C.H)}</div><div class="s">${+A.colchon?`${e0(C.necesaria)} + ${e0(A.colchon)} de colchón`:"lo que falta tras poner vuestro dinero"} · ${numTxt(Math.round(C.ltv))} % del precio</div></div>
      <div class="kpi">${tic("📆","var(--plum-soft)")}<div class="l">Cuota a ${numTxt(A.anos)} años</div><div class="v">${e0(C.cuota)}<span style="font-size:.9rem;font-weight:600"> /mes</span></div><div class="s">al ${numTxt(A.tipo)} % · ${e0(C.intTot)} de intereses en total</div></div>
    </div>
    ${av.length?`<div class="alerts">${av.map(a=>`<div class="alert ${a[0]}"><span class="ic em">${a[1]}</span><div>${a[2]}</div></div>`).join("")}</div>`:""}
    <div class="grid2">
      <div class="card"><div class="card-h"><h2>🏷️ El piso</h2></div><div class="list">
        ${fld("Precio de compra","🏡",n2("al-precio","precio",A.precio))}
        ${fld("Arras ya pagadas","🤝",n2("al-arras","arras",A.arras))}
        ${fld("Queda por pagar","💶",calc(C.pend))}
        ${fld("Firma prevista","🖊️",inDate("al-ff","fechaFirma",A.fechaFirma))}
        ${fld("Plazo de las arras","⏳",inDate("al-fa","fechaArras",A.fechaArras),"Si la firma va después de este plazo, la prórroga tiene que estar firmada por escrito.")}
      </div></div>
      <div class="card"><div class="card-h"><h2>🏛️ Impuestos y gastos</h2></div><div class="list">
        ${fld("ITP (%)","📜",n2("al-itp","itp",A.itp),"6,75 % si la rebaja andaluza de 2027 está en vigor el día de la firma; si no, 7 %.")}
        ${fld("Valor de referencia catastral","🔎",n2("al-vr","valorRef",A.valorRef),"Si es mayor que el precio, Hacienda calcula el ITP sobre él. Déjalo en 0 si no lo sabes.")}
        ${fld("ITP a pagar","🏛️",calc(C.itp))}
        ${fld("Notaría, registro y gestoría","🖋️",n2("al-not","notaria",A.notaria),"Entre 2.000 y 3.500 € con hipoteca.")}
        ${fld("Otros gastos (tasación…)","🧾",n2("al-otr","otros",A.otros))}
        ${fld("Total el día de la firma","💰",calc(C.total),"","total")}
      </div></div>
    </div>
    <div class="card"><div class="card-h"><h2>🏦 Cuentas remuneradas</h2><span class="tot">${e0(C.saldos+C.intereses)}</span></div>
      <p class="note" style="margin:0 0 10px">Apunta en cada cuenta el interés neto que te marca la app del banco y actualízalo cuando quieras. Desmarca "Cuenta para la firma" si ese dinero no va al piso o ya está contado en otra cuenta.</p>
      <div style="display:grid;gap:10px">${ctas}</div>
      <button class="add" data-act="add-cta" style="margin-top:10px" ${dis()}>+ Añadir cuenta</button></div>
    <div class="card"><div class="card-h"><h2>🔑 Hipoteca</h2><span class="tot">${e0(C.H)}</span></div><div class="list">
      ${fld("Lo que cuesta la firma","💰",calc(C.total))}
      ${fld("Menos vuestro dinero","🏦",calc(-C.fondos))}
      ${fld("Colchón extra que queréis pedir","🛟",n2("al-col","colchon",A.colchon),"Opcional: si preferís pedir algo más para no quedaros a cero tras firmar.")}
      ${fld("Reservado para muebles y otros","🛋️",n2("al-res","reservado",A.reservado),"Dinero de las cuentas que no queréis usar en la firma.")}
      ${fld("Hipoteca a pedir","🔑",calc(C.H),`Es el ${numTxt(Math.round(C.ltv))} % del precio; los bancos suelen financiar hasta el 80 %.`,"total")}
      ${fld("Tipo de interés (%)","📈",n2("al-tipo","tipo",A.tipo),"El HipoteCON Mixto de Cajamar: 2,30 % fijo los 5 primeros años y después euríbor + 0,60, así que la cuota cambiará a partir del sexto año.")}
      ${fld("Años","⏱️",n2("al-anos","anos",A.anos))}
      ${fld("Cuota mensual aproximada","📆",calc(C.cuota),`${e0(C.intTot)} de intereses a lo largo de ${numTxt(A.anos)} años.`,"total")}
    </div></div>
  </section>`;
}

// ---------- IMPORTAR ----------
function vImportar(){
  const imp=S.imp;
  return `<section class="panel"><div class="card">
    <div class="card-h"><h2>Subir el extracto del banco</h2>${mesesOrden().length?`<button class="btn ghost" id="imp-back">Volver</button>`:""}</div>
    <p class="note">El Excel de movimientos de la 6103, de un mes o de varios. Lo que ya esté guardado no se duplica. También puedes soltar aquí una copia de Nido (.json) para cargar todos los datos.</p>
    ${S.local||S.cloud?`<div class="row" style="margin-top:10px"><button class="btn soft" id="exp-copia">Descargar copia de seguridad</button><span class="small muted">${S.cloud?`Conectada como ${esc(S.user)}; los datos están en la nube y se ven en todos vuestros dispositivos.`:"Los datos se guardan solo en este navegador. Haz copia de vez en cuando."}</span>${S.cloud?`<button class="btn ghost" id="salir">Cerrar sesión</button>`:""}</div>`:""}
    <label class="drop" id="drop" style="margin-top:12px">Arrastra aquí el archivo o <u>elígelo</u><input type="file" id="file" accept=".xls,.xlsx,.csv,.json" hidden></label>
    ${imp?(imp.error?`<div class="alert warn" style="margin-top:14px"><span class="ic">!</span><div>${esc(imp.error)}</div></div>`:`
      <div style="margin-top:16px"><h3>${imp.nuevos.length} movimientos nuevos · ${imp.dup} ya estaban</h3>
      <div class="list" style="margin-top:6px">${Object.entries(imp.porMes).sort().map(([m,v])=>`<div class="it"><div class="main">${mLong(m)}</div><div class="right small">${v.n} nuevos · <span style="color:var(--mint)">+${e0(v.in)}</span> · −${e0(v.out)}</div></div>`).join("")}</div>
      <div class="row" style="margin-top:12px"><button class="btn" id="imp-ok" ${imp.nuevos.length&&S.writable?"":"disabled"}>Guardar</button><button class="btn ghost" id="imp-no">Descartar</button></div></div>`):""}
  </div>${vHistorial()}</section>`;
}
function vHistorial(){
  if(!S.db) return ""; const h=(S.db.dump()["config/historial"]||{items:[]}).items||[]; if(!h.length) return "";
  return `<div class="card" id="hist"><div class="card-h"><h2>🕘 Últimos cambios</h2></div><p class="note" style="margin:0 0 8px">Si algo se ha cambiado por error, pulsa "Volver atrás" en ese cambio y todo lo que tocó vuelve a como estaba antes.</p><div class="list">${h.map((it,k)=>`<div class="it"><div class="main" style="flex-direction:column;align-items:flex-start;gap:0"><span>${esc(it.motivo)} · ${esc(it.paths.map(ETQ).join(", "))}</span><span class="small muted">${new Date(it.t).toLocaleString("es-ES",{dateStyle:"short",timeStyle:"short"})}${it.u?" · "+esc(it.u.split("@")[0]):""}</span></div><div class="right"><button class="btn ghost" data-hrest="${k}">Volver atrás</button></div></div>`).join("")}</div></div>`;
}
function aFecha(v){
  if(v instanceof Date) return new Date(v.getTime()-v.getTimezoneOffset()*60000).toISOString().slice(0,10);
  if(typeof v==="number"){ const d=XLSX.SSF.parse_date_code(v); return `${d.y}-${String(d.m).padStart(2,"0")}-${String(d.d).padStart(2,"0")}`; }
  const s=String(v||"").trim(); let m=s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/); if(m){ const y=m[3].length===2?"20"+m[3]:m[3]; return `${y}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`; }
  m=s.match(/^(\d{4})-(\d{2})-(\d{2})/); return m?m[0]:null;
}
async function leerArchivo(file){
  if(/\.json$/i.test(file.name)) return restaurarCopia(file);
  try{
    if(typeof XLSX==="undefined") throw new Error("No se pudo cargar el lector de Excel. Recarga la página.");
    const wb=XLSX.read(await file.arrayBuffer(),{type:"array",cellDates:true});
    const rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,raw:true,defval:""});
    const hi=rows.findIndex(r=>r.some(c=>/^fecha$/i.test(String(c).trim()))&&r.some(c=>/importe/i.test(String(c))));
    if(hi<0) throw new Error("No encuentro las columnas Fecha, Concepto e Importe. ¿Es el extracto de movimientos?");
    const h=rows[hi].map(c=>String(c).trim().toLowerCase()); const cF=h.indexOf("fecha"), cC=h.findIndex(x=>x.startsWith("concepto")), cI=h.findIndex(x=>x.startsWith("importe"));
    const ex=new Map(); for(const m of mesesOrden()) for(const x of S.meses[m].movs){ const k=x.f+"|"+x.i.toFixed(2)+"|"+claveRegla(x.c); ex.set(k,(ex.get(k)||0)+1); }
    const nuevos=[]; let dup=0; const vis=new Map();
    for(const r of rows.slice(hi+1)){
      const f=aFecha(r[cF]), i=Math.round(parseNum(typeof r[cI]==="number"?String(r[cI]).replace(".",","):r[cI])*100)/100, raw=String(r[cC]||"").replace(/\r?\n/g," | ");
      if(!f||!raw||!i) continue;
      const c=limpiar(raw), k=f+"|"+i.toFixed(2)+"|"+claveRegla(c); const n=(vis.get(k)||0)+1; vis.set(k,n);
      const dv=(S.plan.divisiones||[]).find(d=>raw.toUpperCase().includes(d.match)&&f.startsWith(d.mes)&&Math.abs(-i-d.importe)<0.01);
      if(dv){ const k1=f+"|"+(-dv.partes[0].i).toFixed(2)+"|"+claveRegla(c); if((ex.get(k1)||0)>0||n<=(ex.get(k)||0)){ dup++; continue; } for(const pt of dv.partes) nuevos.push({f,c,i:-pt.i,cat:pt.cat,nota:pt.nota}); continue; }
      if(n<=(ex.get(k)||0)){ dup++; continue; }
      nuevos.push({f,c,i,cat:categorizar({f,raw,i},S.plan.reglas)});
    }
    const porMes={}; for(const x of nuevos){ const o=(porMes[x.f.slice(0,7)]??={n:0,in:0,out:0}); o.n++; if(x.i>0) o.in+=x.i; else o.out-=x.i; }
    S.imp={nuevos,dup,porMes};
  }catch(e){ S.imp={error:e.message||"No se pudo leer el archivo."}; }
  render();
}
async function confirmarImport(){
  const b=$("#imp-ok"); if(b){ b.disabled=true; b.textContent="Guardando…"; }
  const pm={}; for(const x of S.imp.nuevos) (pm[x.f.slice(0,7)]??=[]).push(x);
  for(const [m,l] of Object.entries(pm)){ const d=S.meses[m]||{mes:m,movs:[]}; d.movs=d.movs.concat(l).sort((a,b)=>a.f.localeCompare(b.f)); S.meses[m]=d; await guardarYa("meses/"+m); }
  const n=S.imp.nuevos.length; S.imp=null; setStatus(n+" movimientos guardados"); irA("mes");
}

// ---------- edición genérica ----------
function setPath(obj,path,val){
  const ks=path.split("."); let o=obj;
  for(let k=0;k<ks.length-1;k++){ const key=ks[k]; if(o[key]==null) o[key]={}; o=o[key]; }
  o[ks[ks.length-1]]=val;
}
function bind(){
  document.querySelectorAll("[data-path]").forEach(el=>{
    const upd=()=>{ const isNum=el.dataset.num==="1"; const v=el.dataset.bool==="1"?el.checked:isNum?parseNum(el.value):el.value;
      let path=el.dataset.path;
      if(el.dataset.doc==="alto"){ setPath(S.alto,path,v); guardarAlto(); if(el.dataset.bool==="1"||el.type==="date") render(); else renderSoon(); return; }
      const doc=el.dataset.doc==="metas"?S.metas:S.plan;
      if(el.dataset.doc==="metas"&&path.startsWith("sim.")){ setPath(S.metas,path,v); if(path==="sim.anos") S.metas.sim.anos=Math.min(40,Math.max(1,Math.round(v)||1)); }
      else if(el.dataset.doc==="metas"){ setPath(S.metas,path,v); }
      else if(path.startsWith("etiquetas.")||path.startsWith("recibosImporte.")||path.startsWith("presupuesto.")){ const i=path.indexOf("."); const root=path.slice(0,i), key=path.slice(i+1); (S.plan[root]??={})[key]=v; }
      else setPath(doc,path,v);
      if(el.dataset.doc==="metas"){ if(S.writable) guardarMetas(); } else guardarPlan();
      if(el.tagName==="SELECT") render(); else renderSoon(); };
    el.addEventListener(el.tagName==="SELECT"||el.type==="checkbox"||el.type==="date"?"change":"input",upd);
  });
  document.querySelectorAll("[data-act]").forEach(el=>el.onclick=()=>{
    const a=el.dataset.act, i=+el.dataset.i, p=S.plan;
    if(a==="add-cta"){ (S.alto.cuentas??=[]).push({n:"Nueva cuenta",saldo:0,interes:0,desde:new Date().toISOString().slice(0,10),fin:"",nota:"",incl:true}); guardarAlto(); render(); return; }
    if(a==="del-cta"){ S.alto.cuentas.splice(i,1); guardarAlto(); render(); return; }
    if(a==="add-hucha") (p.huchas??=[]).push({n:"Nueva hucha",v:0});
    if(a==="del-hucha") p.huchas.splice(i,1);
    if(a==="add-fijo") (p.fijos??=[]).push({n:"Nuevo gasto",cat:"Suscripciones",frec:"mensual",importe:0});
    if(a==="del-fijo") p.fijos.splice(i,1);
    if(a==="add-rec") (p.recibosManuales??=[]).push({n:"Nuevo recibo",mes:new Date().getMonth()+1,importe:0});
    if(a==="del-rec") p.recibosManuales.splice(i,1);
    if(a==="hide-rec") (p.recibosOcultos??={})[el.dataset.c]=true;
    if(a==="add-meta"){ (S.metas.metas??=[]).push({id:"m"+Date.now(),n:"Nueva meta",obj:0,act:0,mes:0}); guardarMetas(); render(); return; }
    if(a==="del-meta"){ S.metas.metas.splice(i,1); guardarMetas(); render(); return; }
    guardarPlan(); render();
  });
  document.querySelectorAll("[data-vercat]").forEach(el=>el.onclick=()=>{ S.f={q:"",cat:el.dataset.vercat,mes:el.dataset.vermes||"",kind:""}; irA("movs"); });
  const sm=$("#sel-mes"); if(sm) sm.onchange=()=>{ S.mesSel=sm.value; render(); };
  const fq=$("#f-q"); if(fq){ let t; fq.oninput=()=>{ clearTimeout(t); t=setTimeout(()=>{ S.f.q=fq.value; render(); },250); }; }
  [["f-mes","mes"],["f-cat","cat"],["f-kind","kind"]].forEach(([id,k])=>{ const el=document.getElementById(id); if(el) el.onchange=()=>{ S.f[k]=el.value; render(); }; });
  document.querySelectorAll("select[data-cat]").forEach(el=>el.onchange=()=>cambiarCat(el.dataset.m,+el.dataset.i,el.value));
  document.querySelectorAll("input[data-nota]").forEach(el=>el.oninput=()=>{ const x=S.meses[el.dataset.m].movs[+el.dataset.i]; x.nota=el.value; guardarMes(el.dataset.m); });
  const at=$("#aplicar-todos"); if(at) at.onclick=aplicarATodos;
  document.querySelectorAll("[data-dividir]").forEach(b=>b.onclick=()=>{ const [m,i]=b.dataset.dividir.split("|"); const x=S.meses[m].movs[+i]; const tot=-x.i;
    const r=prompt(`Este movimiento es de ${e2(tot)}. ¿Qué importe quieres separar en otro movimiento? (por ejemplo, la parte extraordinaria)`); const v=parseNum(r); if(!v||v<=0||v>=tot) return;
    x.i=-(Math.round((tot-v)*100)/100); S.meses[m].movs.splice(+i+1,0,{f:x.f,c:x.c,i:-v,cat:"Extraordinario",nota:"Parte separada de "+e2(tot)}); guardarMes(m); render(); });
  const hz=$("#hist"); if(hz) hz.querySelectorAll("[data-hrest]").forEach(b=>b.onclick=async()=>{ const it=(S.db.dump()["config/historial"]||{items:[]}).items[+b.dataset.hrest]; if(it&&confirm("¿Volver a como estaba antes de este cambio?")){ await restaurar(it.paths,it.antes,"Vuelta atrás"); toast("Restaurado"); } });
  const file=$("#file"), drop=$("#drop");
  if(file){ file.onchange=()=>file.files[0]&&leerArchivo(file.files[0]); drop.ondragover=e=>{e.preventDefault();drop.classList.add("on");}; drop.ondragleave=()=>drop.classList.remove("on"); drop.ondrop=e=>{e.preventDefault();drop.classList.remove("on"); const f=e.dataTransfer.files[0]; if(f) leerArchivo(f);}; }
  const ok=$("#imp-ok"); if(ok) ok.onclick=confirmarImport;
  const no=$("#imp-no"); if(no) no.onclick=()=>{ S.imp=null; render(); };
  const ex=$("#exp-copia"); if(ex) ex.onclick=exportarCopia;
  const sl=$("#salir"); if(sl) sl.onclick=async()=>{ if(confirm("¿Cerrar sesión en este dispositivo?")){ await S.sb.auth.signOut(); location.reload(); } };
  const bk=$("#imp-back"); if(bk) bk.onclick=()=>{ S.imp=null; irA("inicio"); };
}
document.querySelectorAll("#tabs button").forEach(b=>b.onclick=()=>irA(b.dataset.t));
$("#go-import").onclick=()=>irA("importar");

// ---------- almacenamiento: mismo formato en local y en la nube ----------
function makeStore(st, writer){
  const subs=[]; const notify=()=>subs.forEach(f=>f());
  const snap=(id,d)=>({id,exists:d!==undefined,data:()=>d,metadata:{}});
  return {
    collection:c=>({onSnapshot:cb=>{ const f=()=>cb({docs:Object.keys(st).filter(k=>k.startsWith(c+"/")).sort().map(k=>snap(k.slice(c.length+1),st[k]))}); subs.push(f); setTimeout(f,0); return ()=>{}; }}),
    doc:p=>({ onSnapshot:cb=>{ const f=()=>cb(snap(p.split("/").pop(),st[p])); subs.push(f); setTimeout(f,0); return ()=>{}; },
      get:async()=>snap(p.split("/").pop(),st[p]),
      set:async d=>{ st[p]=JSON.parse(JSON.stringify(d)); notify(); await writer(p,st[p]); } }),
    dump:()=>JSON.parse(JSON.stringify(st)),
    _st:st, _notify:notify
  };
}
const LKEY="dino_db_v1";
function leerLocal(){ try{ return JSON.parse(localStorage.getItem(LKEY))||{}; }catch(e){ return {}; } }
function localDB(){
  const st=leerLocal();
  return makeStore(st, async()=>{ try{ localStorage.setItem(LKEY,JSON.stringify(st)); }catch(e){ setStatus("El navegador no deja guardar datos"); } });
}

// ---------- nube (Supabase): los mismos datos en todos los dispositivos ----------
const SUPA_URL="https://vaqbeirrqtdcpzolxpap.supabase.co";
const SUPA_KEY="sb_publishable_yiuLOOWVwbTRT65Llr2PCw_HtjFDxIC";
const PERMITIDOS=["lauranovelmunoz@gmail.com","francisco@inmobiliariadn.com"];
async function nubeDB(sb,email){
  const st={}, mios={};
  const cargar=async()=>{ const {data,error}=await sb.from("docs").select("path,data"); if(error) throw error; for(const k in st) delete st[k]; data.forEach(r=>st[r.path]=r.data); };
  await cargar();
  const store=makeStore(st, async(path,data)=>{ mios[path]=Date.now(); const {error}=await sb.from("docs").upsert({path,data,updated_at:new Date().toISOString(),updated_by:email}); if(error){ setStatus("No se pudo guardar en la nube; revisa la conexión"); throw error; } });
  sb.channel("nido-docs").on("postgres_changes",{event:"*",schema:"public",table:"docs"},pl=>{
    const path=(pl.new&&pl.new.path)||(pl.old&&pl.old.path); if(!path) return;
    if(mios[path]&&Date.now()-mios[path]<4000) return;
    if(pl.eventType==="DELETE") delete st[path]; else st[path]=pl.new.data;
    store._notify(); setStatus("Actualizado desde otro dispositivo");
  }).subscribe();
  document.addEventListener("visibilitychange",async()=>{ if(document.visibilityState==="visible"){ try{ await cargar(); store._notify(); }catch(e){} } });
  return store;
}
function vLogin(){
  const L=S.login||{}, m=L.mode||"entrar";
  if(L.fatal) return `<div class="card" style="max-width:520px"><div class="card-h"><h2>🔒 Sin acceso</h2></div><p>${esc(L.fatal)}</p><button class="btn soft" id="lg-out">Entrar con otro correo</button></div>`;
  const inp=(id,type,label,val,ac)=>`<label class="field" style="flex:1 1 100%">${label}<span class="pw"><input class="n" style="width:100%;text-align:left;font-family:var(--body);font-weight:400" type="${type}" id="${id}" name="${id}" value="${esc(val||"")}" autocomplete="${ac}" required>${type==="password"?`<button type="button" class="eye" data-eye="${id}" aria-label="Mostrar contraseña" title="Mostrar contraseña">👁️</button>`:""}</span></label>`;
  const T={entrar:["🔐 Entrar en Nido","Correo y contraseña. El navegador te ofrecerá guardarla y la sesión se queda abierta en este dispositivo."],
           crear:["✨ Crear cuenta","Para quien entra por primera vez. Te llegará un correo para confirmar la cuenta; después ya entras con tu contraseña."],
           olvido:["🔑 Crear o cambiar contraseña","Te mandamos un correo con un enlace. Ábrelo en este navegador y elige tu contraseña."],
           nueva:["🔑 Elige tu contraseña","Mínimo 8 caracteres. Después entrarás siempre con ella."]}[m];
  let campos="";
  if(m==="entrar") campos=inp("lg-email","email","Correo",L.email,"username")+inp("lg-pass","password","Contraseña","","current-password");
  if(m==="crear") campos=inp("lg-email","email","Correo",L.email,"username")+inp("lg-pass","password","Contraseña nueva","","new-password")+inp("lg-pass2","password","Repite la contraseña","","new-password");
  if(m==="olvido") campos=inp("lg-email","email","Correo",L.email,"username");
  if(m==="nueva") campos=`<input type="email" name="username" autocomplete="username" value="${esc(L.email||"")}" hidden>`+inp("lg-pass","password","Contraseña nueva","","new-password")+inp("lg-pass2","password","Repite la contraseña","","new-password");
  const boton={entrar:"Entrar",crear:"Crear cuenta",olvido:"Enviarme el enlace",nueva:"Guardar contraseña"}[m];
  const links=m==="nueva"?"":[m!=="entrar"?`<button type="button" class="btn ghost" data-lgm="entrar">Ya tengo contraseña</button>`:"",m!=="olvido"?`<button type="button" class="btn ghost" data-lgm="olvido">Crear o cambiar contraseña</button>`:"",m!=="crear"?`<button type="button" class="btn ghost" data-lgm="crear">Crear cuenta</button>`:""].join("");
  return `<section class="panel" style="max-width:520px">
    <form class="card" id="lg-form" autocomplete="on"><div class="card-h"><h2>${T[0]}</h2></div>
      <p class="note" style="margin:0 0 12px">${T[1]}</p>
      ${L.msg?`<div class="alert ok" style="margin-bottom:12px"><span class="ic em">📬</span><div>${L.msg}</div></div>`:""}
      <div class="row">${campos}</div>
      <div class="row" style="margin-top:14px;align-items:center"><button class="btn" type="submit" id="lg-go">${boton}</button></div>
      ${L.error?`<div class="alert warn" style="margin-top:12px"><span class="ic em">⚠️</span><div>${esc(L.error)}</div></div>`:""}
      <div class="row" style="margin-top:10px;gap:4px">${links}</div>
    </form></section>`;
}
function bindLogin(){
  const sb=S.sb, L=S.login, m=L.mode||"entrar";
  document.querySelectorAll("[data-eye]").forEach(b=>b.onclick=()=>{ const i=$("#"+b.dataset.eye); const ver=i.type==="password"; i.type=ver?"text":"password"; b.textContent=ver?"🙈":"👁️"; b.title=b.ariaLabel=ver?"Ocultar contraseña":"Mostrar contraseña"; i.focus(); });
  document.querySelectorAll("[data-lgm]").forEach(b=>b.onclick=()=>{ const em=$("#lg-email"); S.login={mode:b.dataset.lgm,email:em?em.value.trim():L.email}; render(); });
  const out=$("#lg-out"); if(out) out.onclick=async()=>{ await sb.auth.signOut(); S.login={}; render(); };
  const f=$("#lg-form"); if(!f) return;
  f.onsubmit=async ev=>{ ev.preventDefault(); const go=$("#lg-go"); go.disabled=true;
    const v=id=>{ const e=$("#"+id); return e?e.value:""; };
    const email=(v("lg-email")||L.email||"").trim().toLowerCase(); L.email=email; L.error=null; L.msg=null;
    const redir=location.origin+location.pathname;
    try{
      if(m!=="nueva"&&!PERMITIDOS.includes(email)) throw new Error("Ese correo no tiene acceso a Nido.");
      if((m==="crear"||m==="nueva")&&v("lg-pass").length<8) throw new Error("La contraseña tiene que tener al menos 8 caracteres.");
      if((m==="crear"||m==="nueva")&&v("lg-pass")!==v("lg-pass2")) throw new Error("Las dos contraseñas no coinciden.");
      if(m==="entrar"){ const {error}=await sb.auth.signInWithPassword({email,password:v("lg-pass")}); if(error) throw new Error(/confirm/i.test(error.message)?"Falta confirmar la cuenta desde el correo que te enviamos.":"Correo o contraseña incorrectos. Si aún no tienes contraseña, pulsa «Crear o cambiar contraseña»."); history.replaceState(null,"",redir); location.reload(); return; }
      if(m==="crear"){ const {data,error}=await sb.auth.signUp({email,password:v("lg-pass"),options:{emailRedirectTo:redir}}); if(error) throw new Error(/rate|limit|seconds/i.test(error.message)?"Ahora no se puede enviar el correo: el servicio tiene un límite por hora. Prueba dentro de un rato.":error.message);
        if(data.session){ history.replaceState(null,"",redir); location.reload(); return; }
        if(data.user&&data.user.identities&&data.user.identities.length===0){ const r=await sb.auth.resetPasswordForEmail(email,{redirectTo:redir}); if(r.error) throw new Error(/rate|limit|seconds/i.test(r.error.message)?"Ese correo ya tiene cuenta, pero ahora no se puede enviar el enlace: el servicio de correo tiene un límite por hora. Prueba dentro de un rato con «Crear o cambiar contraseña».":"Ese correo ya tiene cuenta. Usa «Crear o cambiar contraseña» ("+r.error.message+")."); S.login={mode:"entrar",email,msg:`Ese correo ya tenía cuenta. Te hemos enviado a <b>${esc(email)}</b> un enlace para elegir la contraseña.`}; return render(); }
        S.login={mode:"entrar",email,msg:`Cuenta creada. Confírmala desde el correo que te hemos enviado a <b>${esc(email)}</b> y después entra con tu contraseña.`}; return render(); }
      if(m==="olvido"){ const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:redir}); if(error) throw new Error(/rate|limit|seconds/i.test(error.message)?"Ahora no se puede enviar el correo: el servicio tiene un límite de envíos por hora. Prueba dentro de un rato.":"No se pudo enviar el correo ("+error.message+"). Espera un minuto y vuelve a probar."); S.login={mode:"olvido",email,msg:`Te hemos enviado un enlace a <b>${esc(email)}</b>. Ábrelo en este navegador para elegir la contraseña.`}; return render(); }
      if(m==="nueva"){ const {error}=await sb.auth.updateUser({password:v("lg-pass")}); if(error) throw new Error(/different/i.test(error.message)?"La contraseña nueva tiene que ser distinta de la anterior.":"No se pudo guardar ("+error.message+"). Pide otro enlace."); history.replaceState(null,"",redir); location.reload(); return; }
    }catch(e){ L.error=e.message; render(); }
  };
}

function exportarCopia(){
  const st=S.db.dump(); const out={meses:{},plan:st["config/plan"]||null,metas:st["config/metas"]||null,altovelo:st["config/altovelo"]||null};
  for(const k in st) if(k.startsWith("meses/")) out.meses[k.slice(6)]=st[k];
  const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([JSON.stringify(out)],{type:"application/json"}));
  a.download="nido-copia-"+new Date().toISOString().slice(0,10)+".json"; document.body.appendChild(a); a.click(); a.remove();
}
async function restaurarCopia(file){
  try{
    const d=JSON.parse(await file.text()); if(!d||!d.meses) throw new Error();
    for(const m of Object.keys(d.meses)) await S.db.doc("meses/"+m).set(d.meses[m]);
    if(d.plan) await S.db.doc("config/plan").set(d.plan);
    if(d.metas) await S.db.doc("config/metas").set(d.metas);
    if(d.altovelo) await S.db.doc("config/altovelo").set(d.altovelo);
    S.imp=null; setStatus("Copia cargada"); irA("inicio");
  }catch(e){ S.imp={error:"Ese archivo no es una copia de Nido válida."}; render(); }
}

// ---------- recibos detectados en el extracto de 2025 (se añaden una sola vez) ----------
function migrar2025(p){
  const L=(p.recibosManuales??=[]);
  const add=(n,importe,mes)=>{ if(!L.some(r=>r.n===n)) L.push({n,importe,mes}); };
  const ibi=L.find(r=>/IBI/i.test(r.n||""));
  if(ibi){ if(!+ibi.importe){ ibi.importe=767; ibi.mes=1; ibi.n="IBI de la vivienda (2025: unos 767 € en 7 plazos; comprobar 2026)"; } }
  else add("IBI de la vivienda (2025: unos 767 € en 7 plazos; comprobar 2026)",767,1);
  add("ITV del coche (VEIASA El Palo)",41.23,5);
  add("Revisión de la moto (Servimoto)",130.1,11);
  add("Recibo sin identificar · ref. 25115642867",140.71,11);
  add("Extra del colegio a inicio de curso",37,9);
  add("Extra del AMPA en verano",74,7);
  p.migr2025=true; return p;
}

function migrarOct26(p){
  const F=(p.fijos??=[]);
  for(const f of F){ if(/tenis/i.test(f.n||"")) f.ef=true; if(/rosa/i.test(f.n||"")){ f.ef=true; if(!f.match) f.match="ROSA MARIA G. F."; } if(f.match==="GUILLERMO L.") f.ef=true; }
  if(!F.some(f=>/rob[oó]tica/i.test(f.n||""))) F.push({n:"Extraescolares: robótica (42 €) y diseño informático (39 €)",cat:"Colegio y Guille",frec:"octmay",importe:81,match:"GRUPO EDUCATIVO ASUNCION",nota:"De octubre a mayo. Se cobran por el Grupo Educativo Asunción."});
  p.migrOct26=true; return p;
}

// ---------- arranque ----------
render();
(async()=>{
  let db=null;
  try{ db=window.claude&&window.claude.use?await window.claude.use("db"):null; }catch(e){ db=null; }
  if(!db&&window.supabase&&window.supabase.createClient){
    const esRecuperacion=/type=recovery/.test(location.hash);
    const sb=window.supabase.createClient(SUPA_URL,SUPA_KEY); S.sb=sb;
    const {data:{session}}=await sb.auth.getSession();
    if(session&&esRecuperacion){ S.login={mode:"nueva",email:session.user.email}; render(); return; }
    if(!session){ S.login={mode:"entrar"}; render(); return; }
    const email=(session.user.email||"").toLowerCase();
    if(!PERMITIDOS.includes(email)){ S.login={fatal:`${email} no tiene acceso a Nido.`}; render(); return; }
    setStatus("Conectando…");
    try{ db=await nubeDB(sb,email); }catch(e){ S.login={fatal:"No se pudo conectar con la nube. Revisa la conexión y recarga la página."}; render(); return; }
    S.cloud=true; S.user=email;
    // primera vez: si la nube está vacía y este dispositivo tiene datos, se suben
    const loc=leerLocal(); const nubeVacia=!Object.keys(db._st).some(k=>k.startsWith("meses/"));
    if(nubeVacia&&Object.keys(loc).some(k=>k.startsWith("meses/"))){ setStatus("Subiendo tus datos a la nube…"); for(const k of Object.keys(loc)) await db.doc(k).set(loc[k]); setStatus("Datos subidos a la nube"); }
  }
  if(!db){ db=localDB(); S.local=true; }
  S.db=db;
  if(S.local||S.cloud){ const pl=await db.doc("config/plan").get(); if(!pl.exists) await db.doc("config/plan").set({nomina:0,cisco:0,pagaExtra:0,nPagasExtra:2,huchas:[],fijos:[],presupuesto:{},recibosManuales:[],reglas:[]}); }
  if(!S.local) try{ const u=await window.claude.use("user"); if(u&&u.can){ const w=await u.can("data.write"); if(w===false) S.writable=false; } }catch(e){}
  const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const err=e=>setStatus(e&&e.code==="revoked"?"Acceso retirado":"No se pudieron leer los datos; recarga");
  db.collection("meses").onSnapshot(s=>{ const n={}; s.docs.forEach(d=>n[d.id]=JSON.parse(JSON.stringify(d.data()))); for(const p of S.dirty) if(p.startsWith("meses/")&&S.meses[p.slice(6)]) n[p.slice(6)]=S.meses[p.slice(6)]; const ch=!same(n,S.meses)||!S.ready.meses; S.meses=n; S.ready.meses=true; if(ch){ setStatus(S.writable?"Al día":"Solo lectura"); render(); } },err);
  db.doc("config/altovelo").onSnapshot(d=>{ if(S.dirty.has("config/altovelo")) return; let p=d.exists?JSON.parse(JSON.stringify(d.data())):null; if(!p){ p=JSON.parse(JSON.stringify(ALTO_DEF)); if(S.writable) db.doc("config/altovelo").set(p).catch(()=>{}); } const ch=!same(p,S.alto)||!S.ready.alto; S.alto=p; S.ready.alto=true; if(ch&&!(document.activeElement&&document.activeElement.dataset&&document.activeElement.dataset.path)) render(); },err);
  db.doc("config/plan").onSnapshot(d=>{ if(S.dirty.has("config/plan")) return; let p=d.exists?JSON.parse(JSON.stringify(d.data())):null; if(p&&S.writable&&(!p.migr2025||!p.migrOct26)){ if(!p.migr2025) p=migrar2025(p); if(!p.migrOct26) p=migrarOct26(p); db.doc("config/plan").set(JSON.parse(JSON.stringify(p))).catch(()=>{}); } const ch=!same(p,S.plan)||!S.ready.plan; S.plan=p; S.ready.plan=true; if(ch&&!(document.activeElement&&document.activeElement.dataset&&document.activeElement.dataset.path)) render(); },err);
  db.doc("config/metas").onSnapshot(d=>{ if(S.dirty.has("config/metas")) return; const p=d.exists?JSON.parse(JSON.stringify(d.data())):{metas:[],sim:{ini:0,mes:100,anos:10,r:4}}; const ch=!same(p,S.metas)||!S.ready.metas; S.metas=p; S.ready.metas=true; if(ch&&!(document.activeElement&&document.activeElement.dataset&&document.activeElement.dataset.path)) render(); },err);
})();

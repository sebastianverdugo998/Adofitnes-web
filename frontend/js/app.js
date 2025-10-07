// ===== Config =====
const API_BASE = 'http://localhost:4000';
const $ = (s, c=document)=>c.querySelector(s);
const $$ = (s, c=document)=>Array.from(c.querySelectorAll(s));

$('#y').textContent = new Date().getFullYear();

// Tema
const btnTheme = $('#btnTheme');
const applyTheme = (mode) => {
  document.body.classList.toggle('light', mode === 'light');
  if (btnTheme) btnTheme.textContent = mode === 'light' ? '🌞' : '🌙';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', mode === 'light' ? '#f6f8fb' : '#0b0f14');
};
const savedTheme = localStorage.getItem('ado_theme') || 'dark';
applyTheme(savedTheme);
btnTheme?.addEventListener('click', ()=>{
  const next = document.body.classList.contains('light') ? 'dark' : 'light';
  localStorage.setItem('ado_theme', next); applyTheme(next);
});

// Menú móvil + links
const btnMenu = $('#btnMenu'); const nav = $('.menu'); const header = $('.header');
btnMenu?.addEventListener('click', ()=>{
  const open = getComputedStyle(nav).display !== 'none';
  nav.style.display = open ? 'none' : 'flex';
  nav.style.flexDirection = 'column';
  nav.style.background = 'rgba(11,15,20,.95)';
  nav.style.position = 'absolute'; nav.style.right = '4%';
  nav.style.top = (header?.offsetHeight || 56) + 8 + 'px'; nav.style.padding = '12px';
  nav.style.border = '1px solid rgba(255,255,255,.08)'; nav.style.borderRadius = '12px';
});
function scrollToId(id){ const el = document.querySelector(id); if(!el) return; el.scrollIntoView({behavior:'smooth'}); if(getComputedStyle(btnMenu).display!=='none'){ nav.style.display='none'; } }
$$('.nav-link').forEach(a=> a.addEventListener('click', e=>{ e.preventDefault(); const id=a.getAttribute('href'); scrollToId(id); history.pushState(null,'',id); }));
window.addEventListener('load', ()=>{ if(location.hash) scrollToId(location.hash); });

// Scrollspy
const spySections = ['#planes','#clases','#horario','#entrenadores','#testimonios','#faq','#contacto'].map(id=>document.querySelector(id)).filter(Boolean);
const spyLinks = $$('.nav-link');
const spy = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{ if(e.isIntersecting){ spyLinks.forEach(l=> l.classList.toggle('active', l.getAttribute('href')==='#'+e.target.id)); } });
},{threshold:.55});
spySections.forEach(s=> spy.observe(s));

// Mostrar to-top
const toTopBtn = $('#toTop');
window.addEventListener('scroll', ()=>{ toTopBtn.style.display = window.scrollY>420 ? 'inline-flex':'none'; });
toTopBtn.addEventListener('click', ()=> window.scrollTo({top:0, behavior:'smooth'}));

// Reveal on scroll
const reveals = $$('.reveal, .card, .tile, .trainer');
const obs = new IntersectionObserver((ents)=>{ ents.forEach(ent=>{ if(ent.isIntersecting){ ent.target.classList.add('in'); obs.unobserve(ent.target); } }); }, {threshold:.15});
revelsInit();
function revelsInit(){ reveals.forEach(el=>{ el.classList.add('reveal'); obs.observe(el); }); }

// KPIs counters
$$('[id^="k"]').forEach(el=>{
  const target = Number(el.dataset.target||0); let started=false;
  const io = new IntersectionObserver(([e])=>{
    if(e.isIntersecting && !started){ started=true; let v=0; const step=Math.max(1,Math.round(target/120));
      const tick=()=>{ v+=step; if(v>=target){ el.textContent=target; return; } el.textContent=v; requestAnimationFrame(tick); }; tick(); io.disconnect();
    }
  },{threshold:.7}); io.observe(el);
});

// Cargar datos desde API
async function api(path, opts){ const r = await fetch(API_BASE+path, opts); if(!r.ok) throw new Error(await r.text()); return r.json(); }

// Planes
let coupon = null; const toggle = $('#billingToggle'); const plansGrid = $('#plansGrid'); const planSelect = $('#planSelect');
function formatCOP(n){ return n.toLocaleString('es-CO', {style:'currency', currency:'COP', maximumFractionDigits:0}); }
function planCard(p){
  const monthly = p.monthly, yearly = p.yearly;
  const price = toggle?.checked ? yearly : monthly;
  const el = document.createElement('article'); el.className='card plan'; el.dataset.plan=p.name;
  el.innerHTML = `
    <h3>${p.name}${p.name==='Pro' ? ' 💥':''}</h3>
    <p class="price" data-monthly="${monthly}" data-yearly="${yearly}">${formatCOP(price)}/mes</p>
    <ul class="list">${p.features.map(f=>`<li>✅ ${f}</li>`).join('')}</ul>
    <p><button class="cta select-plan" type="button">Elegir</button></p>`;
  return el;
}
async function loadPlans(){
  try{
    const data = await api('/api/plans');
    plansGrid.innerHTML=''; data.forEach(p=> plansGrid.appendChild(planCard(p)));
    // llenar select de contacto
    planSelect.innerHTML = '<option value="">Selecciona…</option>' + data.map(p=>`<option>${p.name}</option>`).join('');
    bindPlanButtons(); updatePrices();
  }catch(e){ plansGrid.innerHTML = `<div class="hint err">No pude cargar planes. ¿Iniciaste la API?</div>`; }
}
function updatePrices(){
  $$('.plan .price').forEach(p=>{
    const base = Number(toggle?.checked ? p.dataset.yearly : p.dataset.monthly);
    let total = base;
    if(coupon==='ADO15') total=Math.round(base*0.85);
    if(coupon==='ADOFIT10') total=Math.round(base*0.90);
    p.textContent = `${formatCOP(total)}/mes`;
  });
}
function bindPlanButtons(){
  $$('.select-plan').forEach(btn=> btn.addEventListener('click', ()=>{
    const plan = btn.closest('.plan')?.dataset.plan || '';
    if(plan){ planSelect.value = plan; $('#contacto').scrollIntoView({behavior:'smooth'}); }
  }));
}
$('#applyCoupon')?.addEventListener('click', ()=>{
  const code = $('#couponInput').value.trim().toUpperCase();
  const msg = $('#couponMsg'); const valid=['ADO15','ADOFIT10'];
  if(valid.includes(code)){ coupon=code; msg.textContent=`Cupón ${code} aplicado.`; msg.className='hint ok'; }
  else { coupon=null; msg.textContent='Cupón inválido.'; msg.className='hint err'; }
  updatePrices();
});
toggle?.addEventListener('change', updatePrices);

// Clases
const classesGrid = $('#classesGrid'); const classSelect = $('#classSelect');
async function loadClasses(){
  try{
    const data = await api('/api/classes');
    classesGrid.innerHTML = '';
    data.forEach(c=>{
      const el = document.createElement('div'); el.className='tile'; el.dataset.tags = c.tag;
      el.innerHTML = `<b>${c.name}</b><small> ${c.desc}</small><button class="cta book" data-class="${c.name}" type="button">Reservar</button>`;
      classesGrid.appendChild(el);
    });
    // llenar select del modal
    classSelect.innerHTML = '<option value="">Selecciona…</option>' + data.map(c=>`<option>${c.name}</option>`).join('');
    bindBookButtons();
  }catch(e){ classesGrid.innerHTML = `<div class="hint err">No pude cargar clases. API apagada.</div>`; }
}
// Filtro clases
const chips = $$('.chip');
chips.forEach(ch=> ch.addEventListener('click', ()=>{
  chips.forEach(c=>c.classList.remove('is-active')); ch.classList.add('is-active');
  const tag = ch.dataset.filter;
  $$('#classesGrid .tile').forEach(tile=>{
    const has = (tile.dataset.tags||'').split(',').includes(tag);
    tile.style.display = (tag==='all'||has) ? '' : 'none';
  });
}));

// Horario
const tbody = $('#scheduleTable tbody');
async function loadSchedule(){
  try{
    const data = await api('/api/schedule');
    renderScheduleRows(data);
    // filtros
    $('#dayFilter').addEventListener('change', ()=> renderScheduleRows(data));
    $('#searchClass').addEventListener('input', ()=> renderScheduleRows(data));
  }catch(e){ tbody.innerHTML = `<tr><td colspan="5" class="hint err">No pude cargar el horario. API apagada.</td></tr>`; }
}
function renderScheduleRows(rows){
  const day = $('#dayFilter').value; const q = $('#searchClass').value.toLowerCase().trim();
  tbody.innerHTML='';
  rows.filter(r => day==='all' || r.dia===day)
      .filter(r => !q || r.clase.toLowerCase().includes(q) || r.coach.toLowerCase().includes(q))
      .forEach(r=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${r.dia}</td><td>${r.hora}</td><td>${r.clase}</td><td>${r.coach}</td>`;
        const td = document.createElement('td');
        const btn = document.createElement('a');
        const params = new URLSearchParams({ dia:r.dia, hora:r.hora, clase:r.clase, coach:r.coach });
        btn.href = `${API_BASE}/api/schedule/ics?`+params.toString();
        btn.textContent = 'Agregar a calendario';
        btn.className = 'ghost';
        td.appendChild(btn); tr.appendChild(td); tbody.appendChild(tr);
      });
}

// Entrenadores
const trainersGrid = $('#trainersGrid');
async function loadTrainers(){
  try{
    const data = await api('/api/trainers');
    trainersGrid.innerHTML = data.map(t => `
      <article class="card trainer reveal"><div class="avatar" aria-hidden="true"></div>
        <h4>${t.name}</h4><p>${t.focus}</p></article>
    `).join('');
  }catch(e){ trainersGrid.innerHTML = `<div class="hint err">No pude cargar entrenadores. API apagada.</div>`; }
}

// Modal reservas
const modal = $('#bookingModal'); const openers = [$('#openBooking'), $('#fabBook')];
const closers = [$('#closeModal'), $('#cancelBook')]; const bookMsg = $('#bookMsg');
function bindBookButtons(){ $$('.book').forEach(b => b.addEventListener('click', ()=>{ classSelect.value = b.dataset.class || ''; modal.style.display='flex'; })); }
openers.forEach(b=> b?.addEventListener('click', ()=> modal.style.display='flex'));
closers.forEach(b=> b?.addEventListener('click', ()=> modal.style.display='none'));
modal.addEventListener('click', (e)=>{ if(e.target===modal) modal.style.display='none'; });

// Reservar (POST a API)
$('#bookingForm')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const fd = new FormData(e.target);
  const payload = Object.fromEntries(fd.entries());
  if(!/.+@.+\..+/.test(payload.email)){ bookMsg.textContent='Correo inválido.'; bookMsg.className='hint err'; return; }
  try{
    const res = await api('/api/bookings', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    bookMsg.textContent = '¡Reserva creada! Revisa tu calendario.'; bookMsg.className='hint ok';
    e.target.reset(); setTimeout(()=>{ modal.style.display='none'; bookMsg.textContent=''; }, 1200);
  }catch(err){
    bookMsg.textContent = 'Error creando reserva. ¿API iniciada?'; bookMsg.className='hint err';
  }
});

// Contacto (POST a API)
const form = $('#form'); const msg = $('#formMsg');
form?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  if(!data.nombre || !data.email || !data.plan){ msg.textContent='Completa nombre, email y plan.'; msg.className='hint err'; return; }
  if(!/.+@.+\..+/.test(data.email)){ msg.textContent='El correo no parece válido.'; msg.className='hint err'; return; }
  try{
    await api('/api/contact', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) });
    msg.innerHTML = '¡Gracias, <b>'+data.nombre+'</b>! Te escribiremos a <b>'+data.email+'</b> sobre el plan <b>'+data.plan+'</b>.';
    msg.className='hint ok'; form.reset();
  }catch(e){ msg.textContent='No pude enviar el formulario. ¿API iniciada?'; msg.className='hint err'; }
});

// Carrusel
const track = $('#carTrack'); const slides = Array.from(track.children); let idx=0; const dotsBox = $('#dots');
function makeDots(){ slides.forEach((_,i)=>{ const d=document.createElement('span'); d.className='dot'+(i===0?' active':''); d.setAttribute('role','button'); d.addEventListener('click',()=>goTo(i)); dotsBox.appendChild(d); }); }
function updateDots(){ dotsBox.querySelectorAll('.dot').forEach((d,i)=> d.classList.toggle('active', i===idx)); }
function goTo(i){ idx=(i+slides.length)%slides.length; track.style.transform=`translateX(-${idx*100}%)`; updateDots(); }
$('#prev').addEventListener('click', ()=> goTo(idx-1)); $('#next').addEventListener('click', ()=> goTo(idx+1)); makeDots(); setInterval(()=> goTo(idx+1), 4500);

// Init
(async function init(){
  await Promise.all([loadPlans(), loadClasses(), loadSchedule(), loadTrainers()]);
  revelsInit();
})();

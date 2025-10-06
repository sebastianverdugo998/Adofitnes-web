// Helpers
const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

// Año dinámico
$('#y').textContent = new Date().getFullYear();

// Tema claro/oscuro (persistencia en localStorage)
const btnTheme = $('#btnTheme');
const applyTheme = (mode) => {
  document.body.classList.toggle('light', mode === 'light');
  if (btnTheme) btnTheme.textContent = mode === 'light' ? '🌞' : '🌙';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', mode === 'light' ? '#f6f8fb' : '#0b0f14');
};
const savedTheme = localStorage.getItem('ado_theme') || 'dark';
applyTheme(savedTheme);
btnTheme?.addEventListener('click', () => {
  const next = document.body.classList.contains('light') ? 'dark' : 'light';
  localStorage.setItem('ado_theme', next);
  applyTheme(next);
});

// Menú móvil con autocierre al navegar
const btnMenu = $('#btnMenu');
const nav = $('.menu');
const header = $('.header');
btnMenu?.addEventListener('click', ()=>{
  const open = getComputedStyle(nav).display !== 'none';
  nav.style.display = open ? 'none' : 'flex';
  nav.style.flexDirection = 'column';
  nav.style.background = 'rgba(11,15,20,.95)';
  nav.style.position = 'absolute';
  nav.style.right = '4%';
  nav.style.top = (header?.offsetHeight || 56) + 8 + 'px';
  nav.style.padding = '12px';
  nav.style.border = '1px solid rgba(255,255,255,.08)';
  nav.style.borderRadius = '12px';
});

// Navegación suave + Scrollspy + hash
function scrollToId(id){
  const el = document.querySelector(id);
  if(!el) return;
  el.scrollIntoView({behavior:'smooth', block:'start'});
  // cierra menú móvil si está abierto
  const isMobile = getComputedStyle(btnMenu).display !== 'none';
  if(isMobile){ nav.style.display='none'; }
}
$$('.nav-link').forEach(link=>{
  link.addEventListener('click', (e)=>{
    e.preventDefault();
    const id = link.getAttribute('href');
    scrollToId(id);
    history.pushState(null, '', id);
  });
});
// Si el usuario llega con hash, haz scroll
window.addEventListener('load', ()=>{ if(location.hash) scrollToId(location.hash); });

// Scrollspy
const spySections = ['#planes','#clases','#horario','#entrenadores','#testimonios','#faq','#contacto']
  .map(id => document.querySelector(id)).filter(Boolean);
const spyLinks = $$('.nav-link');
const spy = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting){
      spyLinks.forEach(l=>l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
    }
  })
}, {threshold: 0.55});
spySections.forEach(s => spy.observe(s));

// Reveal on scroll
const reveals = $$('.reveal, .card, .tile, .trainer');
const obs = new IntersectionObserver((entries)=>{
  entries.forEach(ent=>{
    if(ent.isIntersecting){
      ent.target.classList.add('in');
      obs.unobserve(ent.target);
    }
  })
}, {threshold: .15});
reveals.forEach(el=>{ el.classList.add('reveal'); obs.observe(el); });

// Mostrar/ocultar botón "arriba"
const toTopBtn = $('#toTop');
window.addEventListener('scroll', ()=>{
  toTopBtn.style.display = window.scrollY > 420 ? 'inline-flex' : 'none';
});
toTopBtn.addEventListener('click', ()=> window.scrollTo({top:0, behavior:'smooth'}));

// KPIs counters
$$('[id^="k"]').forEach(el=>{
  const target = Number(el.dataset.target || 0);
  let started = false;
  const io = new IntersectionObserver(([e])=>{
    if(e.isIntersecting && !started){
      started = true;
      let val = 0;
      const step = Math.max(1, Math.round(target/120));
      const tick = () => {
        val += step;
        if (val >= target) { el.textContent = target; return; }
        el.textContent = val;
        requestAnimationFrame(tick);
      };
      tick();
      io.disconnect();
    }
  }, {threshold: .7});
  io.observe(el);
});

// Billing toggle + coupon
const toggle = $('#billingToggle');
const prices = $$('.price');
let coupon = null;
toggle?.addEventListener('change', ()=> updatePrices());
$('#applyCoupon')?.addEventListener('click', ()=>{
  const code = $('#couponInput').value.trim().toUpperCase();
  const msg = $('#couponMsg');
  const valid = ['ADO15','ADOFIT10'];
  if(valid.includes(code)){
    coupon = code;
    msg.textContent = `Cupón ${code} aplicado.`;
    msg.className = 'hint ok';
    updatePrices();
  }else{
    coupon = null;
    msg.textContent = 'Cupón inválido.';
    msg.className = 'hint err';
    updatePrices();
  }
});
function formatCOP(n){ return n.toLocaleString('es-CO', {style:'currency', currency:'COP', maximumFractionDigits:0}); }
function updatePrices(){
  prices.forEach(p=>{
    const base = Number(toggle?.checked ? p.dataset.yearly : p.dataset.monthly);
    let total = base;
    if(coupon === 'ADO15') total = Math.round(base*0.85);
    if(coupon === 'ADOFIT10') total = Math.round(base*0.90);
    p.textContent = `${formatCOP(total)}/mes`;
  });
}
updatePrices();

// Filtro de clases
const chips = $$('.chip');
const classTiles = $$('#classesGrid .tile');
chips.forEach(ch => ch.addEventListener('click', ()=>{
  chips.forEach(c=>c.classList.remove('is-active'));
  ch.classList.add('is-active');
  const tag = ch.dataset.filter;
  classTiles.forEach(tile =>{
    const has = tile.dataset.tags?.split(',').includes(tag);
    tile.style.display = (tag === 'all' || has) ? '' : 'none';
  });
}));

// Modal de reservas
const modal = $('#bookingModal');
const openers = [$('#openBooking'), $('#fabBook')];
const closers = [$('#closeModal'), $('#cancelBook')];
const classSelect = $('#classSelect');
$$('.book').forEach(b => b.addEventListener('click', ()=>{
  classSelect.value = b.dataset.class || '';
  modal.style.display = 'flex';
  $('#bookingTitle').focus?.();
}));
openers.forEach(b=> b?.addEventListener('click', ()=> { modal.style.display='flex'; $('#bookingTitle').focus?.(); }));
closers.forEach(b=> b?.addEventListener('click', ()=> modal.style.display='none'));
modal.addEventListener('click', (e)=>{ if (e.target === modal) modal.style.display='none'; });

// Reserva demo + guardar "mis reservas" en localStorage
const bookingForm = $('#bookingForm');
const bookMsg = $('#bookMsg');
bookingForm?.addEventListener('submit', (e)=>{
  e.preventDefault();
  const fd = new FormData(bookingForm);
  const item = {
    clase: fd.get('clase'),
    cuando: fd.get('cuando'),
    nombre: fd.get('nombre'),
    email: fd.get('email')
  };
  if(!item.clase || !item.cuando || !item.nombre || !item.email){
    bookMsg.textContent='Completa todos los campos.'; bookMsg.className='hint err'; return;
  }
  if(!/.+@.+\..+/.test(item.email)){ bookMsg.textContent='Correo inválido.'; bookMsg.className='hint err'; return; }
  const all = JSON.parse(localStorage.getItem('ado_reservas')||'[]');
  all.push(item);
  localStorage.setItem('ado_reservas', JSON.stringify(all));
  bookMsg.textContent = `¡Reserva lista! ${item.nombre}, te esperamos en ${item.clase} el ${new Date(item.cuando).toLocaleString()}.`;
  bookMsg.className='hint ok';
  bookingForm.reset();
  setTimeout(()=>{ modal.style.display='none'; bookMsg.textContent=''; }, 1400);
});

// Selección de plan → autollenado en formulario
const planButtons = $$('.select-plan');
const selectPlan = $('select[name="plan"]');
planButtons.forEach(btn=>btn.addEventListener('click', ()=>{
  selectPlan.value = btn.closest('.plan')?.dataset.plan || '';
  $('#contacto').scrollIntoView({behavior:'smooth'});
}));

// Horario (datos, filtro, export ICS)
const scheduleData = [
  {dia:'Lunes', hora:'06:00', clase:'HIIT', coach:'Carlos'},
  {dia:'Lunes', hora:'19:00', clase:'Power Yoga', coach:'Andrea'},
  {dia:'Martes', hora:'07:00', clase:'Spinning', coach:'Lina'},
  {dia:'Martes', hora:'18:00', clase:'Funcional', coach:'Carlos'},
  {dia:'Miércoles', hora:'06:00', clase:'Peso Libre', coach:'Lina'},
  {dia:'Miércoles', hora:'19:00', clase:'Box Cardio', coach:'Carlos'},
  {dia:'Jueves', hora:'07:00', clase:'Levant. Olímpico', coach:'Lina'},
  {dia:'Jueves', hora:'18:00', clase:'Stretch', coach:'Andrea'},
  {dia:'Viernes', hora:'06:00', clase:'HIIT', coach:'Carlos'},
  {dia:'Sábado', hora:'09:00', clase:'Funcional', coach:'Carlos'},
  {dia:'Domingo', hora:'09:00', clase:'Power Yoga', coach:'Andrea'}
];
const tbody = $('#scheduleTable tbody');
function renderSchedule(){
  const day = $('#dayFilter').value;
  const q = $('#searchClass').value.toLowerCase().trim();
  tbody.innerHTML = '';
  scheduleData
    .filter(r => day==='all' || r.dia===day)
    .filter(r => !q || (r.clase.toLowerCase().includes(q) || r.coach.toLowerCase().includes(q)))
    .forEach(r => {
      const tr = document.createElement('tr');
      const btn = document.createElement('button');
      btn.className = 'ghost';
      btn.type = 'button';
      btn.textContent = 'Agregar a calendario';
      btn.addEventListener('click', ()=> downloadICS(r));
      tr.innerHTML = `<td>${r.dia}</td><td>${r.hora}</td><td>${r.clase}</td><td>${r.coach}</td>`;
      const td = document.createElement('td'); td.appendChild(btn);
      tr.appendChild(td);
      tbody.appendChild(tr);
    });
}
$('#dayFilter').addEventListener('change', renderSchedule);
$('#searchClass').addEventListener('input', renderSchedule);
function pad(n){ return String(n).padStart(2,'0'); }
function nextDateOf(dow){ // dow: Lunes..Domingo
  const map = {Domingo:0,Lunes:1,Martes:2,Miércoles:3,Jueves:4,Viernes:5,Sábado:6};
  const now = new Date(); let dt = new Date(now);
  while (dt.getDay() !== map[dow]) { dt.setDate(dt.getDate()+1); }
  return dt;
}
function downloadICS(row){
  // Build DTSTART/DTEND in local time (1h duration)
  const base = nextDateOf(row.dia);
  const [H,M] = row.hora.split(':').map(Number);
  base.setHours(H, M, 0, 0);
  const end = new Date(base.getTime() + 60*60*1000);
  const fmt = (d)=> d.getFullYear().toString()+pad(d.getMonth()+1)+pad(d.getDate())+'T'+pad(d.getHours())+pad(d.getMinutes())+'00';
  const uid = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
  const ics = [
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//AdoFitness//Horario//ES',
    'BEGIN:VEVENT',
    'UID:'+uid,
    'DTSTAMP:'+fmt(new Date()),
    'DTSTART:'+fmt(base),
    'DTEND:'+fmt(end),
    'SUMMARY:'+row.clase+' - AdoFitness',
    'DESCRIPTION:Clase con '+row.coach,
    'LOCATION:AdoFitness Sede Principal',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  const blob = new Blob([ics], {type:'text/calendar'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `adofitness-${row.clase}-${row.dia}-${row.hora}.ics`;
  document.body.appendChild(a); a.click(); a.remove();
}
renderSchedule();

// Carrusel simple
const track = $('#carTrack');
const slides = Array.from(track.children);
let idx = 0;
const dotsBox = $('#dots');
const makeDots = () => {
  slides.forEach((_,i)=>{
    const d = document.createElement('span');
    d.className = 'dot' + (i===0 ? ' active' : '');
    d.setAttribute('role','button');
    d.addEventListener('click', ()=> goTo(i));
    dotsBox.appendChild(d);
  });
};
const updateDots = () => {
  dotsBox.querySelectorAll('.dot').forEach((d,i)=> d.classList.toggle('active', i===idx));
};
const goTo = (i) => {
  idx = (i + slides.length) % slides.length;
  track.style.transform = `translateX(-${idx*100}%)`;
  updateDots();
};
$('#prev').addEventListener('click', ()=> goTo(idx-1));
$('#next').addEventListener('click', ()=> goTo(idx+1));
makeDots();
setInterval(()=> goTo(idx+1), 4500);

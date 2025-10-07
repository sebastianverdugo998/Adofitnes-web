import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// utils
const ensureFile = (relPath, init) => {
  const p = path.join(__dirname, relPath);
  if (!fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify(init, null, 2));
  return p;
};
const readJSON = (relPath, init=[]) => {
  const file = ensureFile(relPath, init);
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
};
const writeJSON = (relPath, data) => fs.writeFileSync(path.join(__dirname, relPath), JSON.stringify(data, null, 2));

// Health
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Static data
app.get('/api/plans', (req, res) => res.json(readJSON('data/plans.json')));
app.get('/api/classes', (req, res) => res.json(readJSON('data/classes.json')));
app.get('/api/trainers', (req, res) => res.json(readJSON('data/trainers.json')));
app.get('/api/schedule', (req, res) => res.json(readJSON('data/schedules.json')));

// Bookings
app.post('/api/bookings', (req, res) => {
  const { clase, cuando, nombre, email } = req.body || {};
  if(!clase || !cuando || !nombre || !email){
    return res.status(400).json({ error: 'Datos incompletos. Requiere clase, cuando, nombre, email.' });
  }
  const item = { id: Date.now().toString(36), clase, cuando, nombre, email, createdAt: new Date().toISOString() };
  const bookings = readJSON('data/bookings.json', []);
  bookings.push(item);
  writeJSON('data/bookings.json', bookings);
  res.status(201).json({ ok: true, booking: item });
});

// Contact
app.post('/api/contact', (req, res) => {
  const { nombre, email, plan, mensaje } = req.body || {};
  if(!nombre || !email || !plan){
    return res.status(400).json({ error: 'Datos incompletos. Requiere nombre, email, plan.' });
  }
  const item = { id: Date.now().toString(36), nombre, email, plan, mensaje: mensaje || '', createdAt: new Date().toISOString() };
  const contacts = readJSON('data/contacts.json', []);
  contacts.push(item);
  writeJSON('data/contacts.json', contacts);
  res.status(201).json({ ok: true, contact: item });
});

// ICS generator for a schedule entry via query (?dia=...&hora=...&clase=...&coach=...)
app.get('/api/schedule/ics', (req, res) => {
  const { dia, hora, clase, coach } = req.query;
  if(!dia || !hora || !clase){
    return res.status(400).json({ error: 'Faltan parámetros: dia, hora, clase (coach opcional).' });
  }
  function pad(n){ return String(n).padStart(2,'0'); }
  const map = { 'Domingo':0,'Lunes':1,'Martes':2,'Miércoles':3,'Jueves':4,'Viernes':5,'Sábado':6 };
  const target = map[dia];
  if (target === undefined) return res.status(400).json({ error: 'Día inválido.' });
  const now = new Date();
  let dt = new Date(now);
  while (dt.getDay() !== target){ dt.setDate(dt.getDate()+1); }
  const [H,M] = String(hora).split(':').map(n => parseInt(n, 10));
  dt.setHours(H||0, M||0, 0, 0);
  if (dt <= now) dt = new Date(dt.getTime() + 7*24*60*60*1000);
  const end = new Date(dt.getTime() + 60*60*1000);
  const fmt = (d)=> d.getFullYear().toString()+pad(d.getMonth()+1)+pad(d.getDate())+'T'+pad(d.getHours())+pad(d.getMinutes())+'00';
  const ics = [
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//AdoFitness//Horario//ES',
    'BEGIN:VEVENT',
    'UID:'+Date.now().toString(36),
    'DTSTAMP:'+fmt(new Date()),
    'DTSTART:'+fmt(dt),
    'DTEND:'+fmt(end),
    'SUMMARY:'+(clase)+' - AdoFitness',
    'DESCRIPTION:'+(coach ? ('Clase con '+coach) : 'Reserva AdoFitness'),
    'LOCATION:AdoFitness Sede Principal',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="adofitness-${clase}-${dia}-${hora}.ics"`);
  res.send(ics);
});

app.listen(PORT, () => {
  console.log(`AdoFitness API escuchando en http://localhost:${PORT}`);
});

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const Database = require('better-sqlite3');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const isProd = process.env.NODE_ENV === 'production';
if (isProd && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)) {
  throw new Error('Set a strong SESSION_SECRET (at least 32 characters) before production.');
}
const db = new Database(path.join(__dirname, '..', 'studio.sqlite'));
db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS bookings (
 id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL,
 service TEXT NOT NULL, event_date TEXT, location TEXT, budget TEXT, details TEXT, status TEXT NOT NULL DEFAULT 'New',
 created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`);

app.use(helmet({contentSecurityPolicy: false}));
app.use(express.json({limit:'30kb'}));
app.use(express.urlencoded({extended:false, limit:'30kb'}));
app.use(session({
 secret: process.env.SESSION_SECRET || 'dev-only-secret-change-before-deploying-please',
 resave:false, saveUninitialized:false, store:new SQLiteStore({db:'sessions.sqlite', dir:path.join(__dirname,'..')}),
 cookie:{httpOnly:true, sameSite:'lax', secure:isProd, maxAge:8*60*60*1000}
}));
app.use(express.static(path.join(__dirname,'..','public')));
const bookingLimiter = rateLimit({windowMs:15*60*1000, max:12, standardHeaders:true, legacyHeaders:false, message:{error:'Too many booking attempts. Please try again later.'}});
const loginLimiter = rateLimit({windowMs:15*60*1000, max:8, standardHeaders:true, legacyHeaders:false, message:{error:'Too many login attempts. Please wait and try again.'}});
const services = ['Event Videography','Cinematography','Wedding Films','Video Editing','Photography','Commercial & Brand Films','Documentary'];
const requireAdmin = (req,res,next) => req.session && req.session.admin ? next() : res.status(401).json({error:'Please sign in as an administrator.'});

app.get('/api/health', (req,res)=>res.json({ok:true, app:"Maj's ClipZyun"}));
app.get('/api/services', (req,res)=>res.json(services));
app.post('/api/bookings', bookingLimiter, (req,res)=>{
 const b=req.body||{};
 const name=String(b.name||'').trim().slice(0,100), email=String(b.email||'').trim().slice(0,180), phone=String(b.phone||'').trim().slice(0,40);
 const service=String(b.service||'').trim(), eventDate=String(b.eventDate||'').trim().slice(0,20), location=String(b.location||'').trim().slice(0,180), budget=String(b.budget||'').trim().slice(0,80), details=String(b.details||'').trim().slice(0,3000);
 if (!name || !email || !phone || !services.includes(service)) return res.status(400).json({error:'Please fill in your name, email, phone and a valid service.'});
 if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({error:'Please enter a valid email address.'});
 const result=db.prepare('INSERT INTO bookings (name,email,phone,service,event_date,location,budget,details) VALUES (?,?,?,?,?,?,?,?)').run(name,email,phone,service,eventDate,location,budget,details);
 res.status(201).json({ok:true, id:result.lastInsertRowid, message:'Your booking request has been received. We will contact you to confirm availability.'});
});
app.post('/api/admin/login', loginLimiter, (req,res)=>{
 const username=String(req.body?.username||''), password=String(req.body?.password||'');
 if (username !== (process.env.ADMIN_USERNAME||'admin') || password !== (process.env.ADMIN_PASSWORD||'change-this-before-deploying')) return res.status(401).json({error:'Incorrect username or password.'});
 req.session.regenerate(err=>{ if(err) return res.status(500).json({error:'Could not start a secure session.'}); req.session.admin=true; req.session.username=username; res.json({ok:true}); });
});
app.get('/api/admin/me', (req,res)=>res.json({authenticated:!!req.session?.admin, username:req.session?.username||null}));
app.post('/api/admin/logout', requireAdmin, (req,res)=>req.session.destroy(()=>res.json({ok:true})));
app.get('/api/admin/bookings', requireAdmin, (req,res)=>{
 const rows=db.prepare('SELECT * FROM bookings ORDER BY created_at DESC, id DESC').all();
 res.json(rows);
});
app.patch('/api/admin/bookings/:id', requireAdmin, (req,res)=>{
 const id=Number(req.params.id), status=String(req.body?.status||'');
 if(!Number.isInteger(id)||id<1) return res.status(400).json({error:'Invalid booking ID.'});
 if(!['New','Contacted','Confirmed','Completed','Cancelled'].includes(status)) return res.status(400).json({error:'Invalid status.'});
 const result=db.prepare('UPDATE bookings SET status=? WHERE id=?').run(status,id);
 if(!result.changes) return res.status(404).json({error:'Booking not found.'});
 res.json({ok:true});
});
app.get('/admin', (req,res)=>res.sendFile(path.join(__dirname,'..','public','admin.html')));
app.get('*', (req,res)=>res.sendFile(path.join(__dirname,'..','public','index.html')));
app.listen(PORT,()=>console.log(`Maj's ClipZyun running at http://localhost:${PORT}`));

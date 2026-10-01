const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;
const DATA = path.join(__dirname, "data.json");
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const seed = {
  users: [
    { id: 1, username: "admin", password: "admin123", role: "admin", name: "Administrator" },
    { id: 2, username: "conductor", password: "bus123", role: "conductor", name: "Conductor" }
  ],
  routes: [
    { id: 1, from: "Dar es Salaam", to: "Morogoro", fare: 8000 },
    { id: 2, from: "Dar es Salaam", to: "Dodoma", fare: 25000 }
  ],
  buses: [{ id: 1, plate: "T 123 ABC", name: "Bus 01" }],
  tickets: [],
  nextTicket: 1001
};
function load() {
  if (!fs.existsSync(DATA)) fs.writeFileSync(DATA, JSON.stringify(seed, null, 2));
  return JSON.parse(fs.readFileSync(DATA, "utf8"));
}
let db = load();
function save() { fs.writeFileSync(DATA, JSON.stringify(db, null, 2)); }
function auth(role) {
  return (req,res,next) => {
    const token = req.headers.authorization || "";
    const username = token.replace(/^Bearer\s+/i, "");
    const user = db.users.find(u => u.username === username);
    if (!user || (role && user.role !== role)) return res.status(401).json({error:"Please log in with an authorized account."});
    req.user = user; next();
  };
}
app.post("/api/login",(req,res)=>{
  const {username,password}=req.body||{};
  const u=db.users.find(x=>x.username===username && x.password===password);
  if(!u) return res.status(401).json({error:"Incorrect username or password"});
  res.json({username:u.username,role:u.role,name:u.name});
});
app.get("/api/routes",auth(),(req,res)=>res.json(db.routes));
app.get("/api/buses",auth("admin"),(req,res)=>res.json(db.buses));
app.post("/api/routes",auth("admin"),(req,res)=>{
  const {from,to,fare}=req.body||{};
  if(!from?.trim()||!to?.trim()||!(Number(fare)>0)) return res.status(400).json({error:"Enter route and a fare above zero."});
  const item={id:Date.now(),from:from.trim(),to:to.trim(),fare:Number(fare)};
  db.routes.push(item);save();res.json(item);
});
app.post("/api/buses",auth("admin"),(req,res)=>{
  const {plate,name}=req.body||{};
  if(!plate?.trim()) return res.status(400).json({error:"Enter a bus plate number."});
  const item={id:Date.now(),plate:plate.trim(),name:(name||"Bus").trim()};
  db.buses.push(item);save();res.json(item);
});
app.post("/api/tickets",auth("conductor"),(req,res)=>{
  const {routeId,passenger,busId}=req.body||{};
  const route=db.routes.find(r=>r.id===Number(routeId));
  if(!route) return res.status(400).json({error:"Choose a valid route."});
  const bus=db.buses.find(b=>b.id===Number(busId)) || db.buses[0] || {id:null,plate:"Not assigned",name:""};
  const ticket={id:db.nextTicket++,code:"BT-"+(db.nextTicket-1),routeId:route.id,from:route.from,to:route.to,fare:route.fare,
    passenger:(passenger||"Passenger").trim(),bus:bus.plate,conductor:req.user.name,status:"UNPAID",createdAt:new Date().toISOString(),paidAt:null};
  db.tickets.unshift(ticket);save();res.json(ticket);
});
app.patch("/api/tickets/:id/pay",auth("conductor"),(req,res)=>{
  const t=db.tickets.find(x=>x.id===Number(req.params.id));
  if(!t) return res.status(404).json({error:"Ticket not found"});
  if(t.status==="PAID") return res.status(400).json({error:"Ticket is already marked paid."});
  t.status="PAID";t.paidAt=new Date().toISOString();t.conductor=req.user.name;save();res.json(t);
});
app.get("/api/tickets",auth(),(req,res)=>{
  const list=req.user.role==="admin"?db.tickets:db.tickets.filter(t=>t.conductor===req.user.name);
  res.json(list);
});
app.get("/api/dashboard",auth("admin"),(req,res)=>{
  const paid=db.tickets.filter(t=>t.status==="PAID");
  res.json({ticketCount:db.tickets.length,paidCount:paid.length,unpaidCount:db.tickets.length-paid.length,
    cash:paid.reduce((s,t)=>s+t.fare,0),tickets:db.tickets});
});
app.delete("/api/routes/:id",auth("admin"),(req,res)=>{
  db.routes=db.routes.filter(r=>r.id!==Number(req.params.id));save();res.json({ok:true});
});
app.listen(PORT,"0.0.0.0",()=>console.log(`Bus ticket system running on http://localhost:${PORT}`));
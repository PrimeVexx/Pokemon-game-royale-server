const express=require('express'),http=require('http'),{WebSocketServer}=require('ws'),crypto=require('crypto'),fs=require('fs'),path=require('path');
const {OAuth2Client}=require('google-auth-library');
const CID=process.env.GOOGLE_CLIENT_ID||'',SECRET=process.env.TOKEN_SECRET||'cambia-esto',PORT=process.env.PORT||3000,DBF=path.join(__dirname,'data.json');
const oc=new OAuth2Client(CID);let DB={users:{}};try{DB=JSON.parse(fs.readFileSync(DBF))}catch(e){}
const persist=()=>fs.writeFile(DBF,JSON.stringify(DB),()=>{});
const mac=p=>crypto.createHmac('sha256',SECRET).update(p).digest('base64url');
const sign=id=>{const p=Buffer.from(id).toString('base64url');return p+'.'+mac(p)};
const verify=t=>{if(!t)return null;const[p,s]=t.split('.');if(!p||!s)return null;const ok=mac(p);if(s.length!=ok.length||!crypto.timingSafeEqual(Buffer.from(s),Buffer.from(ok)))return null;return DB.users[Buffer.from(p,'base64url').toString()]||null};
const hashPw=(u,p)=>crypto.scryptSync(p,'pr_'+u,32).toString('hex');

const app=express();app.use(express.json({limit:'200kb'}));
app.use((q,r,n)=>{r.set({'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type,Authorization','Access-Control-Allow-Methods':'GET,POST,PUT,OPTIONS'});q.method=='OPTIONS'?r.end():n()});
const auth=(q,r,n)=>{const u=verify((q.headers.authorization||'').slice(7));if(!u)return r.status(401).json({error:'auth'});q.u=u;n()};
const online=new Map();

app.get('/config',(q,r)=>r.json({clientId:CID}));

app.post('/auth/register',(q,r)=>{
  const name=String(q.body.name||'').trim(),pw=String(q.body.password||'');
  if(!/^[A-Za-z0-9_.\-ñÑáéíóúÁÉÍÓÚ]{3,14}$/.test(name))return r.status(400).json({error:'Nombre: 3-14 letras o números sin espacios'});
  if(pw.length<4)return r.status(400).json({error:'Contraseña de mínimo 4 caracteres'});
  const id='u_'+name.toLowerCase();
  if(DB.users[id])return r.status(409).json({error:'Ese nombre ya está en uso'});
  DB.users[id]={id,name,pass:hashPw(id,pw),code:crypto.randomBytes(3).toString('hex').toUpperCase(),friends:[],save:null};
  persist();r.json({token:sign(id)});
});

app.post('/auth/login',(q,r)=>{
  const name=String(q.body.name||'').trim(),pw=String(q.body.password||''),id='u_'+name.toLowerCase();
  const u=DB.users[id];
  if(!u||!u.pass||u.pass!==hashPw(id,pw))return r.status(401).json({error:'Nombre o contraseña incorrectos'});
  r.json({token:sign(id)});
});

app.post('/auth/google',async(q,r)=>{try{const p=(await oc.verifyIdToken({idToken:q.body.credential,audience:CID})).getPayload();let u=DB.users[p.sub];if(!u)u=DB.users[p.sub]={id:p.sub,code:crypto.randomBytes(3).toString('hex').toUpperCase(),friends:[],save:null};u.name=p.name;u.pic=p.picture;persist();r.json({token:sign(u.id)})}catch(e){r.status(401).json({error:'google'})}});
app.get('/api/me',auth,(q,r)=>r.json({id:q.u.id,name:q.u.name,pic:q.u.pic,code:q.u.code}));
app.get('/api/save',auth,(q,r)=>r.json({data:q.u.save}));
app.put('/api/save',auth,(q,r)=>{q.u.save=q.body;persist();r.json({ok:1})});
app.get('/api/friends',auth,(q,r)=>r.json(q.u.friends.map(id=>DB.users[id]).filter(Boolean).map(f=>({id:f.id,name:f.name,online:online.has(f.id)}))));
app.post('/api/friends',auth,(q,r)=>{const f=Object.values(DB.users).find(x=>x.code==String(q.body.code||'').trim().toUpperCase());if(!f||f.id==q.u.id)return r.status(404).json({error:'no'});for(const[a,b]of[[q.u,f],[f,q.u]])if(!a.friends.includes(b.id))a.friends.push(b.id);persist();r.json({ok:1})});

app.use(express.static(path.join(__dirname,'public')));
const srv=http.createServer(app),wss=new WebSocketServer({server:srv,path:'/ws'}),rooms=new Map();
wss.on('connection',(ws,q)=>{const url=new URL(q.url,'http://x'),code=(url.searchParams.get('room')||'').slice(0,12).toUpperCase(),u=verify(url.searchParams.get('token'));if(!code)return ws.close();
if(u)online.set(u.id,(online.get(u.id)||0)+1);
if(!rooms.has(code))rooms.set(code,new Set());const rm=rooms.get(code);rm.add(ws);ws.p={};
const bc=()=>{const m=JSON.stringify({t:'peers',peers:[...rm].map(s=>s.p)});rm.forEach(s=>s.readyState==1&&s.send(m))};
ws.on('message',d=>{try{const m=JSON.parse(d);if(m.t=='p'&&m.p&&typeof m.p=='object'){ws.p=m.p;bc()}}catch(e){}});
ws.on('close',()=>{rm.delete(ws);if(!rm.size)rooms.delete(code);if(u){const n=(online.get(u.id)||1)-1;n?online.set(u.id,n):online.delete(u.id)}bc()});bc()});
srv.listen(PORT,()=>console.log('Poké Royale en http://localhost:'+PORT));

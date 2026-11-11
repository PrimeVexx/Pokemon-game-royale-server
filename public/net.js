(()=>{
const API=(window.API_URL||location.origin).replace(/\/$/,'');let TOKEN=localStorage.getItem('pr_token')||'';
const api=async(p,o={})=>{try{const r=await fetch(API+p,{method:o.method||'GET',headers:{'Content-Type':'application/json',Authorization:'Bearer '+TOKEN},body:o.body?JSON.stringify(o.body):undefined});if(r.status==401){localStorage.removeItem('pr_token');TOKEN=''}return await r.json()}catch(e){return{error:'net'}}};
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function room(code){return new Promise(res=>{const ws=new WebSocket(API.replace(/^http/,'ws')+'/ws?room='+encodeURIComponent(code)+'&token='+TOKEN);let peers=[],cb=()=>{},mine={};
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.t=='peers'){peers=m.peers;cb()}};
ws.onopen=()=>res({presence:p=>{Object.assign(mine,p);if(ws.readyState==1)ws.send(JSON.stringify({t:'p',p:mine}))},onPeers:f=>{cb=f},peers:()=>peers.map(x=>({presence:x})),leave:async()=>ws.close()});ws.onerror=()=>res(null)})}
window.claude={use:async n=>{
if(n=='user'){if(!TOKEN)return null;const me=await api('/api/me');if(me.error)return null;return{id:async()=>me.id,me:async()=>({name:me.name})}}
if(n=='db'){if(!TOKEN)return null;return{collection:()=>({doc:()=>({get:async()=>{const r=await api('/api/save');return{exists:!!r.data,data:()=>r.data}},set:async d=>{await api('/api/save',{method:'PUT',body:d})}})})}}
if(n=='room')return{join:code=>room(code)};return null}};
addEventListener('load',()=>{
if(!TOKEN)fetch(API+'/config').then(r=>r.json()).then(c=>{if(!c.clientId)return;const s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.onload=()=>{google.accounts.id.initialize({client_id:c.clientId,callback:async r=>{const j=await api('/auth/google',{method:'POST',body:{credential:r.credential}});if(j.token){localStorage.setItem('pr_token',j.token);location.reload()}}});google.accounts.id.renderButton($('gbtn'),{theme:'filled_blue',size:'medium',text:'signin_with'})};document.head.appendChild(s)}).catch(()=>{});
window.loadFr=async()=>{frDefault();if(!TOKEN){$('frl').insertAdjacentHTML('beforeend','<small>Inicia sesi\u00f3n con Google desde el men\u00fa principal para guardar amigos.</small>');return}
const me=await api('/api/me'),fl=await api('/api/friends'),el=$('frl');
el.insertAdjacentHTML('beforeend','<div class=row><span>Tu c\u00f3digo de amigo: <b>'+esc(me.code||'')+'</b></span></div><div class=row><input id=fc placeholder="C\u00f3digo de amigo" style="flex:1;padding:8px;border-radius:4px;border:0"><button id=fa>Agregar</button></div>'+(Array.isArray(fl)?fl.map(f=>'<div class=row><span>'+(f.online?'\ud83d\udfe2 ':'\u26ab ')+esc(f.name)+'</span><button class=g data-i=1>Invitar</button></div>').join(''):''));
$('fa').onclick=async()=>{const r=await api('/api/friends',{method:'POST',body:{code:$('fc').value}});if(r.error)tst('C\u00f3digo no encontrado');window.loadFr()};
el.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{const c=$('pc').textContent;if(c.length<2||c=='\u2014')return tst('Primero crea un grupo y comparte el c\u00f3digo');const t='\u00danete a mi grupo en Pok\u00e9 Royale: '+c;navigator.clipboard?navigator.clipboard.writeText(t).then(()=>tst('C\u00f3digo copiado')):prompt('Copia:',t)})};
});})();

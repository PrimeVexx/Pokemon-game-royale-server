(()=>{
const API=(window.API_URL||location.origin).replace(/\/$/,'');
let TOKEN=localStorage.getItem('pr_token')||'';
const api=async(p,o={})=>{
  try{
    const r=await fetch(API+p,{method:o.method||'GET',headers:{'Content-Type':'application/json',Authorization:'Bearer '+TOKEN},body:o.body?JSON.stringify(o.body):undefined});
    if(r.status==401&&p!='/auth/login'){localStorage.removeItem('pr_token');TOKEN=''}
    return await r.json();
  }catch(e){return{error:'Error de conexión con el servidor'}}
};
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function room(code){
  return new Promise(res=>{
    const ws=new WebSocket(API.replace(/^http/,'ws')+'/ws?room='+encodeURIComponent(code)+'&token='+TOKEN);
    let peers=[],cb=()=>{},mine={};
    ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.t=='peers'){peers=m.peers;cb()}};
    ws.onopen=()=>res({presence:p=>{Object.assign(mine,p);if(ws.readyState==1)ws.send(JSON.stringify({t:'p',p:mine}))},onPeers:f=>{cb=f},peers:()=>peers.map(x=>({presence:x})),leave:async()=>ws.close()});
    ws.onerror=()=>res(null);
  });
}
window.claude={use:async n=>{
  if(n=='user'){if(!TOKEN)return null;const me=await api('/api/me');if(me.error)return null;return{id:async()=>me.id,me:async()=>({name:me.name})}}
  if(n=='db'){if(!TOKEN)return null;return{collection:()=>({doc:()=>({get:async()=>{const r=await api('/api/save');return{exists:!!r.data,data:()=>r.data}},set:async d=>{await api('/api/save',{method:'PUT',body:d})}})})}}
  if(n=='room')return{join:code=>room(code)};
  return null;
}};
addEventListener('load',async()=>{
  const av=document.querySelector('.av');
  if(av){av.style.cursor='pointer';av.onclick=()=>TOKEN?openFr():go('lg')}
  if($('lGo')){
    if(!$('lClose'))$('lg').querySelector('.lgb').insertAdjacentHTML('beforeend','<button class=g id=lClose style="margin-top:4px">JUGAR SIN CUENTA (LOCAL)</button>');
    $('lClose').onclick=()=>go('menu');
    $('lGo').onclick=async()=>{
      const n=$('lN').value.trim(),p=$('lP').value;
      if(LM&&p!==$('lQ').value){$('lM').textContent='Las contraseñas no coinciden';return}
      $('lM').textContent='Conectando...';
      const r=await api(LM?'/auth/register':'/auth/login',{method:'POST',body:{name:n,password:p}});
      if(r.error){$('lM').textContent=r.error;return}
      if(r.token){localStorage.setItem('pr_token',r.token);location.reload()}
    };
  }
  if(TOKEN){
    const me=await api('/api/me');
    if(!me.error){
      MYN=me.name;MYID=me.id;UID=me.id;
      const sv=await api('/api/save');
      if(sv.data&&sv.data.v==2)S=Object.assign(S,sv.data);
      DB={collection:()=>({doc:()=>({set:async d=>{await api('/api/save',{method:'PUT',body:d})}})})};
      if($('acc'))$('acc').textContent='☁️ Cuenta online: '+MYN;
      if($('nm'))$('nm').textContent=MYN;
      menu();
    }
  }
  if(!TOKEN)fetch(API+'/config').then(r=>r.json()).then(c=>{
    if(!c.clientId||!$('gbtn'))return;
    const s=document.createElement('script');s.src='https://google.com';
    s.onload=()=>{
      google.accounts.id.initialize({client_id:c.clientId,callback:async r=>{const j=await api('/auth/google',{method:'POST',body:{credential:r.credential}});if(j.token){localStorage.setItem('pr_token',j.token);location.reload()}}});
      google.accounts.id.renderButton($('gbtn'),{theme:'filled_blue',size:'medium',text:'signin_with'});
    };
    document.head.appendChild(s);
  }).catch(()=>{});
  window.loadFr=async()=>{
    const el=$('fr');
    if(!TOKEN){
      el.innerHTML='<h1>👥 Amigos</h1><div class=fw><div class=row><span>👤 <b>Modo local</b></span><button class=g id=flogin>Iniciar sesión / Crear cuenta</button></div><h3>Grupo rápido por código</h3><div class=row><span>Grupo: <b id=pc>—</b></span><span><button class=g id=pnew>Crear</button><button class=g id=pjoin>Unirse</button></span></div><div id=pm style="font-size:12px"></div></div><button class=g id=frb>Volver</button>';
      $('flogin').onclick=()=>go('lg');
      $('pnew').onclick=()=>pj(Math.random().toString(36).slice(2,6).toUpperCase());
      $('pjoin').onclick=()=>{const c=prompt('Código del grupo');if(c)pj(c.trim().toUpperCase())};
      $('frb').onclick=()=>go('menu');
      return;
    }
    const me=await api('/api/me'),fl=await api('/api/friends');
    el.innerHTML='<h1>👥 Amigos</h1><div class=fw><div class=row><span>☁️ <b>'+esc(me.name)+'</b></span><button class=g id=fo>Cerrar sesión</button></div><div class=row><span>Tu código de amigo: <b>'+esc(me.code||'')+'</b></span></div><h3>Grupo online</h3><div class=row><span>Grupo: <b id=pc>—</b></span><span><button class=g id=pnew>Crear</button><button class=g id=pjoin>Unirse</button></span></div><div id=pm style="font-size:12px"></div><h3>Agregar amigo</h3><div class=row><input id=fc placeholder="Código de amigo"><button id=fa>Agregar</button></div><div id=frl>'+(Array.isArray(fl)&&fl.length?fl.map(f=>'<div class=row><span>'+(f.online?'🟢 ':'⚫ ')+esc(f.name)+'</span><button class=g data-i=1>Invitar</button></div>').join(''):'<small>Aún no tienes amigos agregados.</small>')+'</div></div><button class=g id=frb>Volver</button>';
    $('fo').onclick=()=>{localStorage.removeItem('pr_token');location.reload()};
    $('pnew').onclick=()=>pj(Math.random().toString(36).slice(2,6).toUpperCase());
    $('pjoin').onclick=()=>{const c=prompt('Código del grupo');if(c)pj(c.trim().toUpperCase())};
    $('fa').onclick=async()=>{const r=await api('/api/friends',{method:'POST',body:{code:$('fc').value}});if(r.error)tst('Código no encontrado');else tst('¡Amigo agregado!');window.loadFr()};
    el.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{const c=$('pc').textContent;if(c.length<2||c=='—')return tst('Primero crea un grupo y comparte el código');const t='Únete a mi grupo en Poké Royale: '+c;navigator.clipboard?navigator.clipboard.writeText(t).then(()=>tst('Código copiado')):prompt('Copia:',t)});
    $('frb').onclick=()=>go('menu');
  };
});
})();

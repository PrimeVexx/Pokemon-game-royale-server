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
const freshSave=()=>({coins:100,v:2,mode:'br',em:['hi'],emo:'hi',cl:[],mq:{},mc:[],own:['Pikachu','Charmander','Squirtle','Bulbasaur'],skins:[],sel:'Pikachu',skin:'',token:false});

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
      if(r.token){
        localStorage.removeItem('pr2');
        localStorage.setItem('pr_token',r.token);
        location.reload();
      }
    };
  }

  if(TOKEN){
    const me=await api('/api/me');
    if(!me.error){
      MYN=me.name;MYID=me.id;UID=me.id;
      const sv=await api('/api/save');
      S=freshSave();
      if(sv.data&&sv.data.v==2)S=Object.assign(S,sv.data);
      localStorage.setItem('pr2',JSON.stringify(S));
      DB={collection:()=>({doc:()=>({set:async d=>{await api('/api/save',{method:'PUT',body:d})}})})};
      if($('acc'))$('acc').textContent='☁️ Cuenta online: '+MYN;
      if($('nm'))$('nm').textContent=MYN;
      menu();
    }else{
      localStorage.removeItem('pr_token');
      localStorage.removeItem('pr2');
      TOKEN='';
    }
  }

  window.loadFr=async()=>{
    const el=$('fr');
    const inParty=!!R;
    const partyHtml=inParty
      ?'<div class=row><span>Grupo actual: <b id=pc>'+esc($('pc')?$('pc').textContent:'—')+'</b></span><button class=g id=pleave style="background:#d82820">Salir del grupo</button></div><div id=pm style="font-size:12px"></div>'
      :'<div class=row><span>Grupo: <b id=pc>—</b></span><span><button class=g id=pnew>Crear</button><button class=g id=pjoin>Unirse</button></span></div><div id=pm style="font-size:12px"></div>';

    if(!TOKEN){
      el.innerHTML='<h1>👥 Amigos</h1><div class=fw><div class=row><span>👤 <b>Modo local</b></span><button class=g id=flogin>Iniciar sesión / Cambiar cuenta</button></div><h3>Grupo rápido</h3>'+partyHtml+'</div><button class=g id=frb>Volver</button>';
      $('flogin').onclick=()=>go('lg');
    }else{
      const me=await api('/api/me'),fl=await api('/api/friends');
      el.innerHTML='<h1>👥 Amigos</h1><div class=fw><div class=row><span>☁️ <b>'+esc(me.name)+'</b></span><button class=g id=fo>Cambiar / Cerrar cuenta</button></div><div class=row><span>Tu código de amigo: <b>'+esc(me.code||'')+'</b></span></div><h3>Grupo online</h3>'+partyHtml+'<h3>Agregar amigo</h3><div class=row><input id=fc placeholder="Código de amigo"><button id=fa>Agregar</button></div><div id=frl>'+(Array.isArray(fl)&&fl.length?fl.map(f=>'<div class=row><span>'+(f.online?'🟢 ':'⚫ ')+esc(f.name)+'</span><button class=g data-i=1>Invitar</button></div>').join(''):'<small>Aún no tienes amigos agregados.</small>')+'</div></div><button class=g id=frb>Volver</button>';
      $('fo').onclick=()=>{
        localStorage.removeItem('pr_token');
        localStorage.removeItem('pr2');
        location.reload();
      };
      $('fa').onclick=async()=>{const r=await api('/api/friends',{method:'POST',body:{code:$('fc').value}});if(r.error)tst('Código no encontrado');else tst('¡Amigo agregado!');window.loadFr()};
      el.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{const c=$('pc').textContent;if(c.length<2||c=='—')return tst('Primero crea un grupo y comparte el código');const t='Únete a mi grupo en Poké Royale: '+c;navigator.clipboard?navigator.clipboard.writeText(t).then(()=>tst('Código copiado')):prompt('Copia:',t)});
    }

    if($('pnew'))$('pnew').onclick=()=>{pj(Math.random().toString(36).slice(2,6).toUpperCase(),true);window.loadFr()};
    if($('pjoin'))$('pjoin').onclick=()=>{const c=prompt('Código del grupo');if(c){pj(c.trim().toUpperCase(),false);window.loadFr()}};
    if($('pleave'))$('pleave').onclick=()=>{leaveGroup();window.loadFr()};
    $('frb').onclick=()=>go('menu');
  };
});
})();

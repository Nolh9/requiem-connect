let channels=[];
let activeChannel=localStorage.getItem('requiem.activeChannel')||'general';
let currentUser=null;
let currentMessages=[];
const $=selector=>document.querySelector(selector);
const escapeHtml=str=>String(str).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const formatTime=iso=>new Date(iso).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});

async function boot(){
  if(!api.token()){location.href='login.html';return;}
  try{
    currentUser=(await api.request('/api/me')).user;
    channels=(await api.request('/api/channels')).channels;
    if(!channels.some(c=>c.id===activeChannel)) activeChannel=channels[0]?.id||'general';
    renderUser();renderChannels();renderHeader();await renderMembers();await loadMessages();
  }catch(err){api.clearToken();location.href='login.html';}
}

function renderChannels(){
  const host=$('#channelList');
  host.innerHTML=channels.map(c=>`<button class="channel ${c.id===activeChannel?'active':''}" data-channel="${escapeHtml(c.id)}"># ${escapeHtml(c.name)}</button>`).join('');
  host.querySelectorAll('[data-channel]').forEach(btn=>btn.addEventListener('click',async()=>{
    activeChannel=btn.dataset.channel;localStorage.setItem('requiem.activeChannel',activeChannel);renderChannels();renderHeader();await loadMessages();
  }));
}
function renderHeader(){
  const channel=channels.find(c=>c.id===activeChannel)||channels[0]||{name:'général',description:'Discussion principale.'};
  $('#activeChannelName').textContent=channel.name;
  $('#activeChannelDesc').textContent=channel.description;
  $('#messageInput').placeholder=`Envoyer un message dans #${channel.name}`;
}
async function loadMessages(){
  const data=await api.request(`/api/channels/${activeChannel}/messages`);
  currentMessages=data.messages||[];
  renderMessages($('#searchMessages')?.value||'');
}
function renderMessages(filter=''){
  const list=$('.messages');
  const q=filter.toLowerCase();
  const entries=currentMessages.filter(m=>(m.body||'').toLowerCase().includes(q)||(m.author||'').toLowerCase().includes(q));
  list.innerHTML=entries.map(m=>`<article class="message ${m.system?'system-message':''}"><div class="msg-avatar">${escapeHtml((m.author||'?')[0]).toUpperCase()}</div><div><div class="msg-meta"><strong>${escapeHtml(m.author)}</strong><span>${formatTime(m.createdAt)}</span></div><p>${escapeHtml(m.body)}</p></div></article>`).join('')||'<p class="empty-state">Aucun message trouvé.</p>';
  list.scrollTop=list.scrollHeight;
}
function renderUser(){
  document.querySelectorAll('[data-current-name]').forEach(el=>el.textContent=currentUser.displayName);
  document.querySelectorAll('[data-current-username]').forEach(el=>el.textContent='@'+currentUser.username);
  document.querySelectorAll('[data-current-initial]').forEach(el=>el.textContent=(currentUser.displayName||currentUser.username||'R')[0].toUpperCase());
}
async function renderMembers(){
  const users=(await api.request('/api/users')).users;
  const members=users.length?users:[currentUser];
  $('#memberList').innerHTML=members.map(u=>`<button class="friend-card"><div class="member-avatar">${escapeHtml((u.displayName||u.username||'?')[0]).toUpperCase()}</div><div><strong>${escapeHtml(u.displayName||u.username)}</strong><span>${escapeHtml(u.status||'En ligne')}</span></div><small>${u.id===currentUser.id?'TOI':'MEMBRE'}</small></button>`).join('');
  $('#memberCount').textContent=members.length;
}

document.getElementById('logoutBtn')?.addEventListener('click',()=>{api.clearToken();location.href='index.html'});
document.getElementById('settingsBtn')?.addEventListener('click',()=>{location.href='settings.html'});
document.getElementById('messageInput')?.addEventListener('keydown',async e=>{
  const input=e.currentTarget;
  if(e.key==='Enter'&&input.value.trim()){
    e.preventDefault();
    await api.request(`/api/channels/${activeChannel}/messages`,{method:'POST',body:JSON.stringify({body:input.value.trim()})});
    input.value='';await loadMessages();
  }
});
document.getElementById('searchMessages')?.addEventListener('input',e=>renderMessages(e.target.value));
document.getElementById('clearMessages')?.addEventListener('click',async()=>{if(confirm('Vider les messages utilisateurs de ce salon ?')){await api.request(`/api/channels/${activeChannel}/messages`,{method:'DELETE'});await loadMessages();}});
document.getElementById('newChannelBtn')?.addEventListener('click',async()=>{
  const name=prompt('Nom du nouveau salon textuel');
  if(!name?.trim())return;
  try{const payload=await api.request('/api/channels',{method:'POST',body:JSON.stringify({name:name.trim(),description:'Salon textuel personnalisé.'})});channels.push(payload.channel);activeChannel=payload.channel.id;localStorage.setItem('requiem.activeChannel',activeChannel);renderChannels();renderHeader();await loadMessages();}catch(err){alert(err.message);}
});
boot();


document.addEventListener('DOMContentLoaded', () => {
    const emojiBtn = document.getElementById('emojiBtn');
    const picker = document.getElementById('emojiPicker');
    const input = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');

    if (emojiBtn && picker) {
        emojiBtn.addEventListener('click', () => {
            picker.classList.toggle('hidden');
        });

        picker.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
                input.value += btn.textContent;
                input.focus();
            });
        });
    }

    if(sendBtn && input){
        sendBtn.addEventListener('click', () => {
            const ev = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                bubbles: true
            });

            input.dispatchEvent(ev);
        });
    }

    input?.addEventListener('paste', () => {
        console.log('Contenu collé dans le chat');
    });
});


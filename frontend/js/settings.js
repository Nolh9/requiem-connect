let currentUser=null;
const maskEmail=email=>email?email.replace(/^(.{2}).+(@.+)$/,'$1••••••$2'):'Non renseigné';

document.querySelectorAll('.side-item[data-tab]').forEach(item=>{item.addEventListener('click',()=>{document.querySelectorAll('.side-item').forEach(i=>i.classList.remove('active'));document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('visible'));item.classList.add('active');document.getElementById(item.dataset.tab)?.classList.add('visible');});});
document.getElementById('logoutBtn')?.addEventListener('click',()=>{api.clearToken();location.href='index.html'});

async function boot(){
  if(!api.token()){location.href='login.html';return;}
  try{currentUser=(await api.request('/api/me')).user;render();}catch{api.clearToken();location.href='login.html';}
}
function render(){
  document.querySelectorAll('[data-name]').forEach(el=>el.textContent=currentUser.displayName);
  document.querySelectorAll('[data-username]').forEach(el=>el.textContent='@'+currentUser.username);
  document.querySelectorAll('[data-email]').forEach(el=>el.textContent=maskEmail(currentUser.email));
  document.querySelectorAll('[data-initial]').forEach(el=>el.textContent=(currentUser.displayName||currentUser.username||'R')[0].toUpperCase());
  const profileForm=document.getElementById('profileForm');
  if(profileForm){profileForm.displayName.value=currentUser.displayName||'';profileForm.username.value=currentUser.username||'';profileForm.bio.value=currentUser.bio||'';profileForm.onsubmit=async e=>{e.preventDefault();try{const payload=await api.request('/api/me',{method:'PATCH',body:JSON.stringify({displayName:profileForm.displayName.value.trim(),username:profileForm.username.value.trim(),bio:profileForm.bio.value.trim()})});currentUser=payload.user;render();alert('Profil enregistré.');}catch(err){alert(err.message);}};}
}
boot();

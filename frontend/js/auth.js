const setError=(form,msg)=>{
  let box=form.querySelector('.form-error');
  if(!box){box=document.createElement('p');box.className='form-error';form.insertBefore(box,form.querySelector('button[type="submit"]'));}
  box.textContent=msg;
};
const normalize=v=>String(v||'').trim().toLowerCase();

document.getElementById('signupForm')?.addEventListener('submit',async e=>{
  e.preventDefault();
  const form=e.currentTarget;
  const data=Object.fromEntries(new FormData(form).entries());
  try{
    const payload=await api.request('/api/auth/register',{method:'POST',body:JSON.stringify({
      email:normalize(data.email),
      username:normalize(data.username).replace(/\s+/g,'-'),
      displayName:String(data.displayName||'').trim(),
      password:String(data.password||'')
    })});
    api.setToken(payload.token);
    location.href='app.html';
  }catch(err){setError(form,err.message);}
});

document.getElementById('loginForm')?.addEventListener('submit',async e=>{
  e.preventDefault();
  const form=e.currentTarget;
  const data=Object.fromEntries(new FormData(form).entries());
  try{
    const payload=await api.request('/api/auth/login',{method:'POST',body:JSON.stringify({
      emailOrUsername:normalize(data.emailOrUsername),
      password:String(data.password||'')
    })});
    api.setToken(payload.token);
    location.href='app.html';
  }catch(err){setError(form,err.message);}
});

/* Shared song library: public read, authenticated admin writes, cached for offline use. */
const YGSCloud=(()=>{
 const cfg=window.YGS_CLOUD_CONFIG||{},url=String(cfg.url||'').replace(/\/$/,''),key=String(cfg.anonKey||'');
 const configured=!!(url&&key), tokenKey='ygs.cloud.session.v1', cacheKey='ygs.cloud.catalog.v1',stampKey='ygs.cloud.catalog.updated.v1';
 let session=null,connected=false;
 try{session=JSON.parse(sessionStorage.getItem(tokenKey)||'null')}catch{}
 function headers(auth=false){return {'apikey':key,'Content-Type':'application/json',...(auth&&session?.access_token?{'Authorization':'Bearer '+session.access_token}:{'Authorization':'Bearer '+key})}}
 async function request(path,options={}){const response=await fetch(url+path,{...options,headers:{...headers(!!options.auth),...(options.headers||{})},cache:'no-store'});const raw=await response.text();let body;try{body=raw?JSON.parse(raw):null}catch{body=raw}if(!response.ok)throw Error(body?.message||body?.error_description||body?.msg||`Cloud request failed (${response.status})`);return body}
 function cache(songs){localStorage.setItem(cacheKey,JSON.stringify(songs))}
 function cached(){try{const v=JSON.parse(localStorage.getItem(cacheKey)||'null');return Array.isArray(v)?v:null}catch{return null}}
 async function load(force=false){
  if(!configured)return null;
  // Read only a tiny timestamp before downloading the full library.
  const meta=await request('/rest/v1/song_library?id=eq.main&select=updated_at');
  const stamp=meta?.[0]?.updated_at;
  if(!stamp)throw Error('Cloud library has not been initialized. Follow CLOUD_SETUP.md.');
  const previous=localStorage.getItem(stampKey);
  const existing=cached();
  if(!force&&existing&&previous===stamp){connected=true;return existing;}
  const rows=await request('/rest/v1/song_library?id=eq.main&select=songs,updated_at');
  const songs=rows?.[0]?.songs;
  if(!Array.isArray(songs))throw Error('Invalid cloud song library.');
  cache(songs);
  localStorage.setItem(stampKey,rows[0].updated_at);
  connected=true;
  return songs;
 }
 async function login(email,password){if(!configured)throw Error('Configure the cloud connection first.');const data=await request('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})});session=data;sessionStorage.setItem(tokenKey,JSON.stringify(session));return true}
 function logout(){session=null;sessionStorage.removeItem(tokenKey)}
 function isAdmin(){return !!session?.access_token}
 async function save(songs){if(!isAdmin())throw Error('Administrator sign-in required.');const data=await request('/rest/v1/song_library?id=eq.main',{method:'PATCH',auth:true,headers:{'Prefer':'return=representation'},body:JSON.stringify({songs,updated_at:new Date().toISOString()})});if(!data?.length)throw Error('Cloud update rejected. Confirm the account has administrator permission.');cache(songs);if(data[0]?.updated_at)localStorage.setItem(stampKey,data[0].updated_at);connected=true;return true}
 async function refreshSession(){if(!session?.refresh_token)return false;try{const data=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:session.refresh_token})});session=data;sessionStorage.setItem(tokenKey,JSON.stringify(session));return true}catch{logout();return false}}
 async function saveWithRefresh(songs){try{return await save(songs)}catch(e){if(/401|JWT expired|token.*expired/i.test(e.message)&&await refreshSession())return save(songs);throw e}}
 return {configured,load,login,logout,isAdmin,save:saveWithRefresh,cached,get connected(){return connected}};
})();

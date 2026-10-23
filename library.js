/* GitHub Pages library; public reading only. No Supabase or credentials. */
const YGSCloud=(()=>{
 const cacheKey='ygs.static.catalog.v25';
 function cached(){try{const a=JSON.parse(localStorage.getItem(cacheKey)||'null');return Array.isArray(a)?a:null}catch{return null}}
 async function load(){
   // Requested by the user (or on a fresh install only). Cache bypass also works with service worker.
   const r=await fetch('./songs.json',{cache:'no-store'});
   if(!r.ok)throw new Error('Unable to fetch songs ('+r.status+')');
   const data=await r.json(), songs=Array.isArray(data)?data:data.songs;
   if(!Array.isArray(songs)||!songs.length||songs.some(s=>!s||typeof s.id!=='string'||!Array.isArray(s.blocks)))throw Error('Invalid songs.json');
   localStorage.setItem(cacheKey,JSON.stringify(songs));return songs;
 }
 return {configured:true,cached,load,isAdmin:()=>false};
})();

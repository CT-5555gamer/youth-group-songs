const THEMES={navy:['#214F65','#EEF5F7'],royal:['#254E91','#EFF3FA'],ocean:['#087F8C','#ECF8F8'],aqua:['#0F766E','#ECFDFB'],forest:['#356859','#F0F7F3'],lime:['#4D7C0F','#F7FEE7'],golden:['#A96A14','#FFF8E8'],amber:['#B45309','#FFF7ED'],sunrise:['#C65D47','#FFF2EE'],scarlet:['#A93232','#FFF1F1'],crimson:['#991B1B','#FFF1F2'],burgundy:['#7F1D3F','#FFF1F5'],berry:['#9D466C','#FFF2F6'],rose:['#BE5A78','#FFF1F5'],plum:['#76548E','#F7F1FA'],midnight:['#222B45','#F1F3F8'],slate:['#475569','#F1F5F9'],denim:['#315C7C','#EEF5FA'],sky:['#3C7CA5','#EFF8FD'],sand:['#9A7B4F','#FBF7EF']};
const K={songs:'ygs.pwa.songs.v1',sort:'ygs.pwa.sort.v1'}; let state={songs:loadSongs(),sort:localStorage.getItem(K.sort)||'alphabetical',search:'',selected:null,menu:false,editor:null,returnId:null,returnScroll:0,returnMode:null}; const app=document.querySelector('#app');
function loadSongs(){
  let saved;try{saved=YGSCloud.configured?(YGSCloud.cached()||structuredClone(BUNDLED_SONGS)):JSON.parse(localStorage.getItem(K.songs))}catch{}
  if(!Array.isArray(saved))return structuredClone(BUNDLED_SONGS);
  // Apply only known chorus metadata corrections to existing device libraries.
  const fixTitles=new Set(['When Peace Like a River','I Have A Song','I Thirsted','Wonderful Creator']);
  for(const song of saved){
    if(fixTitles.has(song.title))for(const b of song.blocks||[]){
      if(b.type==='chorus'&&b.lines?.length){
        b.bold=b.lines.map(line=>!/^\s*\(?repeat\)?\s*$/i.test(line));
        if(song.title==='Wonderful Creator')b.italic=b.lines.map(line=>/^\s*\(?repeat\)?\s*$/i.test(line));
      }
    }
    if(song.title==='An Open Door')for(const b of song.blocks||[]){
      if(b.type==='stanza'&&b.lines?.length&&b.lines.every(line=>/^\s*chorus(?:\s+repeated)?\s*$/i.test(line))){
        b.type='instruction';b.italic=b.lines.map(()=>true);b.bold=b.lines.map(()=>false);
      }
    }
  }
  return saved;
} function saveSongs(){localStorage.setItem(K.songs,JSON.stringify(state.songs))} function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))} function sorted(all=true){let a=state.songs.filter(s=>s.isVisible!==false);a.sort((x,y)=>state.sort==='numbered'?((x.catalogNumber??9999)-(y.catalogNumber??9999)||x.title.localeCompare(y.title)):x.title.localeCompare(y.title));if(!all&&state.search.trim()){let q=state.search.toLowerCase();a=a.filter(s=>s.title.toLowerCase().includes(q))}return a} function theme(s){return THEMES[s.theme]||THEMES.navy}
function render(){if(state.editor)return renderEditor();if(state.selected)return renderSong();renderHome()}
function renderHome(){let songs=sorted(false);app.innerHTML=`<main class="home"><div class="header">Youth Group Songs<button class="menu" id="menu">Menu</button></div><div class="searchWrap"><input class="search" id="search" placeholder="Search songs…" value="${esc(state.search)}">${state.search?'<button class="clear" id="clear">×</button>':''}</div><div class="list" id="list">${songs.map((s,i)=>`<button class="row" data-id="${esc(s.id)}" id="song-${encodeURIComponent(s.id)}"><span class="num">${state.sort==='numbered'?(s.catalogNumber??''):i+1}</span><span class="title">${esc(s.title)}</span></button>`).join('')||'<div class="empty">No songs found</div>'}</div></main>${state.menu?menuHtml():''}`;document.querySelector('#search').oninput=e=>{state.search=e.target.value;updateHomeList()};document.querySelector('#clear')?.addEventListener('click',()=>{state.search='';renderHome()});document.querySelector('#menu').onclick=()=>{state.menu=true;renderHome()};document.querySelectorAll('.row').forEach(b=>b.onclick=()=>{state.selected=state.songs.find(s=>s.id===b.dataset.id);state.returnId=state.selected.id;state.returnScroll=window.scrollY;state.returnMode=state.search.trim()?'search':'list';render();requestAnimationFrame(()=>window.scrollTo(0,0))});wireMenu(); if(state.returnMode==='search'&&state.returnId&&!state.search){const id=state.returnId;requestAnimationFrame(()=>requestAnimationFrame(()=>document.getElementById('song-'+encodeURIComponent(id))?.scrollIntoView({block:'center'})));state.returnId=null;state.returnMode=null}else if(state.returnMode==='list'&&!state.search){const y=state.returnScroll;requestAnimationFrame(()=>requestAnimationFrame(()=>window.scrollTo(0,y)));state.returnId=null;state.returnMode=null}}
function updateHomeList(){const list=document.querySelector('#list');if(!list)return;const songs=sorted(false);list.innerHTML=songs.map((s,i)=>`<button class="row" data-id="${esc(s.id)}" id="song-${encodeURIComponent(s.id)}"><span class="num">${state.sort==='numbered'?(s.catalogNumber??''):i+1}</span><span class="title">${esc(s.title)}</span></button>`).join('')||'<div class="empty">No songs found</div>';document.querySelectorAll('.row').forEach(b=>b.onclick=()=>{state.selected=state.songs.find(s=>s.id===b.dataset.id);state.returnId=state.selected.id;state.returnScroll=window.scrollY;state.returnMode=state.search.trim()?'search':'list';render();requestAnimationFrame(()=>window.scrollTo(0,0))});const clear=document.querySelector('#clear');if(state.search&&!clear){const btn=document.createElement('button');btn.className='clear';btn.id='clear';btn.textContent='×';btn.onclick=()=>{state.search='';document.querySelector('#search').value='';btn.remove();updateHomeList()};document.querySelector('.searchWrap').appendChild(btn)}else if(!state.search&&clear)clear.remove()}
function menuHtml(){return `<div class="overlay" id="overlay"><div class="card" id="card"><h2>Songs</h2><b>Sort order</b><div class="segment"><button data-sort="alphabetical" class="${state.sort==='alphabetical'?'on':''}">Alphabetical</button><button data-sort="numbered" class="${state.sort==='numbered'?'on':''}">Numbered</button></div>${(!YGSCloud.configured||YGSCloud.isAdmin())?'<button class="primary" id="add">＋ Add Song</button>':''}${YGSCloud.configured?`<button class="secondary" id="cloudLogin">${YGSCloud.isAdmin()?'Sign out of admin':'Administrator sign-in'}</button><button class="secondary" id="cloudSync">Refresh Songs</button>`:''}<button class="secondary" id="export">Export Backup</button><button class="secondary" id="import">Import Backup</button><small style="display:block;text-align:center;margin-top:12px;color:#687777">${YGSCloud.configured?'Shared cloud library • offline copy available':'Settings and custom songs are saved on this device'} • ${state.songs.length} songs</small></div></div>`}
function wireMenu(){if(!state.menu)return;document.querySelector('#overlay').onclick=e=>{if(e.target.id==='overlay'){state.menu=false;renderHome()}};document.querySelectorAll('[data-sort]').forEach(b=>b.onclick=()=>{state.sort=b.dataset.sort;localStorage.setItem(K.sort,state.sort);renderHome()});document.querySelector('#add')?.addEventListener('click',()=>{state.menu=false;state.editor={__new:true,title:'',theme:'navy',catalogNumber:'',blocks:[newBlock('stanza')]};render()});document.querySelector('#export').onclick=exportBackup;document.querySelector('#import').onclick=()=>document.querySelector('#importFile').click();document.querySelector('#cloudLogin')?.addEventListener('click',async()=>{if(YGSCloud.isAdmin()){YGSCloud.logout();state.menu=false;render();return}const email=prompt('Administrator email:');if(!email)return;const password=prompt('Administrator password:');if(!password)return;try{await YGSCloud.login(email,password);state.menu=false;render()}catch(e){alert('Sign-in failed: '+e.message)}});document.querySelector('#cloudSync')?.addEventListener('click',()=>syncCloud(true))}
function songFlowHtml(s){
  const blocks=s.blocks||[];
  const hasParts=blocks.some(b=>b.type==='parts');
  // All songs follow one reading column. Simultaneous parts retain their
  // side-by-side voices within the parts block itself.
  return `<div class="songFlow single-column${hasParts?' voice-song':''}">${blocks.map(blockHtml).join('')}</div>`;
}

function renderSong(){
  let s=state.selected,[head,bg]=theme(s),blocks=s.blocks||[];
  const hasParts=blocks.some(b=>b.type==='parts');
  const normalLines=blocks.flatMap(b=>b.type==='parts'?[]:(b.lines||[])).filter(x=>String(x).trim());
  const partColumns=blocks.filter(b=>b.type==='parts').flatMap(b=>b.columns||[]);
  const partLines=partColumns.flatMap(c=>c.lines||[]).filter(x=>String(x).trim());
  const lineCount=normalLines.length + (hasParts ? Math.max(0,...partColumns.map(c=>(c.lines||[]).filter(x=>String(x).trim()).length)) : 0);
  const longestPart=partLines.reduce((m,x)=>Math.max(m,String(x).length),0);
  const desktop=window.innerWidth>=900;
  let fs;
  if(desktop){
    // Projector/web baseline: deliberately large for distance viewing, with a narrow
    // adaptive range so songs stay visually consistent and avoid needless scrolling.
    if(hasParts){
      fs = longestPart>=42 ? 28 : longestPart>=32 ? 29.5 : 31;
      if(lineCount>30) fs-=1;
    }else{
      fs = lineCount<=12 ? 34 : lineCount<=22 ? 31 : lineCount<=34 ? 29 : 27;
    }
  }else{
    // PWA phone baseline: close-up reading should be clearly smaller than the
    // projector layout, while staying consistent from song to song.
    // Most songs use 24px. Long simultaneous-part lines step down to 22px.
    if(hasParts){
      fs = longestPart>=30 ? 22 : 24;
    }else{
      fs = lineCount>34 ? 22 : lineCount>24 ? 23 : 24;
    }
  }
  // Preserve the compact mobile presentation of An Open Door after its repeat-instruction metadata update.
  // Keep all other songs and the projector sizing on the existing v13 baseline.
  if(!desktop && s.title==='An Open Door') fs=21;
  const longTitle=s.title.length>30?' longTitle':'';
  const longPartsClass=(hasParts && longestPart>=30)?' long-parts':'';
  const decorClass=` decor-${esc(s.decoration||'none')} style-${esc(s.style||'plain')}`;
  app.innerHTML=`<main class="song${decorClass}" style="--song-accent:${head};--song-bg:${bg};background:${bg}"><div class="songHead" style="background:${head}"><div class="songHeadInner"><button class="back" id="back">‹</button><button class="songTitle songTitleButton${longTitle}" id="titleBack" aria-label="Back to song list">${esc(s.title)}</button><button class="gear" id="gear">⚙</button></div></div><div class="lyrics" style="font-size:${fs}px"><div class="mobile-polish${longPartsClass}">${songFlowHtml(s)}</div></div></main>${state.menu?songMenuHtml():''}`;
  document.querySelector('#back').onclick=back;document.querySelector('#titleBack').onclick=back;document.querySelector('#gear').onclick=()=>{state.menu=true;renderSong()};if(state.menu){document.querySelector('#overlay').onclick=e=>{if(e.target.id==='overlay'){state.menu=false;renderSong()}};document.querySelector('#edit')?.addEventListener('click',()=>{state.menu=false;state.editor=structuredClone(s);render()})}requestAnimationFrame(()=>window.scrollTo(0,0))
}
function chorusLabel(text){return `<div class="chorusLabel"><span></span><b>${esc(text)}</b><span></span></div>`}
function lyricText(text){let out=esc(text);if(state.selected?.title==='The Crayon Box'){out=out.replace(/\bRED\b/g,'<span class="crayon-red">RED</span>').replace(/\bBROWN\b/g,'<span class="crayon-brown">BROWN</span>').replace(/\bBLUE\b/g,'<span class="crayon-blue">BLUE</span>').replace(/\bYELLOW\b/g,'<span class="crayon-yellow">YELLOW</span>')}return out}
function blockHtml(b){if(b.type==='parts'){let cols=b.columns||[],rows=Math.max(0,...cols.map(c=>(c.lines||[]).length));return `<div class="block">${b.label?chorusLabel(b.label):''}<div class="parts"><div class="partsHeaders">${cols.map(c=>`<div class="partLabel">${esc(c.label)}</div>`).join('')}</div>${Array.from({length:rows},(_,r)=>cols.some(c=>String(c.lines?.[r]||'').trim())?`<div class="partsRow">${cols.map(c=>`<div class="partLine">${esc(c.lines?.[r]||'')}</div>`).join('')}</div>`:'').join('')}</div></div>`}let cls=b.type==='instruction'?'block instruction':'block';return `<div class="${cls}">${b.type==='chorus'?chorusLabel(b.label||'Chorus'):(b.label?`<div class="blockLabel">${esc(b.label)}</div>`:'')}${(b.lines||[]).map((l,i)=>`<div class="line" style="${b.bold?.[i]?'font-weight:700;':''}${b.italic?.[i]?'font-style:italic;':''}">${lyricText(l)}</div>`).join('')}</div>`}
function songMenuHtml(){return `<div class="overlay" id="overlay"><div class="card"><h2>${esc(state.selected.title)}</h2>${(!YGSCloud.configured||YGSCloud.isAdmin())?'<button class="primary" id="edit">Edit Song</button>':'<p>Song editing is available to administrators only.</p>'}</div></div>`} function back(){if(state.search.trim())state.search='';state.selected=null;state.menu=false;render()}
function newBlock(type){return type==='parts'?{type:'parts',label:'',columns:[{label:'Guys',lines:['']},{label:'Girls',lines:['']}]}:{type,label:'',lines:[''],bold:[false],italic:[false],starts:[true]}}
function renderEditor(){let d=state.editor;app.innerHTML=`<div class="editor"><div class="editorHead"><button id="cancel">Cancel</button><b>${d.__new?'Add Song':'Edit Song'}</b><button id="save">Save</button></div><div class="editorBody"><label class="label">Title</label><input class="field" id="title" value="${esc(d.title)}"><div class="fieldRow"><div><label class="label">Number</label><input class="field" id="number" inputmode="numeric" value="${esc(d.catalogNumber??'')}"></div><div><label class="label">Theme</label><select id="theme">${Object.keys(THEMES).map(t=>`<option ${d.theme===t?'selected':''}>${t}</option>`).join('')}</select></div></div><p class="help">Each section can be a Verse, Chorus, Instruction, or two simultaneous Parts. Put one lyric line on each line below.</p><div id="sections">${(d.blocks||[]).map(sectionHtml).join('')}</div><div class="addButtons">${[['stanza','＋ Verse'],['chorus','＋ Chorus'],['instruction','＋ Instruction'],['parts','＋ Parts']].map(x=>`<button data-add="${x[0]}">${x[1]}</button>`).join('')}</div>${!d.__new?'<button class="danger" id="delete">Delete Song</button>':''}</div></div>`;wireEditor()}
function sectionHtml(b,i){let types=[['stanza','Verse'],['chorus','Chorus'],['instruction','Instruction'],['parts','Parts']];return `<div class="section" data-i="${i}"><div class="sectionTop"><span>Section ${i+1}</span><span><button data-up="${i}">↑</button><button data-down="${i}">↓</button><button data-remove="${i}">×</button></span></div><div class="types">${types.map(x=>`<button data-type="${x[0]}" data-i="${i}" class="${b.type===x[0]?'on':''}">${x[1]}</button>`).join('')}</div>${b.type==='parts'?(b.columns||[]).map((c,ci)=>`<label class="label">Part ${ci+1}</label><input class="field" data-partlabel="${ci}" value="${esc(c.label)}"><textarea data-partlines="${ci}">${esc((c.lines||[]).join('\n'))}</textarea>`).join(''):`<input class="field" data-label value="${esc(b.label||'')}" placeholder="Optional section label"><textarea data-lines>${esc((b.lines||[]).join('\n'))}</textarea>`}</div>`}
function wireEditor(){let d=state.editor;document.querySelector('#cancel').onclick=()=>{state.editor=null;render()};document.querySelector('#save').onclick=async()=>{if(YGSCloud.configured&&!YGSCloud.isAdmin()){alert('Administrator sign-in required.');return}syncEditor();d.title=d.title.trim()||'Untitled Song';if(d.__new){delete d.__new;d.id='custom-'+Date.now()+'.song';state.songs.push(d)}else state.songs=state.songs.map(s=>s.id===d.id?d:s);if(YGSCloud.configured){try{await publishSongs(state.songs)}catch(e){alert('Cloud save failed. Your changes were not published: '+e.message);state.songs=YGSCloud.cached()||structuredClone(BUNDLED_SONGS);return}}else saveSongs();state.selected=d;state.editor=null;render()};document.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{syncEditor();d.blocks.push(newBlock(b.dataset.add));renderEditor()});document.querySelectorAll('[data-type]').forEach(b=>b.onclick=()=>{syncEditor();d.blocks[+b.dataset.i]=newBlock(b.dataset.type);renderEditor()});document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{syncEditor();d.blocks.splice(+b.dataset.remove,1);renderEditor()});document.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>move(+b.dataset.up,-1));document.querySelectorAll('[data-down]').forEach(b=>b.onclick=()=>move(+b.dataset.down,1));document.querySelector('#delete')?.addEventListener('click',async()=>{if(confirm(`Delete “${d.title}”?`)){state.songs=state.songs.filter(s=>s.id!==d.id);if(YGSCloud.configured){try{await publishSongs(state.songs)}catch(e){alert('Cloud delete failed: '+e.message);state.songs=YGSCloud.cached()||structuredClone(BUNDLED_SONGS);return}}else saveSongs();state.editor=null;state.selected=null;render()}})}
function syncEditor(){let d=state.editor;d.title=document.querySelector('#title')?.value??d.title;let n=document.querySelector('#number')?.value;d.catalogNumber=n===''?'':Number(n);d.theme=document.querySelector('#theme')?.value||d.theme;document.querySelectorAll('.section').forEach(sec=>{let i=+sec.dataset.i,b=d.blocks[i];if(b.type==='parts'){sec.querySelectorAll('[data-partlabel]').forEach(x=>b.columns[+x.dataset.partlabel].label=x.value);sec.querySelectorAll('[data-partlines]').forEach(x=>b.columns[+x.dataset.partlines].lines=x.value.split('\n'))}else{b.label=sec.querySelector('[data-label]').value;b.lines=sec.querySelector('[data-lines]').value.split('\n');b.bold=b.lines.map(()=>b.type==='chorus');b.italic=b.lines.map(()=>b.type==='instruction');b.starts=b.lines.map((_,i)=>i===0)}})} function move(i,n){syncEditor();let j=i+n;if(j<0||j>=state.editor.blocks.length)return;[state.editor.blocks[i],state.editor.blocks[j]]=[state.editor.blocks[j],state.editor.blocks[i]];renderEditor()}
function exportBackup(){let blob=new Blob([JSON.stringify({version:1,exportedAt:new Date().toISOString(),songs:state.songs,sort:state.sort},null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='Youth_Group_Songs_Backup.json';a.click();URL.revokeObjectURL(a.href)} document.querySelector('#importFile').addEventListener('change',async e=>{let f=e.target.files[0];if(!f)return;try{let d=JSON.parse(await f.text());if(!Array.isArray(d.songs))throw 0;if(YGSCloud.configured&&!YGSCloud.isAdmin()){alert('Only administrators can import a shared library.');return}if(confirm(YGSCloud.configured?'Replace the shared cloud song library with this backup?':'Replace the songs on this device with this backup?')){state.songs=d.songs;state.sort=d.sort||state.sort;if(YGSCloud.configured){try{await publishSongs(state.songs)}catch(e){alert('Cloud import failed: '+e.message);state.songs=YGSCloud.cached()||structuredClone(BUNDLED_SONGS);return}}else saveSongs();localStorage.setItem(K.sort,state.sort);state.menu=false;render()}}catch{alert('That backup file could not be read.')}e.target.value=''});
async function publishSongs(songs){
 cloudWritePending=true;
 ++cloudRefreshSerial;
 try{return await YGSCloud.save(songs)}
 finally{cloudWritePending=false;}
}
let cloudRefreshSerial=0;
let cloudWritePending=false;
async function syncCloud(showMessage=false){
 if(!YGSCloud.configured||cloudWritePending||state.editor)return;
 const serial=++cloudRefreshSerial;
 try{
  const songs=await YGSCloud.load();
  if(serial!==cloudRefreshSerial||cloudWritePending||state.editor)return;
  if(!Array.isArray(songs))throw Error('Invalid shared song list');
  const changed=JSON.stringify(state.songs)!==JSON.stringify(songs);
  if(changed){
   state.songs=songs;
   if(state.selected)state.selected=songs.find(s=>s.id===state.selected.id)||null;
   // Do not close menus or interrupt an active search just because data changed.
   const active=document.activeElement;
   if(active?.id==='search')updateHomeList();else render();
  }
  if(showMessage)alert('Shared songs are up to date.');
 }catch(e){if(showMessage)alert('Could not refresh. Your last saved songs are still available. '+e.message)}
}
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('./sw.js'));
render();
if(YGSCloud.configured){
 // Only fetch automatically on a first install without any cached song library.
 // There are no periodic, focus, visibility, online, or cross-tab network checks.
 if(!YGSCloud.cached())syncCloud();
 // No cross-tab storage listener: other open windows update only when
 // their user explicitly chooses Menu > Refresh Songs.

}

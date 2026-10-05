const $=id=>document.getElementById(id);
mountThemeSwitch('themeSwitch');
let entries=[];const params=new URLSearchParams(location.search);$('query').value=params.get('q')||'';$('kind').value=params.get('kind')||'';
const labels={asset:'Saved media',template:'Library',workflow:'Workflow',recipe:'Recipe',connection:'Connection'};
function el(tag,text,cls){const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;}
function action(text,fn){const b=el('button',text,'btn-sm');b.type='button';b.onclick=fn;return b;}
async function load(){const r=await fetch('/api/directory');const data=await r.json();if(!r.ok)throw new Error(data.error||'Could not load directory');entries=data.entries;render();if(data.warnings.length)$('status').textContent+=' '+data.warnings.join(' ');}
function render(){
 const words=$('query').value.toLowerCase().trim().split(/\s+/).filter(Boolean),kind=$('kind').value;
 const found=entries.filter(e=>(!kind||e.kind===kind)&&words.every(w=>[e.title,e.description,...(e.tags||[]),e.provider,e.model,e.prompt,e.notes,e.purpose,...(e.useWhen||[])].filter(Boolean).join(' ').toLowerCase().includes(w)));
 const u=new URL(location.href);u.searchParams.set('q',$('query').value);if(kind)u.searchParams.set('kind',kind);else u.searchParams.delete('kind');history.replaceState(null,'',u);
 document.querySelectorAll('.studio-nav a').forEach(a=>{if(new URL(a.href).searchParams.get('kind')===kind&&kind)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
 $('results').replaceChildren();$('status').textContent=found.length+' result'+(found.length===1?'':'s');
 if(!found.length){$('results').append(el('div',kind==='recipe'?'No recipes yet for this search. Save a successful prompt or import its JSON to get started.':'No matches. Try a different phrase or choose Everything.','empty-state'));return;}
 for(const e of found){
  const card=el('article',null,'entry');card.append(el('small',labels[e.kind]),el('h2',e.title),el('p',e.description||(e.kind==='asset'?'Add a description and purpose before approving this asset.':'Saved generation recipe')),el('small',e.status));
  if(e.tags?.length)card.append(el('small',e.tags.join(' · ')));
  const row=el('div',null,'rail-actions');
  if(e.kind==='template'){const a=el('a','Open template','btn-sm');a.href=e.url;row.append(a);}else row.append(action('View details',()=>details(e)));
  if(e.kind==='recipe')row.append(action('Use as starting point',()=>recipe(e)));
  card.append(row);$('results').append(card);
 }
}
function download(e){const blob=new Blob([JSON.stringify(e,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=el('a');a.href=url;a.download='recipe-'+e.id+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function details(e){
 $('detailTitle').textContent=e.title;const body=$('detailBody');body.replaceChildren(el('p',e.description||''),el('p',e.status));
 if(e.requirements){body.append(el('h3','Before you start'));const list=el('ul');for(const r of e.requirements)list.append(el('li',r));body.append(list);}
 const text=['recipe','asset'].includes(e.kind)?JSON.stringify(e,null,2):e.instructions;
 if(e.kind==='asset'&&e.available){const a=el('a','Open media file','btn-sm');a.href=e.url;a.target='_blank';a.rel='noopener';body.append(a);}
 if(text){body.append(el('h3',e.kind==='recipe'?'Saved recipe':'Give this to your agent'),el('pre',text));const msg=el('p','');body.append(action('Copy for agent',async()=>{try{await navigator.clipboard.writeText(text);msg.textContent='Copied.';}catch{msg.textContent='Clipboard unavailable. Select and copy the text above.'}}),msg);}
 if(e.source&&/^https:\/\//.test(e.source)){const a=el('a','Original project / installation instructions','btn-sm');a.href=e.source;a.target='_blank';a.rel='noopener noreferrer';body.append(a);}
 if(e.kind==='recipe')body.append(action('Export JSON',()=>download(e)),action('Duplicate / adapt',()=>{ $('details').close();recipe(e); }));
 $('details').showModal();
}
function recipe(source={}){
 const form=$('recipeForm');form.reset();$('recipeError').textContent='';$('recipeHeading').textContent=source.id?'Adapt a saved recipe':'New recipe';
 for(const field of form.elements){if(!field.name)continue;let v=source[field.name];if(field.name==='settings')v=JSON.stringify(v||{},null,2);else if(Array.isArray(v))v=v.join(field.name==='tags'?', ':'\n');field.value=v??'';}
 if(source.id)form.elements.title.value=source.title+' (copy)';$('recipeDialog').showModal();
}
$('query').oninput=render;$('kind').onchange=render;$('newRecipe').onclick=()=>recipe();$('closeDetails').onclick=()=>$('details').close();$('closeRecipe').onclick=()=>$('recipeDialog').close();
$('importRecipe').onclick=()=>$('importFile').click();$('importFile').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>65536)throw new Error('Recipe exceeds 64 KB');const data=JSON.parse(await file.text());if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('Expected a recipe JSON object');recipe(data);}catch(error){$('status').textContent=error.message;}finally{e.target.value='';}};
$('recipeForm').onsubmit=async e=>{
 e.preventDefault();$('recipeError').textContent='';const b=$('saveRecipe');b.disabled=true;
 try{const data=Object.fromEntries(new FormData(e.target));data.settings=JSON.parse(data.settings||'{}');for(const k of ['tags','references','outputs'])data[k]=data[k].split(k==='tags'?',':/\r?\n/).map(x=>x.trim()).filter(Boolean);
 const r=await fetch('/api/recipes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const result=await r.json();if(!r.ok)throw new Error(result.error||'Could not save recipe');
 $('recipeDialog').close();$('kind').value='recipe';$('query').value='';await load();$('status').textContent='Recipe saved locally. '+$('status').textContent;
 }catch(error){$('recipeError').textContent=error.message;}finally{b.disabled=false;}
};
load().catch(e=>{$('status').textContent=e.message;});

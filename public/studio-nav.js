(() => {
 const bar=document.createElement('nav');bar.className='studio-nav';bar.setAttribute('aria-label','Studio sections');
 const kind=new URLSearchParams(location.search).get('kind');
 for(const [label,href,key] of [['Library','/','library'],['Workflows','/discover.html?kind=workflow','workflow'],['Recipes','/discover.html?kind=recipe','recipe'],['Connections','/discover.html?kind=connection','connection']]){
  const a=document.createElement('a');a.href=href;a.textContent=label;
  if(kind===key||key==='library'&&['/','/index.html','/editor.html'].includes(location.pathname))a.setAttribute('aria-current','page');bar.append(a);
 }
 const form=document.createElement('form');form.action='/discover.html';form.setAttribute('role','search');
 const q=document.createElement('input');q.type='search';q.name='q';q.placeholder='Search the whole studio';q.setAttribute('aria-label','Search the whole studio');
 const button=document.createElement('button');button.textContent='Search';button.className='btn-sm';form.append(q,button);if(location.pathname!=='/discover.html')bar.append(form);document.body.prepend(bar);
})();

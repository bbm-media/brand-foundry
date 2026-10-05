const $ = id => document.getElementById(id);
mountThemeSwitch('themeSwitch');
const colorFields = [['accent','Primary'],['accentSoft','Secondary'],['paper','Background'],['ink','Text']];
for (const [key, label] of colorFields) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `<label for="${key}">${label}</label><div class="color-entry"><input type="color" id="${key}Picker" aria-label="${label} color picker"><input id="${key}" name="${key}" required pattern="#[0-9a-fA-F]{6}" maxlength="7" aria-label="${label} hex color"></div>`;
  $('colors').append(wrapper);
  $(key+'Picker').oninput = () => { $(key).value = $(key+'Picker').value.toUpperCase(); schedulePreview(); };
  $(key).addEventListener('input', () => { if (/^#[0-9a-f]{6}$/i.test($(key).value)) $(key+'Picker').value = $(key).value; });
}
const readBrand = () => ({ name:$('name').value, handle:$('handle').value, ...Object.fromEntries(colorFields.map(([key])=>[key,$(key).value])), fonts:{display:$('display').value,body:$('body').value} });
let timer, previewVersion=0;
async function showPreview() {
  const version = ++previewVersion;
  if (!$('brandForm').checkValidity()) { $('previewStatus').textContent='Complete the fields to update your preview.'; return; }
  $('previewStatus').textContent='Updating preview…';
  try {
    const response = await fetch('/api/brand/preview',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(readBrand())});
    if (!response.ok) throw new Error((await response.json()).error);
    const html = await response.text();
    if (version !== previewVersion) return;
    $('preview').srcdoc=html;
    $('previewStatus').textContent='Previewing your colors and fonts on a real starter template.';
  } catch(e) { if(version===previewVersion) $('previewStatus').textContent=e.message; }
}
function schedulePreview() { clearTimeout(timer); ++previewVersion; timer=setTimeout(showPreview,350); }
$('brandForm').addEventListener('input',schedulePreview);
document.querySelectorAll('[data-heading]').forEach(button => button.addEventListener('click', () => {
  $('display').value=button.dataset.heading;
  $('body').value=button.dataset.body;
  schedulePreview();
}));
(async()=>{
  try {
    const response=await fetch('/google-fonts.json');
    if(!response.ok) throw new Error('Catalog unavailable');
    const catalog=await response.json();
    const families=catalog.families.filter(name=>typeof name==='string' && /^[a-zA-Z0-9][a-zA-Z0-9 -]{0,79}$/.test(name));
    if(!families.length) throw new Error('Empty catalog');
    const options=document.createDocumentFragment();
    for(const name of families) { const option=document.createElement('option'); option.value=name; options.append(option); }
    $('fontOptions').replaceChildren(options);
    $('fontCatalogStatus').textContent=`Search ${families.length.toLocaleString()} Google Fonts families. Catalog snapshot: ${catalog.fetchedAt}.`;
  }catch { $('fontCatalogStatus').textContent='Starter suggestions are available. Browse Google Fonts or type a family name.'; }
})();
$('brandForm').onsubmit = async event => {
  event.preventDefault(); $('save').disabled=true; $('status').textContent='Saving your brand and updating templates…';
  try {
    const response=await fetch('/api/brand',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(readBrand())});
    const result=await response.json(); if(!response.ok) throw new Error(result.error);
    document.documentElement.style.setProperty('--accent',result.brand.accent);
    document.documentElement.style.setProperty('--accent-soft',result.brand.accentSoft);
    $('status').textContent='Brand saved. Your starter templates are ready. You can return here anytime.';
  } catch(e) { $('status').textContent=e.message; }
  finally { $('save').disabled=false; }
};
(async()=>{
  try {
    const response=await fetch('/api/brand'); if(!response.ok) throw new Error('Could not load Brand Settings. Reload to try again.');
    const {brand}=await response.json();
    for(const key of ['name','handle',...colorFields.map(([key])=>key)]) $(key).value=brand[key]||'';
    for(const [key] of colorFields) $(key+'Picker').value=brand[key];
    for(const key of ['display','body']) $(key).value=brand.fonts[key];
    $('fields').disabled=false;
    document.documentElement.style.setProperty('--accent',brand.accent);document.documentElement.style.setProperty('--accent-soft',brand.accentSoft);
    showPreview();
  }catch(e){$('status').textContent=e.message;}
})();

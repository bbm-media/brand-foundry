import {readStyles} from './packages.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
const fields=['title','description','tags','prompt','negativePrompt','provider','model','modelVersion','seed','settings','references','outputs','notes','workflowId'];
const secretKey=/api.?key|access.?token|authorization|password|secret|credential/i;
function inspect(value,depth=0){
 if(depth>12)throw new Error('Recipe nesting is too deep');
 if(value && typeof value==='object')for(const [key,v] of Object.entries(value)){if(secretKey.test(key))throw new Error('Keep credentials out of recipes');inspect(v,depth+1);}
 if(typeof value==='string' && /(?:Bearer\s+[a-z0-9._-]{12,}|sk-[a-z0-9_-]{16,})/i.test(value))throw new Error('Remove credentials from recipe text');
}
export function validateRecipe(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Recipe must be an object');
 if(Buffer.byteLength(JSON.stringify(input))>65536)throw new Error('Recipe exceeds 64 KB');
 inspect(input);
 const out={};
 for(const key of fields){
  let value=input[key];
  if(['tags','references','outputs'].includes(key)){
   value=value??[];if(!Array.isArray(value)||value.length>50||value.some(x=>typeof x!=='string'||x.length>2048))throw new Error(key+' must be a list of strings');
  }else if(key==='settings'){
   value=value??{};if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Settings must be a JSON object');
  }else {value=value??'';if(key==='seed'&&typeof value==='number')value=String(value);if(typeof value!=='string'||value.length>16000)throw new Error('Invalid '+key);}
  out[key]=value;
 }
 if(!out.title.trim()||!out.prompt.trim())throw new Error('Title and prompt are required');
 out.title=out.title.trim();if(out.title.length>160)throw new Error('Title exceeds 160 characters');
 return out;
}
export function directoryRoutes(app,root,manifest,assetStore){
 const folder=path.join(root,'user-data','recipes');
 const readRecipes=()=>{
  const entries=[],warnings=[];
  if(fs.existsSync(folder))for(const file of fs.readdirSync(folder).filter(f=>/^[a-f0-9-]+\.json$/.test(f))){
   try{const raw=JSON.parse(fs.readFileSync(path.join(folder,file),'utf8'));entries.push({...validateRecipe(raw),id:file.slice(0,-5),kind:'recipe',status:'Saved locally',createdAt:raw.createdAt});}
   catch{warnings.push('A local recipe could not be read. Check user-data/recipes.');}
  }
  return {entries,warnings};
 };
 app.get('/api/directory',(_req,res)=>{
  try{
   const curated=JSON.parse(fs.readFileSync(path.join(root,'catalog/directory.json'),'utf8'));
   const {entries,warnings}=readRecipes();let templates=[];
   try{templates=manifest().templates.map(t=>({id:t.id,kind:'template',title:t.label,description:t.mediaLabel+' / '+t.categoryLabel,tags:[t.media,t.category,t.kind],status:'Ready to customize',url:'/editor.html?t='+encodeURIComponent(t.id),sizes:t.sizes}));}catch{warnings.push('Build the library to include templates in search.');}
   const indexed=assetStore?.all()||{records:[],warnings:[]};
   const assets=indexed.records.map(r=>({...r,status:r.available?r.review.status:'File missing',url:'/api/assets/'+r.id+'/file'}));
   res.set('Cache-Control','no-store').json({entries:[...templates,...curated,...readStyles(root),...assets,...entries],warnings:[...warnings,...indexed.warnings]});
  }catch(e){res.status(500).json({error:e.message});}
 });
 app.post('/api/recipes',(req,res)=>{
  const origin=req.get('origin');if(origin&&origin!==`${req.protocol}://${req.get('host')}`)return res.status(403).json({error:'Save recipes from this studio.'});
  try{
   const recipe={...validateRecipe(req.body),id:randomUUID(),kind:'recipe',createdAt:new Date().toISOString()};
   fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(path.join(folder,recipe.id+'.json'),JSON.stringify(recipe,null,2)+'\n',{flag:'wx'});
   res.status(201).json(recipe);
  }catch(e){res.status(400).json({error:e.message});}
 });
}

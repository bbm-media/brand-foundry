import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const extensions=new Set(['.png','.jpg','.jpeg','.webp','.gif','.mp4','.mov','.webm']);
const text=(v,n=4000)=>typeof v==='string'?v.slice(0,n):'';
const list=v=>Array.isArray(v)?v.filter(x=>typeof x==='string').slice(0,40).map(x=>x.slice(0,200)):[];
function mediaPath(root,relative){
 if(typeof relative!=='string'||path.isAbsolute(relative)||relative.includes('\\'))throw new Error('Use a studio-relative media path with forward slashes');
 const full=path.resolve(root,relative),allowed=['exports','uploads','user-data/media'];
 if(!allowed.some(dir=>{const base=path.resolve(root,dir)+path.sep;return full.startsWith(base)}))throw new Error('Media must be in exports/, uploads/ or user-data/media/');
 const real=fs.realpathSync(full);
 if(real!==full||!fs.statSync(real).isFile()||!extensions.has(path.extname(real).toLowerCase()))throw new Error('Unsupported media file or linked path');
 // Refuse ancestor junctions that resolve outside the expected local folder.
 if(!real.startsWith(fs.realpathSync(root)+path.sep))throw new Error('Media is outside this studio');
 return full;
}
function probe(file){
 try{const data=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format=duration:stream=codec_type,codec_name,width,height,avg_frame_rate,pix_fmt','-of','json',file],{encoding:'utf8',windowsHide:true,timeout:10000,maxBuffer:256000}));const video=data.streams?.find(s=>s.codec_type==='video')||{};
 return {width:video.width??null,height:video.height??null,durationSeconds:Number(data.format?.duration)||null,frameRate:video.avg_frame_rate||null,codec:video.codec_name||null,pixelFormat:video.pix_fmt||null,hasAudio:data.streams?.some(s=>s.codec_type==='audio')||false,verified:true};
 }catch{return {verified:false,note:'Technical metadata unavailable; inspect before use.'}};
}
export function createAssetStore(root){
 const folder=path.join(root,'user-data/assets');
 const save=record=>{fs.mkdirSync(folder,{recursive:true});const dest=path.join(folder,record.id+'.json'),temp=dest+'.tmp';fs.writeFileSync(temp,JSON.stringify(record,null,2)+'\n');fs.renameSync(temp,dest);return record;};
 const read=id=>{if(!/^[0-9a-f-]{36}$/.test(id))throw new Error('Invalid asset ID');return JSON.parse(fs.readFileSync(path.join(folder,id+'.json'),'utf8'));};
 const all=()=>{const records=[],warnings=[];if(fs.existsSync(folder))for(const name of fs.readdirSync(folder).filter(n=>/^[0-9a-f-]{36}\.json$/.test(n))){try{const r=read(name.slice(0,-5));let available=true;try{mediaPath(root,r.file)}catch{available=false}const changed=available&&(fs.statSync(path.join(root,r.file)).size!==r.bytes||fs.statSync(path.join(root,r.file)).mtime.toISOString()!==r.modifiedAt);records.push({...r,available,changed,review:changed?{...r.review,status:'flagged',notes:'File changed since indexing. Inspect and reapprove.'}:r.review});}catch{warnings.push('An asset record could not be read. Inspect user-data/assets.')}}return {records,warnings};};
 const register=(relative,metadata={},provenance={})=>{
  const file=mediaPath(root,relative);const prior=all().records.find(r=>r.file===relative);if(prior)return prior;
  const stat=fs.statSync(file);return save({schemaVersion:1,id:randomUUID(),kind:'asset',title:text(metadata.title,160)||path.basename(relative),description:text(metadata.description),purpose:text(metadata.purpose),tags:list(metadata.tags),useWhen:list(metadata.useWhen),avoidWhen:list(metadata.avoidWhen),recipeId:text(metadata.recipeId,160),rights:text(metadata.rights,1000)||'Not reviewed',file:relative,bytes:stat.size,modifiedAt:stat.mtime.toISOString(),technical:probe(file),review:{status:'unreviewed',notes:'Inspect the actual media before use.',updatedAt:new Date().toISOString()},provenance,createdAt:new Date().toISOString()});
 };
 return {all,read,register,update(id,input){const r=read(id);for(const key of ['title','description','purpose','recipeId','rights'])if(key in input)r[key]=text(input[key],key==='title'?160:4000);for(const key of ['tags','useWhen','avoidWhen'])if(key in input)r[key]=list(input[key]);if(input.review){if(!['unreviewed','approved','flagged'].includes(input.review.status))throw new Error('Invalid review status');if(input.review.status==='approved'&&(!r.description.trim()||!r.purpose.trim()||r.rights==='Not reviewed'))throw new Error('Add description, purpose and rights before approval');if(input.review.status==='approved'){const file=mediaPath(root,r.file),stat=fs.statSync(file);r.bytes=stat.size;r.modifiedAt=stat.mtime.toISOString();r.technical=probe(file);}r.review={status:input.review.status,notes:text(input.review.notes),updatedAt:new Date().toISOString()};}return save(r)},resolve(id){return mediaPath(root,read(id).file)}};
}
export function assetRoutes(app,root,store){
 app.get('/api/assets',(req,res)=>{const result=store.all();const terms=text(req.query.q).toLowerCase().split(/\s+/).filter(Boolean);res.set('Cache-Control','no-store').json({assets:result.records.filter(r=>(!req.query.status||r.review.status===req.query.status)&&terms.every(t=>[r.title,r.description,r.purpose,...r.tags,...r.useWhen].join(' ').toLowerCase().includes(t))),warnings:result.warnings});});
 app.get('/api/assets/:id/file',(req,res)=>{try{res.sendFile(store.resolve(req.params.id))}catch(e){res.status(404).json({error:e.message})}});
 const guard=(req,res,next)=>{const origin=req.get('origin');if(origin&&origin!==`${req.protocol}://${req.get('host')}`)return res.status(403).json({error:'Open this studio to change asset records'});next()};
 app.post('/api/assets',guard,(req,res)=>{try{res.status(201).json(store.register(req.body.file,req.body.metadata||{},{source:'external-registration'}))}catch(e){res.status(400).json({error:e.message})}});
 app.patch('/api/assets/:id',guard,(req,res)=>{try{res.json(store.update(req.params.id,req.body))}catch(e){res.status(400).json({error:e.message})}});
 app.post('/api/asset-gaps',guard,(req,res)=>{try{const need=text(req.body.need),reason=text(req.body.reason);if(!need.trim()||!reason.trim())throw new Error('Describe the need and why existing assets do not fit');const gap={id:randomUUID(),need,reason,candidateIds:list(req.body.candidateIds),recommendations:list(req.body.recommendations),status:'awaiting-user-direction',createdAt:new Date().toISOString()};const dir=path.join(root,'user-data/gaps');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,gap.id+'.json'),JSON.stringify(gap,null,2));res.status(201).json(gap);}catch(e){res.status(400).json({error:e.message})}});
 app.get('/api/asset-gaps',(_req,res)=>{const dir=path.join(root,'user-data/gaps');const gaps=[];if(fs.existsSync(dir))for(const n of fs.readdirSync(dir).filter(n=>/^[0-9a-f-]{36}\.json$/.test(n))){try{gaps.push(JSON.parse(fs.readFileSync(path.join(dir,n),'utf8')))}catch{}}res.json({gaps});});
}

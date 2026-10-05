import fs from 'node:fs';import path from 'node:path';import {randomUUID,createHash} from 'node:crypto';
import {createAssetStore} from './assets.mjs';
const media=/\.(png|jpe?g|webp|gif|mp4|mov|webm)$/i;
function hash(file){const h=createHash('sha256'),fd=fs.openSync(file,'r'),buffer=Buffer.alloc(65536);try{let n;while((n=fs.readSync(fd,buffer,0,buffer.length,null)))h.update(buffer.subarray(0,n));return h.digest('hex')}finally{fs.closeSync(fd)}}
export function validateStyle(m){if(m?.schemaVersion!==1||m.type!=='editing-style'||typeof m.id!=='string'||!m.id||typeof m.title!=='string'||typeof m.version!=='string'||!Array.isArray(m.rules)||m.rules.some(r=>typeof r!=='string')||!Array.isArray(m.dependencies))throw new Error('Invalid editing-style package');return m;}
export function exportAsset(root,id){
 const store=createAssetStore(root),record=store.all().records.find(r=>r.id===id),source=store.resolve(id);
 if(!record||!record.available)throw new Error('Asset file is missing');
 if(record.review.status!=='approved')throw new Error('Review and approve the asset before sharing');
 const out=path.join(root,'user-data/packages',randomUUID());fs.mkdirSync(path.join(out,'media'),{recursive:true});
 const relative='media/'+path.basename(source);fs.copyFileSync(source,path.join(out,relative));
 const manifest={schemaVersion:1,type:'media-asset',id:record.id,version:'1.0.0',file:relative,sha256:hash(source),metadata:{title:record.title,description:record.description,purpose:record.purpose,tags:record.tags,useWhen:record.useWhen,avoidWhen:record.avoidWhen,rights:record.rights},source:{assetId:record.id,recipeId:record.recipeId,review:record.review}};
 fs.writeFileSync(path.join(out,'package.json'),JSON.stringify(manifest,null,2));return out;
}
export function importPackage(root,sourceDirectory){
 const base=fs.realpathSync(sourceDirectory),manifestFile=path.join(base,'package.json');
 if(fs.realpathSync(manifestFile)!==manifestFile||fs.statSync(manifestFile).size>65536)throw new Error('Invalid package manifest');
 const m=JSON.parse(fs.readFileSync(manifestFile,'utf8'));if(m.schemaVersion!==1)throw new Error('Unsupported package version');
 if(m.type==='editing-style'){
  validateStyle(m);const folder=path.join(root,'user-data/styles');fs.mkdirSync(folder,{recursive:true});const id=randomUUID();fs.writeFileSync(path.join(folder,id+'.json'),JSON.stringify({...m,localId:id,importedAt:new Date().toISOString()},null,2),{flag:'wx'});return {type:m.type,id};
 }
 if(m.type!=='media-asset'||typeof m.file!=='string'||path.isAbsolute(m.file)||m.file.includes('\\')||!media.test(m.file))throw new Error('Unsupported asset package');
 const source=path.resolve(base,m.file);if(!source.startsWith(base+path.sep)||fs.realpathSync(source)!==source||!fs.statSync(source).isFile())throw new Error('Package file escapes its folder or is linked');
 if(hash(source)!==m.sha256)throw new Error('Asset checksum does not match');
 const dir=path.join(root,'user-data/media');fs.mkdirSync(dir,{recursive:true});const file='user-data/media/'+randomUUID()+path.extname(source).toLowerCase();fs.copyFileSync(source,path.join(root,file),fs.constants.COPYFILE_EXCL);
 return createAssetStore(root).register(file,m.metadata||{},{packageId:m.id,packageVersion:m.version,sourceAsset:m.source?.assetId});
}
export function readStyles(root){const result=[];for(const relative of ['catalog/styles','user-data/styles']){const dir=path.join(root,relative);if(!fs.existsSync(dir))continue;for(const name of fs.readdirSync(dir).filter(n=>n.endsWith('.json'))){try{const m=validateStyle(JSON.parse(fs.readFileSync(path.join(dir,name),'utf8')));result.push({id:m.localId||m.id,kind:'workflow',title:m.title,description:m.description||'',tags:['editing','style','modular'],status:'Editing style • review before applying',instructions:JSON.stringify(m,null,2),requirements:['Dependency links do not install skills. Apply only within the user-approved edit brief.']});}catch{}}}return result;}

import path from 'node:path';import {fileURLToPath} from 'node:url';
import {exportAsset,importPackage} from '../src/packages.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [action,target]=process.argv.slice(2);
try{if(action==='export-asset'&&target)console.log(exportAsset(root,target));else if(action==='import'&&target)console.log(JSON.stringify(importPackage(root,path.resolve(target)),null,2));else throw new Error('Usage: node scripts/share-package.mjs export-asset <id> | import <package-folder>');}catch(e){console.error(e.message);process.exitCode=1;}

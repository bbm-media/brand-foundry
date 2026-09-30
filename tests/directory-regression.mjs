import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import express from 'express';import puppeteer from 'puppeteer-core';
import {directoryRoutes,validateRecipe} from '../src/directory.mjs';import {resolveChrome} from '../chrome.mjs';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'studio-directory-'));
fs.mkdirSync(path.join(root,'catalog'));fs.copyFileSync(new URL('../catalog/directory.json',import.meta.url),path.join(root,'catalog/directory.json'));
assert.throws(()=>validateRecipe({title:'x',prompt:'x',settings:{api_key:'secret'}}),/credentials/);
assert.throws(()=>validateRecipe({title:'x',prompt:'x',settings:[]}),/Settings/);
assert.throws(()=>validateRecipe({title:'',prompt:'x'}),/required/);
const app=express();app.use(express.json());directoryRoutes(app,root,()=>({templates:[{id:'video/demo',label:'Product reveal',mediaLabel:'Video',categoryLabel:'Product',media:'video',category:'product',kind:'motion',sizes:[]}]}));
app.get('/api/brand',(_q,r)=>r.json({brand:{accent:'#2453ff',accentSoft:'#5c7cff'},setup:'complete'}));app.use(express.static(new URL('../public',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1')));
const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base='http://127.0.0.1:'+server.address().port;
let browser;
try{
 const post=(data,origin)=>fetch(base+'/api/recipes',{method:'POST',headers:{'content-type':'application/json',...(origin?{origin}:{})},body:JSON.stringify(data)});
 assert.equal((await post({title:'x',prompt:'x'},'https://other.example')).status,403);
 const created=await(await post({title:'QA product',prompt:'A sculptural product background',tags:['launch'],settings:{steps:12},references:['refs/product.png'],outputs:['exports/result.png']})).json();assert.match(created.id,/^[a-f0-9-]+$/);
 assert(fs.existsSync(path.join(root,'user-data/recipes',created.id+'.json')));
 browser=await puppeteer.launch({executablePath:resolveChrome(),headless:true});const page=await browser.newPage();let renderCalls=0;page.on('request',r=>{if(/api\/(thumb|preview|export)/.test(r.url()))renderCalls++});
 await page.goto(base+'/discover.html');await page.waitForSelector('.entry');
 assert.deepEqual(await page.$$eval('#kind option',nodes=>nodes.map(n=>n.value)),['','template','asset','workflow','recipe','connection']);
 await page.select('#kind','template');assert.equal(await page.$$('.entry').then(x=>x.length),1);
 await page.select('#kind','asset');assert.equal(await page.$$('.entry').then(x=>x.length),0);
 await page.select('#kind','');
 await page.type('#query','3d');assert.equal(await page.$$('.entry').then(x=>x.length),2);
 await page.select('#kind','recipe');assert.equal(await page.$$('.entry').then(x=>x.length),0);
 await page.$eval('#query',e=>{e.value='';e.dispatchEvent(new Event('input'))});assert.equal(await page.$$('.entry').then(x=>x.length),1);
 await page.evaluate(()=>[...document.querySelectorAll('button')].find(e=>e.textContent==='Use as starting point').click());
 assert.equal(await page.$eval('[name=prompt]',e=>e.value),'A sculptural product background');
 await page.click('#saveRecipe');await page.waitForFunction(()=>!document.querySelector('#recipeDialog').open);await page.waitForFunction(()=>document.querySelectorAll('.entry').length===2);
 await page.reload();await page.waitForFunction(()=>document.querySelectorAll('.entry').length===2);
 const cdp=await page.createCDPSession();await cdp.send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:root});
 await page.evaluate(()=>[...document.querySelectorAll('button')].find(e=>e.textContent==='View details').click());
 await page.evaluate(()=>[...document.querySelectorAll('button')].find(e=>e.textContent==='Export JSON').click());
 let downloaded;
 for(let attempt=0;attempt<50;attempt++){
  const file=fs.readdirSync(root).find(f=>/^recipe-.*\.json$/.test(f));
  if(file)try{downloaded=JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));break;}catch{}
  await new Promise(r=>setTimeout(r,100));
 }
 assert(downloaded,'Recipe JSON should finish downloading');assert.equal(downloaded.prompt,'A sculptural product background');
 await page.click('#closeDetails');
 const data=await(await fetch(base+'/api/directory')).json();assert.equal(data.entries.filter(e=>e.kind==='recipe').length,2);assert(data.entries.some(e=>e.kind==='template'));
 await page.click('#importRecipe');const file=path.join(root,'import.json');fs.writeFileSync(file,JSON.stringify({title:'Imported recipe',prompt:'Clean gradient',settings:{seed:42}}));await(await page.$('#importFile')).uploadFile(file);await page.waitForFunction(()=>document.querySelector('#recipeDialog').open);
 assert.equal(await page.$eval('[name=title]',e=>e.value),'Imported recipe');await page.click('#saveRecipe');await page.waitForFunction(()=>document.querySelectorAll('.entry').length===3);
 for(const width of [375,768,1400]){await page.setViewport({width,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal overflow at '+width);}
 assert.equal(renderCalls,0,'Directory must not trigger rendering');
 console.log('PASS: recipe persistence, duplicate without overwrite, JSON import/export, cross-type search, filters, no rendering, mobile widths, credential-field rejection, cross-origin protection.');
}finally{if(browser)await browser.close();await new Promise(r=>server.close(r));/* keep isolated fixture for inspection */}

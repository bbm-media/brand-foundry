import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import {resolveChrome} from '../chrome.mjs';
import {stampTiming} from '../template-timing.mjs';
const base=process.env.STUDIO_URL || 'http://127.0.0.1:4835';
assert.match(stampTiming('<div data-duration="4" data-duration-var="seconds">',{seconds:8}),/data-duration="8"/);
assert.throws(()=>stampTiming('<div data-duration="4" data-duration-var="seconds">',{seconds:0}));
const browser=await puppeteer.launch({executablePath:resolveChrome(),headless:true});
try {
 const page=await browser.newPage();await page.setViewport({width:1400,height:1000});
 let renders=0;page.on('request',r=>{if(r.url().endsWith('/api/preview/still'))renders++});
 await page.goto(base+'/editor.html?t=carousels/case-studies/case-study&s=pt');
 await page.waitForSelector('#var-headline');await page.waitForFunction(()=>document.querySelector('#stillPreview').naturalWidth>0);
 assert.equal(await page.$eval('#var-showSummary',e=>e.type),'checkbox');
 await page.evaluate(()=>[...document.querySelectorAll('button')].find(e=>e.textContent==='Save visual style').click());
 const sizesBefore=await page.$$eval('.sz',links=>links.map(link=>link.href));
 const originalColor=await page.$eval('#var-accentColor',e=>e.value);
 await page.$eval('#var-accentColor',e=>{e.value='#ff0000';e.dispatchEvent(new Event('input',{bubbles:true}))});
 await page.evaluate(()=>[...document.querySelectorAll('button')].find(e=>e.textContent==='Apply saved style').click());
 assert.equal(await page.$eval('#var-accentColor',e=>e.value),originalColor);
 assert.deepEqual(await page.$$eval('.sz',links=>links.map(link=>link.href)),sizesBefore,'Applying a style preserves size navigation');
 const before=renders;await page.type('#var-headline',' QA');
 await new Promise(r=>setTimeout(r,1000));assert.equal(renders,before,'Typing must not render');
 await page.click('#savePreview');await new Promise(r=>setTimeout(r,1600));assert.equal(renders,before+1);
 await Promise.all([page.waitForNavigation(),page.click('.sz[href$="s=sq"]')]);await page.waitForSelector('#var-headline');
 assert.match(await page.$eval('#var-headline',e=>e.value),/ QA$/);
 await page.evaluate(()=>[...document.querySelectorAll('summary')].find(e=>e.textContent==='Make a simple background').click());
 await page.evaluate(()=>[...document.querySelectorAll('button')].find(e=>e.textContent==='Create background').click());
 await page.waitForFunction(()=>document.querySelector('#var-backgroundImage').value.includes('assets/'));
 assert((await page.$eval('#var-backgroundImage',e=>e.value)).endsWith('.svg'));
 await page.click('#savePreview');await new Promise(r=>setTimeout(r,1800));
 await page.screenshot({path:'exports/qa-design-controls.png',fullPage:true});
 const manifest=await(await fetch(base+'/api/manifest')).json();
 for(const t of manifest.templates.filter(t=>t.name==='case-study'))for(const size of t.sizes)for(const layout of ['overview','results','gallery']){
   const response=await fetch(base+'/api/export/png',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:t.id,suffix:size.suffix,scale:1,variables:{layout}})});
   const result=await response.json();assert(response.ok,JSON.stringify(result));
   if(t.media==='carousels' && layout==='overview')console.log(size.suffix,result.url);
 }
 await page.goto(base+'/editor.html?t=video/overlays/starter-headline&s=half');await page.waitForSelector('#var-durationSeconds');
 assert.equal(await page.$eval('#var-durationSeconds',e=>e.type),'number');
 await page.$eval('#var-durationSeconds',e=>{e.value='0';e.dispatchEvent(new Event('input',{bubbles:true}))});
 await page.click('#savePreview');assert.match(await page.$eval('#saveStatus',e=>e.textContent),/Unsaved/);
 console.log('PASS: typed controls, no render while typing, Save once, ratio persistence, background upload, 18 layout/size PNG exports, invalid duration blocked.');
}finally{await browser.close()}

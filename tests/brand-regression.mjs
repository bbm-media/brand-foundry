import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateBrand, brandTemplate, parseVariables } from '../brand.mjs';
const original=JSON.parse(readFileSync(new URL('../studio.config.json',import.meta.url)));
const brand=validateBrand({name:"Owner's Studio",handle:'@brandqa',accent:'#9b352d',accentSoft:'#28634a',paper:'#fff4de',ink:'#242019',fonts:{display:'Montserrat',body:'Roboto'}},original.brand);
assert.equal(brand.accent,'#9B352D');
assert.throws(()=>validateBrand({...brand,accent:'red'},original.brand));
assert.throws(()=>validateBrand({...brand,fonts:{display:'</style><script>',body:'Inter'}},original.brand));
for(const file of ['carousels/slides/starter-slide.html','statics/posters/starter-poster.html','video/overlays/starter-headline.html']) {
  const source=readFileSync(new URL('../templates/'+file,import.meta.url),'utf8');
  const result=brandTemplate(source,brand);
  const variables=parseVariables(result);
  for(const v of variables.filter(v=>v.brandKey)) assert.equal(v.default,brand[v.brandKey]);
  assert(result.includes('--serif:"Montserrat"'));
  assert(result.includes('--sans:"Roboto"'));
  assert(!result.includes('family=Inter'));
  assert.notEqual(result,brandTemplate(source,{...brand,accent:'#000001'}));
}
const independent=`<html data-composition-variables='[{"id":"accentColor","default":"#112233"}]'><head></head></html>`;
assert.equal(parseVariables(brandTemplate(independent,brand))[0].default,'#112233');
console.log('PASS brand defaults in all starters, fonts, validation, and independent template overrides');

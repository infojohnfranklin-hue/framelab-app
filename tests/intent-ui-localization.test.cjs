const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {parse} = require('@babel/parser');
const path = require('node:path');
const root = path.join(__dirname, '..');
const languages = fs.readFileSync(path.join(root,'data/languages.js'),'utf8');
const index = fs.readFileSync(path.join(root,'pages/index.js'),'utf8');
const app = fs.readFileSync(path.join(root,'pages/_app.js'),'utf8');
const api = fs.readFileSync(path.join(root,'pages/api/generate.js'),'utf8');
const copy = vm.runInNewContext(languages.replace(/export /g,'')+'\n({LANGUAGES,getUiCopy,LANGUAGE_STORAGE_KEY});');
const keys = ['intentTitle','intentVisionTitle','intentVisionPlaceholder','intentMeaningTitle','intentMeaningPlaceholder','intentImpactTitle','intentImpactPlaceholder'];
for (const lang of ['English','Deutsch','Español','Français','Italiano','Português','中文']) {
 test(`${lang}: all Intent UI keys are present and wired to current ui copy`,()=>{
  const ui=copy.getUiCopy(lang);
  for(const key of keys){assert.equal(typeof ui.generate[key],'string');assert.ok(ui.generate[key].trim());assert.ok(index.includes(`{ui.generate.${key}}`));}
  if(lang!=='English')for(const key of keys)assert.notEqual(ui.generate[key],copy.getUiCopy('English').generate[key]);
 });
}
test('JS/JSX parse; settings language supplies UI without mutating input state or payload',()=>{
 for(const s of [languages,index])parse(s,{sourceType:'module',plugins:['jsx']});
 assert.equal(copy.LANGUAGE_STORAGE_KEY,'framelab_language');
 assert.equal(copy.LANGUAGES.length,7);
 assert.ok(app.includes('const ui = getUiCopy(language)'));
 assert.ok(app.includes('ui={ui}'));
 const ast=parse(index,{sourceType:'module',plugins:['jsx']});
 const fields=new Map();
 function walk(n){if(!n||typeof n!=='object')return;if(n.type==='JSXOpeningElement'&&n.name.name==='textarea'){
  const attrs=Object.fromEntries(n.attributes.filter(a=>a.type==='JSXAttribute').map(a=>[a.name.name,a.value]));
  const value=attrs.value?.expression?.name;
  if(['userReelVision','meaning','desiredImpact'].includes(value)) fields.set(value,attrs);
 }for(const v of Object.values(n))if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}
 walk(ast);
 for(const [value,setter] of [['userReelVision','setUserReelVision'],['meaning','setMeaning'],['desiredImpact','setDesiredImpact']]){
  const attrs=fields.get(value);assert.ok(attrs);
  const handler=index.slice(attrs.onChange.start,attrs.onChange.end);
  assert.ok(handler.includes(`${setter}(e.target.value)`));
 }
 assert.ok(index.includes('          userReelVision,\n          meaning,\n          desiredImpact,'));
 assert.ok(!api.includes('intentVisionTitle'));
});

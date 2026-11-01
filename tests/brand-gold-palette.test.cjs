const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const luminance=h=>{const v=h.match(/\w\w/g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*v[0]+.7152*v[1]+.0722*v[2]};
const contrast=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
test('central warm gold tokens preserve readable button and label contrast',()=>{
 const css=read('styles/premium.css');
 for(const [token,hex]of [['primary','BE8B45'],['highlight','E5B468'],['muted','C49A61']])assert.ok(css.includes(`--premivate-gold-${token}: #${hex}`));
 for(const [a,b]of [['BE8B45','17130C'],['E5B468','17130C'],['C49A61','141517']])assert.ok(contrast(a,b)>=4.5);
 assert.ok(read('components/Sidebar.js').includes('color: isActive ? "#17130C" : "white"'));
});
test('functional status and disabled states remain separate from brand gold',()=>{
 const sidebar=read('components/Sidebar.js'),index=read('pages/index.js');
 assert.ok(sidebar.includes('#4ade80'));
 assert.ok(index.includes('loading || !mounted'));
 assert.ok(index.includes('? "rgba(255,255,255,0.12)"'));
 assert.ok(index.includes('#22c55e'));assert.ok(index.includes('#86efac'));
});

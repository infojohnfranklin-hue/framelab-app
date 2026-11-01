const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{parse}=require('@babel/parser');
const source=fs.readFileSync(path.join(__dirname,'../pages/videos.js'),'utf8');
test('Blueprints uses isolated dark panel, reference, input and preset surfaces',()=>{
 parse(source,{sourceType:'module',plugins:['jsx']});
 for(const key of ['panel','reference','input','preset'])assert.ok(source.includes(`blueprintSurfaces.${key}`));
 assert.ok(source.includes('panel: "linear-gradient(180deg, #0C0D0F, #08090B)"'));
 assert.ok(source.includes('reference: "linear-gradient(180deg, #121315, #0D0E10)"'));
 assert.ok(source.includes('preset: "#101113"'));
});
test('gold selection, drag feedback and disabled treatment remain independent',()=>{
 assert.ok(source.includes('background: isDragging'));
 assert.ok(source.includes('background: visualReferenceDragging'));
 assert.ok(source.includes('rgba(var(--premivate-gold-rgb),0.18)'));
 assert.ok(source.includes('mode.premium && userPlan !== "pro"\n      ? 0.55'));
});

test('Blueprints background retains original image with subtle warm overlay, without Royal Blue',()=>{
 assert.ok(source.includes("url('/framelab-premium-blueprints-assets/01_FrameLab_Blueprints_Hero_Studio_Wide.png')"));
 assert.ok(source.includes('rgba(84,49,25,0.12)'));
 assert.ok(source.includes('background: blueprintSurfaces.inner'));
 assert.doesNotMatch(source,/#4D6FA6|77,111,166|#172840|#101B2B/);
});

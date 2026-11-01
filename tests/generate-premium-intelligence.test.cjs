const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const root = process.env.FRAMELAB_DEPENDENCY_ROOT || path.join(__dirname, '..');
const { parse } = createRequire(path.join(root, 'package.json'))('@babel/parser');
const sourcePath = process.env.FRAMELAB_TEST_SOURCE || path.join(__dirname, '../pages/api/generate.js');
const source = fs.readFileSync(sourcePath, 'utf8');
const ast = parse(source, { sourceType: 'module' });
const fixtures = require('./fixtures/premium-intelligence-eight-intents.json');
const directorsSource = fs.readFileSync(process.env.FRAMELAB_DIRECTOR_SOURCE || path.join(root, 'data/directorModes.js'), 'utf8');
const directors = vm.runInNewContext(directorsSource.replace('export const directorModes', 'const directorModes') + '\ndirectorModes;');
const clone = v => JSON.parse(JSON.stringify(v));
const declarations = new Map();
function visit(n) {
  if (!n || typeof n !== 'object') return;
  if (n.type === 'VariableDeclarator' && n.id.type === 'Identifier') declarations.set(n.id.name, `const ${source.slice(n.start, n.end)};`);
  Object.values(n).forEach(v => Array.isArray(v) ? v.forEach(visit) : visit(v));
}
visit(ast);
function load(names, globals = {}) {
  return vm.runInNewContext(`${names.map(n => { assert.ok(declarations.has(n), n); return declarations.get(n); }).join('\n')}\n({${names.join(',')}})`, { normalizedOutputLanguage: 'English', ...globals }, { timeout: 1000 });
}
const handlerSource = ast.program.body.filter(n => n.type !== 'ImportDeclaration').map(n => source.slice(n.start, n.end).replace(/^export default /, '')).join('\n');
const audienceEmotionValidator = load([
  'bannedAudienceEmotionTerms',
  'hasBannedAudienceEmotionTerm',
  'audienceEmotionItemsAreTextDuplicates',
  'audienceEmotionLooksComplete',
]);
const groupFields = {
  causal: ['causeRole','effectRole','physicalResponseRelation'],
  subjectInteraction: ['subjectRole','interactionAction','interactionTargetOrMedium'],
  worldContinuity: ['worldPhysicalSystem','materialOrSurfaceBehavior','causalVisibilityCondition'],
};
function preservation(verdict = 'equivalent') {
  const fields = Object.fromEntries(Object.entries(groupFields).map(([g,ks]) => [g,Object.fromEntries(ks.map(k => [k,`Controlled fixture evidence for ${k}`]))]));
  const statuses = Object.fromEntries(Object.entries(groupFields).map(([g,ks]) => [g,Object.fromEntries(ks.map(k => [k,verdict]))]));
  return { evaluationStatus:'evaluation_success', referenceFields: fields, candidateFields:clone(fields), fieldStatuses:statuses,
    causalCoreStatus:'pass',subjectInteractionCoreStatus:'pass',worldContinuityCoreStatus:'pass',preservationStatus:'pass',uncertainFields:[] };
}
// Runs the real handler entirely inside a VM. No require/fetch/network/file
// tools exist in that VM. Only imported boundaries are injected; local routing,
// normalization, audit, repair validation and finalization are real source.
// Scripted evaluator PASS is plumbing evidence, NEVER a quality judgement.
function scriptedPremise(fixture) {
  return {
    corePremise: fixture.candidate.reelConcept,
    governingRelationship: 'The fixture subject remains in a readable relation to its established environment.',
    controlSynthesis: {
      artistTrackPurpose: `${fixture.inputs.artistName} / ${fixture.inputs.trackName}: ${fixture.inputs.reelPurpose}`,
      musicalProfile: `${fixture.inputs.genre} at ${fixture.inputs.bpm} BPM shapes the fixture pacing.`,
      directionAndVisualWorld: `${fixture.inputs.directorMode} and ${fixture.inputs.mood} shape how the fixture is witnessed.`,
    },
    progressionPrinciple: fixture.candidate.narrativeArc.stage2,
    finalCondition: fixture.candidate.narrativeArc.stage3,
    ...(typeof fixture.inputs.trackName === 'string' && fixture.inputs.trackName.trim() ? { trackBinding: {
      signal: `${fixture.inputs.genre} at ${fixture.inputs.bpm} BPM`,
      interpretation: 'Musical pacing becomes deliberate spatial attention in this scripted fixture.',
      governingEffect: 'The fixture relationship unfolds through the measured observation described above.',
    } } : {}),
  };
}
async function replay(fixture, options = {}) {
  const calls = [], logs = []; let status = 200, output;
  const requests = [];
  const requestOptions = [];
  class OfflineOpenAI {
    constructor() { this.chat={completions:{create: async (request, callOptions) => {
      const name = request.response_format?.json_schema?.name || 'initial';
      calls.push(name); requests.push(clone(request));
      requestOptions.push(callOptions ? clone(callOptions) : null);
      let answer;
      if (name === 'framelab_autonomous_premise') {
        const input = JSON.parse(request.messages.at(-1).content);
        if (options.premiseError) throw options.premiseError;
        if (Object.prototype.hasOwnProperty.call(options, 'premiseCompletion')) return clone(options.premiseCompletion);
        answer = options.premise ? options.premise(input, scriptedPremise(fixture)) : scriptedPremise(fixture);
      }
      else if (name === 'initial') answer = clone(fixture.candidate);
      else if (name === 'framelab_filmic_meaning_evaluation') {
        const context = JSON.parse(request.messages.at(-1).content);
        const f = context.candidateFields;
        answer={verdict:'PASS', reasonCode:'FILMIC_MEANING_SUPPORTED', intentPreserved:'yes', carrierPath:'reelConcept',carrierQuote:f.reelConcept.slice(0,65),developmentPath:'narrativeArc.stage3',developmentQuote:f['narrativeArc.stage3'].slice(0,65),repairEvidencePath:'',repairEvidenceQuote:'',originalGapResolved:'uncertain',comparativeReason:''};
        if (options.meaning) answer=options.meaning(context,answer,calls);
      } else if (name === 'framelab_premium_preservation_evaluation') {
        const defaultAnswer=preservation(typeof options.preservation === 'string' ? options.preservation : 'equivalent');
        // Scripted statuses test contract transport and fail-closed plumbing,
        // never the provider's ability to recognize semantic equivalence.
        const causalSchema = request.response_format.json_schema.schema.properties.autonomousCausalFacts;
        if (causalSchema) defaultAnswer.autonomousCausalFacts = Object.fromEntries(causalSchema.required.map(key => [key, {
          referenceFact: `Scripted source evidence for ${key}`,
          candidateEvidence: `Compatible paraphrase for ${key}`,
          status: 'equivalent',
        }]));
        if (request.response_format.json_schema.schema.properties.stage3VisualRuleEvidence) {
          defaultAnswer.stage3VisualRuleEvidence = 'pass';
          defaultAnswer.directorNotesVisualRuleEvidence = 'pass';
        }
        for (const key of ['projectCodenameIdentityQuality', 'creativeArchetypeIdentityQuality', 'projectCodenameLanguageMatch', 'creativeArchetypeLanguageMatch']) {
          if (request.response_format.json_schema.schema.properties[key]) defaultAnswer[key] = 'pass';
        }
        answer=typeof options.preservation === 'function' ? options.preservation(request,defaultAnswer) : defaultAnswer;
      }
      else if (name === 'framelab_semantic_repairs') {
        const context=JSON.parse(request.messages.at(-1).content.split('CONTEXT:\n')[1]);
        if (!options.repair) throw new Error('UNEXPECTED_OFFLINE_REPAIR: '+context.auditIssues.map(i=>i.code).join(','));
        answer=options.repair(context);
      } else throw new Error('UNEXPECTED_OFFLINE_CALL: '+name);
      return {choices:[{finish_reason:'stop',message:{content:JSON.stringify(answer)}}]};
    }}}; }
  }
  const noCredits=()=>{throw new Error('UNEXPECTED_CREDIT_OPERATION');};
  const seededMath=Object.create(Math);seededMath.random=()=>0.37;
  const ctx=vm.createContext({OpenAI:OfflineOpenAI,directorModes:clone(directors),getAuth:()=>({userId:'offline-fixture'}),getUserPlan:()=> 'pro',reserveFreeGenerate:noCredits,completeFreeGenerate:noCredits,failFreeGenerate:noCredits,
    reserveGlobalProviderAttempt: async () => ({ status: 'RESERVED' }),
    measurement: require(path.join(root, 'lib/generation-cost-measurement.js')),
    process:{env:{FRAMELAB_DEV_MODE:'true',OPENAI_API_KEY:'offline-placeholder'}},Math:seededMath,
    console:{log:(...x)=>logs.push(x),info:(...x)=>logs.push(x),error:(...x)=>logs.push(x.map(v=>v?.message?{message:v.message,code:v.code}:v))},
    req:{body:clone(fixture.inputs)},res:{status(n){status=n;return this;},json(v){output=clone(v);return output;}}
  });
  let executionSource=handlerSource;
  // Fault injection is confined to this test VM. The actual gate still runs;
  // only its returned boundary result is replaced, to test fail-closed delivery.
  if (Object.prototype.hasOwnProperty.call(options,'gateResultOverride')) {
    const anchor='await runSemanticQualityGate();';
    assert.equal(executionSource.split(anchor).length-1,1);
    const replacement=options.gateResultOverride === undefined ? 'undefined' : JSON.stringify(options.gateResultOverride);
    executionSource=executionSource.replace(anchor,`(await runSemanticQualityGate(), ${replacement});`);
  }
  await vm.runInContext(executionSource+'\nhandler(req,res);',ctx,{timeout:3000});
  return {status,output,calls,requests,requestOptions,logs};
}
function primaryRequestFromResult(result) {
  return result.requests.find(request => request.response_format?.type === 'json_object');
}
function creativeCore(c) { return {reelConcept:c.reelConcept,directorSummary:c.directorSummary,narrativeArc:c.narrativeArc,aiVideoPrompt:c.aiVideoPrompt}; }
function preservationCandidate(result) {
  const request=result.requests.findLast(r=>r.response_format?.json_schema?.name==='framelab_premium_preservation_evaluation');
  return request ? JSON.parse(request.messages.at(-1).content.split('\nCANDIDATE:\n')[1]) : null;
}

for (const fixture of fixtures) {
  test(`eight-intent real local pipeline: ${fixture.id}`, async () => {
    const r=await replay(fixture);
    assert.equal(r.status,200,JSON.stringify({output:r.output,logs:r.logs}));
    assert.deepEqual(creativeCore(r.output),creativeCore(fixture.candidate),`Unjustified creative rewrite in ${fixture.id}`);
    assert.deepEqual(r.output.hooks,fixture.candidate.hooks,'Individual hooks must remain intact');
    for (const key of ['mainCaption','instagramCaption','tiktokCaption','youtubeShortsCaption']) assert.equal(r.output.captions[key],fixture.candidate.captions[key],key);
    assert.ok(!r.calls.includes('framelab_semantic_repairs'),JSON.stringify({calls:r.calls,logs:r.logs}));
    assert.deepEqual(creativeCore(preservationCandidate(r)),creativeCore(r.output),'Delivered core must be the preservation-checked core');
    assert.equal(r.calls.filter(n=>n==='initial').length,1);
    assert.equal(r.calls.filter(n=>n==='framelab_premium_preservation_evaluation').length,1);
    const prompt=r.requests[0].messages.map(m=>m.content).join('\n');
    assert.ok(prompt.includes(fixture.inputs.userReelVision));
    assert.ok(prompt.includes(fixture.inputs.meaning));
    assert.ok(prompt.includes('SUPPLIED CREATIVE INTENT TAKES PRIORITY:'),'User intent must lead '+fixture.id);
    assert.ok(prompt.includes('Selected controls are creative inputs, not a checklist of labels or decorative styling.'),'Selected controls must influence the direction for '+fixture.id);
    assert.ok(prompt.includes('Concept DNA is a derived identity and routing suggestion, not a literal-world lock.'),'Inferred DNA must remain supporting context for '+fixture.id);
    assert.ok(prompt.includes('For literal physical action, preserve object roles, operating conditions, agency, cause and consequence.'));
    assert.ok(prompt.includes('For abstract, open or surreal ideas, preserve the supplied internal rule'));
    assert.ok(prompt.includes('The Director Blueprint must translate it into filmable direction, not explain its meaning.'));
    assert.ok(prompt.includes("Across the Reel Concept, Director's Notes, Narrative Arc and AI Video Prompt, supplied Meaning and Desired Impact guide creative decisions; they are not to be repeatedly restated as abstract interpretation."));
    assert.ok(prompt.includes('For visually concrete concepts, let them shape what is shown, what changes or remains, framing, timing and the final visible state, and let observable cinematic evidence carry the intent.'));
    assert.ok(prompt.includes('For explicitly abstract or surreal concepts, preserve the declared visual rule without literalizing it.'));
    assert.ok(prompt.includes('for a visually concrete concept, finish on an observable action, state, spatial relationship or open condition rather than appending an abstract explanation of what it means.'));
    assert.ok(prompt.includes('finish on the observable image or condition, not an abstract comment that explains it.'));
    assert.ok(!prompt.includes('Show why its visual treatment matters to the idea.'));
    assert.ok(!prompt.includes('The Director Blueprint must explain it.'));
    assert.ok(!prompt.includes('The reelConcept must not explain too much.'));
    for(const obsolete of [
      'The Concept DNA is the only world.',
      'Concept DNA is the sole source of:',
      'Concept DNA remains the locked physical world',
      'The selected archetype is mandatory.',
      'Write the aiVideoPrompt as one continuous cinematic paragraph with exactly 4 sentences.',
      'The aiVideoPrompt must be 90-130 words.',
      'Write the reelConcept in exactly 2 sentences.',
      'The arc must come from the Concept DNA only.',
    ]) assert.ok(!prompt.includes(obsolete),fixture.id+' prompt retains obsolete lock: '+obsolete);
    assert.ok(!prompt.includes('self-critique rule: undefined'));
  });
}

test('primary Audience Emotion prompt matches local completeness rules without forcing physical change', async () => {
  const fixture = fixtures.find(f => f.id === 'held');
  const r = await replay(fixture);
  assert.equal(r.status, 200);

  const primaryRequest = r.requests[0];
  assert.equal(primaryRequest.response_format?.type, 'json_object');
  assert.equal(primaryRequest.response_format?.json_schema, undefined,
    'Primary Generate has no formal per-field Structured Output schema');

  const prompt = primaryRequest.messages.map(m => m.content).join('\n');
  for (const rule of [
    'each item must contain at least eight whitespace-separated words; do not pad with filler',
    'all three items must describe distinct, concept-specific emotional consequences rather than duplicate or paraphrase one another',
    'each consequence must be supported by a visible or audible cue from this concept, not merely name an emotion or restate Meaning',
    'do not begin an item with viewer, viewers, the viewer, the viewers, audience, the audience, spectator, spectators, the spectator, the spectators, or attention is drawn',
    'do not use the word motif or the phrases across the sequence, final composition, its surroundings, or their surroundings anywhere in an item',
    'do not use the construction “the series/flock/figures [one word] and its” in an item',
    'Do not require physical change for a held, open, abstract or surreal concept.',
  ]) assert.ok(prompt.includes(rule), `Primary prompt is missing validator-aligned rule: ${rule}`);
  for (const term of audienceEmotionValidator.bannedAudienceEmotionTerms) {
    assert.ok(prompt.includes(term), `Primary prompt is missing banned term: ${term}`);
  }

  const items = r.output?.cinematicIdentity?.audienceEmotion;
  assert.equal(items?.length, 3);
  for (const item of items) {
    assert.equal(audienceEmotionValidator.audienceEmotionLooksComplete(item), true);
    assert.equal(audienceEmotionValidator.hasBannedAudienceEmotionTerm(item), false);
  }
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      assert.equal(audienceEmotionValidator.audienceEmotionItemsAreTextDuplicates(items[i], items[j]), false);
    }
  }
});

test('primary-generation causality keeps physical events and intent scale aligned across fields', async () => {
  const physical = clone(fixtures.find(f => f.id === 'craft'));
  physical.inputs.desiredImpact = 'Grounded tenderness and small relief; understated, without dramatic rescue or heroic triumph.';
  const open = fixtures.find(f => f.id === 'held');
  const surreal = fixtures.find(f => f.id === 'surreal');
  const runs = new Map();

  for (const fixture of [physical, open, surreal]) {
    const r = await replay(fixture);
    runs.set(fixture.id, r);
    assert.equal(r.status, 200, `${fixture.id} offline candidate should remain accepted`);
    assert.deepEqual(creativeCore(r.output), creativeCore(fixture.candidate),
      `Primary prompt change must not rewrite an existing candidate: ${fixture.id}`);
    assert.deepEqual(r.output.hooks, fixture.candidate.hooks);
    assert.equal(r.calls.filter(name => name === 'initial').length, 1);
    assert.equal(r.calls.filter(name => name === 'framelab_semantic_repairs').length, 0);

    const prompt = r.requests[0].messages.map(message => message.content).join('\n');
    for (const rule of [
      'For a concrete physical action, carry the same intent-supplied chain of cause, observable effect, performer response and resulting state across Reel Concept, Director\'s Notes, Narrative Arc, AI Video Prompt and Hooks; preserve object roles and agency.',
      'If the connection between two stated events is ambiguous, do not invent an intermediate cause or claim that one causes the other.',
      'Hooks may compress the event but must not increase its scale or stakes beyond the Vision and Desired Impact.',
      'For open, poetic, abstract or surreal ideas, do not impose a literal cause-and-effect chain; preserve their observation, ambiguity or declared internal rule.',
    ]) assert.ok(prompt.includes(rule), `${fixture.id} primary prompt is missing: ${rule}`);
  }

  const physicalRun = runs.get('craft');
  const physicalPrompt = physicalRun.requests[0].messages.map(message => message.content).join('\n');
  assert.ok(physicalPrompt.includes(physical.inputs.userReelVision));
  assert.ok(physicalPrompt.includes(physical.inputs.desiredImpact));
  assert.match(physical.inputs.desiredImpact, /small relief/i);
  assert.match(physical.inputs.desiredImpact, /without dramatic rescue or heroic triumph/i);

  const openRun = runs.get('held');
  const openPrompt = openRun.requests[0].messages.map(message => message.content).join('\n');
  assert.ok(openPrompt.includes(open.inputs.userReelVision));
  assert.ok(openPrompt.includes('preserve their observation, ambiguity or declared internal rule'));

  const surrealRun = runs.get('surreal');
  const surrealPrompt = surrealRun.requests[0].messages.map(message => message.content).join('\n');
  assert.ok(surrealPrompt.includes(surreal.inputs.userReelVision));
  assert.ok(surrealPrompt.includes('do not impose a literal cause-and-effect chain'));
});

test('primary hooks preserve user intent scale for low-stakes, high-stakes, surreal and open concepts', async () => {
  const lowStakes = clone(fixtures.find(f => f.id === 'craft'));
  lowStakes.inputs.desiredImpact = 'Keep this at small relief, without danger escalation, dramatic rescue or triumph.';

  const highStakes = clone(fixtures.find(f => f.id === 'craft'));
  highStakes.inputs.userReelVision = 'A ferry passenger sees a child slip toward the water and pulls them safely back onto the deck.';
  highStakes.inputs.meaning = 'Attention can change the outcome when danger becomes immediate.';
  highStakes.inputs.desiredImpact = 'Let the real danger and rescue feel urgent, without turning the moment into spectacle.';

  const open = fixtures.find(f => f.id === 'held');
  const surreal = fixtures.find(f => f.id === 'surreal');
  const cases = [lowStakes, highStakes, open, surreal];
  const hookIntentRule = "Hook intent fidelity: The supplied Vision, Meaning and Desired Impact define each hook's event scale, emotional temperature and outcome. Hooks may heighten clarity and curiosity, not stakes; preserve explicit boundaries such as quiet, restrained, small relief, unresolved, no triumph, no rescue or no reveal. Retain danger or rescue only when the user explicitly supplies it, at the intended scale. For open or surreal intent, preserve its ambiguity or declared internal rule without explaining or sensationalizing it.";

  for (const fixture of cases) {
    const r = await replay(fixture);
    assert.equal(r.status, 200, `${fixture.id} offline candidate should remain accepted`);
    assert.deepEqual(creativeCore(r.output), creativeCore(fixture.candidate),
      `Hook prompt contract must not rewrite an existing candidate: ${fixture.id}`);
    assert.deepEqual(r.output.hooks, fixture.candidate.hooks,
      `Hook prompt contract must not locally rewrite hook wording: ${fixture.id}`);
    assert.equal(r.calls.filter(name => name === 'initial').length, 1);
    assert.equal(r.calls.filter(name => name === 'framelab_semantic_repairs').length, 0);

    const prompt = r.requests[0].messages.map(message => message.content).join('\n');
    assert.ok(prompt.includes(hookIntentRule), `${fixture.id} primary prompt is missing hook intent fidelity`);
    assert.ok(prompt.includes(fixture.inputs.userReelVision), `${fixture.id} primary prompt omitted supplied Vision`);
    assert.ok(prompt.includes(fixture.inputs.desiredImpact), `${fixture.id} primary prompt omitted supplied Desired Impact`);
    if (fixture.inputs.meaning) assert.ok(prompt.includes(fixture.inputs.meaning), `${fixture.id} primary prompt omitted supplied Meaning`);
  }

  assert.match(lowStakes.inputs.desiredImpact, /small relief/i);
  assert.match(lowStakes.inputs.desiredImpact, /without danger escalation, dramatic rescue or triumph/i);
  assert.match(highStakes.inputs.userReelVision, /slip toward the water and pulls them safely back/i);
  assert.match(highStakes.inputs.desiredImpact, /real danger and rescue/i);
  assert.ok(surreal.inputs.userReelVision.includes('declared impossible rule'));
  assert.ok(open.inputs.userReelVision.includes('No hidden clue or resolved answer appears.'));
});

test('primary cinematic identity assigns distinct authored roles across varied intents', async () => {
  const locationLed = clone(fixtures.find(f => f.id === 'road'));
  locationLed.inputs.userReelVision = 'In the empty greenhouse after closing, a caretaker leaves one pane of the roof open to the evening air.';
  locationLed.inputs.meaning = 'Care sometimes means allowing a place to remain unfinished.';
  locationLed.inputs.desiredImpact = 'Keep the image quiet and modest, without a reveal or a sense of rescue.';

  const actionLed = clone(fixtures.find(f => f.id === 'craft'));
  const surreal = clone(fixtures.find(f => f.id === 'surreal'));
  const quiet = clone(fixtures.find(f => f.id === 'held'));
  const cases = [locationLed, actionLed, surreal, quiet];
  const identityRoleContract = [
    'CINEMATIC IDENTITY FIELD-ROLE CONTRACT (primary output):',
    '- projectCodename is a memorable, project-specific title. It may be poetic or image-led, but it must read as a title.',
    '- creativeArchetype is a concise, authored conceptual organizing principle derived from the supplied Vision, Meaning and Desired Impact. It answers what creative world or dramatic logic organizes this project; it must not merely name the location, person or role, object, visible action, selected Visual Style, Director Mode, Concept DNA category or projectCodename. Concept-native language may anchor the phrase, but visible nouns alone do not express its organizing idea.',
    '- visualDNA consists of exactly three concrete, observable recurring visual signatures, such as material or surface behavior, spatial arrangement, or recurring framing, color or texture. Describe the visible signature rather than an inventory item, mood label or abstract philosophy.',
    '- These fields have different jobs: the codename names the project, the archetype names its intent-specific organizing idea, and visualDNA describes how that idea is visibly recognizable. The archetype and codename must not be identical or trivial paraphrases, and visualDNA must not restate either one.',
    '- Derive the identity from the specific supplied intent without adding mythology, drama or a transformation the user did not ask for. Keep quiet concepts restrained and preserve an open or surreal concept\'s declared internal logic.',
  ].join('\n');

  for (const fixture of cases) {
    const r = await replay(fixture);
    assert.equal(r.status, 200, `${fixture.id} offline candidate should remain accepted`);
    assert.equal(r.calls.filter(name => name === 'initial').length, 1);
    assert.equal(r.calls.filter(name => name === 'framelab_semantic_repairs').length, 0);

    const prompt = r.requests[0].messages.map(message => message.content).join('\n');
    assert.ok(prompt.includes(identityRoleContract), `${fixture.id} primary prompt lacks the identity field-role contract`);
    assert.ok(prompt.includes(fixture.inputs.userReelVision), `${fixture.id} Vision was not supplied to identity generation`);
    assert.ok(prompt.includes(fixture.inputs.meaning), `${fixture.id} Meaning was not supplied to identity generation`);
    assert.ok(prompt.includes(fixture.inputs.desiredImpact), `${fixture.id} Desired Impact was not supplied to identity generation`);

    const identity = r.output.cinematicIdentity;
    assert.equal(typeof identity.projectCodename, 'string');
    assert.equal(typeof identity.creativeArchetype, 'string');
    assert.notEqual(identity.projectCodename.trim().toLowerCase(), identity.creativeArchetype.trim().toLowerCase());
    assert.equal(Array.isArray(identity.visualDNA), true);
    assert.equal(identity.visualDNA.length, 3);
    assert.ok(identity.visualDNA.every(item => typeof item === 'string' && item.trim().length > 0));
    for (const item of identity.visualDNA) {
      assert.notEqual(item.trim().toLowerCase(), identity.projectCodename.trim().toLowerCase());
      assert.notEqual(item.trim().toLowerCase(), identity.creativeArchetype.trim().toLowerCase());
    }
  }

  assert.match(locationLed.inputs.userReelVision, /empty greenhouse/i);
  assert.match(actionLed.inputs.userReelVision, /repairs a watch/i);
  assert.ok(surreal.inputs.userReelVision.includes('declared impossible rule'));
  assert.ok(quiet.inputs.userReelVision.includes('No hidden clue or resolved answer appears.'));
});

test('narrative progression distinguishes beats while preserving open, surreal and physical intent',async()=>{
  const cases=['held','surreal','craft'].map(id=>fixtures.find(f=>f.id===id));
  for(const fixture of cases){
    const r=await replay(fixture);
    assert.equal(r.status,200,JSON.stringify({id:fixture.id,output:r.output,logs:r.logs}));
    assert.deepEqual(creativeCore(r.output),creativeCore(fixture.candidate),'Valid authored candidate must remain unchanged: '+fixture.id);
    const prompt=r.requests[0].messages.map(m=>m.content).join('\n');
    for(const rule of [
      'Stage 1 establishes the governing visual or performance condition.',
      'Stage 2 adds or complicates evidence within that condition.',
      'Stage 3 records the final visible or declared perceptual condition, which may remain unresolved.',
      'Describe the final visible or declared perceptual condition in relation to Stages 1 and 2: what is now different, what remains, where the camera\'s attention rests, and what stays open.',
      'do not append commentary that explains what the condition means.',
      'Preserve explicitly requested essayistic or symbolic narration; for surreal ideas, keep the declared visual rule without normalizing it.',
      'including what changed, what remains and what stays open.',
      'A stable physical scene may progress through viewpoint, timing, rhythm, performance or spatial relation, but each choice must add information rather than repeat the same image.',
      'Do not retell the Narrative Arc or repeat its final beat in different words.',
      'Do not default to an establishing view, a move closer, a consequence shot and a final close or held frame.',
      'It does not need to isolate a final frame, move closer, hold, reveal or resolve the idea.',
    ]) assert.ok(prompt.includes(rule),fixture.id+' prompt lacks observable-state protection: '+rule);
    assert.ok(!prompt.includes('show what changes in the audience\'s understanding or feeling'),fixture.id+' prompt still asks for an interpretive Stage 3 conclusion');
    if(fixture.id==='held'){
      assert.ok(prompt.includes('do not add a twist, resolution or event solely to create a payoff.'));
      assert.ok(fixture.inputs.userReelVision.includes('No hidden clue or resolved answer appears.'));
    }
    if(fixture.id==='surreal'){
      assert.ok(prompt.includes('For open or surreal ideas, preserve the declared internal rule rather than normalizing it.'));
      assert.ok(fixture.inputs.userReelVision.includes('declared impossible rule'));
    }
    if(fixture.id==='craft'){
      assert.ok(prompt.includes('For literal physical action, preserve object roles, operating conditions, agency, cause and consequence.'));
      assert.ok(fixture.inputs.userReelVision.includes('retrieves it with tweezers'));
    }
  }
});

test('explicitly essayistic intent remains allowed while concrete and surreal prompts avoid explanatory conclusions',async()=>{
  const essayistic=clone(fixtures.find(f=>f.id==='held'));
  essayistic.inputs.userReelVision += ' Use explicitly essayistic and symbolic narration alongside the observed image.';
  const r=await replay(essayistic);
  assert.equal(r.status,200,JSON.stringify({output:r.output,logs:r.logs}));
  const prompt=r.requests[0].messages.map(m=>m.content).join('\n');
  assert.ok(prompt.includes('Use explicitly essayistic and symbolic narration alongside the observed image.'));
  assert.ok(prompt.includes('Preserve explicitly requested essayistic or symbolic narration; for surreal ideas, keep the declared visual rule without normalizing it.'));
  assert.ok(prompt.includes('For a visually concrete concept, supplied Meaning and Desired Impact guide selection and framing; finish on the observable image or condition, not an abstract comment that explains it.'));
  assert.ok(prompt.includes('Let supplied Meaning and Desired Impact guide the selected evidence, framing, timing and emphasis, but do not append commentary that explains what the condition means.'));
  assert.deepEqual(creativeCore(r.output),creativeCore(essayistic.candidate),'Prompt-contract check must not rewrite the candidate');
});

test('partial and absent intent keep candidates and existing Meaning activation',async()=>{
  for(const intent of [{userReelVision:fixtures[6].inputs.userReelVision,meaning:'',desiredImpact:''},{userReelVision:'',meaning:'',desiredImpact:''}]){
    const f=clone(fixtures[6]);Object.assign(f.inputs,intent);
    const r=await replay(f);assert.equal(r.status,200,JSON.stringify(r.output));
    assert.deepEqual(creativeCore(r.output),creativeCore(f.candidate));
    const prompt=primaryRequestFromResult(r).messages.map(m=>m.content).join('\n');
    if(intent.userReelVision){
      assert.ok(prompt.includes('SUPPLIED CREATIVE INTENT TAKES PRIORITY:'));
      assert.ok(!prompt.includes('NO PERSONAL CREATIVE INTENT WAS SUPPLIED:'));
    } else {
      assert.ok(prompt.includes('NO PERSONAL CREATIVE INTENT WAS SUPPLIED:'));
      assert.ok(!prompt.includes('SUPPLIED CREATIVE INTENT TAKES PRIORITY:'));
    }
    assert.ok(prompt.includes('Selected controls are creative inputs, not a checklist of labels or decorative styling.'));
    assert.equal(r.calls.filter(n=>n==='framelab_filmic_meaning_evaluation').length,0);
    assert.equal(r.calls.filter(n=>n==='framelab_premium_preservation_evaluation').length,1);
  }
});

test('fallback admission is structural and cannot authorize acceptance',()=>{
  const h=load(['hasCompleteCreativeCore','selectCreativeCandidatePolicy']);
  const input=fixtures[6].candidate;
  for(const intent of [{vision:'',meaning:'',desiredImpact:''},{vision:'No vehicles.',meaning:'',desiredImpact:''}]) assert.equal(h.selectCreativeCandidatePolicy(input,intent).allowTemplateFallback,false);
  assert.equal(h.selectCreativeCandidatePolicy({}, {vision:'',meaning:'',desiredImpact:''}).allowTemplateFallback,true);
  assert.equal(h.selectCreativeCandidatePolicy({}, {vision:'No vehicles.',meaning:'',desiredImpact:''}).allowTemplateFallback,false);
});

test('declared surreal and material language survives formatter',()=>{
  const h=load(['cleanAiVideoPromptText','cleanPublicDecayLanguageText']);
  const prompt='Time freezes while gravity loses its hold, emphasizing the deliberate impossible rule.';
  assert.equal(h.cleanAiVideoPromptText(prompt),prompt);
  const material='Weathered copper and corrosion remain visible in the aged surface.';
  assert.equal(h.cleanPublicDecayLanguageText(material),material);
});

test('brief individual captions survive while missing or unfinished caption fallback remains',()=>{
  const h=load(['isWeakCaption']);
  for(const caption of ['An invitation can stay open.','Still here.','Room for an answer that never arrives.']) assert.equal(h.isWeakCaption(caption),false);
  for(const caption of ['', '   ', 'The final frame reveals']) assert.equal(h.isWeakCaption(caption),true);
});

test('preservation failure and uncertainty still block the delivered candidate',async()=>{
  for(const verdict of ['not_equivalent','uncertain']){
    const r=await replay(fixtures[2],{preservation:verdict});
    assert.equal(r.status,422);assert.equal(r.output.code,'premium_preservation_not_passed');
    assert.ok(!r.output.reelConcept);
  }
});

test('Meaning uncertainty retains bounded recovery and HTTP 503',async()=>{
  const r=await replay(fixtures[2],{meaning:()=>({verdict:'UNCERTAIN',reasonCode:'EVALUATION_UNCERTAIN',intentPreserved:'uncertain',carrierPath:'',carrierQuote:'',developmentPath:'',developmentQuote:'',repairEvidencePath:'',repairEvidenceQuote:'',originalGapResolved:'uncertain',comparativeReason:''})});
  assert.equal(r.status,503);assert.equal(r.calls.filter(n=>n==='framelab_filmic_meaning_evaluation').length,2);
  assert.ok(!r.output.reelConcept);
});

test('original reference remains independent of repaired/final data',async()=>{
  const r=await replay(fixtures[6]);
  const msg=r.requests.find(q=>q.response_format?.json_schema?.name==='framelab_premium_preservation_evaluation').messages.at(-1).content;
  const reference=JSON.parse(msg.split('\nREFERENCE:\n')[1].split('\nCANDIDATE:\n')[0]);
  assert.equal(reference.candidateOrigin.reelConcept,fixtures[6].candidate.reelConcept);
  assert.equal(reference.creativeAuthority.suppliedIntent.vision,fixtures[6].inputs.userReelVision);
  assert.ok(reference.creativeAuthority.routingSuggestions);
  assert.ok(!('subjectStrategy' in reference),'Automatically routed subject must not become a protected top-level fact');
});

test('authorization checks occur on finalization result',()=>{
  const gate=declarations.get('runSemanticQualityGate');
  const finalized=gate.indexOf('const finalizedCandidate');
  for(const name of ['hasOnlyAllowedSemanticChanges(','preservesActionSemanticFingerprint(','hasConsistentSemanticAliases(','preservesGeneralConceptFingerprint(']) assert.ok(gate.indexOf(name)>finalized,name);
});

// Expose only to the external evidence runner, never to the application.
module.exports={replay,fixtures,creativeCore,preservationCandidate};

test('real accepted repair fixes only the evidenced final-state field',async()=>{
  const f=clone(fixtures[0]);
  f.candidate.aiVideoPrompt='The camera observes the stopped recorder and opened cassette on wet sand. The loose tape detaches completely and drifts away.';
  const r=await replay(f,{repair:context=>{
    assert.ok(context.allowedRepairFields.includes('aiVideoPrompt'));
    assert.equal(context.creativeAuthority.suppliedIntent.vision,f.inputs.userReelVision);
    return {repairs:[{path:'aiVideoPrompt',valueType:'string',stringValue:fixtures[0].candidate.aiVideoPrompt,stringList:[]}]};
  }});
  assert.equal(r.status,200,JSON.stringify({output:r.output,logs:r.logs.filter(x=>x[0]!=='OFFLINE_SCOPE_TRACE')}));
  assert.equal(r.output.aiVideoPrompt,fixtures[0].candidate.aiVideoPrompt);
  assert.equal(r.output.reelConcept,f.candidate.reelConcept);
  assert.deepEqual(r.output.narrativeArc,f.candidate.narrativeArc);
  assert.equal(r.output.directorSummary,f.candidate.directorSummary);
  assert.equal(r.calls.filter(n=>n==='framelab_semantic_repairs').length,1);
  assert.deepEqual(creativeCore(preservationCandidate(r)),creativeCore(r.output));
  const q=r.logs.find(x=>x[0]==='[FRAME-LAB SEMANTIC QUALITY]')?.[1];
  assert.equal(q?.selectedCandidate,'repaired',JSON.stringify(q));
  assert.equal(q.candidateChecks.onlyAllowedChanges,true);
});

test('invalid repair cannot launder a contradictory complete candidate',async()=>{
  const f=clone(fixtures[0]);
  f.candidate.aiVideoPrompt='The camera observes the cassette. The tape detaches completely and drifts away.';
  const r=await replay(f,{repair:()=>({repairs:[{path:'unapprovedField',valueType:'string',stringValue:'Unapproved change',stringList:[]}]})});
  assert.equal(r.status,422,JSON.stringify(r.logs));assert.equal(r.output.code,'CREATIVE_QUALITY_NOT_MET');
  assert.ok(!r.output.reelConcept);
});

test('complete candidate still fails an evidenced Meaning failure and invalid repair',async()=>{
  const r=await replay(fixtures[2],{meaning:(context,answer)=>({...answer,verdict:'FAIL',reasonCode:'MEANING_ONLY_ASSERTED'}),repair:()=>({repairs:[]})});
  assert.equal(r.status,422);assert.equal(r.output.code,'CREATIVE_QUALITY_NOT_MET');
  assert.ok(!r.output.reelConcept);
});

test('BPM integration stays idempotent at both boundaries without altering narrative',async()=>{
  for(const bpm of [100,101,125,126]){
    const f=clone(fixtures[2]);f.inputs.bpm=bpm;
    const r=await replay(f);assert.equal(r.status,200,JSON.stringify(r.output));
    const prefix='With measured cutting, regular shot changes, and balanced shot duration,';
    assert.equal(r.output.aiVideoPrompt.startsWith(prefix),bpm>=101&&bpm<=125);
    assert.deepEqual(r.output.narrativeArc,f.candidate.narrativeArc);
    assert.equal(r.output.aiVideoPrompt.split(prefix).length-1,bpm>=101&&bpm<=125?1:0);
    assert.equal(preservationCandidate(r).aiVideoPrompt,r.output.aiVideoPrompt);
  }
});

test('director formatting preserves meaningful held observations and surreal mechanics',()=>{
  const h=load(['repairDirectorSummaryEnding']);
  for(const text of ['The camera holds on two untouched photographs.','The final composition holds on a paper moon.','Time freezes above the sink, leaving the shoreline unresolved.']) assert.equal(h.repairDirectorSummaryEnding(text),text);
});

test('perceptual continuity exception cannot conceal an explicit final-state contradiction',async()=>{
  const f=clone(fixtures[1]);
  f.candidate.narrativeArc.stage2='The camera moves sideways while the two prints remain intact and attached to the table.';
  f.candidate.narrativeArc.stage3='A wider view holds on the prints remaining attached to the table.';
  f.candidate.aiVideoPrompt='The prints detach completely and drift away.';
  const r=await replay(f,{repair:()=>({repairs:[]})});
  assert.equal(r.status,422);assert.ok(!r.output.reelConcept);
});

test('intact camera reframe cannot authorize replacing the subject with an unrelated object',async()=>{
  const h=load(['semanticGenericAnchorWords','extractSemanticAnchors','getLastSentence','inferFinalPhysicalState','getCreativeFinalStateContract','getCanonicalCaptionValues','getCanonicalHookValues','semanticRepairableFields','getConceptAnchorSet','countAnchorOverlap','semanticQualityAudit'],{selectedConceptDNA:'',selectedMusicFacingSubjectStrategy:'',selectedMusicFacingWorldIntelligence:'',mood:'',normalizedUserReelVision:'',normalizedMeaning:'',normalizedDesiredImpact:'',directorMode:'',styleDNA:'',visualStyle:''});
  const f=clone(fixtures[1].candidate);
  assert.ok(!h.semanticQualityAudit(f).issues.some(i=>i.code==='STAGE_CAUSAL_CONTRADICTION'));
  f.narrativeArc.stage3='A wider view holds a brass engine in the empty workshop.';
  assert.ok(h.semanticQualityAudit(f).issues.some(i=>i.code==='STAGE_CAUSAL_CONTRADICTION'));
});

// Focused control-flow regression matrix. No new evaluator or creative rule.
function withIntentMode(fixture,mode) {
  const f=clone(fixture);
  if(mode!=='full'){f.inputs.meaning='';f.inputs.desiredImpact='';}
  if(mode==='absent')f.inputs.userReelVision='';
  return f;
}
function contradictoryFixture(id,mode) {
  const f=withIntentMode(fixtures.find(x=>x.id===id),mode);
  let correctedPrompt=f.candidate.aiVideoPrompt;
  if(id==='held'){
    f.candidate.narrativeArc.stage2='The camera moves sideways while the two prints remain intact and attached to the table.';
    f.candidate.narrativeArc.stage3='A wider view holds on the prints remaining attached to the table.';
    correctedPrompt='The camera moves sideways over the two unchanged prints. A wider view holds on the prints remaining attached to the table.';
  }
  f.candidate.aiVideoPrompt=id==='tide'
    ? 'The camera observes the cassette. The tape detaches completely and drifts away.'
    : 'The prints detach completely and drift away.';
  return {f,correctedPrompt};
}
const repairFailures={
  empty:()=>({repairs:[]}),
  unauthorized:()=>({repairs:[{path:'unapprovedField',valueType:'string',stringValue:'Unapproved change',stringList:[]}]}),
  exception:()=>{throw new Error('SCRIPTED_REPAIR_UNAVAILABLE');},
};
for(const mode of ['full','partial','absent']){
  test(`retaining a valid held candidate after a repair failure remains allowed / ${mode}`,async()=>{
    const f=withIntentMode(fixtures.find(x=>x.id==='held'),mode);
    f.candidate.narrativeArc.stage2='The camera moves sideways while the prints remain untouched.';
    f.candidate.narrativeArc.stage3='Both prints receive equal attention.';
    for(const repair of Object.values(repairFailures)){
      const r=await replay(f,{repair});
      assert.equal(r.status,200,JSON.stringify({mode,output:r.output,logs:r.logs}));
      assert.deepEqual(creativeCore(r.output),creativeCore(f.candidate));
      assert.equal(r.calls.filter(n=>n==='framelab_semantic_repairs').length,1);
      assert.equal(r.calls.filter(n=>n==='framelab_premium_preservation_evaluation').length,1);
      assert.deepEqual(creativeCore(preservationCandidate(r)),creativeCore(r.output));
      assert.equal(r.logs.find(x=>x[0]==='[FRAME-LAB SEMANTIC QUALITY]')?.[1]?.selectedCandidate,'original');
    }
  });
  test(`final-boundary positives: all eight creative families / ${mode}`,async()=>{
    for(const fixture of fixtures){
      const f=withIntentMode(fixture,mode);
      const r=await replay(f);
      assert.equal(r.status,200,JSON.stringify({id:f.id,mode,output:r.output,logs:r.logs}));
      assert.deepEqual(creativeCore(r.output),creativeCore(f.candidate));
      assert.deepEqual(creativeCore(preservationCandidate(r)),creativeCore(r.output));
      assert.equal(r.calls.filter(n=>n==='framelab_premium_preservation_evaluation').length,1);
      assert.equal(r.calls.filter(n=>n==='framelab_semantic_repairs').length,0);
      assert.equal(r.calls.filter(n=>n==='framelab_filmic_meaning_evaluation').length,mode==='full'?1:0);
    }
  });
  for(const [failure,repair] of Object.entries(repairFailures)){
    test(`recognized contradiction blocks after ${failure} repair / ${mode}`,async()=>{
      for(const id of ['tide','held']){
        const {f}=contradictoryFixture(id,mode);
        // Even scripted model PASS must not override a detected contradiction.
        const r=await replay(f,{repair});
        assert.equal(r.status,422,JSON.stringify({id,mode,failure,output:r.output}));
        assert.equal(r.output.code,'CREATIVE_QUALITY_NOT_MET');
        assert.ok(!r.output.reelConcept);
        assert.equal(r.calls.filter(n=>n==='framelab_semantic_repairs').length,1);
        assert.equal(r.calls.filter(n=>n==='framelab_premium_preservation_evaluation').length,1);
      }
    });
  }
  test(`valid scoped repair reaches checked delivery / ${mode}`,async()=>{
    for(const id of ['tide','held']){
      const {f,correctedPrompt}=contradictoryFixture(id,mode);
      const r=await replay(f,{repair:()=>({repairs:[{path:'aiVideoPrompt',valueType:'string',stringValue:correctedPrompt,stringList:[]}]})});
      assert.equal(r.status,200,JSON.stringify({id,mode,output:r.output,logs:r.logs}));
      assert.equal(r.output.aiVideoPrompt,correctedPrompt);
      assert.equal(r.output.reelConcept,f.candidate.reelConcept);
      assert.equal(r.output.directorSummary,f.candidate.directorSummary);
      assert.deepEqual(r.output.narrativeArc,f.candidate.narrativeArc);
      assert.deepEqual(creativeCore(preservationCandidate(r)),creativeCore(r.output));
      assert.equal(r.calls.filter(n=>n==='framelab_premium_preservation_evaluation').length,1);
      assert.equal(r.logs.find(x=>x[0]==='[FRAME-LAB SEMANTIC QUALITY]')?.[1]?.selectedCandidate,'repaired');
    }
  });
  test(`valid-format but ineffective repair cannot pass / ${mode}`,async()=>{
    const {f}=contradictoryFixture('held',mode);
    const r=await replay(f,{repair:()=>({repairs:[{path:'aiVideoPrompt',valueType:'string',stringValue:f.candidate.aiVideoPrompt,stringList:[]}]})});
    assert.equal(r.status,422);assert.equal(r.output.code,'CREATIVE_QUALITY_NOT_MET');
    assert.equal(r.calls.filter(n=>n==='framelab_premium_preservation_evaluation').length,1);
  });
  test(`preservation failure, uncertainty and invalid result remain closed / ${mode}`,async()=>{
    for(const result of ['not_equivalent','uncertain',()=>null,()=>{throw new Error('SCRIPTED_PRESERVATION_UNAVAILABLE');}]){
      const r=await replay(withIntentMode(fixtures[2],mode),{preservation:result});
      assert.equal(r.status,422);assert.equal(r.output.code,'premium_preservation_not_passed');
      assert.ok(!r.output.reelConcept);
      assert.equal(r.calls.filter(n=>n==='framelab_premium_preservation_evaluation').length,1);
    }
  });
  test(`missing or incomplete gate result is not a delivery pass / ${mode}`,async()=>{
    const invalidResults=[undefined,null,{},
      {preservationBlocked:false},
      {preservationBlocked:false,preservationEvaluation:{preservationStatus:'pass'}},
      {preservationBlocked:false,preservationEvaluation:{evaluationStatus:'evaluation_failure',preservationStatus:'pass'}},
      {preservationBlocked:true,preservationEvaluation:{evaluationStatus:'evaluation_success',preservationStatus:'pass'}}];
    for(const gateResultOverride of invalidResults){
      const r=await replay(withIntentMode(fixtures[2],mode),{gateResultOverride});
      assert.equal(r.status,422);assert.equal(r.output.code,'premium_preservation_not_passed');
      assert.ok(!r.output.reelConcept);
    }
  });
}

test('valid authored primary archetype remains unchanged when it passes the current identity quality check', async () => {
  const fixture = clone(fixtures.find(f => f.id === 'road'));
  fixture.candidate.cinematicIdentity.creativeArchetype = 'Kitchen Passage';

  const result = await replay(fixture);
  assert.equal(result.status, 200, JSON.stringify({ output: result.output, logs: result.logs }));
  assert.equal(result.output.cinematicIdentity.creativeArchetype, 'Kitchen Passage');
  assert.ok(!result.calls.includes('framelab_semantic_repairs'));
});

test('archetype provenance is logged once and identifies an accepted primary value', async () => {
  const fixture = clone(fixtures.find(f => f.id === 'road'));
  fixture.candidate.cinematicIdentity.creativeArchetype = 'Kitchen Passage';

  const result = await replay(fixture);
  const provenanceLogs = result.logs.filter(
    ([label]) => label === '[FRAME-LAB ARCHETYPE PROVENANCE]'
  );

  assert.equal(provenanceLogs.length, 1);
  const provenance = JSON.parse(JSON.stringify(provenanceLogs[0][1]));
  assert.equal(provenance.PRIMARY_ARCHETYPE_RAW, 'Kitchen Passage');
  assert.equal(provenance.PRIMARY_ARCHETYPE_NORMALIZED, 'Kitchen Passage');
  assert.equal(provenance.PRIMARY_ARCHETYPE_ACCEPTED, 'yes');
  assert.deepEqual(provenance.PRIMARY_ARCHETYPE_REJECTION_REASONS, []);
  assert.equal(provenance.FALLBACK_CALLED, 'no');
  assert.equal(provenance.FINAL_ARCHETYPE, 'Kitchen Passage');
  assert.equal(provenance.FINAL_ARCHETYPE_SOURCE, 'PRIMARY');
  assert.equal(
    provenance.FINAL_ARCHETYPE,
    result.output.cinematicIdentity.creativeArchetype
  );
});

test('authored primary archetype without mechanism vocabulary is preserved through final output', async () => {
  const fixture = clone(fixtures.find(f => f.id === 'road'));
  fixture.candidate.cinematicIdentity.creativeArchetype = 'Delicate Persistence';

  const result = await replay(fixture);
  assert.equal(result.status, 200, JSON.stringify({ output: result.output, logs: result.logs }));
  assert.equal(result.output.cinematicIdentity.creativeArchetype, 'Delicate Persistence');
  const provenance = JSON.parse(JSON.stringify(result.logs.find(
    ([label]) => label === '[FRAME-LAB ARCHETYPE PROVENANCE]'
  )?.[1]));
  assert.equal(provenance.PRIMARY_ARCHETYPE_ACCEPTED, 'yes');
  assert.equal(provenance.CONCEPT_LANGUAGE_RESULT, 'no');
  assert.equal(provenance.FALLBACK_CALLED, 'no');
  assert.equal(provenance.FINAL_ARCHETYPE_SOURCE, 'PRIMARY');
  assert.equal(provenance.FINAL_ARCHETYPE, 'Delicate Persistence');
});

test('archetype forbidden guards match role words exactly and suffixes only at the phrase ending', () => {
  const h = makeArchetypePrimaryGuards(
    'A tender material relation shapes the light; the concept remains open.',
    ['tender light across a material study']
  );

  assert.equal(h.containsForbiddenCreativeArchetypeSuffix('Tender Material Witness'), false,
    'a leading modifier ending in "er" is not the archetype-defining ending');
  assert.equal(h.containsForbiddenCreativeArchetypeSuffix('Tender Material Memory'), false,
    'a non-final modifier must not trigger a suffix rejection');
  assert.equal(h.containsForbiddenCreativeArchetypeSuffix('Quiet Poise'), true,
    'a forbidden ending on the final archetype word remains rejected');
  assert.equal(h.containsForbiddenCreativeArchetypeSuffix('Quiet Flow'), true,
    'existing terminal suffix vocabulary remains active');

  assert.equal(h.containsForbiddenRoleTerm('Witness'), true);
  assert.equal(h.containsForbiddenRoleTerm('Night Witness'), true);
  assert.equal(h.containsForbiddenRoleTerm('Nightwatcher Pattern'), false,
    'a role string embedded inside a different token is not a role-word match');
  assert.equal(h.containsForbiddenRoleTerm('Witnesslike Pattern'), false,
    'role matching uses whole tokens rather than substrings');
  assert.equal(h.creativeArchetypeIsRoleOnlyOrRoleDescription(
    'Tender Material Witness',
    'A tender material relation shapes the light; the concept remains open.'
  ), false,
  'a role token does not make a phrase role-only when independent anchored concept language remains');
  assert.equal(h.creativeArchetypeIsRoleOnlyOrRoleDescription('Night Witness', 'A night witness waits.'), true,
    'a role plus only one independent phrase word remains role-only');

  assert.equal(h.creativeArchetypePrimaryCandidatePassesGuards(
    'Tender Material Witness',
    'A tender material relation shapes the light; the concept remains open.'
  ), true,
  'Tender Material Witness is preserved when the rest of the phrase has authored concept context and all other guards pass');
  assert.equal(h.creativeArchetypePrimaryCandidatePassesGuards(
    'Delicate Persistence',
    'A potter sets a fired bowl beside the kiln as rain gathers outside.'
  ), true,
  'the existing authored Primary preservation case continues to pass');
});

const archetypePrimaryGuardNames = [
  'forbiddenTerms', 'normalizeText', 'containsForbiddenTerm',
  'forbiddenRoleTerms', 'containsForbiddenRoleTerm',
  'forbiddenCreativeArchetypeSuffixes', 'containsForbiddenCreativeArchetypeSuffix',
  'genericCreativeArchetypeAnchorWords', 'normalizeCreativeIdentityWord',
  'getCreativeArchetypeProjectWordSet', 'extractCreativeArchetypeWords',
  'getCreativeArchetypeSourceText', 'getCreativeArchetypeAnchorWords',
  'p1AnchorRoleStopWords', 'p1VerbOrAdverbFragments', 'isP1TypedAnchorWord',
  'getP1ConceptAnchorWords', 'creativeArchetypeMechanismLabels',
  'creativeArchetypeMechanismSynonyms', 'getCreativeArchetypeMechanismLabel',
  'creativeArchetypeBehaviorPatterns', 'creativeArchetypeFamilyBehaviorLabels',
  'getCreativeArchetypeBehaviorLabel', 'getMeaningfulCreativeArchetypeWords',
  'genericCreativeArchetypePhrases', 'isGenericCreativeArchetype',
  'creativeArchetypeContainsProjectWord', 'creativeArchetypeIsDescriptiveOnly',
  'creativeArchetypeIsRoleOnlyOrRoleDescription',
  'creativeArchetypeMatchesProjectCodename',
  'creativeArchetypeContainsConceptLanguage',
  'creativeArchetypePrimaryCandidatePassesGuards',
];
function makeArchetypePrimaryGuards(sourceText, visualDNA = [], artistName = 'Lio Meret', trackName = 'Open Waterline') {
  return load(archetypePrimaryGuardNames, {
    artistName,
    trackName,
    data: {
      reelConcept: sourceText,
      concept: '',
      thumbnailConcept: '',
      cinematicIdentity: { projectCodename: 'Quiet Aperture', visualDNA },
    },
    selectedMusicFacingCreativeThesis: { isActive: true, primaryIdeaFamily: 'observation_discovery' },
  });
}

test('authored archetypes need no literal mechanism word while concrete descriptions stay blocked', () => {
  const authored = [
    {
      value: 'Fragile Custodianship',
      source: 'A blue bowl rests on a shelf. Fragile custodianship leaves the space around it open.',
      visualDNA: ['blue glaze on the bowl', 'light across a wooden shelf'],
    },
    {
      value: 'Delicate Persistence',
      source: 'A potter sets a fired bowl beside the kiln as rain gathers outside.',
      visualDNA: ['blue glaze against kiln dust', 'rain light on the loading door'],
    },
    {
      value: 'Quiet Stewardship',
      source: 'A gardener leaves one pane fogged while clearing another. Quiet stewardship allows the unfinished view to remain.',
      visualDNA: ['fogged pane beside one clear edge', 'soft light on glass'],
    },
    {
      value: 'Deferred Arrival',
      source: 'A ferry light remains beyond the closed pier gate. Deferred arrival keeps the platform waiting.',
      visualDNA: ['harbor light beyond a closed gate', 'empty platform under dusk'],
    },
  ];

  for (const item of authored) {
    const h = makeArchetypePrimaryGuards(item.source, item.visualDNA);
    assert.equal(h.creativeArchetypeIsDescriptiveOnly(item.value, item.source), false, item.value);
    assert.equal(h.isGenericCreativeArchetype(item.value), false);
    assert.equal(h.creativeArchetypeContainsProjectWord(item.value), false);
    assert.equal(h.containsForbiddenTerm(item.value), false);
    assert.equal(h.containsForbiddenRoleTerm(item.value), false);
    assert.equal(h.containsForbiddenCreativeArchetypeSuffix(item.value), false);
    assert.equal(h.creativeArchetypePrimaryCandidatePassesGuards(item.value, item.source), true,
      item.value + ' must pass primary guards without a literal mechanism word');
  }

  const delicate = makeArchetypePrimaryGuards(
    'A potter sets a fired bowl beside the kiln as rain gathers outside.',
    ['blue glaze against kiln dust', 'rain light on the loading door'],
    'Elias Wren',
    'The Orchard Keeps Its Weather'
  );
  const delicateSource = 'A potter sets a fired bowl beside the kiln as rain gathers outside.';
  assert.equal(delicate.creativeArchetypeContainsConceptLanguage('Delicate Persistence', delicateSource), false);
  assert.equal(delicate.creativeArchetypePrimaryCandidatePassesGuards('Delicate Persistence', delicateSource), true,
    'a concise authored concept is not rejected solely for lacking a recognized mechanism word');

  const codename = makeArchetypePrimaryGuards('A quiet room remains unresolved.', []);
  assert.equal(codename.creativeArchetypeMatchesProjectCodename('Quiet Aperture'), true);
  assert.equal(codename.creativeArchetypePrimaryCandidatePassesGuards('Quiet Aperture', 'A quiet room remains unresolved.'), false,
    'an archetype cannot exactly duplicate the project codename');

  assert.equal(codename.containsForbiddenTerm('Contained Drift'), true,
    'the existing forbidden term "drift" applies regardless of intent context');
  assert.equal(codename.creativeArchetypePrimaryCandidatePassesGuards('Contained Drift', 'A slow train waits beneath a station roof.'), false,
    'existing forbidden vocabulary remains a primary rejection');
  assert.equal(codename.creativeArchetypePrimaryCandidatePassesGuards('Quiet Poise', 'A quiet room remains unresolved.'), false,
    'existing forbidden suffixes remain a primary rejection');
  assert.equal(codename.creativeArchetypePrimaryCandidatePassesGuards('Persistence', 'A quiet room remains unresolved.'), false,
    'the existing two-word archetype structure remains required');

  const mechanism = makeArchetypePrimaryGuards('The glass pane catches the remaining light.', ['glass grain']);
  assert.equal(mechanism.creativeArchetypeIsDescriptiveOnly('Progressive Discovery through Glass', 'The glass pane catches the remaining light.'), false);
  assert.equal(mechanism.creativeArchetypeContainsConceptLanguage('Progressive Discovery through Glass', 'The glass pane catches the remaining light.'), true,
    'an authored archetype with a recognized mechanism remains allowed');

  const surrealSource = 'A corridor reflects itself above a suspended floor. Recursive Horizon keeps the impossible relation unresolved.';
  const surreal = makeArchetypePrimaryGuards(surrealSource, ['suspended geometry']);
  assert.equal(surreal.creativeArchetypeIsDescriptiveOnly('Recursive Horizon', surrealSource), false,
    'surreal organizing language must not be normalized as a concrete scene description');
  assert.equal(surreal.creativeArchetypeContainsConceptLanguage('Recursive Horizon', surrealSource), true);

  const descriptions = [
    { value: 'Neighborhood Library', source: 'The singer waits inside a neighborhood library after closing.', visualDNA: ['shelves and high windows'] },
    { value: 'Person Folds', source: 'A person folds a paper letter over the table.', visualDNA: ['paper letter on a table'] },
    { value: 'Blue Bowl', source: 'The blue bowl remains on the table beside the kiln.', visualDNA: ['blue bowl with chipped glaze'] },
    { value: 'Night Cleaner', source: 'A night cleaner wipes one pane before leaving the room.', visualDNA: ['one pane with a clear edge'] },
    { value: 'Library Caretaker', source: 'A library caretaker closes the reading room at dusk.', visualDNA: ['reading room shelves at dusk'] },
    { value: 'Glass Washer', source: 'A glass washer clears one pane while the others remain fogged.', visualDNA: ['fogged glass with one clear pane'] },
    { value: 'Potter Carries', source: 'The potter carries a blue bowl toward the kiln.', visualDNA: ['blue bowl with chipped glaze'] },
  ];

  for (const item of descriptions) {
    const h = makeArchetypePrimaryGuards(item.source, item.visualDNA);
    assert.equal(h.creativeArchetypeIsDescriptiveOnly(item.value, item.source), true, item.value);
    assert.equal(h.creativeArchetypeContainsConceptLanguage(item.value, item.source), false,
      item.value + ' must remain ineligible as a concrete description');
    assert.equal(h.creativeArchetypePrimaryCandidatePassesGuards(item.value, item.source), false,
      item.value + ' must remain blocked by the descriptive-only guard');
  }

  const roleDescriptions = [
    { value: 'Witness', source: 'A witness waits by the window.', visualDNA: [] },
    { value: 'Night Witness', source: 'A night witness waits by the window.', visualDNA: [] },
    { value: 'Night Cleaner', source: 'A night cleaner wipes the window.', visualDNA: [] },
    { value: 'Library Caretaker', source: 'A library caretaker closes the reading room.', visualDNA: [] },
    { value: 'Pool Attendant', source: 'A pool attendant checks the water.', visualDNA: ['pool attendant beside water'] },
    { value: 'Studio Assistant', source: 'A studio assistant adjusts a light.', visualDNA: ['studio assistant beside a light'] },
  ];

  for (const item of roleDescriptions) {
    const h = makeArchetypePrimaryGuards(item.source, item.visualDNA);
    assert.equal(h.creativeArchetypePrimaryCandidatePassesGuards(item.value, item.source), false,
      item.value + ' remains rejected by the existing word-count, descriptive-only, or suffix guards');
  }

  const contextualRole = makeArchetypePrimaryGuards(
    'A curator waits through a lasting interval of uncertain light.',
    ['lasting interval of uncertain light']
  );
  assert.equal(contextualRole.containsForbiddenRoleTerm("Curator's Lasting Interval"), true);
  assert.equal(contextualRole.creativeArchetypeIsRoleOnlyOrRoleDescription(
    "Curator's Lasting Interval",
    'A curator waits through a lasting interval of uncertain light.'
  ), false,
  'the phrase-level rule is reusable with a different role token and no role allowlist');
  assert.equal(contextualRole.creativeArchetypePrimaryCandidatePassesGuards(
    "Curator's Lasting Interval",
    'A curator waits through a lasting interval of uncertain light.'
  ), true,
  'the independent authored phrase remains eligible when all non-role guards pass');

  assert.equal(makeArchetypePrimaryGuards('A bowl remains on the shelf.', []).isGenericCreativeArchetype('Material Response'), true,
    'existing generic archetype rejection remains active');
  assert.equal(makeArchetypePrimaryGuards('A bowl remains on the shelf.', []).creativeArchetypePrimaryCandidatePassesGuards('Material Response', 'A bowl remains on the shelf.'), false,
    'existing generic archetype rejection remains active for primary candidates');
  const overlap = makeArchetypePrimaryGuards(authored[0].source, authored[0].visualDNA, 'Fragile', 'A Different Track');
  assert.equal(overlap.creativeArchetypeContainsProjectWord('Fragile Custodianship'), true,
    'existing artist/track overlap protection remains active');
  assert.equal(overlap.creativeArchetypePrimaryCandidatePassesGuards('Fragile Custodianship', authored[0].source), false,
    'existing artist/track overlap protection remains active for primary candidates');
  assert.equal(makeArchetypePrimaryGuards('The curtain moves beside the window.', []).containsForbiddenTerm('Contained Drift'), true,
    'existing forbidden-term protections are not weakened');
});

const interpretiveClosureNames = [
  'semanticGenericAnchorWords',
  'extractSemanticAnchors',
  'getLastSentence',
  'inferFinalPhysicalState',
  'getCreativeFinalStateContract',
  'getCanonicalCaptionValues',
  'getCanonicalHookValues',
  'semanticRepairableFields',
  'getAllowedSemanticRepairFields',
  'getConceptAnchorSet',
  'countAnchorOverlap',
  'semanticQualityAudit',
];
const interpretiveClosureInputs = {
  normalizedUserReelVision: 'A linen curtain moves beside two empty chairs at a window.',
  normalizedMeaning: 'Time changes a room without erasing it.',
  normalizedDesiredImpact: 'Quiet patience without a reveal.',
  directorMode: 'Poetic Documentary',
  styleDNA: 'Soft Grain Cinema',
  visualStyle: 'Soft Grain Cinema',
  selectedConceptDNA: 'linen curtain and empty chairs beside a window',
  selectedMusicFacingSubjectStrategy: '',
  selectedMusicFacingWorldIntelligence: '',
  mood: 'Warm Cinematic Hope',
};
const makeInterpretiveClosureCandidate = () => ({
  reelConcept: 'Two empty chairs remain beside the window as a linen curtain stirs, capturing an unspoken dignity without presence or explanation.',
  directorSummary: 'The camera watches both chairs while the curtain shifts in the same frame.',
  narrativeArc: {
    stage1: 'Two empty chairs sit beside a sunlit window.',
    stage2: 'The linen curtain moves beside the chairs while the light crosses the floor.',
    stage3: 'A wider view rests on both chairs beneath the window as the curtain continues to stir.',
  },
  aiVideoPrompt: 'The camera observes two empty chairs beside the window. The linen curtain moves as sunlight crosses the floor.',
  cinematicIdentity: {
    visualDNA: ['linen curtain beside two empty chairs', 'window light across the floor', 'balanced space around the chairs'],
    emotionalTone: ['quiet attention to empty chairs', 'soft light beside linen', 'patient framing of the window'],
    audienceEmotion: [],
  },
  hooks: {},
  captions: {},
});
const makeInterpretiveClosureAudit = (intent = {}) => {
  const h = load(interpretiveClosureNames, {
    ...interpretiveClosureInputs,
    ...intent,
  });
  return h;
};
const issuesByInterpretiveClosureCode = (audit, candidate) =>
  audit.semanticQualityAudit(candidate).issues.filter(
    (issue) => issue.code === 'INTERPRETIVE_CLOSURE_AFTER_VISIBLE_STATE'
  );

test('show-dont-explain audit detects abstract interpretive tails only in the two authorized fields', () => {
  const h = makeInterpretiveClosureAudit();
  const reel = makeInterpretiveClosureCandidate();
  const reelIssues = issuesByInterpretiveClosureCode(h, reel);
  assert.equal(reelIssues.length, 1);
  assert.deepEqual(Array.from(reelIssues[0].fields), ['reelConcept']);
  assert.deepEqual(Array.from(reelIssues[0].repairFields), ['reelConcept']);

  const stage3 = makeInterpretiveClosureCandidate();
  stage3.reelConcept = 'Two empty chairs remain beside the window as a linen curtain stirs.';
  stage3.narrativeArc.stage3 = 'The two empty chairs remain beneath the window as the curtain shifts, leaving the space holding time’s shape in quiet solitude.';
  const stage3Issues = issuesByInterpretiveClosureCode(h, stage3);
  assert.equal(stage3Issues.length, 1);
  assert.deepEqual(Array.from(stage3Issues[0].fields), ['narrativeArc.stage3']);
  assert.deepEqual(Array.from(stage3Issues[0].repairFields), ['narrativeArc.stage3']);
});

test('observable camera language and concrete continuation are not treated as interpretive closure', () => {
  const h = makeInterpretiveClosureAudit();
  const candidate = makeInterpretiveClosureCandidate();
  candidate.reelConcept = 'The camera captures sunlight moving across two empty chairs beside the window.';
  assert.equal(issuesByInterpretiveClosureCode(h, candidate).length, 0);

  candidate.reelConcept = 'Two empty chairs remain beside the window, capturing the passage of time as sunlight moves across the linen curtain.';
  assert.equal(issuesByInterpretiveClosureCode(h, candidate).length, 0);
});

test('reel concept detects only shift the meaning variants when immediate visual evidence supports them', () => {
  const h = makeInterpretiveClosureAudit();
  const candidate = makeInterpretiveClosureCandidate();
  const visibleAction = 'Two empty chairs remain beside the window as the linen curtain stirs.';

  candidate.reelConcept = `${visibleAction} A routine act that quietly shifts the meaning of the space without altering its overall incompleteness or silence.`;
  assert.equal(issuesByInterpretiveClosureCode(h, candidate).length, 1);

  candidate.reelConcept = `${visibleAction} A routine act can shift the meaning of the space without changing its incompleteness.`;
  assert.equal(issuesByInterpretiveClosureCode(h, candidate).length, 1);
});

test('reel concept previous-sentence evidence is limited and does not extend the new marker to Stage 3', () => {
  const h = makeInterpretiveClosureAudit();
  const candidate = makeInterpretiveClosureCandidate();
  candidate.reelConcept = 'Two empty chairs remain beside the window; the meaning stays with the unaltered room.';
  assert.equal(issuesByInterpretiveClosureCode(h, candidate).length, 0);

  candidate.reelConcept = 'Two empty chairs remain beside the window as the linen curtain stirs. The wall is pale. A routine act shifts the meaning of the space without changing its silence.';
  assert.equal(issuesByInterpretiveClosureCode(h, candidate).length, 0);

  candidate.reelConcept = 'Two empty chairs remain beside the window as the linen curtain stirs.';
  candidate.narrativeArc.stage3 = 'The two empty chairs remain beneath the window as the curtain shifts. A routine act shifts the meaning of the space without changing its silence.';
  assert.equal(issuesByInterpretiveClosureCode(h, candidate).length, 0);
});

test('essayistic and surreal intent remain exempt for the new Reel Concept marker', () => {
  const candidate = makeInterpretiveClosureCandidate();
  candidate.reelConcept = 'Two empty chairs remain beside the window as the linen curtain stirs. A routine act shifts the meaning of the space without changing its silence.';

  const essayistic = makeInterpretiveClosureAudit({
    normalizedUserReelVision: `${interpretiveClosureInputs.normalizedUserReelVision} Use explicitly essayistic narration that explains the image’s meaning.`,
  });
  assert.equal(issuesByInterpretiveClosureCode(essayistic, candidate).length, 0);

  const surreal = makeInterpretiveClosureAudit({
    normalizedUserReelVision: 'A linen curtain moves beside two empty chairs at a window. The impossible reflection is the declared governing rule and must remain unexplained.',
  });
  assert.equal(issuesByInterpretiveClosureCode(surreal, candidate).length, 0);
});

test('existing revealing marker remains active for Reel Concept', () => {
  const h = makeInterpretiveClosureAudit();
  const candidate = makeInterpretiveClosureCandidate();
  candidate.reelConcept = 'Two empty chairs remain beside the window as the linen curtain stirs, revealing care in the quiet room.';
  const issues = issuesByInterpretiveClosureCode(h, candidate);
  assert.equal(issues.length, 1);
  assert.deepEqual(Array.from(issues[0].fields), ['reelConcept']);
});

test('explicit essayistic or explanatory intent and declared surreal logic bypass interpretive-closure enforcement', () => {
  const candidate = makeInterpretiveClosureCandidate();
  candidate.narrativeArc.stage3 = 'The two empty chairs remain beneath the window as the curtain shifts, leaving the space holding time’s shape in quiet solitude.';
  const essayistic = makeInterpretiveClosureAudit({
    normalizedUserReelVision: `${interpretiveClosureInputs.normalizedUserReelVision} Use explicitly essayistic narration that explains the image’s meaning.`,
  });
  assert.equal(issuesByInterpretiveClosureCode(essayistic, candidate).length, 0);

  const surreal = makeInterpretiveClosureAudit({
    normalizedUserReelVision: 'A linen curtain moves beside two empty chairs at a window. The impossible reflection is the declared governing rule and must remain unexplained.',
  });
  assert.equal(issuesByInterpretiveClosureCode(surreal, candidate).length, 0);
  assert.match(candidate.reelConcept, /unspoken dignity/);
  assert.match(candidate.narrativeArc.stage3, /quiet solitude/);
});

test('interpretive-closure repairs remain field-scoped and preserve the observed image through checked delivery', async () => {
  const fixture = clone(fixtures.find(f => f.id === 'held'));
  fixture.inputs.userReelVision = interpretiveClosureInputs.normalizedUserReelVision;
  fixture.inputs.meaning = interpretiveClosureInputs.normalizedMeaning;
  fixture.inputs.desiredImpact = interpretiveClosureInputs.normalizedDesiredImpact;
  fixture.candidate.reelConcept = 'Two empty chairs remain beside the window as a linen curtain stirs, capturing an unspoken dignity without presence or explanation.';
  fixture.candidate.directorSummary = 'The camera watches both chairs while the curtain shifts in the same frame.';
  fixture.candidate.narrativeArc = {
    stage1: 'Two empty chairs sit beside a sunlit window.',
    stage2: 'The linen curtain moves beside the chairs while sunlight crosses the floor.',
    stage3: 'The two empty chairs remain beneath the window as the curtain shifts, leaving the space holding time’s shape in quiet solitude.',
  };
  fixture.candidate.aiVideoPrompt = 'The camera observes two empty chairs beside the window. The linen curtain moves as sunlight crosses the floor. The two empty chairs remain beneath the window as the curtain shifts.';
  fixture.candidate.cinematicIdentity.visualDNA = ['linen curtain beside two empty chairs', 'window light across the floor', 'balanced space around the chairs'];

  let allowedAtRepair = null;
  const result = await replay(fixture, {
    repair: context => {
      allowedAtRepair = [...context.allowedRepairFields].sort();
      assert.deepEqual(allowedAtRepair, ['narrativeArc.stage3', 'reelConcept']);
      const guidance = context.semanticRepairGuidance.find(
        item => item.code === 'INTERPRETIVE_CLOSURE_AFTER_VISIBLE_STATE'
      );
      assert.ok(guidance);
      assert.match(guidance.guidance, /remove only the trailing abstract interpretation/i);
      assert.match(guidance.guidance, /Do not add a new action, payoff, physical change/i);
      return {
        repairs: [
          {
            path: 'reelConcept',
            valueType: 'string',
            stringValue: 'Two empty chairs remain beside the window as the linen curtain stirs.',
            stringList: [],
          },
          {
            path: 'narrativeArc.stage3',
            valueType: 'string',
            stringValue: 'The two empty chairs remain beneath the window as the curtain shifts.',
            stringList: [],
          },
        ],
      };
    },
  });

  assert.deepEqual(allowedAtRepair, ['narrativeArc.stage3', 'reelConcept']);
  assert.equal(result.status, 200, JSON.stringify({ output: result.output, logs: result.logs }));
  assert.equal(result.output.reelConcept, 'Two empty chairs remain beside the window as the linen curtain stirs.');
  assert.equal(result.output.narrativeArc.stage3, 'The two empty chairs remain beneath the window as the curtain shifts.');
  assert.equal(result.output.narrativeArc.stage2, fixture.candidate.narrativeArc.stage2);
  assert.equal(result.output.aiVideoPrompt, fixture.candidate.aiVideoPrompt);
  assert.equal(result.output.directorSummary, fixture.candidate.directorSummary);
  assert.equal(result.calls.filter(name => name === 'framelab_semantic_repairs').length, 1);
  assert.equal(result.calls.filter(name => name === 'framelab_premium_preservation_evaluation').length, 1);
  const quality = result.logs.find(entry => entry[0] === '[FRAME-LAB SEMANTIC QUALITY]')?.[1];
  assert.equal(quality?.selectedCandidate, 'repaired');
  assert.equal(quality?.candidateChecks?.onlyAllowedChanges, true);
  assert.equal(quality?.candidateChecks?.actionPreserved, true);
  assert.equal(quality?.candidateChecks?.conceptPreserved, true);
  assert.deepEqual(creativeCore(preservationCandidate(result)), creativeCore(result.output));
});


test('singular sky and voice agreement is corrected without changing plural or correct forms', () => {
  const { polishMusicFacingGrammar } = load(
    ['polishMusicFacingGrammar'],
    { artistName: '' }
  );

  assert.equal(polishMusicFacingGrammar('The sky move across water.'), 'The sky moves across water.');
  assert.equal(polishMusicFacingGrammar('A voice shape space in stillness and movement.'), 'A voice shapes space in stillness and movement.');
  assert.equal(polishMusicFacingGrammar('Skies move across water.'), 'Skies move across water.');
  assert.equal(polishMusicFacingGrammar('Voices shape space.'), 'Voices shape space.');
  assert.equal(polishMusicFacingGrammar('The sky moves across water.'), 'The sky moves across water.');
  assert.equal(polishMusicFacingGrammar('A voice shapes space.'), 'A voice shapes space.');
  assert.equal(polishMusicFacingGrammar('Water gather and rest beneath a patient hand.'), 'Water gathers and rests beneath a patient hand.');
  assert.equal(polishMusicFacingGrammar('Condensation fade on one pane.'), 'Condensation fades on one pane.');
});

function primaryBriefFromRequest(result) {
  const prompt = primaryRequestFromResult(result).messages[1].content;
  return JSON.parse(prompt.split(
    'Use this structured Creative Decision Layer as the hierarchy for the output:\n\n'
  )[1].split('\n\nGenerate Reel is not a full production blueprint.')[0]).creativeBrief;
}

test('autonomous primary projection consumes a premise only with wholly absent intent', () => {
  for (const hasIntent of [true, false]) {
    for (const active of [true, false]) {
      const original = { creativeBrief: {
        suppliedIntent: { vision: hasIntent ? 'A declared scene.' : '', meaning: '', desiredImpact: '' },
        selectedControls: { artistName: 'Fixture Artist', trackName: 'Fixture Track' },
        routingSuggestions: { primaryIdeaFamily: 'observation_discovery', sceneAnchor: 'unchanged local route' },
        selectionRule: 'Existing intent selection rule',
        fieldJobs: { reelConcept: 'existing job' },
      } };
      const before = clone(original);
      const h = load(['useAutonomousNoIntentDirection', 'protectedAutonomousCausalFacts', 'autonomousCausalPreservationRule', 'noIntentFinalStageClosureContract', 'primaryCreativeDecisionLayer', 'primaryConceptDNA', 'creativeDecisionLayerText'], {
        hasSuppliedCreativeIntent: hasIntent,
        hasAutonomousTrack: true,
        hasAutonomousArtist: true,
        selectedMusicFacingCreativeThesis: { isActive: active },
        creativeDecisionLayer: original,
        selectedConceptDNA: 'Existing local Concept DNA',
        autonomousPremise: scriptedPremise(fixtures[0]),
      });
      assert.deepEqual(original, before, 'Local routing and preservation context must not be mutated');
      if (hasIntent) {
        assert.equal(h.primaryCreativeDecisionLayer, original);
        assert.equal(h.creativeDecisionLayerText, JSON.stringify(original, null, 2));
        assert.equal(h.primaryConceptDNA, 'Existing local Concept DNA');
      } else {
        assert.deepEqual(clone(h.primaryCreativeDecisionLayer.creativeBrief.routingSuggestions), {});
        assert.equal(h.primaryCreativeDecisionLayer.creativeBrief.selectedControls, original.creativeBrief.selectedControls);
        assert.equal(h.primaryCreativeDecisionLayer.creativeBrief.suppliedIntent, original.creativeBrief.suppliedIntent);
        assert.equal(h.primaryCreativeDecisionLayer.creativeBrief.fieldJobs, original.creativeBrief.fieldJobs);
        assert.deepEqual(clone(h.primaryCreativeDecisionLayer.creativeBrief.autonomousPremise), scriptedPremise(fixtures[0]));
        assert.equal(h.primaryConceptDNA, JSON.stringify(scriptedPremise(fixtures[0])));
      }
    }
  }
});

test('no-intent primary requests synthesize controls without preselecting a family motif or ending', async () => {
  const controls = [
    { artistName: 'Mara Venn', trackName: 'Last Train Window', genre: 'Jazz', bpm: 88, mood: 'Soft Nostalgia', visualStyle: 'Soft Grain Cinema', directorMode: 'Poetic Documentary', styleDNA: 'Pearl Archive', era: 'Timeless Cinema', reelPurpose: 'Music Video Concept Seed' },
    { artistName: 'Elian Frost', trackName: 'Glass After Rain', genre: 'Electronica', bpm: 118, mood: 'Tense Anticipation', visualStyle: 'Concrete Noir', directorMode: 'Minimal Ritual Cinema', styleDNA: 'Concrete Dreamscape', era: 'Timeless Cinema', reelPurpose: 'Artist Identity Reel' },
    ...['craft', 'surreal', 'performance', 'acid'].map(id => fixtures.find(f => f.id === id).inputs),
  ];
  for (const inputs of controls) {
    // Scripted candidates exercise the real local pipeline; this is not a
    // generated-quality test and does not predict the model's creative output.
    const f = clone(fixtures.find(x => x.id === 'held'));
    Object.assign(f.inputs, inputs, { userReelVision: '', meaning: '', desiredImpact: '' });
    // Satisfy the existing medium-BPM contract before testing preservation.
    if (Number(f.inputs.bpm) > 100 && Number(f.inputs.bpm) <= 125) {
      f.candidate.directorSummary = 'Use balanced shot duration. ' + f.candidate.directorSummary;
    }
    const r = await replay(f);
    assert.equal(r.status, 200, JSON.stringify({ inputs, output: r.output }));
    const brief = primaryBriefFromRequest(r);
    const prompt = primaryRequestFromResult(r).messages[1].content;
    assert.deepEqual(brief.suppliedIntent, { vision: '', meaning: '', desiredImpact: '' });
    for (const key of ['artistName', 'trackName', 'genre', 'bpm', 'mood', 'visualStyle', 'directorMode', 'styleDNA', 'era', 'reelPurpose']) {
      assert.equal(brief.selectedControls[key], f.inputs[key], key);
    }
    assert.deepEqual(brief.routingSuggestions, {});
    for (const stale of ['suggested primary idea family', '- primary idea family:', '- progression mode:', '- ending mode:', 'concrete scene anchor:', 'primary subject strategy:', 'selected observable development', 'suggested observable development']) {
      assert.ok(!prompt.includes(stale), 'Preselected route leaked into primary request: ' + stale);
    }
    for (const rule of [
      'The separate autonomousPremise is the authoritative creative foundation',
      'These are your creative proposals, not user-supplied Vision, Meaning, Desired Impact, biography or facts about the artist.',
      'Quiet, static, abstract, performance-led and surreal ideas remain valid',
      'without requiring a twist, transformation, explanation or resolved payoff',
    ]) assert.ok(brief.selectionRule.includes(rule), rule);
    assert.deepEqual(creativeCore(r.output), creativeCore(f.candidate));
    assert.equal(r.calls.filter(name => name === 'initial').length, 1);
    assert.equal(r.calls.filter(name => name === 'framelab_autonomous_premise').length, 1);
    assert.equal(r.calls.filter(name => name === 'framelab_filmic_meaning_evaluation').length, 0);
    assert.equal(r.calls.filter(name => name === 'framelab_semantic_repairs').length, 0);
    assert.equal(r.calls.filter(name => name === 'framelab_premium_preservation_evaluation').length, 1);
  }
});

test('each non-empty intent field and all partial combinations keep the existing primary route', async () => {
  const fields = ['userReelVision', 'meaning', 'desiredImpact'];
  for (let mask = 1; mask < 8; mask++) {
    const f = clone(fixtures.find(x => x.id === 'held'));
    fields.forEach((field, i) => { if (!(mask & (1 << i))) f.inputs[field] = ''; });
    const r = await replay(f);
    assert.equal(r.status, 200);
    const brief = primaryBriefFromRequest(r);
    const prompt = primaryRequestFromResult(r).messages[1].content;
    assert.ok(Object.keys(brief.routingSuggestions).length > 0);
    assert.ok(prompt.includes('SUPPLIED CREATIVE INTENT TAKES PRIORITY:'));
    assert.ok(!prompt.includes('Take responsibility for the creative direction: originate'));
    assert.ok(!r.calls.includes('framelab_autonomous_premise'));
    assert.ok(prompt.includes('- primary idea family:'));
    assert.deepEqual(creativeCore(r.output), creativeCore(f.candidate));
    assert.equal(brief.suppliedIntent.vision, f.inputs.userReelVision);
    assert.equal(brief.suppliedIntent.meaning, f.inputs.meaning);
    assert.equal(brief.suppliedIntent.desiredImpact, f.inputs.desiredImpact);
  }
});

test('missing, empty and whitespace-only intent select the same autonomous primary request', async () => {
  const results = [];
  for (const value of [undefined, '', ' \t\n ']) {
    const f = clone(fixtures.find(x => x.id === 'held'));
    for (const field of ['userReelVision', 'meaning', 'desiredImpact']) {
      if (value === undefined) delete f.inputs[field];
      else f.inputs[field] = value;
    }
    const r = await replay(f);
    assert.equal(r.status, 200);
    assert.deepEqual(primaryBriefFromRequest(r).suppliedIntent, { vision: '', meaning: '', desiredImpact: '' });
    results.push(r);
  }
  for (const r of results.slice(1)) {
    assert.deepEqual(r.requests, results[0].requests);
    assert.deepEqual(r.output, results[0].output);
  }
});

test('autonomous primary direction still fails closed when preservation is not established', async () => {
  const f = clone(fixtures.find(x => x.id === 'held'));
  Object.assign(f.inputs, { userReelVision: '', meaning: '', desiredImpact: '' });
  for (const verdict of ['not_equivalent', 'uncertain']) {
    const r = await replay(f, { preservation: verdict });
    assert.equal(r.status, 422);
    assert.equal(r.output.code, 'premium_preservation_not_passed');
    assert.equal(r.output.reelConcept, undefined);
    assert.equal(r.calls.filter(name => name === 'initial').length, 1);
  }
});


test('no-intent control synthesis interprets aesthetic labels before selecting scene nouns', async () => {
  const controls = [
    { artistName: 'Neris Vale', trackName: 'Rooms Between Signals', genre: 'Electronica', bpm: 104, mood: 'Nocturnal Intimacy', visualStyle: 'Soft Grain Cinema', directorMode: 'Poetic Documentary', styleDNA: 'Pearl Archive', era: 'Timeless Cinema', reelPurpose: 'Artist Identity Reel' },
    { artistName: 'Elian Frost', trackName: 'Glass After Rain', genre: 'Electronica', bpm: 118, mood: 'Tense Anticipation', visualStyle: 'Concrete Noir', directorMode: 'Minimal Ritual Cinema', styleDNA: 'Concrete Dreamscape', era: 'Timeless Cinema', reelPurpose: 'Artist Identity Reel' },
    ...['craft', 'surreal', 'performance', 'acid'].map(id => fixtures.find(f => f.id === id).inputs),
  ];
  for (const inputs of controls) {
    const f = clone(fixtures.find(x => x.id === 'held'));
    Object.assign(f.inputs, inputs, { userReelVision: '', meaning: '', desiredImpact: '' });
    if (Number(f.inputs.bpm) > 100 && Number(f.inputs.bpm) <= 125) {
      f.candidate.directorSummary = 'Use balanced shot duration. ' + f.candidate.directorSummary;
    }
    const r = await replay(f);
    assert.equal(r.status, 200, JSON.stringify(r.output));
    const brief = primaryBriefFromRequest(r);
    const prompt = primaryRequestFromResult(r).messages[1].content;
    for (const key of ['artistName', 'trackName', 'genre', 'bpm', 'mood', 'visualStyle', 'directorMode', 'styleDNA', 'era', 'reelPurpose']) {
      assert.equal(brief.selectedControls[key], f.inputs[key], key + ' must remain supplied content');
    }
    for (const rule of [
      'Interpret selectedControls before choosing scene nouns:',
      'Visual Style and Cinematic DNA labels are aesthetic directions, not supplied props, locations, materials or story objects.',
      'a literal realization is valid only when the independently chosen governing relationship needs it and the other controls support it.',
      'Preserve the selected aesthetic through compatible treatment and world behavior rather than ignoring it.',
      'Use autonomousPremise.controlSynthesis to carry Artist, Track, Purpose, musical time',
      'Do not redo ideation, assign one prop per control',
    ]) assert.ok(brief.selectionRule.includes(rule), rule);
    assert.ok(prompt.includes('read the already authored autonomousPremise and its controlSynthesis'));
    assert.ok(prompt.includes('Choose a compatible world category only to stage the supplied autonomousPremise'));
    assert.ok(!prompt.includes('First interpret the title, genre, mood, visual style, director mode, cinematic DNA, era and reel purpose as a world category.'));
    assert.ok(!prompt.includes('- Visual Style controls material behavior, not the whole idea by itself.'));
    assert.deepEqual(creativeCore(r.output), creativeCore(f.candidate), 'Prompt contract must not rewrite the scripted candidate locally');
    assert.deepEqual(r.calls, ['framelab_autonomous_premise', 'initial', 'framelab_premium_preservation_evaluation']);
  }
});

test('control synthesis retains quiet and surreal freedom without invented supplied intent or label-specific rules', async () => {
  for (const id of ['held', 'surreal', 'performance']) {
    const f = clone(fixtures.find(x => x.id === id));
    Object.assign(f.inputs, { userReelVision: '', meaning: '', desiredImpact: '' });
    const r = await replay(f);
    assert.equal(r.status, 200);
    const brief = primaryBriefFromRequest(r);
    assert.deepEqual(brief.suppliedIntent, { vision: '', meaning: '', desiredImpact: '' });
    for (const rule of [
      'not biography or mandatory title imagery',
      'These are your creative proposals, not user-supplied Vision, Meaning, Desired Impact, biography or facts about the artist.',
      'Quiet, static, abstract, performance-led and surreal ideas remain valid',
      'without requiring a twist, transformation, explanation or resolved payoff',
    ]) assert.ok(brief.selectionRule.includes(rule), rule);
    for (const specialCase of ['Pearl Archive', 'Concrete Dreamscape', 'Neris Vale', 'Elian Frost']) {
      assert.ok(!brief.selectionRule.includes(specialCase), 'No case-specific rule: ' + specialCase);
    }
    assert.deepEqual(creativeCore(r.output), creativeCore(f.candidate));
  }
});

test('control synthesis is absent for every supplied-intent combination including the legacy route', async () => {
  const fields = ['userReelVision', 'meaning', 'desiredImpact'];
  for (let mask = 1; mask < 8; mask++) {
    const f = clone(fixtures.find(x => x.id === 'held'));
    fields.forEach((key, i) => { if (!(mask & (1 << i))) f.inputs[key] = ''; });
    if (mask === 1) f.inputs.reelPurpose = 'Legacy non-routing purpose';
    const r = await replay(f);
    assert.equal(r.status, 200);
    const prompt = r.requests[0].messages[1].content;
    assert.ok(!prompt.includes('Interpret selectedControls before choosing scene nouns:'));
    assert.ok(!prompt.includes('Choose a compatible world category only after synthesizing the authored premise'));
    assert.ok(prompt.includes('First interpret the title, genre, mood, visual style, director mode, cinematic DNA, era and reel purpose as a world category.'));
    assert.ok(prompt.includes('- Visual Style controls material behavior, not the whole idea by itself.'));
    assert.ok(!r.calls.includes('framelab_autonomous_premise'));
  }
});

function noIntentFixture(id = 'held') {
  const fixture = clone(fixtures.find(f => f.id === id));
  Object.assign(fixture.inputs, { userReelVision: '', meaning: '', desiredImpact: '' });
  return fixture;
}

test('autonomous premise uses one bounded Sol medium structured request before the package', async () => {
  const fixture = noIntentFixture();
  const result = await replay(fixture);
  assert.equal(result.status, 200);
  assert.deepEqual(result.calls, ['framelab_autonomous_premise', 'initial', 'framelab_premium_preservation_evaluation']);
  const request = result.requests[0];
  assert.equal(request.model, 'gpt-6.1-sol');
  assert.equal(request.reasoning_effort, 'medium');
  assert.equal(request.max_completion_tokens, 8192);
  assert.deepEqual(result.requestOptions[0], { maxRetries: 0, timeout: 60000 });
  for (const unsupported of ['temperature', 'top_p', 'logprobs', 'top_logprobs', 'tools']) {
    assert.equal(request[unsupported], undefined);
  }
  assert.equal(request.response_format.type, 'json_schema');
  assert.equal(request.response_format.json_schema.strict, true);
  const schema = request.response_format.json_schema.schema;
  assert.equal(schema.additionalProperties, false);
  assert.deepEqual([...schema.required].sort(), ['corePremise', 'governingRelationship', 'controlSynthesis', 'progressionPrinciple', 'finalCondition', 'trackBinding'].sort());
  assert.equal(schema.properties.controlSynthesis.additionalProperties, false);
  const input = JSON.parse(request.messages[1].content);
  assert.deepEqual(Object.keys(input).sort(), ['selectedControls', 'outputLanguage', 'rhythmDirection', 'directorDirection'].sort());
  for (const key of ['artistName', 'trackName', 'genre', 'bpm', 'mood', 'visualStyle', 'directorMode', 'styleDNA', 'era', 'reelPurpose']) {
    assert.equal(input.selectedControls[key], fixture.inputs[key]);
  }
  for (const absent of ['suppliedIntent', 'routingSuggestions', 'selectedConceptDNA', 'userReelVision', 'meaning', 'desiredImpact']) {
    assert.equal(input[absent], undefined);
  }
  assert.equal(input.directorDirection.cameraStyle, directors.find(d => d.name === fixture.inputs.directorMode)?.cameraStyle || '');
  assert.ok(!result.output.autonomousPremise, 'Internal premise must not become a new response field');
  assert.equal(primaryRequestFromResult(result).model, 'gpt-4.1-mini');
});

test('independent premise reaches primary verbatim without rewriting intent or scripted candidate', async () => {
  for (const id of ['held', 'surreal', 'performance', 'craft']) {
    const fixture = noIntentFixture(id);
    let chosenPremise;
    const result = await replay(fixture, { premise: (_, defaultPremise) => {
      chosenPremise = { ...defaultPremise, governingRelationship: `Unique ${id} relationship retained between ideation and execution.` };
      return chosenPremise;
    } });
    assert.equal(result.status, 200);
    const brief = primaryBriefFromRequest(result);
    assert.deepEqual(brief.autonomousPremise, chosenPremise);
    assert.deepEqual(brief.suppliedIntent, { vision: '', meaning: '', desiredImpact: '' });
    assert.deepEqual(brief.routingSuggestions, {});
    const primaryPrompt = primaryRequestFromResult(result).messages[1].content;
    assert.ok(primaryPrompt.includes(JSON.stringify(chosenPremise)), 'Concept DNA must carry the same premise');
    assert.ok(brief.selectionRule.includes('authoritative creative foundation'));
    assert.ok(brief.selectionRule.includes('do not replace it with another idea'));
    assert.ok(brief.selectionRule.includes('Creative Identity, Hooks and Captions from autonomousPremise'));
    assert.ok(brief.selectionRule.includes('captions must condense this particular premise in their distinct platform roles'));
    assert.deepEqual(creativeCore(result.output), creativeCore(fixture.candidate));
    assert.deepEqual(creativeCore(preservationCandidate(result)), creativeCore(result.output));
    assert.equal(result.calls.filter(name => name === 'framelab_autonomous_premise').length, 1);
    assert.ok(!result.calls.includes('framelab_filmic_meaning_evaluation'));
  }
});

test('premise contract preserves open and surreal forms while requiring a filmic governing relationship', async () => {
  const result = await replay(noIntentFixture());
  const contract = result.requests[0].messages[0].content;
  assert.ok(contract.includes('how one element changes, reveals, shifts or limits another'));
  assert.ok(contract.includes('Stage 2 to add filmic information or consequence to Stage 1'));
  assert.ok(contract.includes('final or deliberately open state'));
  assert.ok(contract.includes('Physical transformation is optional'));
  assert.ok(contract.includes('Artist + Track + Purpose jointly shape the creative decision'));
  assert.ok(contract.includes('not automatic props, locations or materials'));
  assert.ok(contract.includes('not biography, supplied story facts or mandatory literal title imagery'));
  assert.ok(contract.includes('Do not write Captions, Hooks, Creative Archetypes, finished Director Notes or a complete Narrative Package'));
});

test('premise validator rejects missing, extra, empty, mistyped and nested-invalid fields', () => {
  const h = load(['autonomousPremiseTextKeys', 'autonomousSynthesisKeys', 'autonomousTrackBindingKeys', 'autonomousPremiseSchema', 'validateAutonomousPremise'], { hasAutonomousTrack: true });
  const valid = scriptedPremise(fixtures[0]);
  assert.equal(h.validateAutonomousPremise(valid), true);
  for (const key of Object.keys(valid)) {
    const missing = clone(valid); delete missing[key];
    assert.equal(h.validateAutonomousPremise(missing), false, key);
  }
  for (const key of ['corePremise', 'governingRelationship', 'progressionPrinciple', 'finalCondition']) {
    for (const value of ['', ' \t\n', null, 7, [], {}]) {
      assert.equal(h.validateAutonomousPremise({ ...valid, [key]: value }), false, key);
    }
  }
  for (const key of Object.keys(valid.controlSynthesis)) {
    const missing = clone(valid); delete missing.controlSynthesis[key];
    assert.equal(h.validateAutonomousPremise(missing), false);
    assert.equal(h.validateAutonomousPremise({ ...valid, controlSynthesis: { ...valid.controlSynthesis, [key]: '  ' } }), false);
  }
  for (const invalid of [null, [], 'text', { ...valid, captions: 'unexpected package copy' },
    { ...valid, controlSynthesis: [] }, { ...valid, controlSynthesis: { ...valid.controlSynthesis, extra: 'unexpected' } }]) {
    assert.equal(h.validateAutonomousPremise(invalid), false);
  }
  for (const field of Object.values(h.autonomousPremiseSchema.properties)) {
    for (const leaf of field.properties ? Object.values(field.properties) : [field]) {
      const pattern = new RegExp(leaf.pattern);
      assert.equal(pattern.test(' \t\n'), false);
      assert.equal(pattern.test('A visible relation.'), true);
    }
  }
});

for (const [name, options, reason] of [
  ['provider error', { premiseError: new Error('OFFLINE_PROVIDER_ERROR') }, 'PROVIDER_ERROR'],
  ['timeout', { premiseError: Object.assign(new Error('OFFLINE_TIMEOUT'), { code: 'ETIMEDOUT' }) }, 'PROVIDER_ERROR'],
  ['refusal', { premiseCompletion: { choices: [{ finish_reason: 'stop', message: { refusal: 'refused', content: '{}' } }] } }, 'REFUSAL'],
  ['output limit', { premiseCompletion: { choices: [{ finish_reason: 'length', message: { content: JSON.stringify(scriptedPremise(fixtures[0])) } }] } }, 'INCOMPLETE_RESPONSE'],
  ['missing choice', { premiseCompletion: { choices: [] } }, 'INCOMPLETE_RESPONSE'],
  ['invalid JSON', { premiseCompletion: { choices: [{ finish_reason: 'stop', message: { content: '{' } }] } }, 'INVALID_JSON'],
  ['empty content', { premiseCompletion: { choices: [{ finish_reason: 'stop', message: { content: '' } }] } }, 'INVALID_JSON'],
  ['missing required fields', { premise: () => ({ corePremise: 'Only one field.' }) }, 'INVALID_STRUCTURE'],
  ['extra output fields', { premise: (_, p) => ({ ...p, hooks: ['Not permitted.'] }) }, 'INVALID_STRUCTURE'],
  ['empty required field', { premise: (_, p) => ({ ...p, finalCondition: ' \t ' }) }, 'INVALID_STRUCTURE'],
]) {
  test(`premise ${name} fails closed without a primary, fallback or retry`, async () => {
    const result = await replay(noIntentFixture(), options);
    assert.equal(result.status, 503);
    assert.equal(result.output.code, 'CREATIVE_QUALITY_EVALUATION_UNAVAILABLE');
    assert.equal(result.output.reelConcept, undefined);
    assert.deepEqual(result.calls, ['framelab_autonomous_premise']);
    assert.deepEqual(result.requestOptions, [{ maxRetries: 0, timeout: 60000 }]);
    const marker = result.logs.find(entry => entry[0] === '[FRAME-LAB AUTONOMOUS PREMISE FAILURE]')?.[1];
    assert.deepEqual(clone(marker), { path: 'NO_INTENT_PREMISE_UNAVAILABLE', reason });
    assert.ok(!JSON.stringify(result.logs).includes('OFFLINE_PROVIDER_ERROR'));
  });
}

test('absence of thesis routing does not silently skip the authorized no-intent premise stage', async () => {
  const fixture = noIntentFixture();
  fixture.inputs.reelPurpose = 'Legacy non-routing purpose';
  const result = await replay(fixture);
  assert.equal(result.status, 200);
  assert.equal(result.calls[0], 'framelab_autonomous_premise');
  assert.deepEqual(primaryBriefFromRequest(result).autonomousPremise, scriptedPremise(fixture));
});

for (const key of ['signal', 'interpretation', 'governingEffect']) {
  test(`track binding requires nonempty ${key} before Primary`, async () => {
    for (const value of ['', ' \t\n', null, [], {}]) {
      const result = await replay(noIntentFixture(), { premise: (_, p) => ({
        ...p, trackBinding: { ...p.trackBinding, [key]: value },
      }) });
      assert.equal(result.status, 503);
      assert.equal(result.output.code, 'CREATIVE_QUALITY_EVALUATION_UNAVAILABLE');
      assert.deepEqual(result.calls, ['framelab_autonomous_premise']);
      assert.ok(!result.logs.some(log => log[0] === '[FRAME-LAB AUTONOMOUS PREMISE]'));
    }
  });
}

test('generic artistTrackPurpose alone cannot replace a complete track binding', async () => {
  for (const binding of [undefined, null, {}, { signal: 'Jazz' },
    { signal: 'Jazz', interpretation: 'A musical reading.' },
    { signal: 'Jazz', interpretation: 'A reading.', governingEffect: 'A relation.', extra: 'not allowed' }]) {
    const result = await replay(noIntentFixture(), { premise: (_, p) => {
      p.controlSynthesis.artistTrackPurpose = 'This artist and track fit the mood and release purpose.';
      if (binding === undefined) delete p.trackBinding;
      else p.trackBinding = binding;
      return p;
    } });
    assert.equal(result.status, 503);
    assert.deepEqual(result.calls, ['framelab_autonomous_premise']);
  }
});

for (const [reading, binding] of [
  ['metaphorical', { signal: 'Second Window', interpretation: 'A second chance to perceive the same encounter.', governingEffect: 'A changed viewpoint makes the established relationship newly visible without adding a literal window.' }],
  ['temporal', { signal: 'Half a Second Late, 94 BPM', interpretation: 'Reciprocal actions miss their shared moment.', governingEffect: 'A repeated timing offset between the performers determines how their spatial relationship develops.' }],
]) {
  test(`${reading} binding reaches Primary and is captured once without extra ideation`, async () => {
    const fixture = noIntentFixture();
    fixture.inputs.trackName = binding.signal.split(',')[0];
    const result = await replay(fixture, { premise: (_, p) => ({ ...p, trackBinding: binding }) });
    assert.equal(result.status, 200);
    assert.deepEqual(primaryBriefFromRequest(result).autonomousPremise.trackBinding, binding);
    const captures = result.logs.filter(log => log[0] === '[FRAME-LAB AUTONOMOUS PREMISE]');
    assert.equal(captures.length, 1);
    assert.deepEqual(clone(captures[0][1].autonomousPremise), primaryBriefFromRequest(result).autonomousPremise);
    assert.deepEqual(Object.keys(captures[0][1]).sort(), ['model', 'finishReason', 'promptTokens', 'completionTokens', 'maxCompletionTokens', 'autonomousPremise'].sort());
    assert.deepEqual(result.calls, ['framelab_autonomous_premise', 'initial', 'framelab_premium_preservation_evaluation']);
    assert.deepEqual(result.requestOptions[0], { maxRetries: 0, timeout: 60000 });
    assert.deepEqual(creativeCore(result.output), creativeCore(fixture.candidate));
    const contract = result.requests[0].messages[0].content;
    assert.ok(contract.includes('Literal title objects or scenes are not required'));
    assert.ok(contract.includes('do not invent lyrics, song history or Artist facts'));
    assert.ok(contract.includes('Track title, Genre, BPM, Mood or their combination'));
    assert.ok(primaryBriefFromRequest(result).selectionRule.includes('its signal, interpretation and governingEffect must remain observable'));
  });
}

test('track binding schema requires the same three nonempty fields as the local validator', async () => {
  const result = await replay(noIntentFixture());
  const schema = result.requests[0].response_format.json_schema.schema;
  assert.ok(schema.required.includes('trackBinding'));
  assert.deepEqual(schema.properties.trackBinding.required, ['signal', 'interpretation', 'governingEffect']);
  assert.equal(schema.properties.trackBinding.additionalProperties, false);
  for (const field of Object.values(schema.properties.trackBinding.properties)) {
    assert.equal(field.type, 'string');
    assert.equal(new RegExp(field.pattern).test(' \t\n'), false);
  }
});

for (const track of [undefined, '', ' \t\n ']) {
  test(`absent track (${String(track)}) permits control synthesis without trackBinding or invented identity`, async () => {
    const fixture = noIntentFixture();
    fixture.inputs.artistName = '';
    if (track === undefined) delete fixture.inputs.trackName;
    else fixture.inputs.trackName = track;
    const result = await replay(fixture);
    assert.equal(result.status, 200);
    assert.deepEqual(result.calls, ['framelab_autonomous_premise', 'initial', 'framelab_premium_preservation_evaluation']);
    const schema = result.requests[0].response_format.json_schema.schema;
    assert.ok(!schema.required.includes('trackBinding'));
    assert.equal(schema.properties.trackBinding, undefined);
    const premise = primaryBriefFromRequest(result).autonomousPremise;
    assert.equal(premise.trackBinding, undefined);
    assert.ok(premise.controlSynthesis.musicalProfile);
    const contract = result.requests[0].messages[0].content;
    assert.ok(contract.includes('No Track name was supplied. Omit trackBinding'));
    assert.ok(contract.includes('Never invent a missing Artist or Track name'));
    assert.ok(!contract.includes('trackBinding must make the chain explicit'));
    const primary = primaryBriefFromRequest(result);
    assert.ok(primary.selectionRule.includes('without inventing a Track or demanding track-specific binding'));
    assert.ok(primary.selectionRule.includes('No Artist name was supplied'));
    assert.deepEqual(primary.suppliedIntent, { vision: '', meaning: '', desiredImpact: '' });
    assert.ok(!result.calls.includes('framelab_filmic_meaning_evaluation'));
  });
}

test('missing Artist does not disable required binding when Track is present', async () => {
  const fixture = noIntentFixture();
  fixture.inputs.artistName = '';
  const valid = await replay(fixture);
  assert.equal(valid.status, 200);
  assert.ok(valid.requests[0].response_format.json_schema.schema.required.includes('trackBinding'));
  assert.ok(valid.requests[0].messages[0].content.includes('Never invent a missing Artist or Track name'));
  const invalid = await replay(fixture, { premise: (_, p) => { delete p.trackBinding; return p; } });
  assert.equal(invalid.status, 503);
  assert.deepEqual(invalid.calls, ['framelab_autonomous_premise']);
});


// Scope 32: real-handler tests with scripted semantic judgements. These prove
// transmission, independent invariant coverage and final rejection, not live
// semantic model accuracy (which requires a separately authorized validation).
const causalInvariantKeys = ['actorAndAction', 'causeAndConsequence', 'governingRule', 'progressionCondition', 'finalCondition', 'persistentConstraints'];
function preservationReference(request) {
  return JSON.parse(request.messages.at(-1).content.split('REFERENCE:\n')[1].split('\nCANDIDATE:\n')[0]);
}
function causalFacts(premise) {
  return Object.fromEntries(['corePremise', 'governingRelationship', 'progressionPrinciple', 'finalCondition'].map(key => [key, premise[key]]));
}
test('autonomous causal source facts reach Primary and final Preservation independently of candidateOrigin', async () => {
  const f = noIntentFixture();
  let authored;
  const result = await replay(f, { premise: (_, p) => {
    authored = { ...p, corePremise: 'The caller withdraws before the responder answers.',
      governingRelationship: 'The response always follows the call; the delay persists.',
      progressionPrinciple: 'The caller sustains the offer rather than changing its timing.',
      finalCondition: 'Contact occurs while the delayed relationship remains in force.' };
    return authored;
  } });
  assert.equal(result.status, 200);
  assert.deepEqual(primaryBriefFromRequest(result).protectedAutonomousCausalFacts, causalFacts(authored));
  const request = result.requests.findLast(r => r.response_format?.json_schema?.name === 'framelab_premium_preservation_evaluation');
  const reference = preservationReference(request);
  assert.deepEqual(reference.protectedAutonomousCausalFacts, causalFacts(authored));
  assert.notEqual(reference.candidateOrigin.reelConcept, authored.corePremise);
  const contract = request.messages[0].content;
  for (const clause of ['outranks candidateOrigin', 'who initiates', 'what produces what', 'progressionPrinciple', 'finalCondition', 'every expressly continuing rule', 'Compatible paraphrase is equivalent', 'A contradictory stage or other core field cannot be compensated']) assert.ok(contract.includes(clause), clause);
  assert.deepEqual(request.response_format.json_schema.schema.properties.autonomousCausalFacts.required, causalInvariantKeys);
  assert.equal(result.calls.filter(n => n === 'framelab_premium_preservation_evaluation').length, 1);
});
for (const [key, violation] of [
  ['actorAndAction', 'Responder withdraws instead of initiator.'],
  ['causeAndConsequence', 'Contact causes the offer rather than resulting from it.'],
  ['governingRule', 'The declared response rule is replaced.'],
  ['progressionCondition', 'Progression changes timing instead of duration.'],
  ['finalCondition', 'The final contact is absent.'],
  ['persistentConstraints', 'The continuing delay disappears at the end.'],
]) {
  test(`No-Intent ${key} rejection cannot be compensated by nine equivalent fields`, async () => {
    const result = await replay(noIntentFixture(), { preservation: (_, answer) => {
      answer.autonomousCausalFacts[key] = { referenceFact: 'Protected source fact', candidateEvidence: violation, status: 'not_equivalent' };
      return answer;
    } });
    assert.equal(result.status, 422);
    assert.equal(result.output.code, 'premium_preservation_not_passed');
    assert.equal(result.calls.filter(n => n === 'framelab_premium_preservation_evaluation').length, 1);
  });
}
test('missing, blank, malformed or uncertain causal evidence cannot silently pass', async () => {
  for (const change of [
    answer => { delete answer.autonomousCausalFacts; },
    answer => { delete answer.autonomousCausalFacts.progressionCondition; },
    answer => { answer.autonomousCausalFacts.finalCondition.candidateEvidence = '  '; },
    answer => { answer.autonomousCausalFacts.actorAndAction.status = 'unsupported'; },
    answer => { answer.autonomousCausalFacts.persistentConstraints.status = 'uncertain'; },
  ]) {
    const result = await replay(noIntentFixture(), { preservation: (_, answer) => { change(answer); return answer; } });
    assert.equal(result.status, 422);
    assert.equal(result.output.code, 'premium_preservation_not_passed');
  }
});
test('compatible paraphrase remains accepted without literal text equality', async () => {
  const result = await replay(noIntentFixture(), { preservation: (_, answer) => {
    for (const key of causalInvariantKeys) assert.notEqual(answer.autonomousCausalFacts[key].referenceFact, answer.autonomousCausalFacts[key].candidateEvidence);
    return answer;
  } });
  assert.equal(result.status, 200);
});
test('authorized Repair receives causal facts and a failed Repair cannot bypass final causal Preservation', async () => {
  const f = noIntentFixture('held');
  f.candidate.narrativeArc.stage2 = 'The camera moves sideways while the prints remain untouched.';
  f.candidate.narrativeArc.stage3 = 'Both prints receive equal attention.';
  let seen;
  const result = await replay(f, {
    repair: context => { seen = context; throw new Error('SCRIPTED_REPAIR_UNAVAILABLE'); },
    preservation: (_, answer) => { answer.autonomousCausalFacts.actorAndAction.status = 'not_equivalent'; return answer; },
  });
  assert.deepEqual(seen.protectedAutonomousCausalFacts, causalFacts(scriptedPremise(f)));
  assert.ok(seen.autonomousCausalPreservationRule.includes('authorized repair may paraphrase'));
  assert.ok(!seen.allowedRepairFields.includes('narrativeArc.stage1'), 'Causal contract does not widen authorization');
  assert.equal(result.status, 422);
  assert.equal(result.output.code, 'premium_preservation_not_passed');
});
test('full and partial Intent do not acquire autonomous contracts or coverage schema', async () => {
  for (let mask = 1; mask < 8; mask++) {
    const f = clone(fixtures[0]);
    ['userReelVision', 'meaning', 'desiredImpact'].forEach((key, index) => { if (!(mask & (1 << index))) f.inputs[key] = ''; });
    const result = await replay(f);
    assert.equal(result.status, 200);
    assert.equal(primaryBriefFromRequest(result).protectedAutonomousCausalFacts, undefined);
    const request = result.requests.find(r => r.response_format?.json_schema?.name === 'framelab_premium_preservation_evaluation');
    assert.equal(preservationReference(request).protectedAutonomousCausalFacts, undefined);
    assert.equal(request.response_format.json_schema.schema.properties.autonomousCausalFacts, undefined);
    assert.ok(!request.messages[0].content.includes('protectedAutonomousCausalFacts'));
  }
});

for (const status of ['equivalent', 'not_equivalent']) {
  test(`selected repaired candidate still uses independent premise reference / ${status}`, async () => {
    const { f, correctedPrompt } = contradictoryFixture('held', 'absent');
    let repairFacts;
    const result = await replay(f, {
      repair: context => {
        repairFacts = context.protectedAutonomousCausalFacts;
        return { repairs: [{ path: 'aiVideoPrompt', valueType: 'string', stringValue: correctedPrompt, stringList: [] }] };
      },
      preservation: (request, answer) => {
        assert.deepEqual(preservationReference(request).protectedAutonomousCausalFacts, repairFacts);
        assert.equal(JSON.parse(request.messages.at(-1).content.split('\nCANDIDATE:\n')[1]).aiVideoPrompt, correctedPrompt);
        answer.autonomousCausalFacts.finalCondition.status = status;
        return answer;
      },
    });
    assert.equal(result.logs.find(log => log[0] === '[FRAME-LAB SEMANTIC QUALITY]')?.[1]?.selectedCandidate, 'repaired');
    assert.equal(result.status, status === 'equivalent' ? 200 : 422);
    if (status === 'not_equivalent') assert.equal(result.output.code, 'premium_preservation_not_passed');
    assert.equal(result.calls.filter(n => n === 'framelab_semantic_repairs').length, 1);
    assert.equal(result.calls.filter(n => n === 'framelab_premium_preservation_evaluation').length, 1);
  });
}


// Scope 33 tests the generation contract, not a new semantic validator.
// Scripted responses cannot prove live cross-field semantic consistency.
async function autonomousConsistencyContract(fixture = noIntentFixture()) {
  const result = await replay(fixture);
  assert.equal(result.status, 200);
  assert.equal(result.calls.filter(name => name === 'framelab_autonomous_premise').length, 1);
  return { result, contract: result.requests[0].messages[0].content };
}
test('premise contract requires one organizing rule with shared cross-field reference conditions', async () => {
  const { contract } = await autonomousConsistencyContract();
  assert.ok(contract.includes('governingRelationship defines one unambiguous organizing rule'));
  assert.ok(contract.includes('relevant roles, causal direction and temporal or relational reference conditions'));
  assert.ok(contract.includes('corePremise, progressionPrinciple and finalCondition, together with trackBinding.governingEffect, must describe and apply that same rule'));
  assert.ok(contract.includes('not silently define different versions'));
});
test('premise contract prevents silent causal redefinition while permitting an explicitly authored rule change', async () => {
  const { contract } = await autonomousConsistencyContract();
  assert.ok(contract.includes('develops behavior, perception or situation within the rule without unintentionally redefining it'));
  assert.ok(contract.includes('an actual rule change is allowed only when that change is explicitly part of the chosen creative premise'));
  assert.ok(contract.includes('internally reconcile the fields for contradictory actor roles, temporal reference points, cause/effect relations and rule definitions'));
});
test('premise contract carries only expressly persistent conditions through progression and ending', async () => {
  const { contract } = await autonomousConsistencyContract();
  assert.ok(contract.includes('Any condition expressly defined as persistent anywhere in the premise must remain compatible with progressionPrinciple and be clearly preserved in finalCondition'));
  assert.ok(contract.includes('the ending must not silently cancel it'));
  assert.ok(contract.includes('Do not invent a persistent constraint where none is needed'));
});
test('premise consistency contract permits semantic paraphrase without literal-copy validation', async () => {
  const { result, contract } = await autonomousConsistencyContract();
  assert.ok(contract.includes('Semantic paraphrase is allowed; identical wording is not required'));
  assert.deepEqual(primaryBriefFromRequest(result).autonomousPremise, scriptedPremise(noIntentFixture()));
});
test('premise consistency retains quiet, open, observational and surreal permissions', async () => {
  for (const id of ['held', 'surreal']) {
    const fixture = noIntentFixture(id);
    const { result, contract } = await autonomousConsistencyContract(fixture);
    assert.ok(contract.includes('Quiet, open, observational and surreal concepts remain valid without forced action, physical normalization or resolution'));
    assert.ok(contract.includes('Physical transformation is optional'));
    assert.ok(contract.includes('without requiring a twist, transformation, explanation or resolved payoff'));
    assert.deepEqual(creativeCore(result.output), creativeCore(fixture.candidate));
  }
});
test('premise consistency without Track or Artist requires no invented binding', async () => {
  const fixture = noIntentFixture();
  fixture.inputs.trackName = '';
  fixture.inputs.artistName = '';
  const { result, contract } = await autonomousConsistencyContract(fixture);
  assert.ok(contract.includes('corePremise, progressionPrinciple and finalCondition must describe and apply that same rule'));
  assert.ok(!contract.includes('together with trackBinding.governingEffect'));
  assert.ok(contract.includes('No Track name was supplied. Omit trackBinding'));
  assert.ok(contract.includes('Never invent a missing Artist or Track name'));
  assert.equal(result.requests[0].response_format.json_schema.schema.properties.trackBinding, undefined);
  assert.equal(primaryBriefFromRequest(result).autonomousPremise.trackBinding, undefined);
  assert.deepEqual(result.calls, ['framelab_autonomous_premise', 'initial', 'framelab_premium_preservation_evaluation']);
});


// Scope 34: contract propagation plus existing fail-closed evaluator boundaries.
// Scripted judgements do not prove that the live model detects missing evidence.
test('No-Intent Primary distinguishes final semantic preservation from visible cinematic evidence', async () => {
  const result = await replay(noIntentFixture());
  assert.equal(result.status, 200);
  const rule = primaryBriefFromRequest(result).selectionRule;
  for (const clause of [
    'For narrativeArc.stage3, directorSummary and aiVideoPrompt',
    'distinguish semantic preservation from visible cinematic evidence',
    'concluding action or perceptual relationship',
    'acting roles, order, timing or spatial relation legible',
    'merely saying that a rule remains visible in a static result is not evidence',
    "Preserve the premise's final condition and the distinct field roles",
  ]) assert.ok(rule.includes(clause), clause);
});
test('scoped Repair receives final-state evidence contract without additional field authorization', async () => {
  const { f, correctedPrompt } = contradictoryFixture('held', 'absent');
  let context;
  const result = await replay(f, { repair: value => {
    context = value;
    return { repairs: [{ path: 'aiVideoPrompt', valueType: 'string', stringValue: correctedPrompt, stringList: [] }] };
  } });
  assert.equal(result.status, 200);
  assert.ok(context.autonomousCausalPreservationRule.includes('distinguish semantic preservation from visible cinematic evidence'));
  assert.ok(context.autonomousCausalPreservationRule.includes('only within allowedRepairFields, without widening repair scope or inventing a new ending'));
  assert.ok(context.allowedRepairFields.includes('aiVideoPrompt'));
  assert.ok(!context.allowedRepairFields.includes('narrativeArc.stage1'));
  assert.ok(!context.allowedRepairFields.includes('narrativeArc.stage2'));
  assert.equal(result.calls.filter(n => n === 'framelab_semantic_repairs').length, 1);
});
test('existing Preservation request demands evidence for the concluding transition without demanding motion', async () => {
  const result = await replay(noIntentFixture());
  const request = result.requests.find(r => r.response_format?.json_schema?.name === 'framelab_premium_preservation_evaluation');
  const contract = request.messages[0].content;
  for (const clause of [
    'finalCondition, persistentConstraints and worldContinuity.causalVisibilityCondition',
    'not just a statement that the rule persists',
    'a preceding visible transition into a held final image can suffice',
    'observable support is missing or ambiguous, mark the affected existing status uncertain',
    "visible sequence contradicts the rule, mark it not_equivalent",
  ]) assert.ok(contract.includes(clause), clause);
  assert.equal(result.calls.filter(n => n === 'framelab_premium_preservation_evaluation').length, 1);
});
for (const target of ['causalVisibilityCondition', 'finalCondition', 'persistentConstraints']) {
  test(`reported missing final visible evidence blocks via existing ${target} status`, async () => {
    for (const verdict of ['uncertain', 'not_equivalent']) {
      const result = await replay(noIntentFixture(), { preservation: (_, answer) => {
        if (target === 'causalVisibilityCondition') answer.fieldStatuses.worldContinuity.causalVisibilityCondition = verdict;
        else answer.autonomousCausalFacts[target].status = verdict;
        return answer;
      } });
      assert.equal(result.status, 422);
      assert.equal(result.output.code, 'premium_preservation_not_passed');
    }
  });
}
test('held and surreal final relationships remain allowed without forced action or explanatory closure', async () => {
  for (const id of ['held', 'surreal']) {
    const f = noIntentFixture(id);
    const result = await replay(f);
    assert.equal(result.status, 200);
    const rule = primaryBriefFromRequest(result).selectionRule;
    assert.ok(rule.includes('A still final image is valid when the visible transition into it establishes the continuing rule'));
    assert.ok(rule.includes('composition itself supports a declared static or surreal relationship'));
    assert.ok(rule.includes('Do not require continuous motion, replay, explanation or a new event'));
    assert.deepEqual(creativeCore(result.output), creativeCore(f.candidate));
    assert.ok(!result.calls.includes('framelab_semantic_repairs'));
  }
});

// Scope 35 uses the existing detector, not a new semantic/word-list classifier.
function unresolvedClosureFixture() {
  const f = noIntentFixture('held');
  f.candidate.directorSummary = 'The camera holds on the two prints in unresolved spatial balance.';
  f.candidate.narrativeArc.stage3 = 'The two prints remain in unresolved spatial balance.';
  return f;
}
function closureRepair(path, value) {
  return { path, valueType: 'string', stringValue: value, stringList: [] };
}
test('No-Intent final-stage contract separates visible transition from a held result', async () => {
  const result = await replay(noIntentFixture());
  assert.equal(result.status, 200);
  const rule = primaryBriefFromRequest(result).selectionRule;
  for (const clause of [
    'Final-stage evidence contract for narrativeArc.stage3 and directorSummary',
    'initiating action, dependent response and resulting state in order before describing an optional still hold',
    'Do not substitute a claim about persistence in the held result for this visible sequence',
    'A static spatial relationship may be shown directly in composition when it is actually visible',
    'without added movement, explanation or payoff',
  ]) assert.ok(rule.includes(clause), clause);
});
test('existing audit recognizes the observed held-contact closure wording', () => {
  const h = load(['semanticGenericAnchorWords','extractSemanticAnchors','getLastSentence','inferFinalPhysicalState','getCreativeFinalStateContract','getCanonicalCaptionValues','getCanonicalHookValues','semanticRepairableFields','getConceptAnchorSet','countAnchorOverlap','semanticQualityAudit'], { selectedConceptDNA:'',selectedMusicFacingSubjectStrategy:'',selectedMusicFacingWorldIntelligence:'',mood:'',normalizedUserReelVision:'',normalizedMeaning:'',normalizedDesiredImpact:'',directorMode:'',styleDNA:'',visualStyle:'' });
  const c = clone(fixtures.find(f => f.id === 'held').candidate);
  c.narrativeArc.stage3 = 'Both the real palm and its reflection align against the glass, held in fragile stillness while the half-second delay remains legible in the sustained contact.';
  const issue = h.semanticQualityAudit(c).issues.find(i => i.code === 'CROSS_FIELD_STATIC_CLOSURE');
  assert.ok(issue);
  assert.ok(issue.fields.includes('narrativeArc.stage3'));
});
test('lower total severity cannot select a repair with unresolved final-stage closure', async () => {
  const f = unresolvedClosureFixture();
  let context;
  const result = await replay(f, { repair: c => {
    context = c;
    return { repairs: [closureRepair('directorSummary', fixtures.find(x => x.id === 'held').candidate.directorSummary)] };
  } });
  assert.equal(result.status, 422);
  assert.equal(result.output.code, 'CREATIVE_QUALITY_NOT_MET');
  assert.ok(!result.output.reelConcept);
  const log = result.logs.find(x => x[0] === '[FRAME-LAB SEMANTIC QUALITY]')?.[1];
  assert.ok(log.repairedSeverity < log.initialSeverity, JSON.stringify(log));
  assert.equal(log.candidateChecks.finalStageClosureResolved, false);
  assert.notEqual(log.selectedCandidate, 'repaired');
  assert.ok(log.rejectionReasons.includes('unresolved_cross_field_static_closure'));
  const guidance = context.semanticRepairGuidance.find(i => i.code === 'CROSS_FIELD_STATIC_CLOSURE').guidance;
  assert.ok(guidance.includes('initiating action, dependent response and resulting state in order'));
  assert.ok(guidance.includes('lowering total severity while retaining this issue is not a completed repair'));
  const marker = result.logs.find(x => x[0] === '[FRAME-LAB 422 PATH]' && x[1]?.path === 'FINAL_NO_INTENT_STATIC_CLOSURE');
  assert.ok(marker, JSON.stringify(result.logs));
  assert.equal(result.calls.filter(n => n === 'framelab_semantic_repairs').length, 1);
  assert.equal(result.calls.filter(n => n === 'framelab_premium_preservation_evaluation').length, 1);
});
for (const repair of [() => ({ repairs: [] }), () => { throw new Error('SCRIPTED_UNAVAILABLE'); }]) {
  test(`retained original cannot bypass unresolved closure after ${repair.toString().includes('throw') ? 'exception' : 'invalid payload'}`, async () => {
    const result = await replay(unresolvedClosureFixture(), { repair });
    assert.equal(result.status, 422);
    assert.equal(result.output.code, 'CREATIVE_QUALITY_NOT_MET');
    assert.ok(result.logs.some(x => x[0] === '[FRAME-LAB 422 PATH]' && x[1]?.path === 'FINAL_NO_INTENT_STATIC_CLOSURE'));
  });
}
test('fully resolved scoped repair permits a concrete held spatial ending', async () => {
  const f = unresolvedClosureFixture();
  const valid = fixtures.find(x => x.id === 'held').candidate;
  const result = await replay(f, { repair: () => ({ repairs: [
    closureRepair('directorSummary', valid.directorSummary),
    closureRepair('narrativeArc.stage3', valid.narrativeArc.stage3),
  ] }) });
  assert.equal(result.status, 200, JSON.stringify({ output:result.output, logs:result.logs }));
  const log = result.logs.find(x => x[0] === '[FRAME-LAB SEMANTIC QUALITY]')?.[1];
  assert.equal(log.selectedCandidate, 'repaired');
  assert.equal(log.candidateChecks.finalStageClosureResolved, true);
  assert.ok(!log.remainingIssueCodes.includes('CROSS_FIELD_STATIC_CLOSURE'));
  assert.equal(result.output.narrativeArc.stage3, valid.narrativeArc.stage3);
  assert.equal(result.output.aiVideoPrompt, f.candidate.aiVideoPrompt);
});
test('existing detector permits a demonstrated delayed arrival followed by an unembellished still hold', () => {
  const h = load(['semanticGenericAnchorWords','extractSemanticAnchors','getLastSentence','inferFinalPhysicalState','getCreativeFinalStateContract','getCanonicalCaptionValues','getCanonicalHookValues','semanticRepairableFields','getConceptAnchorSet','countAnchorOverlap','semanticQualityAudit'], { selectedConceptDNA:'',selectedMusicFacingSubjectStrategy:'',selectedMusicFacingWorldIntelligence:'',mood:'',normalizedUserReelVision:'',normalizedMeaning:'',normalizedDesiredImpact:'',directorMode:'',styleDNA:'',visualStyle:'' });
  const c = clone(fixtures.find(f => f.id === 'held').candidate);
  c.narrativeArc.stage2 = 'The performer touches the glass and withdraws before the delayed reflected hand arrives.';
  c.narrativeArc.stage3 = 'The performer keeps a palm on the glass. The reflection moves into place later; both palms then rest against the glass.';
  c.directorSummary = 'Keep both hands in view as the performer reaches the glass and the reflection follows later. Then hold on their palms against the glass.';
  const audit = h.semanticQualityAudit(c);
  assert.ok(!audit.issues.some(i => i.code === 'CROSS_FIELD_STATIC_CLOSURE' && i.fields.some(p => p === 'narrativeArc.stage3' || p === 'directorSummary')), JSON.stringify(audit));
});
test('physical, held spatial and surreal No-Intent families still deliver their compatible final images', async () => {
  for (const id of ['craft', 'held', 'surreal']) {
    const f = noIntentFixture(id);
    const result = await replay(f);
    assert.equal(result.status, 200);
    assert.deepEqual(creativeCore(result.output), creativeCore(f.candidate));
    assert.ok(!result.calls.includes('framelab_semantic_repairs'));
  }
});

// Scope 37: scripted semantic judgements prove independent field enforcement,
// schema/prompt transport and fail-closed delivery, not live evaluator accuracy.
const temporalVisualEvidenceKeys = ['stage3VisualRuleEvidence', 'directorNotesVisualRuleEvidence'];
test('No-Intent reuses the existing preservation call for two required independent visual-evidence judgements', async () => {
  const r = await replay(noIntentFixture());
  assert.equal(r.status, 200);
  assert.deepEqual(r.calls, ['framelab_autonomous_premise', 'initial', 'framelab_premium_preservation_evaluation']);
  const req = r.requests.at(-1), schema = req.response_format.json_schema.schema;
  for (const key of temporalVisualEvidenceKeys) {
    assert.ok(schema.required.includes(key));
    assert.deepEqual(schema.properties[key], { type: 'string', enum: ['pass', 'fail'] });
  }
  const contract = req.messages[0].content;
  for (const clause of ['Evaluate each field independently', 'evidence in another field cannot compensate',
    'filmable initiating action or condition', 'temporally or relationally dependent response',
    'immediately preceding visible sequence', "Director's Notes must direct the relevant visible movement or response",
    'Fail if only a static result is described', 'regardless of their wording']) assert.ok(contract.includes(clause), clause);
});
for (const key of temporalVisualEvidenceKeys) {
  test(`temporal static-result claim rejected by ${key} even when every other preservation check passes`, async () => {
    const r = await replay(noIntentFixture(), { preservation: (req, answer) => {
      const candidate = preservationCandidate({ requests: [req] });
      assert.ok(candidate.narrativeArc.stage3);
      assert.ok(candidate.directorSummary);
      answer[key] = 'fail';
      return answer;
    } });
    assert.equal(r.status, 422);
    assert.equal(r.output.code, 'premium_preservation_not_passed');
    const log = r.logs.find(x => x[0] === '[FRAME-LAB SEMANTIC QUALITY]')[1].preservationEvaluation;
    assert.equal(log.preservationStatus, 'fail');
    assert.equal(log[key], 'fail');
    assert.equal(log[temporalVisualEvidenceKeys.find(k => k !== key)], 'pass');
    assert.equal(r.calls.filter(n => n === 'framelab_premium_preservation_evaluation').length, 1);
  });
}
test('missing or malformed visual verdicts remain uncertain and cannot pass delivery', async () => {
  for (const key of temporalVisualEvidenceKeys) {
    for (const value of [undefined, '', 'equivalent', null, true]) {
      const r = await replay(noIntentFixture(), { preservation: (_, a) => {
        if (value === undefined) delete a[key]; else a[key] = value;
        return a;
      } });
      assert.equal(r.status, 422);
      const log = r.logs.find(x => x[0] === '[FRAME-LAB SEMANTIC QUALITY]')[1].preservationEvaluation;
      assert.equal(log.preservationStatus, 'uncertain');
      assert.ok(log.uncertainFields.includes(key));
    }
  }
});
test('visible delayed response followed by a still hold can pass without literal agreement', async () => {
  const r = await replay(noIntentFixture(), { preservation: (req, a) => {
    const contract = req.messages[0].content;
    assert.ok(contract.includes('A subsequent quiet hold may retain the result'));
    assert.ok(contract.includes('compatible paraphrases remain valid'));
    for (const key of temporalVisualEvidenceKeys) a[key] = 'pass';
    return a;
  } });
  assert.equal(r.status, 200);
});
for (const id of ['held', 'surreal', 'craft']) {
  test(`semantic evidence contract preserves ${id} ending with supported evaluator PASS`, async () => {
    const f = noIntentFixture(id), r = await replay(f);
    assert.equal(r.status, 200);
    assert.deepEqual(creativeCore(r.output), creativeCore(f.candidate));
    const contract = r.requests.at(-1).messages[0].content;
    assert.ok(contract.includes('A genuinely static spatial relationship may pass'));
    assert.ok(contract.includes('Quiet, open and surreal endings'));
    assert.ok(contract.includes('without requiring ordinary physics'));
    assert.ok(contract.includes('rather than inventing a temporal requirement'));
  });
}
test('all supplied-intent masks exclude the No-Intent visual verdict contract', async () => {
  for (let mask = 1; mask < 8; mask++) {
    const f = clone(fixtures[0]);
    ['userReelVision', 'meaning', 'desiredImpact'].forEach((k, i) => { if (!(mask & (1 << i))) f.inputs[k] = ''; });
    const r = await replay(f);
    assert.equal(r.status, 200);
    const req = r.requests.find(x => x.response_format?.json_schema?.name === 'framelab_premium_preservation_evaluation');
    for (const key of temporalVisualEvidenceKeys) {
      assert.equal(req.response_format.json_schema.schema.properties[key], undefined);
      assert.ok(!req.messages[0].content.includes(key));
    }
  }
});
test('No-Track and No-Artist retain the same No-Intent calls and valid control synthesis', async () => {
  const f = noIntentFixture(); f.inputs.trackName = ''; f.inputs.artistName = '';
  const r = await replay(f);
  assert.equal(r.status, 200);
  assert.deepEqual(r.calls, ['framelab_autonomous_premise', 'initial', 'framelab_premium_preservation_evaluation']);
  assert.equal(primaryBriefFromRequest(r).autonomousPremise.trackBinding, undefined);
  assert.equal(r.requests[0].response_format.json_schema.schema.properties.trackBinding, undefined);
});

// Scope 38: run the real recursive post-model sanitizer in isolation.
function sanitizeSubjectText(data, artistName = 'Mira Senn') {
  const h = load(['extractHashtagTokens', 'enforceSubjectSafetyForVisualPrompts'], { data, artistName });
  h.enforceSubjectSafetyForVisualPrompts();
  return data;
}
test('subject sanitizer preserves possessive objects and compounds instead of globally replacing subject aliases', () => {
  const texts = ["The star's brass mounting remains visible.", 'The star-shaped aperture casts light.',
    'The star’s reflection crosses the water.', 'The star rotates above the set.',
    'The compass looks like a flower.', 'The dial is recognizable as a clock.',
    'Two masks share the same face as the carving.', 'An iconic trademark remains on the case.',
    'The sculpture retains its signature pose and signature outfit.', "An original fictional performer's hand rests on glass."];
  const data = { reelConcept: texts.join(' '), narrativeArc: { stage3: texts.join(' ') }, captions: { tiktokCaption: texts.join(' ') } };
  assert.deepEqual(sanitizeSubjectText(clone(data)), data);
});
test('artist-name substrings and possessive object names are not proof of a human likeness', () => {
  for (const name of ['Star', 'Glass', 'Mira Senn']) {
    const data = { reelConcept: `The ${name}'s etched edge looks like a wave.`, aiVideoPrompt: `A label reads ${name}.` };
    assert.deepEqual(sanitizeSubjectText(clone(data), name), data);
  }
});
test('explicit human likeness directives still receive original fictional identity instructions', () => {
  const data = { aiVideoPrompt: "Make the subject look like Mira Senn. Copy the artist’s face. Preserve Mira Senn's likeness." };
  assert.equal(sanitizeSubjectText(data).aiVideoPrompt,
    'Make the subject visually distinct from any real artist. Create an original fictional face. Avoid any real-person likeness.');
});
test('identity directives use complete instruction boundaries and preserve surrounding filmable content', () => {
  const data = { aiVideoPrompt: "The mirror looks like water.\nMake the performer recognizable as the artist. The star's metal frame remains fixed." };
  const expected = "The mirror looks like water.\nMake the subject visually distinct from any real artist. The star's metal frame remains fixed.";
  assert.equal(sanitizeSubjectText(data).aiVideoPrompt, expected);
  const ordinary = { reelConcept: 'The note says make the subject look like a flower. Make the subject look like Mira Senn pottery.' };
  assert.deepEqual(sanitizeSubjectText(clone(ordinary)), ordinary);
  assert.equal(sanitizeSubjectText(data).aiVideoPrompt, expected, 'Idempotent');
});
test('recursive subject sanitizer retains existing metadata, hashtag and safety-block handling', () => {
  const data = { artistName: 'Mira Senn', hashtags: '#MiraSenn #Film',
    nested: ['The star-shaped window looks like a leaf.'],
    aiVideoPrompt: 'A hand touches glass.\nSUBJECT SAFETY: internal instructions' };
  sanitizeSubjectText(data);
  assert.equal(data.artistName, 'Mira Senn');
  assert.ok(!data.hashtags.includes('#MiraSenn'));
  assert.ok(data.hashtags.includes('#ArtistIdentity'));
  assert.deepEqual(data.nested, ['The star-shaped window looks like a leaf.']);
  assert.equal(data.aiVideoPrompt, 'A hand touches glass.');
});
test('no-artist sanitizer remains a no-op and intent routing is not a sanitizer dependency', () => {
  const data = { reelConcept: "The star's frame looks like a ring." };
  assert.deepEqual(sanitizeSubjectText(clone(data), ''), data);
  const body = declarations.get('enforceSubjectSafetyForVisualPrompts');
  assert.ok(!body.includes('hasSuppliedCreativeIntent'));
  assert.ok(!body.includes('useAutonomousNoIntentDirection'));
});

// Scripted provider tests prove language-contract transmission, not live translation accuracy.
for (const language of ['English', 'Deutsch', 'Español', 'Français', 'Italiano', 'Português', '中文']) {
  test(`Repair explicitly retains normalized ${language} for all authorized fields including Audience Emotion`, async () => {
    const f = unresolvedClosureFixture(); f.inputs.language = language;
    let context;
    const r = await replay(f, { repair: c => { context = c; return { repairs: [] }; } });
    assert.equal(context.outputLanguage, language);
    const req = r.requests.find(x => x.response_format?.json_schema?.name === 'framelab_semantic_repairs');
    const contract = req.messages.at(-1).content;
    assert.ok(contract.includes(`Write every repaired user-facing text in ${language}`));
    assert.ok(contract.includes('including Audience Emotion, Emotional Tone, identity, concept, director notes, narrative, video prompt, hooks, captions and thumbnail text'));
    assert.ok(contract.includes('Preserve Artist Name, Track Name and other supplied proper names unchanged'));
    assert.ok(contract.includes('Do not switch to English'));
    assert.ok(contract.includes('formatIntent.format remains "16:9 cinematic wide + 9:16 vertical social"'));
    assert.ok(contract.includes('never authorizes additional repair fields'));
    assert.equal(context.lockedInputs.artistName, f.inputs.artistName);
    assert.equal(context.lockedInputs.trackName, f.inputs.trackName);
    assert.equal(r.calls.filter(x => x === 'framelab_semantic_repairs').length, 1);
    assert.equal(r.calls.filter(x => x === 'framelab_premium_preservation_evaluation').length, 1);
  });
}

// Scope 42: same length rule for Primary normalization and repaired lists.
for (const language of ['English','Deutsch','Español','Français','Italiano','Português','中文']) {
 test(`Audience length validator and repair schema agree for ${language}`,()=>{
  const h=load(['bannedAudienceEmotionTerms','hasBannedAudienceEmotionTerm','audienceEmotionItemsAreTextDuplicates','audienceEmotionLooksComplete','semanticRepairableFields','semanticRepairResponseSchema','buildSemanticRepairResponseSchema','audienceEmotionRepairListIsValid'],{normalizedOutputLanguage:language});
  const schema=h.buildSemanticRepairResponseSchema(new Set(['cinematicIdentity.audienceEmotion','cinematicIdentity.emotionalTone']));
  const variants=schema.properties.repairs.items.anyOf;
  const item=variants.find(v=>v.properties.path.enum.includes('cinematicIdentity.audienceEmotion')).properties.stringList.items;
  const pattern=new RegExp(item.pattern);
  const valid=language==='中文'?'目光跟随手掌缓慢靠近玻璃，等待另一只手延迟回应。':'one two three four five six seven eight';
  const invalid=language==='中文'?'安静等待':'one two three four five six seven';
  for(const text of [valid]){assert.equal(h.audienceEmotionLooksComplete(text),true);assert.equal(pattern.test(text),true);}
  for(const text of [invalid,'','   ','，。！？……']){assert.equal(h.audienceEmotionLooksComplete(text),false);assert.equal(pattern.test(text),false);}
  assert.equal(variants.find(v=>v.properties.path.enum.includes('cinematicIdentity.emotionalTone')).properties.stringList.items.pattern,undefined);
  if(language==='中文'){
   assert.equal(h.audienceEmotionLooksComplete('a b c d e f g h'),false);
   assert.equal(h.audienceEmotionLooksComplete('光'.repeat(15)),false);
   assert.equal(h.audienceEmotionLooksComplete('光'.repeat(16)),true);
  }
 });
}

// Semantic model judgements are scripted: prove contract/gate plumbing, not live quality accuracy.
const identity45 = {
 Deutsch:['Geteilte Schwelle','Geduldige Gegenseitigkeit'],
 Español:['Umbral compartido','Reciprocidad sostenida'],
 Français:['Seuil partagé','Réciprocité suspendue'],
 Italiano:['Soglia condivisa','Reciprocità sospesa'],
 Português:['Limiar partilhado','Reciprocidade suspensa'],
 中文:['迟来的掌心','迟滞回响律动'],
};
for (const [language, labels] of Object.entries(identity45)) {
 test(`${language}: strong Primary Identity remains intact through bounded review and semantic PASS`,async()=>{
  const f=noIntentFixture();f.inputs.language=language;
  [f.candidate.cinematicIdentity.projectCodename,f.candidate.cinematicIdentity.creativeArchetype]=labels;
  const r=await replay(f,{repair:context=>{
   assert.equal(context.outputLanguage,language);
   assert.ok(context.allowedRepairFields.includes('cinematicIdentity.projectCodename'));
   assert.ok(context.allowedRepairFields.includes('cinematicIdentity.creativeArchetype'));
   assert.deepEqual([context.currentValues['cinematicIdentity.projectCodename'],context.currentValues['cinematicIdentity.creativeArchetype']],labels);
   return {repairs:[]};
  }});
  assert.equal(r.status,200);
  assert.deepEqual([r.output.cinematicIdentity.projectCodename,r.output.cinematicIdentity.creativeArchetype],labels);
  assert.deepEqual(creativeCore(r.output),creativeCore(f.candidate));
  assert.equal(r.calls.filter(n=>n==='framelab_semantic_repairs').length,1);
  assert.equal(r.calls.filter(n=>n==='framelab_premium_preservation_evaluation').length,1);
  const req=r.requests.at(-1),schema=req.response_format.json_schema.schema;
  for(const key of ['projectCodenameIdentityQuality','creativeArchetypeIdentityQuality','projectCodenameLanguageMatch','creativeArchetypeLanguageMatch'])assert.ok(schema.required.includes(key));
  assert.ok(req.messages[0].content.includes('Target output language: '+language));
 });
}
for(const key of ['projectCodenameIdentityQuality','creativeArchetypeIdentityQuality','projectCodenameLanguageMatch','creativeArchetypeLanguageMatch']) {
 for(const verdict of ['fail','uncertain',undefined]) {
  test(`non-English ${key} ${verdict} blocks delivery despite all other PASS`,async()=>{
   const f=noIntentFixture();f.inputs.language='中文';f.candidate.cinematicIdentity.projectCodename='普通项目';f.candidate.cinematicIdentity.creativeArchetype='房间';
   const r=await replay(f,{repair:()=>({repairs:[]}),preservation:(_,a)=>{
    if(verdict===undefined)delete a[key];else a[key]=verdict;return a;
   }});
   assert.equal(r.status,422);assert.equal(r.output.code,'premium_preservation_not_passed');
  });
 }
}
test('non-English identity correction is selected without manufacturing lexical severity improvement',async()=>{
 const f=noIntentFixture();f.inputs.language='中文';f.candidate.cinematicIdentity.projectCodename='普通项目';f.candidate.cinematicIdentity.creativeArchetype='房间';
 const r=await replay(f,{repair:()=>({repairs:[closureRepair('cinematicIdentity.projectCodename','未竟的靠近'),closureRepair('cinematicIdentity.creativeArchetype','相隔中的回应')]})});
 assert.equal(r.status,200);
 assert.equal(r.output.cinematicIdentity.projectCodename,'未竟的靠近');
 assert.equal(r.output.cinematicIdentity.creativeArchetype,'相隔中的回应');
});
test('non-English identity provider failure cannot authorize unchecked delivery; No-Track remains valid',async()=>{
 const f=noIntentFixture();f.inputs.language='Deutsch';f.inputs.trackName='';f.inputs.artistName='';
 const r=await replay(f,{repair:()=>{throw Error('SCRIPTED_PROVIDER_FAILURE');},preservation:(_,a)=>{a.projectCodenameIdentityQuality='uncertain';return a;}});
 assert.equal(r.status,422);
 const valid=await replay(f,{repair:()=>({repairs:[]})});assert.equal(valid.status,200);
 assert.equal(primaryBriefFromRequest(valid).autonomousPremise.trackBinding,undefined);
});
for (const field of ['projectCodename','creativeArchetype']) {
 test(`non-English ${field} missing or wrong type cannot pass by scripted semantic PASS`,async()=>{
  for(const value of ['',null,{bad:true}]){
   const f=noIntentFixture();f.inputs.language='中文';f.candidate.cinematicIdentity[field]=value;
   const r=await replay(f,{repair:()=>({repairs:[]})});
   assert.equal(r.status,422);
  }
 });
}
test('English identity schema and repair authorization remain unchanged',async()=>{
 const r=await replay(noIntentFixture());assert.equal(r.status,200);
 assert.ok(!r.calls.includes('framelab_semantic_repairs'));
 const schema=r.requests.at(-1).response_format.json_schema.schema;
 assert.equal(schema.properties.projectCodenameIdentityQuality,undefined);
 assert.equal(schema.properties.creativeArchetypeIdentityQuality,undefined);
});
test('non-English full and partial Intent keep their creative core while reusing identity review',async()=>{
 for(const language of Object.keys(identity45))for(const mask of [1,7]){
  const f=clone(fixtures[0]);f.inputs.language=language;
  if(language==='中文') f.candidate.cinematicIdentity.audienceEmotion=[
    '目光跟随画面中缓慢展开的动作，细微变化带来持续的专注感',
    '视线停留在主体与周围空间的关系上，距离的改变带来克制的紧张',
    '最后的画面保留具体动作留下的痕迹，使安静的感受继续延展',
  ];
  ['userReelVision','meaning','desiredImpact'].forEach((k,i)=>{if(!(mask&(1<<i)))f.inputs[k]='';});
  const r=await replay(f,{repair:()=>({repairs:[]})});
  assert.equal(r.status,200,JSON.stringify({language,mask,output:r.output,logs:r.logs.filter(x=>x[0]==='[FRAME-LAB SEMANTIC QUALITY]')}));assert.deepEqual(creativeCore(r.output),creativeCore(f.candidate));
  assert.ok(!r.calls.includes('framelab_autonomous_premise'));
  assert.equal(r.calls.filter(n=>n==='framelab_premium_preservation_evaluation').length,1);
 }
});

// Scripted judgments verify fail-closed routing, not live language recognition.
for (const language of Object.keys(identity45)) {
 for (const key of ['projectCodenameLanguageMatch','creativeArchetypeLanguageMatch']) {
  test(`${language}: wrong-language ${key} cannot be compensated by quality PASS`, async()=>{
   const f=noIntentFixture(); f.inputs.language=language;
   f.candidate.cinematicIdentity.projectCodename='Half Delay Exchange';
   f.candidate.cinematicIdentity.creativeArchetype='Measured Mirror Contact';
   const r=await replay(f,{repair:()=>({repairs:[]}),preservation:(_,a)=>{a[key]='fail';return a;}});
   assert.equal(r.status,422);
  });
 }
}

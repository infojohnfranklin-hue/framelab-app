const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');

const dependencyRequire = createRequire(path.resolve(
  process.env.FRAMELAB_DEPENDENCY_ROOT || process.cwd(), 'package.json'
));
const { parse } = dependencyRequire('@babel/parser');
const sourcePath = process.env.FRAMELAB_TEST_SOURCE || path.join(__dirname, '../pages/api/generate.js');
const source = fs.readFileSync(sourcePath, 'utf8');
const ast = parse(source, { sourceType: 'module' });
const declarations = new Map();
function visit(node) {
  if (!node || typeof node !== 'object') return;
  if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier') {
    declarations.set(node.id.name, `const ${source.slice(node.start, node.end)};`);
  }
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') visit(value);
  }
}
visit(ast);
function load(names, globals = {}) {
  const measurement = require(path.join(__dirname, '../lib/generation-cost-measurement.js'));
  const context = vm.createContext({ normalizedOutputLanguage: 'English', console: { log() {}, info() {}, error() {} }, measureOpenAICall: measurement.measureOpenAICall, costMeasurement: measurement.createGenerationCostMeasurementContext('main_generator', () => {}, async () => ({ status: 'RESERVED' })), ...globals });
  return vm.runInContext(`(() => {${names.map(name => {
    assert.ok(declarations.has(name), `source declaration missing: ${name}`);
    return declarations.get(name);
  }).join('\n')} return {${names.join(',')}}; })()`, context, { timeout: 1000 });
}
const plain = value => JSON.parse(JSON.stringify(value));

// Independent JSON-Schema subset checker for the constraints emitted here.
// It does not emulate provider constrained decoding or claim API integration.
function accepts(schema, value) {
  if (schema.anyOf && !schema.anyOf.some(s => accepts(s, value))) return false;
  if (schema.enum && !schema.enum.includes(value)) return false;
  if (schema.type === 'object') {
    if (!value || Array.isArray(value) || typeof value !== 'object') return false;
    if ((schema.required || []).some(k => !(k in value))) return false;
    if (schema.additionalProperties === false && Object.keys(value).some(k => !(k in schema.properties))) return false;
    return Object.entries(schema.properties || {}).every(([k, s]) => !(k in value) || accepts(s, value[k]));
  }
  if (schema.type === 'array') {
    return Array.isArray(value) && value.length >= (schema.minItems || 0) &&
      value.length <= (schema.maxItems ?? Infinity) && value.every(v => accepts(schema.items, v));
  }
  if (schema.type === 'string') {
    return typeof value === 'string' && [...value].length >= (schema.minLength || 0) &&
      [...value].length <= (schema.maxLength ?? Infinity);
  }
  return true;
}

const validatorNames = ['bannedAudienceEmotionTerms', 'hasBannedAudienceEmotionTerm',
  'audienceEmotionItemsAreTextDuplicates', 'audienceEmotionLooksComplete',
  'semanticRepairableFields', 'semanticRepairResponseSchema', 'audienceEmotionRepairListIsValid',
  'validateSemanticRepairPayload'];
const validator = load(validatorNames);

const snowflakePolish = load([
  'mechanismOnlyCreativeArchetypePattern',
  'polishSnowflakeCausalHook',
  'normalizeSnowflakeVisualItem',
  'isSnowflakeContinuationWorld',
  'buildSnowflakeContinuationCodename',
  'buildSnowflakeContinuationStage3',
  'polishSnowflakeContinuationSentence',
  'buildSnowflakeContinuationPromptEnding',
  'polishSnowflakePhysicalStateLanguage',
  'getLastSentence',
  'inferFinalPhysicalState',
  'getCanonicalCaptionValues',
  'getCanonicalHookValues',
  'getCreativeFinalStateContract',
]);

test('semantic snowflake polish makes mechanism-only identity ownable without changing the concept', () => {
  assert.equal(
    snowflakePolish.mechanismOnlyCreativeArchetypePattern.test(
      'Solitary Progressive Discovery'
    ),
    true
  );
  assert.equal(
    buildArchetypeFallback(
      'The laundromat clock pauses at midnight as washers turn beneath fogged glass.',
      'observation_discovery',
      { projectCodename: 'Shoreline Trace', visualDNA: ['fogged glass'] }
    ),
    'Progressive Discovery through Glass'
  );
  assert.equal(
    snowflakePolish.mechanismOnlyCreativeArchetypePattern.test(
      'Emptying Progressive Discovery'
    ),
    true
  );
  assert.equal(
    buildArchetypeFallback(
      'The tide recedes from wet sand, leaving a cassette in place.',
      'observation_discovery',
      { projectCodename: 'Shoreline Residue', visualDNA: ['wet sand'] }
    ),
    'Progressive Discovery through Sand'
  );
  assert.equal(
    snowflakePolish.mechanismOnlyCreativeArchetypePattern.test(
      'Empty Progressive Discovery'
    ),
    true
  );
  assert.equal(
    buildArchetypeFallback(
      'A cassette rests where the tide has receded.',
      'observation_discovery',
      { projectCodename: 'Tidebound Residue', visualDNA: ['wet sand'] }
    ),
    'Progressive Discovery through Sand'
  );
  assert.equal(
    snowflakePolish.mechanismOnlyCreativeArchetypePattern.test(
      'Tidal Tape Elegy'
    ),
    false
  );
  assert.equal(
    snowflakePolish.mechanismOnlyCreativeArchetypePattern.test(
      'Message Progressive Discovery'
    ),
    true
  );
});

test('semantic snowflake continuation polish aligns the physical payoff and language', () => {
  const world = 'weathered cassette, magnetic tape, wet sand and returning saltwater';
  assert.equal(
    snowflakePolish.isSnowflakeContinuationWorld(
      'The Tide Keeps the Tape',
      world
    ),
    true
  );
  assert.equal(
    snowflakePolish.buildSnowflakeContinuationCodename(world),
    'Tidebound Tape Residue'
  );
  assert.equal(
    buildArchetypeFallback(world, 'observation_discovery', {
      projectCodename: 'Tidebound Tape Residue',
      visualDNA: ['magnetic tape', 'wet sand']
    }),
    'Progressive Discovery through Sand'
  );
  assert.equal(
    snowflakePolish.buildSnowflakeContinuationStage3(world),
    'One final loop remains attached to the cassette as the returning saltwater pulls loose magnetic tape across wet sand and beyond the frame.'
  );
  assert.equal(
    snowflakePolish.buildSnowflakeContinuationPromptEnding(world),
    'The camera finishes on one final loop still attached to the cassette as the returning saltwater pulls loose magnetic tape across wet sand and beyond the frame.'
  );
  assert.equal(
    snowflakePolish.polishSnowflakeContinuationSentence(
      'Hands hold fragile tape as water quietly erases.'
    ),
    'Hands hold fragile tape as the returning tide carries the loose tape onward.'
  );
  assert.equal(
    snowflakePolish.polishSnowflakeContinuationSentence(
      'A magnetic tape slips away beneath returning saltwater.'
    ),
    'A strip of magnetic tape slips away beneath returning saltwater.'
  );
  assert.equal(
    snowflakePolish.polishSnowflakePhysicalStateLanguage(
      'The recording continues while the loose magnetic tape drifts.'
    ),
    'The loose tape carries the recorded message as it drifts.'
  );
  assert.equal(
    snowflakePolish.polishSnowflakePhysicalStateLanguage(
      'The loose magnetic tape continues recording.'
    ),
    'The loose tape carries the recorded message.'
  );
});

test('semantic snowflake polish corrects reversed causal hook language only', () => {
  assert.equal(
    snowflakePolish.polishSnowflakeCausalHook(
      'A fragile film strip pulls the tide closer to rusted steel.'
    ),
    'The tide pulls a fragile film strip toward rusted steel.'
  );
  const valid = 'The tide pulls a fragile film strip toward rusted steel.';
  assert.equal(snowflakePolish.polishSnowflakeCausalHook(valid), valid);
});

test('cross-field final-state contract rejects explicit attached/detached contradictions', () => {
  assert.equal(
    snowflakePolish.inferFinalPhysicalState(
      'The tape drifts beyond the frame.'
    ).state,
    'detached'
  );

  const contradictory = snowflakePolish.getCreativeFinalStateContract({
    reelConcept: 'The returning tide carries the loose tape away.',
    narrativeArc: {
      stage3: 'The tape detaches fully and drifts beyond the frame.',
    },
    aiVideoPrompt:
      'The camera finishes on one final loop still attached to the cassette.',
  });

  assert.equal(contradictory.contradictory, true);
  assert.deepEqual(Array.from(contradictory.states).sort(), ['attached', 'detached']);

  const aligned = snowflakePolish.getCreativeFinalStateContract({
    reelConcept: 'One final loop remains attached as loose tape moves beyond the frame.',
    narrativeArc: {
      stage3: 'One final loop remains attached as the tide pulls loose tape beyond the frame.',
    },
    aiVideoPrompt:
      'The camera finishes on one final loop still attached to the cassette.',
  });

  assert.equal(aligned.contradictory, false);
});

test('cross-field final-state contract recognizes progressive detachment language', () => {
  assert.equal(
    snowflakePolish.inferFinalPhysicalState(
      'Tape fragments drifting beyond the frame.'
    ).state,
    'detached'
  );

  const contradictory = snowflakePolish.getCreativeFinalStateContract({
    reelConcept: 'The tide carries loose tape away.',
    narrativeArc: {
      stage3: 'One final loop remains attached to the cassette.',
    },
    aiVideoPrompt:
      'The camera finishes with tape fragments drifting beyond the frame.',
  });

  assert.equal(contradictory.contradictory, true);
  assert.deepEqual(Array.from(contradictory.states).sort(), ['attached', 'detached']);
});

test('final-state contract covers hooks and captions without requiring identical wording', () => {
  const result = snowflakePolish.getCreativeFinalStateContract({
    narrativeArc: {
      stage3: 'One final loop remains attached to the cassette.',
    },
    aiVideoPrompt:
      'The camera finishes on one final loop still attached to the cassette.',
    hooks: {
      viralHook: 'The loose tape drifts beyond the frame.',
    },
    captions: {
      mainCaption: 'Loose tape drifts beyond the frame.',
    },
  });

  assert.equal(result.contradictory, true);
  assert.ok(result.explicitFields.includes('hooks.viralHook'));
  assert.ok(result.explicitFields.includes('captions.mainCaption'));
});

test('snowflake identity polish leaves creative contradictions for authorized semantic repair', () => {
  const data = {
    reelConcept:
      'At low tide, a performer records a final message onto a weathered cassette as the shoreline empties.',
    directorSummary: 'The camera observes the cassette and returning saltwater.',
    narrativeArc: {
      stage1: 'A weathered cassette rests on wet sand.',
      stage2: 'The performer records a final message as saltwater reaches the cassette.',
      stage3:
        'One final loop remains attached to the cassette as returning saltwater pulls loose tape beyond the frame.',
    },
    aiVideoPrompt:
      'The camera observes the cassette and shoreline in patient close-ups. End with tape fragments drifting beyond the frame.',
    cinematicIdentity: {
      projectCodename: 'Solitary Sits Cipher',
      creativeArchetype: 'Shoreline Progressive Discovery',
      visualDNA: ['weathered cassette and magnetic tape'],
      snowflakeSignature: 'SOLITARY-PERFORMER-8918',
    },
    hooks: {},
  };

  const h = load([
    ...archetypeFallbackNames,
    'mechanismOnlyCreativeArchetypePattern',
    'polishSnowflakeCausalHook',
    'normalizeSnowflakeVisualItem',
    'isSnowflakeContinuationWorld',
    'buildSnowflakeContinuationCodename',
    'buildSnowflakeContinuationStage3',
    'polishSnowflakeContinuationSentence',
    'buildSnowflakeContinuationPromptEnding',
    'polishSnowflakePhysicalStateLanguage',
    'getLastSentence',
    'inferFinalPhysicalState',
    'buildIdentityExecutionSource',
    'applySemanticSnowflakePolish',
  ], {
    data,
    artistName: '',
    selectedMusicFacingCreativeThesis: {
      isActive: true,
      primaryIdeaFamily: 'observation_discovery',
    },
    trackName: 'The Tide Keeps the Tape',
    selectedConceptDNA: 'weathered cassette and magnetic tape on wet sand',
    containsForbiddenTerm: () => false,
    containsForbiddenRoleTerm: () => false,
    normalizeSnowflakeSignature: (value) => value,
    buildSnowflakeSignature: () => 'TEST-SIGNATURE',
  });

  const promptBefore = data.aiVideoPrompt;
  h.applySemanticSnowflakePolish();
  assert.equal(data.aiVideoPrompt, promptBefore);
  assert.equal(
    snowflakePolish.getCreativeFinalStateContract(data).contradictory, true,
    'Identity normalization must not conceal the contradiction from semantic repair'
  );
});

test('semantic quality audit surfaces the cross-field final-state issue for repair', () => {
  const audit = load([
    'semanticGenericAnchorWords',
    'extractSemanticAnchors',
    'getLastSentence',
    'inferFinalPhysicalState',
    'getCreativeFinalStateContract',
    'getCanonicalCaptionValues',
    'getCanonicalHookValues',
    'semanticRepairableFields',
    'getConceptAnchorSet',
    'countAnchorOverlap',
    'semanticQualityAudit',
  ], {
    normalizedUserReelVision: '',
    normalizedMeaning: '',
    normalizedDesiredImpact: '',
    directorMode: '',
    styleDNA: '',
    visualStyle: '',
    selectedConceptDNA: 'weathered cassette and magnetic tape on wet sand',
    selectedMusicFacingSubjectStrategy: 'cassette recorder',
    selectedMusicFacingWorldIntelligence: 'returning saltwater shoreline',
    mood: 'Warm Cinematic Hope',
  });

  const result = audit.semanticQualityAudit({
    reelConcept: 'The tide carries the loose tape away.',
    directorSummary: 'The camera follows the tide across wet sand.',
    narrativeArc: {
      stage1: 'A cassette rests on wet sand.',
      stage2: 'The returning tide lifts loose tape.',
      stage3: 'The tape detaches fully and drifts beyond the frame.',
    },
    aiVideoPrompt:
      'The camera finishes on one final loop still attached to the cassette.',
    cinematicIdentity: {
      visualDNA: ['weathered cassette and magnetic tape'],
      emotionalTone: ['warm focus through cassette tape', 'measured pacing around tide', 'warm presence within wet sand'],
      audienceEmotion: [],
    },
  });

  assert.equal(
    result.issues.some(
      (issue) => issue.code === 'CROSS_FIELD_FINAL_STATE_CONTRADICTION'
    ),
    true
  );
});

test('semantic quality audit accepts diverse individual creative intents', () => {
  const audit = load([
    'semanticGenericAnchorWords',
    'extractSemanticAnchors',
    'getLastSentence',
    'inferFinalPhysicalState',
    'getCreativeFinalStateContract',
    'getCanonicalCaptionValues',
    'getCanonicalHookValues',
    'semanticRepairableFields',
    'getConceptAnchorSet',
    'countAnchorOverlap',
    'semanticQualityAudit',
  ], { selectedConceptDNA: '', selectedMusicFacingSubjectStrategy: '',
    selectedMusicFacingWorldIntelligence: '', mood: '',
    normalizedUserReelVision: '', normalizedMeaning: '', normalizedDesiredImpact: '',
    directorMode: '', styleDNA: '', visualStyle: '' });

  const shared = {
    cinematicIdentity: { visualDNA: [], emotionalTone: [], audienceEmotion: [] },
    hooks: {},
    captions: {},
  };
  const cases = [
    {
      reelConcept: 'A watchmaker opens a brass watch and releases the wound spring into a tray.',
      directorSummary: 'The camera follows the watchmaker because the spring has slipped from its seat, then tracks the spring across the tray.',
      narrativeArc: { stage2: 'The spring moves across the tray as the watchmaker reaches for tweezers.', stage3: 'The spring settles into the watchmaker’s open palm and the watch remains silent.' },
      aiVideoPrompt: 'After the spring slips from its seat, the camera follows it across the tray and ends on the spring resting in the watchmaker’s palm.',
      hooks: { hook: 'A tiny spring changes the entire repair.' },
      captions: { mainCaption: 'A watchmaker follows one spring from failure to stillness.' },
    },
    {
      reelConcept: 'A room of projected light slowly changes shape as a memory is revisited.',
      directorSummary: 'The camera observes projected light crossing the room while each recalled detail alters the pattern.',
      narrativeArc: { stage2: 'The projected light shifts across the walls as the remembered room opens.', stage3: 'The pattern keeps moving across the room, leaving the memory unresolved.' },
      aiVideoPrompt: 'The camera follows projected light across the room as each remembered detail changes the pattern, ending with the movement continuing beyond the final frame.',
      hooks: { hook: 'What changes when a room remembers?' },
      captions: { mainCaption: 'A memory changes the light without closing the room.' },
    },
    {
      reelConcept: 'A paper moon rises from a kitchen sink and casts a second shoreline across the ceiling.',
      directorSummary: 'The camera watches the paper moon because the sink water reflects a shoreline that cannot exist indoors.',
      narrativeArc: { stage2: 'The reflected shoreline climbs from the sink toward the ceiling.', stage3: 'The second shoreline keeps spreading across the ceiling while the paper moon remains in the sink.' },
      aiVideoPrompt: 'As the sink reflection climbs toward the ceiling, the camera ends on the second shoreline spreading while the paper moon remains below.',
      hooks: { hook: 'A shoreline appears where no sea exists.' },
      captions: { mainCaption: 'The impossible shoreline keeps moving across the ceiling.' },
    },
    {
      reelConcept: 'A singer records one final harmony in an empty rehearsal room before the lights go out.',
      directorSummary: 'The camera stays with the singer because the last harmony must be held until the room falls quiet.',
      narrativeArc: { stage2: 'The singer repeats the harmony as the room’s lights begin to dim.', stage3: 'The final note continues after the lights go out, leaving the empty room listening.' },
      aiVideoPrompt: 'When the lights begin to dim, the camera holds on the singer’s final harmony and ends in the dark room after the note continues.',
      hooks: { hook: 'The room hears the last note after the lights disappear.' },
      captions: { mainCaption: 'One final harmony remains after the room goes dark.' },
    },
  ];

  for (const candidate of cases) {
    const result = audit.semanticQualityAudit({ ...shared, ...candidate });
    assert.equal(result.passed, true, result.issues.map((issue) => issue.code).join(', '));
    assert.equal(result.issues.length, 0);
  }
});

test('hashtag sanitization keeps tokens and drops explanatory prose', () => {
  const data = {
    hashtags: '#Tape; one final loop remains attached to the cassette.',
  };
  const h = load(['extractHashtagTokens', 'enforceSubjectSafetyForVisualPrompts'], {
    data,
    artistName: 'Mara Vale',
  });

  h.enforceSubjectSafetyForVisualPrompts();

  assert.match(data.hashtags, /#Tape/);
  assert.doesNotMatch(data.hashtags, /one final loop remains/i);
});

test('semantic snowflake visual cleanup removes adjacent duplication without inventing imagery', () => {
  assert.equal(
    snowflakePolish.normalizeSnowflakeVisualItem(
      'textured concrete textures with fine grain'
    ),
    'layered concrete surfaces with fine grain'
  );
  assert.equal(
    snowflakePolish.normalizeSnowflakeVisualItem(
      'thin film strip at the water edge'
    ),
    'thin film strip at the water edge'
  );
});

const emotions = [
  'Small differences between the prints keep the comparison unsettled without promising an answer.',
  'Distance from the light table lets imperfect paper edges become equally readable.',
  'An unhurried final hold leaves room to accept both unchanged photographs together.',
];
const repair = (path, value) => ({ path, valueType: Array.isArray(value) ? 'string_list' : 'string',
  stringValue: Array.isArray(value) ? '' : value, stringList: Array.isArray(value) ? value : [] });

test('full generator parses without importing or executing the handler', () => assert.ok(ast));
test('contract regression: schema excludes paths outside the current audit scope', () => {
  const allowed = new Set(['cinematicIdentity.audienceEmotion']);
  const factory = declarations.has('buildSemanticRepairResponseSchema')
    ? load(['semanticRepairableFields', 'semanticRepairResponseSchema', 'buildSemanticRepairResponseSchema'])
      .buildSemanticRepairResponseSchema(allowed)
    : validator.semanticRepairResponseSchema;
  const payload = { repairs: [repair('reelConcept', 'Unrequested rewritten world.')] };
  assert.equal(validator.validateSemanticRepairPayload(payload, allowed).valid, false);
  assert.equal(accepts(factory, payload), false, 'model schema must exclude locally forbidden paths');
});
test('contract regression: Audience Emotion must use exactly three list entries at schema level', () => {
  const allowed = new Set(['cinematicIdentity.audienceEmotion']);
  const schema = declarations.has('buildSemanticRepairResponseSchema')
    ? load(['semanticRepairableFields', 'semanticRepairResponseSchema', 'buildSemanticRepairResponseSchema'])
      .buildSemanticRepairResponseSchema(allowed)
    : validator.semanticRepairResponseSchema;
  for (const entry of [repair('cinematicIdentity.audienceEmotion', 'Wrong container'),
    repair('cinematicIdentity.audienceEmotion', emotions.slice(0, 2))]) {
    assert.equal(validator.validateSemanticRepairPayload({ repairs: [entry] }, allowed).valid, false);
    assert.equal(accepts(schema, { repairs: [entry] }), false);
  }
  assert.equal(accepts(schema, { repairs: [repair('cinematicIdentity.audienceEmotion', emotions)] }), true);
});
test('request-specific schemas cannot leak another concurrent request field scope', (t) => {
  if (!declarations.has('buildSemanticRepairResponseSchema')) {
    t.skip('NOT_APPLICABLE: the baseline has no request-specific schema factory');
    return;
  }
  const { buildSemanticRepairResponseSchema: build, semanticRepairResponseSchema: base } =
    load(['semanticRepairableFields', 'semanticRepairResponseSchema', 'buildSemanticRepairResponseSchema']);
  const before = JSON.stringify(base);
  const one = build(new Set(['reelConcept']));
  const two = build(new Set(['cinematicIdentity.audienceEmotion']));
  assert.equal(JSON.stringify(base), before);
  assert.equal(accepts(one, { repairs: [repair('reelConcept', 'The prints remain unchanged.')] }), true);
  assert.equal(accepts(two, { repairs: [repair('reelConcept', 'The prints remain unchanged.')] }), false);
  assert.throws(() => build(new Set()));
  assert.throws(() => build(new Set(['unknown.field'])));
});
test('Audience Emotion still rejects every banned term, incomplete prose and textual duplicates', () => {
  assert.equal(validator.audienceEmotionRepairListIsValid(emotions), true);
  for (const term of validator.bannedAudienceEmotionTerms) {
    const diagnostic = {};
    const payload = { repairs: [repair('cinematicIdentity.audienceEmotion',
      [`${emotions[0]} ${term.toUpperCase()}`, ...emotions.slice(1)])] };
    assert.equal(validator.validateSemanticRepairPayload(payload,
      new Set(['cinematicIdentity.audienceEmotion']), diagnostic).valid, false);
    assert.equal(diagnostic.reasonCode, 'AUDIENCE_EMOTION_BANNED_TERM');
    assert.equal(diagnostic.itemPosition, 1);
  }
  assert.equal(validator.audienceEmotionRepairListIsValid(['Too short.', ...emotions.slice(1)]), false);
  assert.equal(validator.audienceEmotionRepairListIsValid([emotions[0], emotions[0].toUpperCase(), emotions[2]]), false);
});

const meaningNames = ['FILMIC_MEANING_VISUAL_EVIDENCE_PATHS', 'FILMIC_MEANING_AUDIENCE_EMOTION_PATHS',
  'FILMIC_MEANING_EVIDENCE_PATHS', 'filmicMeaningEvaluationSchema', 'getFilmicMeaningEvidenceCandidate',
  'filmicMeaningEvidenceMatches', 'evaluateFilmicMeaningCarrier'];
const getPathValue = (obj, p) => p.split('.').reduce((v, k) => v?.[k], obj);
const candidate = {
  reelConcept: 'Two unchanged contact prints rest beside one another under the light table.',
  narrativeArc: { stage1: 'A technician studies the same room from a narrow viewing position.',
    stage2: 'The camera moves sideways while the prints remain unchanged.',
    stage3: 'A wider held view gives equal space to both imperfect prints without a solution.' },
  aiVideoPrompt: 'A long held view preserves the distance between two unchanged photographs.',
  cinematicIdentity: { audienceEmotion: emotions },
};
const pass = {
  verdict: 'PASS', reasonCode: 'FILMIC_MEANING_SUPPORTED', intentPreserved: 'yes',
  carrierPath: 'reelConcept', carrierQuote: 'Two unchanged contact prints',
  developmentPath: 'narrativeArc.stage3', developmentQuote: 'A wider held view gives equal space',
  repairEvidencePath: '', repairEvidenceQuote: '', originalGapResolved: 'uncertain', comparativeReason: '',
};
function meaningHarness(responses) {
  const calls = [];
  const globals = { getPathValue,
    normalizedUserReelVision: 'Only the camera changes. The photographs remain unchanged.',
    normalizedMeaning: 'Uncertainty can be freedom.', normalizedDesiredImpact: 'Quiet unsentimental permission.',
    artistName: 'Elian Voss', trackName: 'Unfixed Negative', genre: 'Downtempo', bpm: 92,
    mood: 'Tense Anticipation', visualStyle: 'Soft Grain Cinema', directorMode: 'Poetic Documentary',
    styleDNA: 'Luxury Underground', era: '1970s Analog Film', reelPurpose: 'Artist Identity Reel',
    client: { chat: { completions: { create: async (request, options) => {
      calls.push({ request, options });
      const next = responses.shift();
      if (next instanceof Error) throw next;
      return { choices: [{ message: { content: typeof next === 'string' ? next : JSON.stringify(next) } }] };
    } } } },
  };
  return { ...load(meaningNames, globals), calls };
}
test('contract regression: oversized evaluator evidence is excluded by the response schema', () => {
  const h = meaningHarness([]);
  const quote = 'x'.repeat(241);
  assert.equal(h.filmicMeaningEvidenceMatches({ reelConcept: quote }, 'reelConcept', quote), false);
  assert.equal(accepts(h.filmicMeaningEvaluationSchema, { ...pass, developmentQuote: quote }), false);
});
test('supported minimalist meaning passes; invented and paraphrased evidence stays UNCERTAIN', async () => {
  const h = meaningHarness([pass, { ...pass, developmentQuote: 'Invented emotional transformation' }]);
  assert.equal((await h.evaluateFilmicMeaningCarrier(candidate)).verdict, 'PASS');
  const bad = await h.evaluateFilmicMeaningCarrier(candidate);
  assert.equal(bad.verdict, 'UNCERTAIN');
  assert.equal(bad.__framelabUncertainTrace.category, 'PASS_INTENT_OR_VISUAL_EVIDENCE_INVALID');
});
test('repair comparison passes only with changed exact evidence and resolution of the original gap', async () => {
  const original = structuredClone(candidate);
  original.narrativeArc.stage3 = 'The technician repeats the same inspection without any change in viewing relationship.';
  const initial = { verdict: 'FAIL', reasonCode: 'REPEATED_OBSERVATION_WITHOUT_NEW_FUNCTION',
    carrierPath: 'narrativeArc.stage3', carrierQuote: 'repeats the same inspection' };
  const improved = { ...pass, repairEvidencePath: 'narrativeArc.stage3',
    repairEvidenceQuote: 'A wider held view gives equal space', originalGapResolved: 'yes',
    comparativeReason: 'The old inspection repeats evidence; the wider held framing changes how the same photographs are regarded.' };
  const h = meaningHarness([improved, { ...improved, originalGapResolved: 'no' },
    { ...improved, repairEvidenceQuote: 'repeats the same inspection' }]);
  assert.equal((await h.evaluateFilmicMeaningCarrier(candidate, original, initial)).verdict, 'PASS');
  assert.equal((await h.evaluateFilmicMeaningCarrier(candidate, original, initial)).verdict, 'UNCERTAIN');
  assert.equal((await h.evaluateFilmicMeaningCarrier(candidate, original, initial)).verdict, 'UNCERTAIN');
});
test('request failure, malformed JSON, model uncertainty and input bounds remain fail closed', async () => {
  const h = meaningHarness([new Error('offline transport failure'), '{',
    { ...pass, verdict: 'UNCERTAIN', reasonCode: 'INSUFFICIENT_EVIDENCE' }]);
  const transport = await h.evaluateFilmicMeaningCarrier(candidate);
  assert.equal(transport.verdict, 'UNCERTAIN'); assert.equal(transport.recoveryEligible, false);
  const malformed = await h.evaluateFilmicMeaningCarrier(candidate);
  assert.equal(malformed.verdict, 'UNCERTAIN'); assert.equal(malformed.recoveryEligible, true);
  assert.equal((await h.evaluateFilmicMeaningCarrier(candidate)).verdict, 'UNCERTAIN');
  const large = structuredClone(candidate);
  for (const p of h.FILMIC_MEANING_EVIDENCE_PATHS) {
    const keys = p.split('.'); let obj = large;
    for (const key of keys.slice(0, -1)) obj = obj[key] ||= {};
    obj[keys.at(-1)] = 'z'.repeat(1800);
  }
  const before = h.calls.length;
  const result = await h.evaluateFilmicMeaningCarrier(large, large, { verdict: 'FAIL' });
  assert.equal(result.verdict, 'UNCERTAIN'); assert.equal(result.recoveryEligible, false);
  assert.equal(h.calls.length, before);
});
test('preservation equivalence remains mandatory in all three cores', () => {
  const h = load(['premiumPreservationFieldPaths', 'isResolvedPremiumPreservationField',
    'getEffectivePremiumPreservationFieldStatus', 'getPremiumPreservationCoreStatus',
    'validatePremiumPreservationEvaluation']);
  const payload = { referenceFields: {}, candidateFields: {}, fieldStatuses: {} };
  for (const [core, fields] of Object.entries(h.premiumPreservationFieldPaths)) {
    for (const key of ['referenceFields', 'candidateFields', 'fieldStatuses']) payload[key][core] = {};
    for (const field of fields) {
      payload.referenceFields[core][field] = 'Original functional physical relationship';
      payload.candidateFields[core][field] = 'Preserved functional physical relationship';
      payload.fieldStatuses[core][field] = 'equivalent';
    }
  }
  assert.equal(h.validatePremiumPreservationEvaluation(payload).preservationStatus, 'pass');
  for (const [core, fields] of Object.entries(h.premiumPreservationFieldPaths)) {
    for (const field of fields) {
      const changed = structuredClone(payload);
      changed.fieldStatuses[core][field] = 'not_equivalent';
      assert.equal(h.validatePremiumPreservationEvaluation(changed).preservationStatus, 'fail');
      changed.fieldStatuses[core][field] = 'uncertain';
      assert.equal(h.validatePremiumPreservationEvaluation(changed).preservationStatus, 'uncertain');
    }
  }
});
test('HTTP status mapping preserves 422 for quality failure and 503 for uncertainty', () => {
  const h = load(['makeFilmicQualityError']);
  assert.equal(h.makeFilmicQualityError('CREATIVE_QUALITY_NOT_MET').status, 422);
  assert.equal(h.makeFilmicQualityError('CREATIVE_QUALITY_EVALUATION_UNAVAILABLE').status, 503);
});

function gateHarness({ verdicts, payload, fallback = false, check = {}, preservation = 'pass', gateActive = true, audit = null }) {
  const data = structuredClone(candidate);
  const calls = { evaluator: 0, repair: 0, preservation: 0 };
  const requests = [];
  const logs = [];
  let auditCalls = 0;
  const initialData = JSON.stringify(data);
  const globals = {
    ...validator,
    console: {
      log: (...args) => logs.push(args),
      info: (...args) => logs.push(args),
      error: (...args) => logs.push(args),
    },
    normalizedOutputLanguage: "English",
    useAutonomousNoIntentDirection: false, // This isolated Meaning harness models supplied Intent.
    fullIntentFilmicQualityGateActive: gateActive, data,
    cloneSemanticCandidate: v => structuredClone(v),
    semanticQualityAudit: () => {
      auditCalls++;
      return audit && auditCalls === 1 ? structuredClone(audit) : { passed: true, severity: 0, issues: [] };
    },
    getGenericAudienceEmotionFallbackPositions: v => fallback && JSON.stringify(v) === initialData ? [0] : [],
    evaluateFilmicMeaningCarrier: async () => { calls.evaluator++; return verdicts.shift(); },
    getConceptPreservationFingerprint: () => ({}),
    buildSemanticRepairContext: () => ({}),
    client: { chat: { completions: { create: async (request) => {
      calls.repair++;
      requests.push(request);
      const nextPayload = Array.isArray(payload) ? payload.shift() : payload;
      if (nextPayload instanceof Error) throw nextPayload;
      if (nextPayload && typeof nextPayload === 'object' && Array.isArray(nextPayload.choices)) {
        return nextPayload;
      }
      return { choices: [{ message: { content: typeof nextPayload === 'string' ? nextPayload : JSON.stringify(nextPayload) } }] };
    } } } },
    setPathValue: (obj, p, value) => {
      const keys = p.split('.'); let current = obj;
      for (const key of keys.slice(0, -1)) current = current[key] ||= {};
      current[keys.at(-1)] = value;
    },
    normalizeSemanticRepairCandidate: () => {}, enforceSubjectSafetyForVisualPrompts: () => {},
    syncSemanticAliases: () => {}, getAllowedSemanticMutationPaths: p => p,
    hasOnlyAllowedSemanticChanges: () => check.allowed !== false,
    getActionSemanticFingerprint: () => ({}), preservesActionSemanticFingerprint: () => check.action !== false,
    hasConsistentSemanticAliases: () => check.aliases !== false,
    preservesGeneralConceptFingerprint: () => check.concept !== false,
    originalIssuePathsImproved: () => check.improved !== false,
    hasShiftedSemanticIssue: () => check.shifted === true,
    hasNewSevereSemanticIssues: () => check.severe === true,
    replaceSemanticCandidateContents: (obj, value) => {
      for (const key of Object.keys(obj)) delete obj[key];
      Object.assign(obj, structuredClone(value));
    },
    runPremiumPreservationForCandidate: async () => {
      calls.preservation++;
      return { preservationBlocked: preservation !== 'pass', preservationEvaluation: { preservationStatus: preservation } };
    },
    generatedSnowflakeIdentity: null, applySemanticSnowflakePolish: () => null,
    sanitizeFinalCinematicIdentity: () => {},
    applyMediumBpmCadence: () => {},
  };
  const names = ['FILMIC_MEANING_VISUAL_EVIDENCE_PATHS', 'FILMIC_MEANING_AUDIENCE_EMOTION_PATHS',
    'FILMIC_MEANING_REPAIR_FIELDS', 'makeFilmicQualityError', 'withFilmicMeaningIssue',
    'getIssueRepairFields', 'getAllowedSemanticRepairFields'];
  if (declarations.has('buildSemanticRepairResponseSchema')) names.push('buildSemanticRepairResponseSchema');
  names.push('runSemanticQualityGate');
  return { ...load(names, globals), calls, requests, logs, data, initialData };
}
const failedMeaning = { verdict: 'FAIL', reasonCode: 'MEANING_ONLY_ASSERTED', carrierPath: 'reelConcept', carrierQuote: 'Two unchanged contact prints' };
const goodRepair = { repairs: [repair('narrativeArc.stage3', candidate.narrativeArc.stage3)] };
test('real gate: invalid repair remains HTTP 422 and restores the original candidate', async () => {
  const h = gateHarness({ verdicts: [failedMeaning], payload: { repairs: [] } });
  await assert.rejects(h.runSemanticQualityGate(), e => e.status === 422 && e.code === 'CREATIVE_QUALITY_NOT_MET');
  assert.equal(JSON.stringify(h.data), h.initialData);
  assert.deepEqual(h.calls, { evaluator: 1, repair: 1, preservation: 0 });
});
test('real gate: initial uncertainty recovers at most once then remains HTTP 503', async () => {
  const h = gateHarness({ verdicts: [{ verdict: 'UNCERTAIN', recoveryEligible: true },
    { verdict: 'UNCERTAIN', recoveryEligible: true }] });
  await assert.rejects(h.runSemanticQualityGate(), e => e.status === 503);
  assert.deepEqual(h.calls, { evaluator: 2, repair: 0, preservation: 0 });
});
test('real gate: repair uncertainty recovers at most once; FAIL is 422 and UNCERTAIN is 503', async () => {
  for (const [verdict, status] of [['FAIL', 422], ['UNCERTAIN', 503]]) {
    const h = gateHarness({ verdicts: [failedMeaning,
      { verdict: 'UNCERTAIN', recoveryEligible: true }, { verdict, recoveryEligible: true }], payload: goodRepair });
    await assert.rejects(h.runSemanticQualityGate(), e => e.status === status);
    assert.deepEqual(h.calls, { evaluator: 3, repair: 1, preservation: 0 });
    assert.equal(JSON.stringify(h.data), h.initialData);
  }
});
test('real gate: empty or unparseable repair content gets at most one identical parse retry', async () => {
  for (const firstResponse of ['', '   ', '{']) {
    const h = gateHarness({
      verdicts: [failedMeaning, { verdict: 'PASS' }],
      payload: [firstResponse, goodRepair],
    });
    await h.runSemanticQualityGate();
    assert.equal(h.calls.repair, 2);
    assert.equal(h.requests.length, 2);
    assert.deepEqual(h.requests[1], h.requests[0]);
    assert.equal(h.calls.preservation, 1);
  }
});
test('real gate: repair request stays scoped to failed fields and only full intent gets expanded completion budget', async () => {
  const scopedAudit = { passed: false, severity: 1, issues: [{
    code: 'TEST_SCOPED_REPAIR', severity: 1,
    fields: ['narrativeArc.stage3'], repairFields: ['narrativeArc.stage3'],
  }] };
  const scopedRepair = { repairs: [repair('narrativeArc.stage3', candidate.narrativeArc.stage3)] };

  for (const [gateActive, expectedBudget] of [[true, 9900], [false, undefined]]) {
    const h = gateHarness({
      verdicts: [{ verdict: 'PASS' }, { verdict: 'PASS' }],
      payload: scopedRepair,
      gateActive,
      audit: scopedAudit,
    });
    await h.runSemanticQualityGate();
    assert.equal(h.calls.repair, 1);
    const request = h.requests[0];
    assert.equal(request.max_completion_tokens, expectedBudget);
    const variants = request.response_format.json_schema.schema.properties.repairs.items.anyOf;
    assert.equal(variants.length, 1);
    assert.deepEqual(Array.from(variants[0].properties.path.enum), ['narrativeArc.stage3']);
  }
});
test('real gate: a valid first repair response makes exactly one repair call', async () => {
  const h = gateHarness({
    verdicts: [failedMeaning, { verdict: 'PASS' }],
    payload: goodRepair,
  });
  await h.runSemanticQualityGate();
  assert.equal(h.calls.repair, 1);
  assert.equal(h.calls.preservation, 1);
});
test('real gate: two empty or malformed repair responses preserve the existing fail-closed 503', async () => {
  for (const payload of [['', '{'], ['{', '   ']]) {
    const h = gateHarness({ verdicts: [failedMeaning], payload });
    await assert.rejects(h.runSemanticQualityGate(), e => e.status === 503 && e.code === 'CREATIVE_QUALITY_EVALUATION_UNAVAILABLE');
    assert.equal(h.calls.repair, 2);
    assert.equal(JSON.stringify(h.data), h.initialData);
  }
});
test('real gate: API errors, invalid parsed payloads, quality/meaning rejection and preservation do not trigger parse retry', async () => {
  const apiError = gateHarness({ verdicts: [failedMeaning], payload: new Error('offline simulated transport') });
  await assert.rejects(apiError.runSemanticQualityGate(), e => e.status === 503);
  assert.equal(apiError.calls.repair, 1);

  const invalidPayload = gateHarness({ verdicts: [failedMeaning], payload: { repairs: [] } });
  await assert.rejects(invalidPayload.runSemanticQualityGate(), e => e.status === 422);
  assert.equal(invalidPayload.calls.repair, 1);

  const qualityRejected = gateHarness({ verdicts: [failedMeaning], payload: goodRepair, check: { allowed: false } });
  await assert.rejects(qualityRejected.runSemanticQualityGate(), e => e.status === 422);
  assert.equal(qualityRejected.calls.repair, 1);

  const meaningRejected = gateHarness({ verdicts: [failedMeaning, { verdict: 'FAIL' }], payload: goodRepair });
  await assert.rejects(meaningRejected.runSemanticQualityGate(), e => e.status === 422);
  assert.equal(meaningRejected.calls.repair, 1);

  const preservationFailed = gateHarness({ verdicts: [failedMeaning, { verdict: 'PASS' }], payload: goodRepair, preservation: 'fail' });
  assert.equal((await preservationFailed.runSemanticQualityGate()).preservationBlocked, true);
  assert.equal(preservationFailed.calls.repair, 1);
});
test('real gate: action, concept, aliases, field scope and severe-issue guards still reject repairs', async () => {
  for (const check of [{ allowed: false }, { action: false }, { concept: false },
    { aliases: false }, { improved: false }, { shifted: true }, { severe: true }]) {
    const h = gateHarness({ verdicts: [failedMeaning, { verdict: 'PASS' }], payload: goodRepair, check });
    await assert.rejects(h.runSemanticQualityGate(), e => e.status === 422);
    assert.equal(h.calls.evaluator, 1, 'invalid candidates must never reach the repaired evaluator');
  }
});
test('real gate: generic Audience Emotion fallback triggers repair but does not set the Meaning fatal flag after PASS', async () => {
  const h = gateHarness({ verdicts: [{ verdict: 'PASS' }], payload: { repairs: [] }, fallback: true });
  const result = await h.runSemanticQualityGate();
  assert.equal(result.preservationBlocked, false);
  assert.equal(h.calls.repair, 1);
  assert.equal(h.calls.preservation, 1);
  const meaningFlag = h.logs.find(args => args[0] === '[FRAME-LAB MUST REJECT MEANING]')?.[1];
  assert.equal(meaningFlag?.value, false);
  assert.equal(meaningFlag?.meaningFailed, false);
  assert.equal(meaningFlag?.genericAudienceFallback, true);
  const repairScope = h.logs.find(args => args[0] === '[FRAME-LAB SEMANTIC REPAIR SCOPE]')?.[1];
  assert.equal(repairScope?.triggered, true);
  assert.deepEqual(Array.from(repairScope?.allowedFields || []), ['cinematicIdentity.audienceEmotion']);
});
test('real gate: only an actual Meaning FAIL sets the fatal flag and a failed repair remains fail closed', async () => {
  const h = gateHarness({ verdicts: [failedMeaning], payload: new Error('SCRIPTED_REPAIR_UNAVAILABLE') });
  await assert.rejects(h.runSemanticQualityGate(), e => e.status === 503 && e.code === 'CREATIVE_QUALITY_EVALUATION_UNAVAILABLE');
  assert.equal(h.calls.repair, 1);
  const meaningFlag = h.logs.find(args => args[0] === '[FRAME-LAB MUST REJECT MEANING]')?.[1];
  assert.equal(meaningFlag?.value, true);
  assert.equal(meaningFlag?.meaningFailed, true);
  assert.equal(meaningFlag?.genericAudienceFallback, false);
  const finalDecision = h.logs.find(args => args[0] === '[FRAME-LAB FINAL 503 DECISION]')?.[1];
  assert.equal(finalDecision?.path, 'REPAIR_EXCEPTION_HANDLING');
  assert.equal(finalDecision?.mustRejectUnrepairedMeaning, true);
});
test('real gate: Meaning-PASS audience-only repair provider exception is not classified as unrepaired Meaning', async () => {
  const h = gateHarness({ verdicts: [{ verdict: 'PASS' }], payload: new Error('SCRIPTED_REPAIR_UNAVAILABLE'), fallback: true });
  const result = await h.runSemanticQualityGate();
  assert.equal(result.preservationBlocked, false);
  assert.equal(h.calls.repair, 1);
  assert.equal(h.calls.preservation, 1);
  const meaningFlag = h.logs.find(args => args[0] === '[FRAME-LAB MUST REJECT MEANING]')?.[1];
  assert.equal(meaningFlag?.value, false);
  assert.equal(meaningFlag?.meaningFailed, false);
  assert.equal(meaningFlag?.genericAudienceFallback, true);
  assert.ok(h.logs.some(args => args[0] === '[FRAME-LAB SEMANTIC QUALITY REPAIR ERROR]'));
  assert.ok(!h.logs.some(args => args[0] === '[FRAME-LAB FINAL 503 DECISION]'));
});
test('real gate: passing original and repaired candidates still require premium preservation', async () => {
  for (const preservation of ['pass', 'fail', 'uncertain']) {
    for (const needsRepair of [false, true]) {
      const h = gateHarness({ verdicts: needsRepair ? [failedMeaning, { verdict: 'PASS' }] : [{ verdict: 'PASS' }],
        payload: goodRepair, preservation });
      const result = await h.runSemanticQualityGate();
      assert.equal(result.preservationBlocked, preservation !== 'pass');
      assert.equal(h.calls.preservation, 1);
    }
  }
});
test('real gate: non-full-intent route retains preservation and does not introduce a Meaning call', async () => {
  const h = gateHarness({ verdicts: [], gateActive: false, preservation: 'uncertain' });
  assert.equal((await h.runSemanticQualityGate()).preservationBlocked, true);
  assert.deepEqual(h.calls, { evaluator: 0, repair: 0, preservation: 1 });
});

// Separate structural checker: fail on unsupported/unknown schema keywords,
// missing strict-object requirements, or invalid constraints at any depth.
// This is static validation of the emitted subset, not an API acceptance test.
function assertStrictSchema(schema, root = true) {
  assert.ok(schema && typeof schema === 'object' && !Array.isArray(schema));
  const keywords = new Set(['type', 'properties', 'required', 'additionalProperties',
    'enum', 'items', 'minItems', 'maxItems', 'minLength', 'maxLength', 'pattern', 'anyOf']);
  for (const key of Object.keys(schema)) assert.ok(keywords.has(key), `unsupported keyword: ${key}`);
  if (root) { assert.equal(schema.type, 'object'); assert.equal(schema.anyOf, undefined); }
  if (schema.anyOf) {
    assert.ok(Array.isArray(schema.anyOf) && schema.anyOf.length > 0);
    for (const variant of schema.anyOf) assertStrictSchema(variant, false);
  }
  if (!schema.anyOf || schema.type) assert.ok(['object', 'array', 'string'].includes(schema.type));
  if (schema.type === 'object') {
    assert.equal(schema.additionalProperties, false);
    assert.ok(schema.properties && typeof schema.properties === 'object');
    assert.ok(Array.isArray(schema.required));
    assert.equal(new Set(schema.required).size, schema.required.length);
    assert.deepEqual([...schema.required].sort(), Object.keys(schema.properties).sort());
    for (const value of Object.values(schema.properties)) assertStrictSchema(value, false);
  }
  if (schema.type === 'array') assertStrictSchema(schema.items, false);
  for (const [min, max, type] of [['minItems', 'maxItems', 'array'], ['minLength', 'maxLength', 'string']]) {
    for (const key of [min, max]) {
      if (schema[key] !== undefined) {
        assert.equal(schema.type, type);
        assert.ok(Number.isInteger(schema[key]) && schema[key] >= 0);
      }
    }
    assert.ok((schema[min] || 0) <= (schema[max] ?? Infinity));
  }
  if (schema.enum) {
    assert.equal(schema.type, 'string');
    assert.ok(Array.isArray(schema.enum) && schema.enum.length > 0);
    assert.ok(schema.enum.every(v => typeof v === 'string'));
    assert.equal(new Set(schema.enum).size, schema.enum.length);
  }
}

test('independent static checker rejects malformed strict schemas instead of ignoring keywords', () => {
  const valid = { type: 'object', properties: { text: { type: 'string' } },
    required: ['text'], additionalProperties: false };
  assertStrictSchema(valid);
  for (const invalid of [{ ...valid, required: [] }, { ...valid, additionalProperties: true },
    { ...valid, anyOf: [{ type: 'string' }] }, { ...valid, unknownConstraint: true },
    { ...valid, properties: { text: { type: 'string', minLength: 3, maxLength: 2 } } }]) {
    assert.throws(() => assertStrictSchema(invalid));
  }
});

test('complete actual repair schemas satisfy strict objects, containers and request boundaries', async (t) => {
  if (!declarations.has('buildSemanticRepairResponseSchema')) {
    t.skip('NOT_APPLICABLE: the baseline has no request-specific schema factory');
    return;
  }
  const h = load(['semanticRepairableFields', 'semanticRepairResponseSchema', 'buildSemanticRepairResponseSchema']);
  const baseBefore = JSON.stringify(h.semanticRepairResponseSchema);
  const scopes = [['reelConcept', 'narrativeArc.stage3'], ['cinematicIdentity.audienceEmotion'],
    ['cinematicIdentity.emotionalTone'], ['reelConcept', 'cinematicIdentity.audienceEmotion', 'cinematicIdentity.emotionalTone']];
  for (const scope of scopes) {
    const schema = plain(h.buildSemanticRepairResponseSchema(new Set(scope)));
    assertStrictSchema(schema);
    for (const variant of schema.properties.repairs.items.anyOf) {
      const entry = plain(h.semanticRepairResponseSchema.properties.repairs.items);
      delete entry.properties;
      const rest = { ...variant }; delete rest.properties;
      assert.deepEqual(rest, entry, 'entry inheritance must preserve only the original strict-object requirements');
    }
    for (const p of validator.semanticRepairableFields) {
      const list = p.startsWith('cinematicIdentity.');
      const value = p.endsWith('audienceEmotion') ? emotions : list ? ['Tactile paper', 'Held framing', 'Open comparison'] : 'The contact prints remain physically unchanged.';
      const payload = { repairs: [repair(p, value)] };
      assert.equal(accepts(schema, payload), scope.includes(p));
      if (scope.includes(p)) assert.equal(validator.validateSemanticRepairPayload(payload, new Set(scope)).valid, true);
    }
    for (const p of scope.filter(p => p.startsWith('cinematicIdentity.'))) {
      for (const bad of [repair(p, 'wrong container'), repair(p, ['one', 'two']), repair(p, ['one', '', 'three'])]) {
        assert.equal(accepts(schema, { repairs: [bad] }), false);
      }
    }
    assert.equal(JSON.stringify(h.semanticRepairResponseSchema), baseBefore);
    console.log('STATIC_SCHEMA_SCOPE=' + JSON.stringify({ scope, result: 'PASS', schema }));
  }
  assert.throws(() => h.buildSemanticRepairResponseSchema(new Set()));
  assert.throws(() => h.buildSemanticRepairResponseSchema(new Set(['unknown.field'])));
  for (const [gateCase, expectedFailure] of [
    [{ verdicts: [failedMeaning] }, true],
    [{ verdicts: [{ verdict: 'PASS' }], fallback: true }, false],
    [{ verdicts: [{ ...failedMeaning, carrierPath: 'cinematicIdentity.audienceEmotion.0' }] }, true],
  ]) {
    const gate = gateHarness({ ...gateCase, payload: { repairs: [] } });
    if (expectedFailure) {
      await assert.rejects(gate.runSemanticQualityGate(), e => e.status === 422);
    } else {
      const result = await gate.runSemanticQualityGate();
      assert.equal(result.preservationBlocked, false);
      const meaningFlag = gate.logs.find(args => args[0] === '[FRAME-LAB MUST REJECT MEANING]')?.[1];
      assert.equal(meaningFlag?.value, false);
      assert.equal(gate.calls.preservation, 1);
    }
    assert.equal(gate.requests.length, 1);
    const actualSchema = plain(gate.requests[0].response_format.json_schema.schema);
    assertStrictSchema(actualSchema);
    assert.equal(gate.requests[0].response_format.json_schema.strict, true);
  }
});

test('complete actual Meaning schema satisfies strict structure and retains empty unused evidence fields', async () => {
  const h = meaningHarness([pass]);
  const schema = plain(h.filmicMeaningEvaluationSchema);
  assertStrictSchema(schema);
  assert.equal(accepts(schema, { ...pass, verdict: 'UNCERTAIN', reasonCode: 'INSUFFICIENT_EVIDENCE',
    carrierPath: '', carrierQuote: '', developmentPath: '', developmentQuote: '',
    repairEvidencePath: '', repairEvidenceQuote: '', comparativeReason: '' }), true);
  await h.evaluateFilmicMeaningCarrier(candidate);
  assert.deepEqual(plain(h.calls[0].request.response_format.json_schema.schema), schema);
  assert.equal(h.calls[0].request.response_format.json_schema.strict, true);
  console.log('STATIC_MEANING_SCHEMA=' + JSON.stringify({ result: 'PASS', schema }));
});

const unicodeReasons = [
  ['BMP_700', 'x'.repeat(700), true, true],
  ['BMP_701', 'x'.repeat(701), false, false],
  ['ASTRAL_350_UTF16_700', '😀'.repeat(350), true, true],
  ['ASTRAL_351_UTF16_702', '😀'.repeat(351), true, false],
  ['MIXED_UTF16_700', 'x'.repeat(698) + '😀', true, true],
  ['MIXED_UTF16_701', 'x'.repeat(699) + '😀', true, false],
  ['ASTRAL_700_CODEPOINTS', '😀'.repeat(700), true, false],
  ['ASTRAL_701_CODEPOINTS', '😀'.repeat(701), false, false],
  ['MIXED_700_CODEPOINTS', 'x'.repeat(350) + '😀'.repeat(350), true, false],
  ['MIXED_701_CODEPOINTS', 'x'.repeat(350) + '😀'.repeat(351), false, false],
  ['LOWER_BMP_34', 'x'.repeat(34), true, false],
  ['LOWER_BMP_35', 'x'.repeat(35), true, true],
  ['LOWER_ASTRAL_17_UTF16_34', '😀'.repeat(17), true, false],
  ['LOWER_ASTRAL_18_UTF16_36', '😀'.repeat(18), true, true],
];
test('historical scalar codepoint ceiling cannot exactly preserve the former UTF-16 reason domain', () => {
  const validBMP = 'x'.repeat(700);
  const invalidAstral = '😀'.repeat(351);
  assert.equal(validBMP.length, 700);
  assert.equal(invalidAstral.length, 702);
  // Every maxLength that preserves validBMP is >= 700 and also admits
  // invalidAstral (351 codepoints). A limit of 350 is sufficient but excludes
  // existing valid BMP reasons. The closure changes only the upper local
  // counting unit with explicit Franco product consent; this is historical.
  assert.equal(accepts({ type: 'string', maxLength: 700 }, invalidAstral), true);
  assert.equal(accepts({ type: 'string', maxLength: 350 }, validBMP), false);
});
for (const [name, reason, v3SchemaExpected, baselineLocalExpected] of unicodeReasons) {
  test('Unicode comparativeReason boundary: ' + name, async () => {
    const original = structuredClone(candidate);
    original.narrativeArc.stage3 = 'The technician repeats the same inspection without any change in viewing relationship.';
    const initial = { verdict: 'FAIL', reasonCode: 'REPEATED_OBSERVATION_WITHOUT_NEW_FUNCTION',
      carrierPath: 'narrativeArc.stage3', carrierQuote: 'repeats the same inspection' };
    const response = { ...pass, originalGapResolved: 'yes', comparativeReason: reason,
      repairEvidencePath: 'narrativeArc.stage3', repairEvidenceQuote: 'A wider held view gives equal space' };
    const h = meaningHarness([response]);
    const schemaAccepts = accepts(h.filmicMeaningEvaluationSchema, response);
    const localAccepts = (await h.evaluateFilmicMeaningCarrier(candidate, original, initial)).verdict === 'PASS';
    const baseline = !declarations.has('buildSemanticRepairResponseSchema');
    const codepointUpperBound = source.includes('Array.from(response.comparativeReason).length > 700');
    const localExpected = codepointUpperBound
      ? reason.trim().length >= 35 && [...reason].length <= 700
      : baselineLocalExpected;
    assert.equal(schemaAccepts, baseline ? true : v3SchemaExpected);
    assert.equal(localAccepts, localExpected);
    console.log('UNICODE_BOUNDARY=' + JSON.stringify({ TEST_NAME: name,
      UNICODE_CODEPOINT_LENGTH: [...reason].length, UTF16_CODEUNIT_LENGTH: reason.length,
      SCHEMA_ACCEPTS: schemaAccepts, LOCAL_VALIDATOR_ACCEPTS: localAccepts,
      EXPECTED_BEHAVIOR: localExpected
        ? baselineLocalExpected ? 'ACCEPT_WITHIN_PREVIOUS_DOMAIN' : 'ACCEPT_EXPLICITLY_APPROVED_CODEPOINT_EXPANSION'
        : schemaAccepts ? 'LOCAL_REJECTS_LOWER_BOUND_OR_BASELINE_UPPER_BOUND' : 'REJECT_OVER_LIMIT', RESULT: 'PASS' }));
  });
}
for (const [name, quote, schemaExpected, localExpected] of [
  ['QUOTE_BMP_120', 'x'.repeat(120), true, true],
  ['QUOTE_ASTRAL_120_UTF16_240', '😀'.repeat(120), true, true],
  ['QUOTE_ASTRAL_121_UTF16_242', '😀'.repeat(121), false, false],
  ['QUOTE_BMP_121', 'x'.repeat(121), false, true],
  ['QUOTE_BMP_241', 'x'.repeat(241), false, false],
  ['QUOTE_TOO_SHORT', 'x'.repeat(11), true, false],
  ['QUOTE_NOT_LITERAL', 'not present in original', true, false],
]) {
  test('Unicode Evidence boundary: ' + name, () => {
    const h = meaningHarness([]);
    const schemaAccepts = accepts(h.filmicMeaningEvaluationSchema, { ...pass, carrierQuote: quote });
    const fields = { reelConcept: name === 'QUOTE_NOT_LITERAL' ? 'Different literal original wording.' : quote };
    const localAccepts = h.filmicMeaningEvidenceMatches(fields, 'reelConcept', quote);
    assert.equal(schemaAccepts, declarations.has('buildSemanticRepairResponseSchema') ? schemaExpected : true);
    assert.equal(localAccepts, localExpected);
    assert.equal(h.filmicMeaningEvidenceMatches(fields, 'unapproved.path', quote), false);
    console.log('UNICODE_BOUNDARY=' + JSON.stringify({ TEST_NAME: name,
      UNICODE_CODEPOINT_LENGTH: [...quote].length, UTF16_CODEUNIT_LENGTH: quote.length,
      SCHEMA_ACCEPTS: schemaAccepts, LOCAL_VALIDATOR_ACCEPTS: localAccepts,
      EXPECTED_BEHAVIOR: localExpected ? 'LOCAL_ACCEPTS_EXACT_EVIDENCE_WITHIN_EXISTING_LIMIT' : 'LOCAL_REJECTS_INVALID_EVIDENCE',
      RESULT: 'PASS' }));
  });
}

test('primary generate output contract defines Main and Instagram captions separately', () => {
  const captionsContract = source.match(/"captions": \{\s*([\s\S]*?)\n  \},/);
  assert.ok(captionsContract, 'primary caption output contract must exist');
  const keys = [...captionsContract[1].matchAll(/"([^"]+)": ""/g)].map((match) => match[1]);
  assert.ok(keys.includes('mainCaption'), 'primary output contract must include mainCaption');
  assert.ok(keys.includes('instagramCaption'), 'Instagram caption contract must remain');
  assert.notEqual(keys.indexOf('mainCaption'), keys.indexOf('instagramCaption'), 'Main and Instagram must be separate keys');

  const uiSource = fs.readFileSync(path.join(__dirname, '../pages/index.js'), 'utf8');
  assert.match(uiSource, /caption:\s*data\.captions\?\.mainCaption/,
    'downstream UI must continue to prefer mainCaption');
  assert.match(source, /if \(!creativeCandidatePolicy\.allowTemplateFallback\) return cleaned;/,
    'Main Caption guard must remain');
  assert.match(source, /pattern: "\^\\\\s\*\\\\S\+\(\?:\\\\s\+\\\\S\+\)\{7,\}\\\\s\*\$"/,
    'Audience Emotion repair pattern must remain');
});

test('final caption grammar polish corrects observed singular agreement without rewriting roles', () => {
  const h = load(['polishMusicFacingGrammar'], { artistName: 'FrameLab Test Artist' });
  const captions = {
    mainCaption: "The ceiling rise as the bowl's water holds steady.",
    instagramCaption: 'A single circle on fogged glass slowly disappear.',
    tiktokCaption: 'Water gather and rest untouched beneath a patient hand.',
    shortsCaption: 'One quiet hand stays beside the bowl.',
  };

  const polished = Object.fromEntries(
    Object.entries(captions).map(([field, value]) => [field, h.polishMusicFacingGrammar(value)])
  );

  assert.deepEqual(polished, {
    mainCaption: "The ceiling rises as the bowl's water holds steady.",
    instagramCaption: 'A single circle on fogged glass slowly disappears.',
    tiktokCaption: 'Water gathers and rests untouched beneath a patient hand.',
    shortsCaption: 'One quiet hand stays beside the bowl.',
  });
  assert.equal(new Set(Object.values(polished)).size, 4,
    'platform-specific captions must remain separate');
  assert.equal(
    h.polishMusicFacingGrammar('The circles disappear while loose fragments gather.'),
    'The circles disappear while loose fragments gather.',
    'plural subjects and already-correct wording must remain unchanged'
  );
  assert.equal(
    h.polishMusicFacingGrammar('Condensation fades on one pane, while fog holds its place outside.'),
    'Condensation fades on one pane, while fog holds its place outside.',
    'already-correct singular mass-noun agreement must remain unchanged'
  );
  assert.equal(
    h.polishMusicFacingGrammar('Loose droplets fade as condensation settles.'),
    'Loose droplets fade as condensation settles.',
    'plural subjects must not be changed by the narrow condensation rule'
  );
  assert.equal(
    h.polishMusicFacingGrammar('Does the ceiling rises?'),
    'Does the ceiling rise?',
    'the existing grammar helper must retain base-verb agreement after does/did'
  );
});

test('final short-form surface corrects observed grammar and local naturalness across captions and hooks', () => {
  const h = load([
    'polishMusicFacingGrammar',
    'polishShortFormLanguage',
    'cleanCaptionOpeningText',
    'cleanHookText',
    'polishFinalShortFormSurface',
  ], { artistName: 'FrameLab Test Artist' });

  const packageCandidate = {
    captions: {
      mainCaption: "The ceiling rise as the bowl's water holds steady.",
      instagramCaption: 'A single circle on fogged glass slowly disappear.',
      tiktokCaption: 'Condensation fade on one pane, while fog holds its place outside.',
      shortsCaption: 'One mark holds ink sharp under glass weight.',
    },
    hooks: {
      hook: 'A single drop transform paper without spectacle.',
      curiosityHook: 'Which quiet detail remains?',
      emotionalHook: 'A gentle pause leaves room for warmth.',
      viralHook: 'One blue line stays on the page.',
    },
  };

  h.polishFinalShortFormSurface(packageCandidate);
  assert.deepEqual(plain(packageCandidate), {
    captions: {
      mainCaption: "The ceiling rises as the bowl's water holds steady.",
      instagramCaption: 'A single circle on fogged glass slowly disappears.',
      tiktokCaption: 'Condensation fades on one pane, while fog holds its place outside.',
      shortsCaption: 'One mark keeps the ink sharp beneath the weight of the glass.',
    },
    hooks: {
      hook: 'A single drop transforms paper without spectacle.',
      curiosityHook: 'Which quiet detail remains?',
      emotionalHook: 'A gentle pause leaves room for warmth.',
      viralHook: 'One blue line stays on the page.',
    },
  });

  const correctCandidate = {
    captions: {
      mainCaption: 'She folds the blue paper slowly.',
      instagramCaption: 'Blue ink pools along the seam.',
      tiktokCaption: 'A thin ring rests beside the bowl.',
      shortsCaption: 'The frame stays open.',
    },
    hooks: {
      hook: 'The color waits at the threshold.',
      curiosityHook: 'Which shadow reaches the edge?',
      emotionalHook: 'A quiet warmth remains.',
      viralHook: 'One blue line holds.',
    },
  };
  const unchanged = plain(correctCandidate);
  h.polishFinalShortFormSurface(correctCandidate);
  assert.deepEqual(plain(correctCandidate), unchanged,
    'already-correct short-form copy must remain unchanged');
  assert.equal(new Set(Object.values(correctCandidate.captions)).size, 4,
    'platform caption roles must remain distinct');
  assert.equal(new Set(Object.values(correctCandidate.hooks)).size, 4,
    'hook roles must remain distinct');
  assert.match(packageCandidate.hooks.hook, /without spectacle/,
    'grammar correction must not add stakes or change intent');
});

test('short-form language correction is included before final gates and after accepted field repairs', () => {
  assert.match(source, /polishFinalShortFormSurface\(data\);\s*const semanticQualityGateResult\s*=\s*await runSemanticQualityGate\(\);/,
    'the complete output surface must be polished before existing final gates');
  assert.match(source, /"hooks\.viralHook"[\s\S]*?cleanHookText\(String\(value \|\| ""\)\)/,
    'accepted hook repairs must receive the same existing hook cleaning and grammar protection');
  assert.match(source, /polishShortFormLanguage\(\s*cleanCaptionOpeningText\(String\(value \|\| ""\)\)\s*\)/,
    'accepted caption repairs must receive the short-form naturalness correction');
});

const archetypeFallbackNames = [
  'genericCreativeArchetypeAnchorWords',
  'normalizeCreativeIdentityWord',
  'toTitleWord',
  'getCreativeArchetypeProjectWordSet',
  'extractCreativeArchetypeWords',
  'getCreativeArchetypeSourceText',
  'getCreativeArchetypeAnchorWords',
  'p1AnchorRoleStopWords',
  'p1VerbOrAdverbFragments',
  'isP1TypedAnchorWord',
  'getP1IdentityFieldWordSet',
  'getP1AnchorWords',
  'getP1ConceptAnchorWords',
  'creativeArchetypeMechanismLabels',
  'creativeArchetypeMechanismSynonyms',
  'getCreativeArchetypeMechanismLabel',
  'creativeArchetypeBehaviorPatterns',
  'creativeArchetypeFamilyBehaviorLabels',
  'getCreativeArchetypeBehaviorLabel',
  'buildIdentityFallback',
];
function buildArchetypeFallback(concept, family = null, options = {}) {
  const helpers = load(archetypeFallbackNames, {
    artistName: '',
    trackName: '',
    data: {
      reelConcept: '',
      concept: '',
      thumbnailConcept: '',
      directorSummary: '',
      narrativeArc: { stage3: '' },
      cinematicIdentity: {
        projectCodename: options.projectCodename || '',
        visualDNA: options.visualDNA || [],
      },
    },
    selectedConceptDNA: '',
    selectedMusicFacingCreativeThesis: {
      isActive: Boolean(family),
      primaryIdeaFamily: family,
    },
    containsForbiddenTerm: () => false,
    containsForbiddenRoleTerm: () => false,
  });
  return helpers.buildIdentityFallback(
    concept,
    options.mechanismOverride || '',
    options.projectCodename || ''
  );
}

test('archetype fallback uses an independent concept anchor and a readable relation', () => {
  const location = buildArchetypeFallback(
    'The laundromat clock pauses at midnight as washers turn beneath fogged glass.',
    'observation_discovery',
    { visualDNA: ['fogged glass'] }
  );
  assert.equal(location, 'Progressive Discovery through Glass');
  assert.doesNotMatch(location, /laundromat|clock|pauses|washers/i);

  const action = buildArchetypeFallback(
    'The ceramicist steadies a blue bowl beside the kiln as the wheel slows.',
    'performer_action',
    { visualDNA: ['blue ceramic glaze'] }
  );
  assert.equal(action, 'Gesture Progression through the Glaze');
  assert.doesNotMatch(action, /ceramicist|steadies|kiln/i);
});

test('quiet and surreal archetype fallbacks use the selected governing mechanism without adding mythology', () => {
  const quiet = buildArchetypeFallback(
    'A curtain rests in still air beside a glass of rainwater.',
    'nature_scale_relation',
    { visualDNA: ['still rainwater'] }
  );
  assert.equal(quiet, 'Scale Orientation through Rainwater');
  assert.doesNotMatch(quiet, /myth|cosmos|destiny|legend|prophecy/i);

  const surreal = buildArchetypeFallback(
    'A corridor reflects itself above a suspended floor while the moon remains indoors.',
    'spatial_installation',
    { visualDNA: ['suspended geometry'] }
  );
  assert.equal(surreal, 'Spatial Access through the Geometry');
  assert.doesNotMatch(surreal, /explained|mirror trick|gravity/i);
});

test('archetype fallback avoids codename overlap and does not make a noun stack', () => {
  const archetype = buildArchetypeFallback(
    'A dancer tilts a bowl and its impossible reflection travels across the ceiling.',
    'spatial_installation',
    {
      projectCodename: 'Threshold Reverberation',
      visualDNA: ['impossible ceiling reflection'],
    }
  );

  assert.equal(archetype, 'Spatial Access through Reflection');
  assert.doesNotMatch(archetype, /threshold|reverberation/i);
  assert.match(archetype, /\bthrough\b/);
  assert.equal(archetype.split(/\s+/).length <= 5, true);
});

test('archetype fallback uses a grammatical existing mechanism when no specific family exists', () => {
  assert.equal(
    buildArchetypeFallback('The laundromat clock beneath fogged glass.', null, {
      projectCodename: 'Laundromat',
      visualDNA: ['fogged glass'],
    }),
    'Visible Progression through Glass'
  );
});

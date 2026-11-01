const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { parse } = require('@babel/parser');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const endpoint = read('pages/api/generate-blueprint.js');
const page = read('pages/videos.js');
const parsedEndpoint = parse(endpoint, { sourceType: 'module' });
const parsedPage = parse(page, { sourceType: 'module', plugins: ['jsx'] });

function findDeclaration(ast, type, name) {
  let found = null;
  const visit = (node) => {
    if (!node || typeof node !== 'object' || found) return;
    if (node.type === 'ExportNamedDeclaration' && node.declaration) visit(node.declaration);
    if (type === 'FunctionDeclaration' && node.type === type && node.id?.name === name) {
      found = node;
      return;
    }
    if (type === 'VariableDeclaration' && node.type === type && node.declarations.some((entry) => entry.id?.name === name)) {
      found = node;
      return;
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === 'object') visit(value);
    }
  };
  visit(ast.program);
  return found;
}

const validatorNode = findDeclaration(parsedEndpoint, 'FunctionDeclaration', 'validateBlueprintOutput');
const validationFailureNode = findDeclaration(parsedEndpoint, 'FunctionDeclaration', 'getBlueprintOutputValidationFailure');
const shotFieldsNode = findDeclaration(parsedEndpoint, 'VariableDeclaration', 'SHOT_FIELDS');
const textSchemaNode = findDeclaration(parsedEndpoint, 'VariableDeclaration', 'textSchema');
const shotSchemaNode = findDeclaration(parsedEndpoint, 'VariableDeclaration', 'shotSchema');
const blueprintSchemaNode = findDeclaration(parsedEndpoint, 'VariableDeclaration', 'blueprintOutputSchema');
const validatorSource = endpoint.slice(validatorNode.start, validatorNode.end);
const validationFailureSource = endpoint.slice(validationFailureNode.start, validationFailureNode.end);
const shotFieldsSource = endpoint.slice(shotFieldsNode.start, shotFieldsNode.end);
const validationFunctions = vm.runInNewContext(
  `${shotFieldsSource}\n${validationFailureSource}\n${validatorSource}\n({ getBlueprintOutputValidationFailure, validateBlueprintOutput })`,
  { Number, Array, Object }
);
const { getBlueprintOutputValidationFailure, validateBlueprintOutput } = validationFunctions;
const blueprintSchema = vm.runInNewContext(
  [shotFieldsNode, textSchemaNode, shotSchemaNode, blueprintSchemaNode]
    .map((node) => endpoint.slice(node.start, node.end))
    .join('\n') + '\nblueprintOutputSchema',
  { Object }
);
const imageValidatorNode = findDeclaration(parsedEndpoint, 'FunctionDeclaration', 'validateVisualReferenceDataUrl');
const imageLimitNode = findDeclaration(parsedEndpoint, 'VariableDeclaration', 'MAX_VISUAL_REFERENCE_BYTES');
const imageMimeNode = findDeclaration(parsedEndpoint, 'VariableDeclaration', 'VISUAL_REFERENCE_MIME_TYPES');
const validateVisualReferenceDataUrl = vm.runInNewContext(
  `${endpoint.slice(imageLimitNode.start, imageLimitNode.end)}\n${endpoint.slice(imageMimeNode.start, imageMimeNode.end)}\n${endpoint.slice(imageValidatorNode.start, imageValidatorNode.end)}\nvalidateVisualReferenceDataUrl`,
  { Buffer, Set }
);

function validBlueprint() {
  return {
    directorSummary: 'A concise director summary.',
    governingIdea: 'A project-specific visual rule.',
    shots: Array.from({ length: 6 }, (_, index) => ({
      title: `Shot ${index + 1}`,
      sequenceRole: `Beat ${index + 1}`,
      visibleAction: `A visible action ${index + 1}.`,
      causalLink: index ? `This follows beat ${index}.` : 'The initiating condition is visible.',
      emotion: 'Contained attention.',
      camera: 'A measured close frame.',
      motion: 'The camera advances with the hand.',
      lens: 'A 50 mm lens.',
      lighting: 'Warm practical light.',
      directorDecision: 'Stay close because the change begins at the fingertips.',
      videoPrompt: 'Film the visible action in one controlled shot.',
    })),
    hook: 'The hinge gives way before the door moves.',
    voiceover: 'A short, restrained line.',
    musicDirection: { direction: 'Unhurried low strings.', bpm: null },
    caption: 'The room changes by one quiet degree.',
  };
}

test('blueprint endpoint uses exactly one bounded structured call with zero retries and no repair stage', () => {
  assert.equal((endpoint.match(/client\.chat\.completions\.create\(/g) || []).length, 1);
  assert.match(endpoint, /model:\s*MODEL/);
  assert.match(endpoint, /const MODEL = "gpt-6-luna"/);
  assert.match(endpoint, /reasoning_effort:\s*"low"/);
  assert.match(endpoint, /maxRetries:\s*0/);
  assert.match(endpoint, /response_format:\s*\{\s*type:\s*"json_schema"/);
  assert.doesNotMatch(endpoint, /repairCompletion|retryCompletion|buildCinematicPrompt|generateShotSequence/i);
  assert.match(endpoint, /No fallback blueprint was returned/);
});

test('the request contains only actual vision, mode, language, and present reference analysis/type', () => {
  for (const field of ['vision', 'directorMode', 'outputLanguage']) {
    assert.match(endpoint, new RegExp(`${field}: input\\.${field}`));
  }
  assert.match(endpoint, /audioReferenceAnalysis/);
  assert.match(endpoint, /visualReferenceType/);
  assert.match(endpoint, /isSupportedLanguage\(outputLanguage\)/);
  assert.match(endpoint, /every user-facing creative field in \$\{languageName\}/i);
  assert.match(endpoint, /no image pixels were supplied\. Do not claim to have seen image details/);
  assert.match(endpoint, /No audio reference or BPM was supplied/);
  for (const language of ['English', 'Deutsch', 'Español', 'Français', 'Italiano', 'Português', '中文']) {
    assert.ok(endpoint.includes(`${language}:`), `missing supported language ${language}`);
  }
});

test('visual pixels travel in the same single multimodal call while no-image and type-only paths stay truthful', () => {
  assert.match(endpoint, /bodyParser:\s*\{\s*sizeLimit:\s*"4mb"/);
  assert.match(endpoint, /visualReferenceImageDataUrl/);
  assert.match(endpoint, /type:\s*"image_url"/);
  assert.match(endpoint, /image_url:\s*\{\s*url:\s*input\.visualReferenceImage\.dataUrl/);
  assert.match(endpoint, /MAX_VISUAL_REFERENCE_BYTES\s*=\s*2\s*\*\s*1024\s*\*\s*1024/);
  assert.match(endpoint, /visualReferenceTransport:\s*input\.visualReferenceImage\s*\?\s*"pixels_received"\s*:\s*input\.visualReferenceType\s*\?\s*"type_only"\s*:\s*"none"/);
  assert.match(page, /visualReferenceTransport === "pixels_received"/);
  assert.match(page, /pixelsTransmitted:/);
  assert.match(page, /expanded_prompt:\s*expandedPrompt/);
  const formatNode = findDeclaration(parsedPage, 'FunctionDeclaration', 'formatStructuredBlueprint');
  const formatter = vm.runInNewContext(`(${page.slice(formatNode.start, formatNode.end)})`);
  const output = validBlueprint();
  const noPixels = formatter(output, 'Vision', 'Mode', 'mood', 'Deutsch', false);
  const withPixels = formatter(output, 'Vision', 'Mode', 'mood', 'Deutsch', true);
  assert.match(noPixels, /Übermittelt wurde nur der Referenztyp, nicht die Bildpixel/);
  assert.match(withPixels, /Bilddaten wurden in diese Blueprint-Anfrage übermittelt/);
  assert.doesNotMatch(withPixels, /haben die Regieentscheidungen beeinflusst|prägt die Shots/);
  assert.doesNotMatch(formatter(output, 'Vision', 'Mode', null, 'Deutsch'), /ART DER VISUELLEN REFERENZ|Bilddaten wurden/);
  assert.equal((endpoint.match(/client\.chat\.completions\.create\(/g) || []).length, 1);
  assert.match(endpoint, /maxRetries:\s*0/);
});

test('visual data URL validation enforces JPEG, PNG and WEBP signatures and the 2 MiB bound', () => {
  const dataUrl = (mime, bytes) => `data:${mime};base64,${bytes.toString('base64')}`;
  const png = Buffer.alloc(24);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(png, 0);
  png.write('IHDR', 12, 'ascii');
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
  const webp = Buffer.from('RIFF0000WEBP');
  for (const [mime, bytes] of [['image/png', png], ['image/jpeg', jpeg], ['image/webp', webp]]) {
    assert.ok(validateVisualReferenceDataUrl(dataUrl(mime, bytes)).value, `${mime} should pass`);
  }
  assert.match(validateVisualReferenceDataUrl(dataUrl('image/png', jpeg)).error, /does not match/);
  assert.match(validateVisualReferenceDataUrl('data:image/gif;base64,R0lGODlh').error, /JPEG, PNG, or WEBP/);
  assert.match(validateVisualReferenceDataUrl('data:image/png;base64,not base64').error, /JPEG, PNG, or WEBP|malformed/);
  const tooLargeJpeg = Buffer.alloc(2 * 1024 * 1024 + 1);
  tooLargeJpeg[0] = 0xff; tooLargeJpeg[1] = 0xd8; tooLargeJpeg[2] = 0xff;
  tooLargeJpeg[tooLargeJpeg.length - 2] = 0xff; tooLargeJpeg[tooLargeJpeg.length - 1] = 0xd9;
  assert.match(validateVisualReferenceDataUrl(dataUrl('image/jpeg', tooLargeJpeg)).error, /2 MiB/);
  assert.match(endpoint, /if \(parsed\.error\) return res\.status\(400\)/);
  assert.ok(endpoint.indexOf('if (parsed.error) return res.status(400)') < endpoint.indexOf('new OpenAI('), 'invalid images must fail before model creation');
  assert.match(endpoint, /visualReferenceImage\s*\?\s*\[/);
  assert.doesNotMatch(endpoint, /local template fallback/i);
});

test('all seven localized Blueprint image-size messages state the 2 MiB transport limit', () => {
  const languages = read('data/languages.js');
  const messages = [...languages.matchAll(/"imageTooLarge":\s*"([^"]+)"/g)].map((match) => match[1]);
  assert.equal(messages.length, 7);
  assert.ok(messages.every((message) => /2\s*(?:MiB|Mio)/i.test(message)));
  assert.match(page, /file\.size > 2 \* 1024 \* 1024/);
  assert.match(page, /\["image\/jpeg", "image\/png", "image\/webp"\]/);
  assert.match(page, /accept="image\/jpeg,image\/png,image\/webp"/);
});

test('structured output requires a governing idea, assets, and all per-shot fields', () => {
  assert.match(endpoint, /"governingIdea"/);
  assert.match(endpoint, /"causalLink"/);
  for (const field of ['directorSummary', 'shots', 'hook', 'voiceover', 'musicDirection', 'caption']) {
    assert.ok(endpoint.includes(`"${field}"`), `missing field ${field}`);
  }
  for (const field of ['title', 'sequenceRole', 'visibleAction', 'causalLink', 'emotion', 'camera', 'motion', 'lens', 'lighting', 'directorDecision', 'videoPrompt']) {
    assert.ok(endpoint.includes(`"${field}"`), `missing shot field ${field}`);
  }
  assert.match(endpoint, /exactly six connected shots/i);
  assert.match(endpoint, /do not impose a fixed Establishing\/Subject\/Detail\/Hero\/Motion\/Final template/i);
});

test('structured output requires non-whitespace content for every blueprint text field', () => {
  assert.match(endpoint, /voiceover field is required/i);
  assert.match(endpoint, /requested output language/i);
  assert.match(endpoint, /if the concept intentionally uses no spoken narration/i);
  const textSchemas = [
    blueprintSchema.properties.directorSummary,
    blueprintSchema.properties.governingIdea,
    blueprintSchema.properties.hook,
    blueprintSchema.properties.voiceover,
    blueprintSchema.properties.musicDirection.properties.direction,
    blueprintSchema.properties.caption,
    ...Object.values(blueprintSchema.properties.shots.items.properties),
  ];
  assert.equal(textSchemas.length, 6 + Object.keys(blueprintSchema.properties.shots.items.properties).length);
  for (const schema of textSchemas) {
    assert.deepEqual(Object.keys(schema).sort(), ['pattern', 'type']);
    assert.equal(schema.type, 'string');
    assert.equal(schema.pattern, '\\S');
  }
  const nonWhitespaceValue = new RegExp(blueprintSchema.properties.voiceover.pattern);
  assert.equal(nonWhitespaceValue.test(''), false);
  assert.equal(nonWhitespaceValue.test('   \n\t'), false);
  assert.equal(nonWhitespaceValue.test('A concise spoken line.'), true);
});

test('local validation accepts exactly six complete shots and rejects missing fields or wrong shot counts', () => {
  const output = validBlueprint();
  assert.equal(validateBlueprintOutput(output), true);
  assert.equal(validateBlueprintOutput({ ...output, shots: output.shots.slice(0, 5) }), false);
  const missingCause = validBlueprint();
  delete missingCause.shots[2].causalLink;
  assert.equal(validateBlueprintOutput(missingCause), false);
  const missingIdea = validBlueprint();
  missingIdea.governingIdea = '';
  assert.equal(validateBlueprintOutput(missingIdea), false);
  const missingCaption = validBlueprint();
  missingCaption.caption = '';
  assert.equal(validateBlueprintOutput(missingCaption), false);
});

test('exposes stable technical validation reason codes while preserving boolean validation', () => {
  const valid = validBlueprint();
  assert.equal(getBlueprintOutputValidationFailure(valid), null);
  assert.equal(validateBlueprintOutput(valid), true);

  const invalidObject = getBlueprintOutputValidationFailure(null);
  assert.equal(invalidObject.code, 'INVALID_OUTPUT_TYPE');
  assert.equal(validateBlueprintOutput(null), false);

  const missingRequired = validBlueprint();
  missingRequired.governingIdea = '';
  const requiredFailure = getBlueprintOutputValidationFailure(missingRequired);
  assert.equal(requiredFailure.code, 'MISSING_OR_EMPTY_REQUIRED_TEXT');
  assert.equal(requiredFailure.field, 'governingIdea');
  assert.equal(validateBlueprintOutput(missingRequired), false);

  const emptyVoiceover = validBlueprint();
  emptyVoiceover.voiceover = '  \n ';
  const voiceoverFailure = getBlueprintOutputValidationFailure(emptyVoiceover);
  assert.equal(voiceoverFailure.code, 'MISSING_OR_EMPTY_REQUIRED_TEXT');
  assert.equal(voiceoverFailure.field, 'voiceover');
  assert.equal(validateBlueprintOutput(emptyVoiceover), false);

  const missingDirection = validBlueprint();
  missingDirection.musicDirection.direction = '';
  assert.equal(getBlueprintOutputValidationFailure(missingDirection).code, 'MISSING_OR_EMPTY_MUSIC_DIRECTION');

  const invalidBpmType = validBlueprint();
  invalidBpmType.musicDirection.bpm = '94';
  assert.equal(getBlueprintOutputValidationFailure(invalidBpmType).code, 'INVALID_MUSIC_BPM_TYPE');

  const unsupportedBpm = validBlueprint();
  unsupportedBpm.musicDirection.bpm = 94;
  assert.equal(getBlueprintOutputValidationFailure(unsupportedBpm, { supportedBpm: 95 }).code, 'UNSUPPORTED_MUSIC_BPM_VALUE');

  const invalidShots = validBlueprint();
  invalidShots.shots = null;
  assert.equal(getBlueprintOutputValidationFailure(invalidShots).code, 'INVALID_SHOTS_ARRAY');
  assert.equal(getBlueprintOutputValidationFailure({ ...valid, shots: valid.shots.slice(0, 5) }).code, 'INCORRECT_SHOT_COUNT');

  const invalidShot = validBlueprint();
  invalidShot.shots[2] = null;
  const shotObjectFailure = getBlueprintOutputValidationFailure(invalidShot);
  assert.equal(shotObjectFailure.code, 'INVALID_SHOT_OBJECT');
  assert.equal(shotObjectFailure.shotIndex, 2);

  const missingShotField = validBlueprint();
  delete missingShotField.shots[2].causalLink;
  const shotFieldFailure = getBlueprintOutputValidationFailure(missingShotField);
  assert.equal(shotFieldFailure.code, 'MISSING_OR_EMPTY_SHOT_FIELD');
  assert.equal(shotFieldFailure.field, 'causalLink');
  assert.equal(shotFieldFailure.shotIndex, 2);

  const unsupportedClaim = validBlueprint();
  unsupportedClaim.musicDirection.direction = 'Measured pulse at 82 BPM.';
  assert.equal(getBlueprintOutputValidationFailure(unsupportedClaim).code, 'UNSUPPORTED_BPM_CLAIM');

  const legacyBrand = validBlueprint();
  legacyBrand.governingIdea = 'FrameLab defines the visual rule.';
  assert.equal(getBlueprintOutputValidationFailure(legacyBrand).code, 'FORBIDDEN_LEGACY_BRAND_REFERENCE');
});

test('endpoint keeps the existing fail-closed response and exposes only structured validation diagnostics', () => {
  assert.match(endpoint, /console\.warn\("PREMIVATE BLUEPRINT OUTPUT REJECTED", validationFailure\.code\)/);
  assert.match(endpoint, /res\.status\(502\)\.json\(\{\s*error: "Blueprint generation returned an incomplete or unsupported result\.",\s*validation: validationFailure/);
  assert.match(endpoint, /model:\s*MODEL/);
  assert.match(endpoint, /maxRetries:\s*0/);
});

test('unsupported BPM claims are rejected while a source-supported BPM can be returned', () => {
  const unsupported = validBlueprint();
  unsupported.musicDirection.direction = 'Dark ambient at 82 BPM.';
  assert.equal(validateBlueprintOutput(unsupported), false);
  const supported = validBlueprint();
  supported.musicDirection.bpm = 94;
  supported.musicDirection.direction = 'Measured electronic pulse at 94 BPM.';
  assert.equal(validateBlueprintOutput(supported, { supportedBpm: 94 }), true);
  supported.musicDirection.bpm = 95;
  assert.equal(validateBlueprintOutput(supported, { supportedBpm: 94 }), false);
});

test('PREMIVATE branding is local and active FrameLab branding is rejected', () => {
  const output = validBlueprint();
  output.governingIdea = 'FrameLab presents a visual rule.';
  assert.equal(validateBlueprintOutput(output), false);
  const formatNode = findDeclaration(parsedPage, 'FunctionDeclaration', 'formatStructuredBlueprint');
  const formatter = page.slice(formatNode.start, formatNode.end);
  assert.match(formatter, /PREMIVATE CINEMATIC BLUEPRINT/);
  assert.match(formatter, /END OF PREMIVATE CINEMATIC BLUEPRINT/);
  assert.doesNotMatch(formatter, /FRAME-LAB|FRAMELAB|FrameLab/);
});

test('provider, refusal, parsing, and structure failures return errors without a template fallback', () => {
  assert.match(endpoint, /choice\?\.message\?\.refusal/);
  assert.match(endpoint, /choice\?\.finish_reason !== "stop"/);
  assert.match(endpoint, /JSON\.parse\(content\)/);
  assert.match(endpoint, /const validationFailure = getBlueprintOutputValidationFailure\(output, \{\s*supportedBpm: input\.supportedBpm,\s*\}\);\s*if \(validationFailure\) \{\s*console\.warn\("PREMIVATE BLUEPRINT OUTPUT REJECTED", validationFailure\.code\);\s*return res\.status\(502\)\.json\(\{\s*error: "Blueprint generation returned an incomplete or unsupported result\.",\s*validation: validationFailure,\s*\}\);\s*\}/);
  assert.match(endpoint, /Blueprint generation failed\. No fallback blueprint was returned\./);
  assert.doesNotMatch(endpoint, /buildCinematicPrompt|generateShotSequence|local template/i);
});

test('normal Blueprint Generate uses the new endpoint and legacy template path is not called', () => {
  const handleNode = findDeclaration(parsedPage, 'FunctionDeclaration', 'handleGenerate');
  const legacyNode = findDeclaration(parsedPage, 'FunctionDeclaration', 'handleLegacyTemplateGenerate');
  const handler = page.slice(handleNode.start, handleNode.end);
  assert.match(handler, /fetch\("\/api\/generate-blueprint"/);
  assert.match(handler, /outputLanguage:\s*language \|\| "English"/);
  assert.match(handler, /mapStructuredBlueprint\(output\)/);
  assert.match(handler, /formatStructuredBlueprint\([\s\S]*?output,/);
  assert.doesNotMatch(handler, /handleLegacyTemplateGenerate\(/);
  assert.ok(legacyNode, 'legacy helper may remain but must not be the normal Generate path');
  assert.match(page, /generatedShots\[selectedShot\]\.causalLink/);
});

test('Blueprint UI keeps the six-shot cards, inspector, copy, and history/export fields', () => {
  assert.match(page, /generatedShots\.map\(\(shot, index\)/);
  assert.match(page, /SHOT INSPECTOR/);
  assert.match(page, /navigator\.clipboard\.writeText\(expandedPrompt\)/);
  assert.match(page, /expanded_prompt:\s*expandedPrompt/);
  assert.match(page, /production_assets:\s*productionAssets/);
});

test('Generate main pipeline and its intent/language implementation remain untouched by the Blueprint route', () => {
  assert.match(page, /fetch\("\/api\/generate-blueprint"/);
  assert.doesNotMatch(endpoint, /pages\/api\/generate\.js|from ["'][^"']*generate\.js["']/);
  assert.match(page, /async function handleLegacyTemplateGenerate\(\)/);
  assert.match(page, /function handleGenerate\(\)/);
});
test('Blueprint output copy buttons share responsive dimensions and vision content shares an inset axis', () => {
  const languages = read('data/languages.js');
  assert.equal((page.match(/className="premiumCopyAction blueprintsOutputCopyAction"/g) || []).length, 2);
  const copyRule = page.match(/\.blueprints-page \.blueprintsOutputCopyAction \{[\s\S]*?\n\}/)?.[0];
  assert.ok(copyRule, 'scoped copy-button rule must exist');
  for (const declaration of [
    /width: 176px !important/,
    /height: 44px !important/,
    /padding: 0 10px !important/,
    /flex: 0 0 176px !important/,
    /margin-left: auto !important/,
  ]) assert.match(copyRule, declaration);
  assert.match(languages, /Copier la direction/);
  assert.match(languages, /Copier la narration/);
  assert.match(page, /navigator\.clipboard\.writeText\(directorSummary \|\| ""\)/);
  assert.match(page, /navigator\.clipboard\.writeText\(item\.value \|\| ""\)/);
  assert.match(page, /flexWrap: "wrap"/);
  assert.match(page, /padding: "42px 42px 42px 22px"/);
  assert.match(page, /paddingLeft: "22px",[\s\S]*?\{ui\.blueprints\.visionTitle\}/);
  assert.match(page, /paddingLeft: "22px",[\s\S]*?\{ui\.blueprints\.visionHelp\}/);
  assert.match(page, /height: "260px"/);
  assert.match(page, /value=\{prompt\}[\s\S]*?setPrompt\(e\.target\.value\)/);
  assert.match(page, /if \(mode\.premium && userPlan !== "pro"\)/);
});

test('Pro Unlimited hides upsell labels without changing non-Pro director access gates', () => {
  const sidebar = read('components/Sidebar.js');
  assert.match(sidebar, /\{userPlan !== "pro" && \([\s\S]*?\{t\("Upgrade to Pro"\)\}[\s\S]*?\)\}/);
  assert.match(page, /\{mode\.premium && userPlan !== "pro" && \(/);
  assert.match(page, /if \(mode\.premium && userPlan !== "pro"\) \{\s*router\.push\("\/pricing\?reason=premium-director"\)/);
  assert.match(endpoint, /selectedMode\?\.premium && !normalizedPlan\.includes\("pro"\)/);
});

// Word list for ClacketyClack: one flat deduplicated array, bucketed at
// runtime by the word length picker in app.js (LENGTHS: 1-4, 5-7, 8-12, 13+).
// The old per-level arrays carried hundreds of duplicates and mis-bucketed
// lengths; this is the same vocabulary, cleaned.
const WORDS = [
  'about', 'accommodation', 'achievement', 'acknowledgement', 'acknowledgment', 'acquaintance', 'administration', 'advertisement',
  'after', 'against', 'all', 'almost', 'already', 'also', 'alternative', 'always',
  'america', 'and', 'animals', 'announcement', 'another', 'answer', 'antidisestablishmentarianism', 'antitransubstantiationalist',
  'any', 'application', 'appreciation', 'appropriate', 'around', 'availability', 'back', 'ball',
  'base', 'beautiful', 'been', 'before', 'believe', 'better', 'between', 'big',
  'bird', 'book', 'boy', 'brought', 'but', 'butterfly', 'call', 'called',
  'came', 'can', 'case', 'celebration', 'century', 'certain', 'championship', 'children',
  'chocolate', 'circumference', 'circumstance', 'circumstances', 'coincidence', 'come', 'communication', 'competition',
  'complete', 'concentration', 'congratulations', 'consequence', 'convenience', 'cooperation', 'correspondence', 'could',
  'country', 'dangerous', 'day', 'decimal', 'describe', 'destination', 'determination', 'dichlorodifluoromethane',
  'did', 'different', 'direction', 'disappointment', 'distribution', 'division', 'does', 'done',
  'down', 'duodenocholedochotomy', 'during', 'each', 'electric', 'electricity', 'electroencephalographically', 'elephant',
  'embarrassment', 'end', 'entertainment', 'environment', 'establishment', 'even', 'everything', 'exactly',
  'exaggeration', 'examination', 'example', 'exercise', 'explanation', 'extraordinary', 'face', 'family',
  'fast', 'feel', 'find', 'first', 'fish', 'floccinaucinihilipilification', 'follow', 'food',
  'foot', 'for', 'form', 'found', 'four', 'fraction', 'from', 'full',
  'game', 'gave', 'general', 'get', 'girl', 'give', 'gone', 'good',
  'grandfather', 'grandmother', 'great', 'grow', 'hand', 'happened', 'hard', 'has',
  'have', 'head', 'help', 'hepaticocholangiocholecystenterostomies', 'her', 'here', 'high', 'hill',
  'him', 'himself', 'hippopotomonstrosesquipedaliophobia', 'home', 'honorificabilitudinitatibus', 'hope', 'house', 'however',
  'hundred', 'identification', 'illustration', 'imagination', 'immediately', 'immunoelectrophoretically', 'important', 'impossible',
  'incomprehensibilities', 'industry', 'information', 'infrastructure', 'instead', 'interesting', 'interpretation', 'into',
  'introduction', 'investigation', 'just', 'keep', 'kind', 'king', 'know', 'land',
  'language', 'large', 'laryngotracheobronchitis', 'last', 'learn', 'left', 'less', 'letter',
  'like', 'line', 'little', 'live', 'long', 'look', 'lost', 'love',
  'made', 'main', 'maintenance', 'make', 'man', 'many', 'mark', 'material',
  'mathematics', 'may', 'me', 'mean', 'means', 'measure', 'meet', 'meteorologist',
  'microscope', 'mile', 'minute', 'modification', 'more', 'morning', 'most', 'mother',
  'mountains', 'move', 'much', 'must', 'my', 'name', 'near', 'necessary',
  'need', 'negotiation', 'neighborhood', 'nevertheless', 'new', 'next', 'not', 'nothing',
  'now', 'number', 'observe', 'often', 'old', 'once', 'only', 'open',
  'opportunity', 'organisation', 'organization', 'other', 'otorhinolaryngological', 'our', 'over', 'own',
  'page', 'parastratiosphecomyiastratiosphecomyioides', 'part', 'participation', 'pass', 'pattern', 'people', 'performance',
  'perspective', 'pharyngolaryngoesophagectomy', 'phosphatidylethanolamine', 'photograph', 'picture', 'place', 'plan', 'play',
  'pneumonoultramicroscopicsilicovolcanoconiosis', 'polytetrafluoroethylene', 'port', 'preparation', 'present', 'presentation', 'problem', 'produce',
  'product', 'professional', 'property', 'pseudopseudohypoparathyroidism', 'psychoneuroendocrinological', 'psychopharmacotherapeutics', 'psychophysicotherapeutics', 'publication',
  'put', 'qualification', 'question', 'race', 'radioimmunoelectrophoresis', 'read', 'recognition', 'recommendation',
  'region', 'remember', 'replacement', 'requirement', 'right', 'road', 'rock', 'room',
  'said', 'same', 'satisfaction', 'say', 'school', 'scientific', 'second', 'see',
  'seen', 'self', 'set', 'several', 'ship', 'should', 'show', 'side',
  'significance', 'small', 'some', 'sometimes', 'song', 'soon', 'spectroheliokinematograph', 'spectrophotofluorometrically',
  'star', 'stay', 'still', 'stop', 'strawberry', 'study', 'subject', 'substantial',
  'such', 'suggestion', 'supercalifragilisticexpialidocious', 'surface', 'system', 'take', 'talk', 'telephone',
  'tell', 'temperature', 'tetrahydrocannabinol', 'than', 'that', 'the', 'their', 'them',
  'then', 'there', 'these', 'thing', 'think', 'this', 'though', 'three',
  'through', 'thunderstorm', 'thyrocalcitonin', 'thyroparathyroidectomized', 'time', 'together', 'told', 'tomorrow',
  'too', 'took', 'toward', 'town', 'transformation', 'transportation', 'tree', 'turn',
  'two', 'umbrella', 'uncharacteristically', 'under', 'underneath', 'understand', 'understanding', 'unfortunately',
  'university', 'until', 'use', 'used', 'usually', 'uvulopalatopharyngoplasty', 'ventriloquistically', 'very',
  'want', 'water', 'way', 'weather', 'well', 'went', 'were', 'what',
  'when', 'where', 'which', 'who', 'will', 'with', 'without', 'wonderful',
  'word', 'work', 'world', 'would', 'write', 'yard', 'year', 'years',
  'yesterday', 'you', 'your',
];

/* ------------------------------------------------------------------ *
 * Teaching lessons. Each lesson is a pack: what falls (targets), what
 * falls alongside in hard mode (distractors, each tagged with why it
 * is wrong), and the banner shown at the top of the screen.
 * style 'letters' pops on a single keypress, 'words' uses the buffer.
 * ------------------------------------------------------------------ */
const LESSON_POS = {
  noun: [
    'dog', 'cat', 'house', 'tree', 'book', 'chair', 'table', 'river',
    'mountain', 'teacher', 'school', 'apple', 'garden', 'window', 'door', 'bird',
    'car', 'train', 'beach', 'cloud', 'sister', 'brother', 'doctor', 'city',
    'farm', 'horse', 'milk', 'bread', 'shoe', 'clock', 'street', 'park',
    'ball', 'cake', 'king', 'queen', 'boat', 'spoon', 'pencil', 'monkey',
  ],
  verb: [
    'run', 'jump', 'swim', 'eat', 'sleep', 'read', 'write', 'sing',
    'dance', 'throw', 'catch', 'climb', 'laugh', 'cry', 'shout', 'whisper',
    'drive', 'draw', 'paint', 'cook', 'wash', 'dig', 'push', 'pull',
    'kick', 'carry', 'build', 'listen', 'speak', 'think', 'dream', 'hide',
    'ride', 'grow', 'hop', 'clap', 'chase', 'giggle', 'stomp', 'wiggle',
  ],
  adjective: [
    'big', 'small', 'happy', 'sad', 'red', 'blue', 'green', 'tall',
    'short', 'slow', 'hot', 'cold', 'loud', 'quiet', 'soft', 'shiny',
    'dark', 'bright', 'funny', 'kind', 'brave', 'tiny', 'huge', 'angry',
    'sleepy', 'hungry', 'wet', 'dry', 'old', 'new', 'clean', 'dirty',
    'sweet', 'sour', 'heavy', 'smooth', 'round', 'fluffy', 'silly', 'gentle',
  ],
};

const LESSON_POS_WHY = { noun: 'a noun', verb: 'a verb', adjective: 'an adjective' };

function posLesson(id, title, banner) {
  return {
    title,
    banner,
    style: 'words',
    whyTarget: LESSON_POS_WHY[id],
    targets: LESSON_POS[id],
    distractors: Object.keys(LESSON_POS)
      .filter((k) => k !== id)
      .flatMap((k) => LESSON_POS[k].map((text) => ({ text, why: LESSON_POS_WHY[k] }))),
  };
}

/* ------------------------------------------------------------------ *
 * Shapes: drawn on the falling caps rather than spelled out. Each draw
 * takes a context, a centre and a radius and strokes the outline; app.js
 * sets colours and line width so shapes match the keycap text styling.
 * Names are what the player types, so they stay lowercase a-z.
 * ------------------------------------------------------------------ */
function ccPolygon(c, cx, cy, r, sides, rot = -Math.PI / 2) {
  c.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = rot + (i * 2 * Math.PI) / sides;
    const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
    if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
  }
  c.closePath();
}

const SHAPES = {
  circle: (c, cx, cy, r) => { c.beginPath(); c.arc(cx, cy, r, 0, 2 * Math.PI); },
  square: (c, cx, cy, r) => { const s = r * 1.7; c.beginPath(); c.rect(cx - s / 2, cy - s / 2, s, s); },
  triangle: (c, cx, cy, r) => ccPolygon(c, cx, cy, r * 1.1, 3),
  rectangle: (c, cx, cy, r) => { const w = r * 2.2, h = r * 1.3; c.beginPath(); c.rect(cx - w / 2, cy - h / 2, w, h); },
  star: (c, cx, cy, r) => {
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 === 0 ? r * 1.15 : r * 0.48;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const x = cx + rad * Math.cos(a), y = cy + rad * Math.sin(a);
      if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.closePath();
  },
  heart: (c, cx, cy, r) => {
    const s = r / 14;
    c.beginPath();
    c.moveTo(cx, cy + 11 * s);
    c.bezierCurveTo(cx - 16 * s, cy - 2 * s, cx - 9 * s, cy - 13 * s, cx, cy - 5 * s);
    c.bezierCurveTo(cx + 9 * s, cy - 13 * s, cx + 16 * s, cy - 2 * s, cx, cy + 11 * s);
    c.closePath();
  },
  diamond: (c, cx, cy, r) => {
    c.beginPath();
    c.moveTo(cx, cy - r * 1.15); c.lineTo(cx + r * 0.8, cy);
    c.lineTo(cx, cy + r * 1.15); c.lineTo(cx - r * 0.8, cy);
    c.closePath();
  },
  oval: (c, cx, cy, r) => { c.beginPath(); c.ellipse(cx, cy, r * 1.25, r * 0.75, 0, 0, 2 * Math.PI); },
  pentagon: (c, cx, cy, r) => ccPolygon(c, cx, cy, r, 5),
  hexagon: (c, cx, cy, r) => ccPolygon(c, cx, cy, r, 6, 0),
  cross: (c, cx, cy, r) => {
    const a = r * 0.42, b = r * 1.1;
    c.beginPath();
    c.moveTo(cx - a, cy - b); c.lineTo(cx + a, cy - b); c.lineTo(cx + a, cy - a);
    c.lineTo(cx + b, cy - a); c.lineTo(cx + b, cy + a); c.lineTo(cx + a, cy + a);
    c.lineTo(cx + a, cy + b); c.lineTo(cx - a, cy + b); c.lineTo(cx - a, cy + a);
    c.lineTo(cx - b, cy + a); c.lineTo(cx - b, cy - a); c.lineTo(cx - a, cy - a);
    c.closePath();
  },
  crescent: (c, cx, cy, r) => {
    c.beginPath();
    c.arc(cx, cy, r, Math.PI * 0.32, Math.PI * 1.68);
    c.arc(cx + r * 0.55, cy, r * 0.72, Math.PI * 1.55, Math.PI * 0.45, true);
    c.closePath();
  },
  /* The look-alike set. These are deliberately drawn to CONTRAST with each
   * other and with the basic set: diamond stands tall on a vertex, rhombus
   * lies wide, the parallelogram leans with unequal sides, the trapezium
   * has one pair of parallel edges, the kite two pairs of neighbours. */
  rhombus: (c, cx, cy, r) => {
    c.beginPath();
    c.moveTo(cx, cy - r * 0.7); c.lineTo(cx + r * 1.2, cy);
    c.lineTo(cx, cy + r * 0.7); c.lineTo(cx - r * 1.2, cy);
    c.closePath();
  },
  parallelogram: (c, cx, cy, r) => {
    c.beginPath();
    c.moveTo(cx - r * 0.6, cy - r * 0.6); c.lineTo(cx + r * 1.2, cy - r * 0.6);
    c.lineTo(cx + r * 0.6, cy + r * 0.6); c.lineTo(cx - r * 1.2, cy + r * 0.6);
    c.closePath();
  },
  trapezium: (c, cx, cy, r) => {
    c.beginPath();
    c.moveTo(cx - r * 0.55, cy - r * 0.6); c.lineTo(cx + r * 0.55, cy - r * 0.6);
    c.lineTo(cx + r * 1.2, cy + r * 0.6); c.lineTo(cx - r * 1.2, cy + r * 0.6);
    c.closePath();
  },
  kite: (c, cx, cy, r) => {
    c.beginPath();
    c.moveTo(cx, cy - r * 1.15); c.lineTo(cx + r * 0.7, cy - r * 0.25);
    c.lineTo(cx, cy + r * 1.15); c.lineTo(cx - r * 0.7, cy - r * 0.25);
    c.closePath();
  },
  semicircle: (c, cx, cy, r) => {
    c.beginPath();
    c.arc(cx, cy + r * 0.35, r * 1.1, Math.PI, 0);
    c.closePath();
  },
  octagon: (c, cx, cy, r) => ccPolygon(c, cx, cy, r * 1.05, 8, Math.PI / 8),
  ring: (c, cx, cy, r) => {
    c.beginPath();
    c.arc(cx, cy, r, 0, 2 * Math.PI);
    c.moveTo(cx + r * 0.55, cy);
    c.arc(cx, cy, r * 0.55, 0, 2 * Math.PI, true);
  },
};

/* Curriculum order, not alphabetical: each lesson starts with its first
 * four and unlocks the rest as the player earns pops. */
const BASIC_SHAPES = ['circle', 'square', 'triangle', 'star', 'heart', 'diamond',
  'rectangle', 'oval', 'cross', 'pentagon', 'hexagon', 'crescent'];
const TRICKY_SHAPES = ['rhombus', 'parallelogram', 'trapezium', 'kite',
  'semicircle', 'octagon', 'ring'];

/* ------------------------------------------------------------------ *
 * Colours: the cap carries a filled swatch instead of an outline. The
 * values are tuned to read on the dark keycap face; white and black get
 * their hairline border from the renderer. Names are what you type.
 * ------------------------------------------------------------------ */
const COLOURS = {
  red:       '#e5493a',
  blue:      '#3b82e0',
  green:     '#43b649',
  yellow:    '#f5d327',
  orange:    '#f28c1b',
  purple:    '#8a4fd0',
  pink:      '#f27fb2',
  brown:     '#8a5a34',
  black:     '#111417',
  white:     '#f2f4f6',
  grey:      '#9aa3ab',
  turquoise: '#2ec4b6',
};
const COLOUR_NAMES = Object.keys(COLOURS); // curriculum order as written

/* One lesson body shared by every shape variant. `reveal` is the teaching
 * scaffold, in fading order:
 *   'delay'  the name appears under the shape only after a moment, so the
 *            player looks at the shape and tries to recall BEFORE reading
 *            the answer (a guess-then-see beats copy-along)
 *   'hint'   only the first letter shows, the rest are dots
 *   'none'   nothing shows: full recall
 */
function shapeLesson(title, banner, reveal, targets) {
  return {
    title,
    banner,
    style: 'shapes',
    glyphs: 'shapes', // caps carry a drawn outline from SHAPES
    reveal,
    targets,
    whyTarget: 'a shape',
    distractors: [], // hard mode has no traps here; memory IS the hard variant
  };
}

/* Colour lessons ride the whole shapes machinery (batching, reveal
 * scaffolds, splash feedback); only the cap's face differs: a filled
 * swatch from COLOURS instead of an outline from SHAPES. */
function colourLesson(title, banner, reveal) {
  return {
    title,
    banner,
    style: 'shapes',
    glyphs: 'colours',
    reveal,
    targets: COLOUR_NAMES,
    whyTarget: 'a colour',
    distractors: [],
  };
}

const LESSONS = {
  vowels: {
    title: 'Vowels',
    banner: 'The vowels are a, e, i, o, u. Every other letter is a consonant.',
    style: 'letters',
    whyTarget: 'a vowel',
    targets: ['a', 'e', 'i', 'o', 'u'],
    distractors: 'bcdfghjklmnpqrstvwxyz'.split('').map((text) => ({ text, why: 'a consonant' })),
  },
  noun: posLesson('noun', 'Nouns',
    'A naming word: a person, place or thing (dog, school, apple).'),
  verb: posLesson('verb', 'Verbs',
    'A doing word: something you can do (run, sing, jump).'),
  adjective: posLesson('adjective', 'Adjectives',
    'A describing word: it tells you what something is like (big, red, happy).'),
  shapes: shapeLesson('Shapes',
    'Say the shape in your head before its name appears underneath, then type it.',
    'delay', BASIC_SHAPES),
  shapeshint: shapeLesson('Shape Hints',
    'Only the first letter shows. Can you finish the name yourself?',
    'hint', BASIC_SHAPES),
  shapesmemory: shapeLesson('Shape Memory',
    'The same shapes, but no labels: type each name from memory.',
    'none', BASIC_SHAPES),
  shapestricky: shapeLesson('Tricky Shapes',
    'The look-alikes. Count the equal sides and parallel edges, guess, then check.',
    'delay', TRICKY_SHAPES),
  colours: colourLesson('Colours',
    'Say the colour in your head before its name appears underneath, then type it.',
    'delay'),
  colourshint: colourLesson('Colour Hints',
    'Only the first letter shows. Can you finish the colour yourself?',
    'hint'),
  coloursmemory: colourLesson('Colour Memory',
    'The same colours, but no labels: type each name from memory.',
    'none'),
};

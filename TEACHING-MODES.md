# ClacketyClack Teaching Modes: Design Report

A survey of ways to turn the game into a teaching tool. No code changes yet, this is the
menu of options. Modes are grouped by what they teach, followed by cross-cutting mechanics
(hard mode, spaced repetition, custom lists) and implementation notes on how the current
code supports each idea.

The core loop stays the same everywhere: things fall as keycaps, you type them before they
splash. What changes per mode is (a) what falls, (b) what the banner at the top of the
screen says, and (c) whether some falling words are traps you must NOT type.

---

## Group A: Letters and phonics (youngest players)

### A1. Vowels mode
The example from the brief. Only `a e i o u` fall, in letters style (single keypress pops
them). Banner reads "Vowels: a e i o u". Variants:
- **Vowels vs consonants**: both fall, only vowels should be typed. Typing a consonant
  costs points or flashes red. This teaches the distinction, not just the keys.
- Same idea inverted for consonants.

### A2. Letter families and typing drills
- Home row only (`a s d f g h j k l`), then top row, then bottom row. This doubles as a
  touch typing curriculum, which is a natural fit for a game about keycaps.
- Left hand vs right hand letters.
- Capital letter recognition: the keycap shows `B`, the child presses `b`. Teaches that
  the shape on screen and the key are the same letter.

### A3. Digraphs and blends
Two or three letter phonics units fall as single caps: `ch sh th wh ph`, blends like
`br cl st str`. Typed as a unit, popped as a unit. Banner can say the sound: "sh, as in
ship". This bridges letters mode and words mode.

### A4. Word families (rhyme time)
Banner: "-at family". Falling words: cat, hat, mat, sat, bat. Everything rhymes, the child
learns the pattern by typing the shared stem over and over. Dozens of families exist
(-og, -in, -ake, -ight) and each is just a tiny word list.

---

## Group B: Word knowledge (the "Adjective" mode from the brief)

### B1. Parts of speech mode
Banner shows the category and its meaning, e.g.:

> **Adjective**: a describing word. It tells you what something is like (big, red, happy).

Only adjectives fall. Typing them reinforces the category through repetition. Rotate
categories per round: noun, verb, adjective, adverb, pronoun, preposition. Each is one
tagged word list plus one definition string.

**Hard mode** (also from the brief): other parts of speech fall alongside the targets.
Typing a non-adjective is a mistake (lose points or a life, with a corrective flash showing
"'jump' is a verb"). Now the game tests classification, not just typing. The corrective
message is the actual teaching moment, so it should name the right category, not just
say "wrong".

### B2. Definition match
Banner shows a definition: "A place where you borrow books." Falling words include
`library` plus distractors (`kitchen`, `garage`, `station`). Type the one that matches.
This is vocabulary comprehension rather than category knowledge. Needs a curated list of
definition and answer pairs plus plausible distractors.

### B3. Synonyms and antonyms
Banner: "Synonym of HAPPY" or "Opposite of HOT". Fallers include the answer(s) and
distractors. Multiple correct answers are fine (glad, cheerful, joyful all pop).

### B4. Odd one out / category sorting
Banner: "Type the ANIMALS". Fallers: dog, cat, chair, fish, table. Only category members
should be typed. Effectively B1 generalised to any category: animals, colours, fruit,
countries, months. Very cheap to add content for, and great for younger kids.

---

## Group C: Spelling

### C1. Missing letter
Words fall with a gap: `b_tter`, `frie_d`. The player types the whole word (the game knows
the answer, so the buffer matching still works) or, simpler, just the missing letter.
Target the classic trouble spots: silent letters, double letters, ie/ei.

### C2. Hear it, spell it
The word is spoken (Web Speech API `speechSynthesis`, no assets needed) and the keycap
falls blank or shows only its first letter. The player must spell from sound. This is the
closest mode to a real spelling test and the biggest jump in teaching value.

### C3. Fix the spelling
The keycap shows a misspelt word (`freind`), the player types the correct spelling
(`friend`). Requires care: research says showing misspellings can reinforce them, so this
suits older kids, and the correct form should flash prominently on the pop.

### C4. Plurals and tenses
Banner: "Type the plural". Keycap shows `box`, player types `boxes`. Same mechanic for
past tense (`run` -> `ran`), comparatives (`big` -> `bigger`). The falling word is the
prompt and the typed word is the transformed answer, which the current buffer system can
support with a per-word `answer` field.

---

## Group D: Beyond English

### D1. Maths facts
Keycap shows `7 x 8`, player types `56`. Times tables, addition bonds, doubles and halves.
Needs digit input allowed (currently the key handler filters to a-z only) but is otherwise
identical to words mode. Times tables alone would make this a genuinely useful homework
tool.

### D2. Translation mode
Banner: "Type the English". Keycap shows `chien`, player types `dog` (or the reverse for
learning the foreign word). Any language pair is just a two-column word list.

---

## Group E: Cross-cutting mechanics (apply to every mode)

### E1. Hard mode: distractors
The single most valuable mechanic in this list because it upgrades every mode from
"typing practice with themed words" to "an actual test of the concept". Needs one code
concept: each falling word carries `isTarget: true/false`, and completing a non-target is
penalised with a corrective message. Distractor density can scale: easy 0%, medium 25%,
hard 50%.

### E2. Custom word lists
A textarea on the menu (or a URL parameter) where a parent or teacher pastes this week's
spelling list. Stored in localStorage. This turns the game into a tool for any school's
actual homework and costs very little to build.

### E3. Spaced repetition / smart word picking
Track per-word results in localStorage: popped cleanly, popped slowly, or splashed. Words
you miss come back sooner and more often; words you always get fade out. Even a crude
version ("splashed words rejoin the pool at 3x weight") noticeably improves learning value.

### E4. End of round review
The game over screen currently shows only the score. Add "Words you missed" with the word,
its category or definition, and (in hard mode) what you typed wrong. Reviewing mistakes is
where a lot of the learning actually lands.

### E5. Progression and rewards
- Lesson ladder: vowels unlock consonants unlock digraphs unlock word families, etc.
- Per-lesson star ratings (accuracy based, not just score based).
- A sticker book or trophy shelf drawn in the existing cartoon style.
This turns a pile of modes into a curriculum and gives kids a reason to return.

### E6. Calm mode
For teaching, the death mechanic can work against you: a struggling child gets punished
hardest on exactly the words they need most. A no-lives option where splashed words simply
recycle (and count in the E4 review) makes the game usable in classrooms.

---

## Implementation notes

The current architecture is friendly to nearly all of this:

- `mode` already exists as a switch (`words` / `letters`) with per-mode input handling in
  `onKey`, so new modes slot in beside it.
- Word selection is already funnelled through `wordPool()` / `pickWord()`, so a teaching
  mode is mostly "a different pool" plus banner text.
- The HUD is DOM, so the banner (category name and meaning) is one element in
  `index.html`, shown/hidden like `#typed`.
- Best scores are already stored per mode and level in localStorage; per-word stats (E3)
  and custom lists (E2) extend the same store.

New concepts the code does not yet have, roughly in order of effort:

1. **Banner/prompt element**: trivial, one DOM element updated per round or per word.
2. **Tagged dictionaries**: `wordDictionaries.js` becomes a set of lesson packs, e.g.
   `{ id, title, banner, targets: [...], distractors: [...] }`. All of groups A, B and
   most of C are then pure data.
3. **isTarget flag and penalty path**: enables hard mode (E1) everywhere.
4. **Per-word answer field** (typed text differs from shown text): enables C1, C4, D1, D2.
5. **Digit input**: small change to the a-z filter in `onKey`, needed only for D1.
6. **Speech synthesis**: enables C2, the only mode needing a new browser API.

### Suggested first slice

If you want a first version that proves the whole concept:

1. Vowels mode (A1, trivial: a five letter pool in the existing letters mode).
2. Parts of speech mode with banner (B1) using a small tagged dictionary.
3. Hard mode toggle with distractors and corrective flashes (E1).
4. Missed-words review on the game over screen (E4).

That covers both examples from the brief, adds the one mechanic (distractors) that makes
everything else meaningful, and builds the data shape every later mode reuses.

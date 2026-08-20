# Clackety Clack

**Annoy your colleagues and test your switches.**

A full screen typing game drawn in a chunky cartoon style. Words tumble out of the sky as giant keycaps and you hammer them out of the air before they splash into the sea. Three hearts, four speeds, and a surprisingly educational streak.

**Play it now: [clacketyclack.gamelabs.gg](https://clacketyclack.gamelabs.gg)**

<!-- screenshot: title menu goes here -->

## The game

Everything falls as a keycap. Type what is on the cap before it hits the water; finish a word and it pops in a shower of points, miss one and it splashes, costing you a heart. Lose all three and it is game over, with a review of the words that got away. Score is paced: the faster you clear letters, the bigger the multiplier, and every pop floats its points up off the cap so you can see the streak building.

<!-- screenshot: gameplay with falling keycaps goes here -->

### Modes

**Words** is the classic game. Pick a word length to suit your hands: Mixed, 1 to 4, 5 to 7, 8 to 12, or 13+ for the sesquipedalian crowd (yes, the dictionary really does include `parastratiosphecomyiastratiosphecomyioides`).

**Just Letters** drops single caps for single keypresses. Great for warming up, or for very small typists.

**Learn** turns the game into a teaching tool, one lesson per card:

| Lesson | What falls | The trick |
| --- | --- | --- |
| Vowels | a e i o u | Letters mode, five keys only |
| Nouns, Verbs, Adjectives | Words of one part of speech | The banner teaches the category |
| Shapes | Drawn shapes, type their names | The outline fills in as you type |
| Shape Hints / Shape Memory | Same, with scaffolding | First letter shown, or name hidden until you commit |
| Tricky Shapes | Rhombus, trapezium and friends | For shape connoisseurs |
| Colours | Colour swatches, type the colour | The swatch itself is the prompt |
| Colour Hints / Colour Memory | Same, with scaffolding | Hints fade, memory hides |

Shape and colour lessons unlock their content in batches as you play, and quietly serve you more of whatever you keep missing.

**Hard mode** is the toggle that turns lessons into tests: sneaky wrong words fall alongside the real targets, and typing one is a mistake with a corrective flash telling you what it actually was. Now you are being examined on the concept, not just the typing.

<!-- screenshot: learn mode lesson cards go here -->

### Speeds

Easy, Medium, Hard, and **Ultimate Badass!** The speed dial changes only how fast caps fall; word length and lessons are chosen separately, so a small person can play long words slowly and a show-off can play short words at ludicrous speed.

## Running it

There is no build step and no framework. It is plain HTML, CSS, and canvas JavaScript.

```bash
git clone https://github.com/c0def0rc0ffee/ClacketyClack.git
cd ClacketyClack
xdg-open index.html
```

Opening `index.html` straight from disk works. Anything that serves static files works too, for example:

```bash
python3 -m http.server 8000
```

Best scores are kept per mode and speed in `localStorage`. When the game is served on the GameLabs domain and you are signed in, `platform.js` also syncs your bests to your account, so a new device cannot lower them. Anywhere else, the platform glue stays silently out of the way and the game is fully offline.

## Project layout

| Path | What it is |
| --- | --- |
| `index.html` | The single page: menu, HUD, game over screen |
| `app.js` | The whole game: rendering, input, scoring, lessons |
| `wordDictionaries.js` | Word lists, tagged by length and part of speech |
| `platform.js` | Optional GameLabs sign-in and score sync |
| `css/styles.css` | Menu and HUD styling |
| `font/` | The keycap and title faces |
| `build-zip.sh` | Packages versioned dist and source zips, mirrors locally |
| `deploy/` | One-time local Apache vhost setup |
| `tools/deploy-site.mjs` | Uploads the built site over SFTP |
| `TEACHING-MODES.md` | Design notes: the roadmap of possible lessons |

## Releasing

`./build-zip.sh` bumps the build number in `VERSION`, stamps it onto the menu, and produces a deployable zip plus a source zip, mirroring the deployable into the local web root if one is set up. `npm run deploy` then uploads the built site. Credentials live outside the repo entirely; the build script and `.gitignore` both carry backstop patterns so none can ever ride along.

## Roadmap

[TEACHING-MODES.md](TEACHING-MODES.md) is the menu of where Learn mode can go next: phonics and word families, spelling with speech synthesis, times tables, translation pairs, custom word lists for this week's homework, and calm mode for classrooms. The shape and colour lessons came off that list; the rest are waiting their turn.

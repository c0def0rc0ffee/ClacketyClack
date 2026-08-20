// GameLabs platform glue: sign-in awareness, score keeping and commendations.
//
// Everything here is OPTIONAL to the game. The API lives on another origin
// (gamelabs.gg) and the session rides a .gamelabs.gg cookie, so a signed-out
// player, a blocked request or a dead server must all end the same way: the
// game plays exactly as it did before any of this existed, on localStorage
// bests alone. Every call therefore swallows its own errors and answers with
// something harmless rather than throwing into app.js.
//
// Loaded BEFORE app.js, so the helpers exist by the time the menu wires up.

'use strict';

const CC_GAME_ID = 'clacketyclack';

// Production is served from clacketyclack.gamelabs.gg and talks to the
// platform at gamelabs.gg; the session cookie is shared across the two
// because it is set on .gamelabs.gg. Anywhere else (the Apache mirror at
// http://clacketyclack, a file:// open) is development and points at the
// local platform vhost. Note cf_cors() only echoes https *.gamelabs.gg
// origins, so cross-origin calls in local dev are expected to fail: the
// panel then simply shows the signed-out state.
const CC_API = /(^|\.)gamelabs\.gg$/.test(location.hostname)
  ? 'https://gamelabs.gg/api'
  : 'http://gamelabs/api';

const CC_SITE = CC_API.replace(/\/api$/, '');

/* What we know about the player. Populated by ccRefresh(), read by the menu
 * panel. `bests` is keyed by the same strings the game uses in localStorage,
 * so the two stores merge by simply taking the larger number. */
const ccAccount = {
  loggedIn: false,
  username: '',
  earnedCount: 0,
  total: 0,
  bests: Object.create(null),
};

/** fetch that never throws and never blocks the game. */
async function ccFetch(path, options) {
  try {
    const res = await fetch(CC_API + path, Object.assign({
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    }, options || {}));
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null; // offline, CORS, blocked: the game does not care
  }
}

/**
 * Re-read who is signed in, their cloud bests and their commendation count.
 * Safe to call as often as you like; it is the only thing that writes to
 * ccAccount. Returns the account object so callers can render from it.
 */
async function ccRefresh() {
  const [session, saves, achievements] = await Promise.all([
    ccFetch('/session.php'),
    ccFetch('/game-data.php?game=' + CC_GAME_ID),
    ccFetch('/achievements.php?game=' + CC_GAME_ID),
  ]);

  ccAccount.loggedIn = !!(session && session.loggedIn);
  ccAccount.username = ccAccount.loggedIn ? String(session.username || '') : '';

  ccAccount.bests = Object.create(null);
  if (saves && Array.isArray(saves.saves)) {
    for (const slot of saves.saves) {
      if (slot && slot.score !== null) ccAccount.bests[slot.name] = Number(slot.score) || 0;
    }
  }

  ccAccount.earnedCount = achievements ? Number(achievements.earnedCount) || 0 : 0;
  ccAccount.total = achievements ? Number(achievements.total) || 0 : 0;
  return ccAccount;
}

/**
 * The best score for one slot key, whichever store holds more. The browser
 * copy is authoritative offline and the account copy follows the player
 * between machines; neither can lower the other.
 */
function ccBestFor(key) {
  const local = Number(localStorage.getItem(key) || 0);
  const cloud = Number(ccAccount.bests[key] || 0);
  return Math.max(local, cloud);
}

/**
 * Report a finished round. Two calls, deliberately:
 *   report-game.php  the round itself, which is what earns commendations
 *   game-data.php    the best-score slot the menu reads back, kept with
 *                    scoreMode 'max' so a stale device can never lower it
 * Guests get {recorded:false} from the server and nothing else happens.
 * Resolves to the list of newly earned commendations (possibly empty).
 */
async function ccReportRound(round, bestKey, bestScore) {
  const payload = Object.assign({ game: CC_GAME_ID }, round);
  const [report] = await Promise.all([
    ccFetch('/report-game.php', { method: 'POST', body: JSON.stringify(payload) }),
    ccFetch('/game-data.php', {
      method: 'POST',
      body: JSON.stringify({
        game: CC_GAME_ID,
        name: bestKey,
        score: bestScore,
        scoreMode: 'max',
      }),
    }),
  ]);
  if (report && Array.isArray(report.newAchievements) && report.newAchievements.length) {
    ccAccount.earnedCount += report.newAchievements.length;
    return report.newAchievements;
  }
  return [];
}

/** Where the player goes to sign in, and to read the full record. */
const CC_SIGNIN_URL = CC_SITE + '/account/';
const CC_RECORD_URL = CC_SITE + '/stats/?game=' + CC_GAME_ID;

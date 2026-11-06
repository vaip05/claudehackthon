// Content guard for lib/tips.ts. Run with: npm run check:tips
// Fails if a Focus x Phase cell is missing/short, a tip is malformed, or a source isn't in the verified list.

// Loaded dynamically so `next build` (which type-checks this folder) doesn't need allowImportingTsExtensions.
const tipsModule = (await import(new URL('../lib/tips.ts', import.meta.url).href)) as typeof import('../lib/tips');
const { FOCUSES, PHASES, CATEGORIES, SOURCE_URLS, getTips, askLink, askQuestion } = tipsModule;

const problems: string[] = [];
const fail = (msg: string) => problems.push(msg);
let total = 0;
let cited = 0;

for (const focus of FOCUSES) {
  for (const phase of PHASES) {
    const cell = `${focus}/${phase}`;
    const tips = getTips(focus, phase);
    total += tips.length;

    if (tips.length < 3 || tips.length > 4) fail(`${cell}: has ${tips.length} tips, want 3-4`);
    for (const c of CATEGORIES) {
      if (!tips.some((t) => t.category === c)) fail(`${cell}: no "${c}" tip`);
    }

    const titles = new Set<string>();
    for (const t of tips) {
      const where = `${cell} "${t.title}"`;
      if (titles.has(t.title)) fail(`${where}: duplicate title in cell`);
      titles.add(t.title);

      if (!CATEGORIES.includes(t.category)) fail(`${where}: bad category ${t.category}`);
      if (t.title.trim().split(/\s+/).length > 8) fail(`${where}: title longer than 8 words`);
      if (!t.why.endsWith('.')) fail(`${where}: "why" must end with a full stop`);
      if (/[.!?]\s+[A-Z]/.test(t.why)) fail(`${where}: "why" must be ONE sentence`);
      if (t.why.split(/\s+/).length > 32) fail(`${where}: "why" longer than 32 words`);

      if (t.source) {
        cited++;
        if (!SOURCE_URLS[t.source]) fail(`${where}: source "${t.source}" is not in the verified SOURCE_URLS list`);
      }

      // Words that make weak evidence sound strong. Reword, or justify and allow explicitly.
      if (/\b(cures?|treats?|reverses?|proven to (?:cure|treat))\b/i.test(t.why) && !/not proven/i.test(t.why)) {
        fail(`${where}: strong-claim wording`);
      }
      if (/\byou have (pmos|pcos|endometriosis)\b/i.test(t.why + t.title)) fail(`${where}: diagnostic wording`);

      const link = askLink(t, focus, phase);
      // Must be /talk?q=<encodeURIComponent(question)>: no raw spaces or quotes, and it round-trips exactly.
      const raw = link.slice('/talk?q='.length);
      if (!link.startsWith('/talk?q=') || /[\s"]/.test(raw) || decodeURIComponent(raw) !== askQuestion(t, focus, phase)) {
        fail(`${where}: ask link is not a clean encodeURIComponent of the question`);
      }
    }
  }
}

if (total < 36 || total > 48) fail(`total tips ${total}, want 36-48`);

// Lookups must never return undefined, even for junk values from localStorage.
const junk = getTips('nonsense' as never, 'luteal');
if (!Array.isArray(junk) || junk.length === 0) fail('getTips with a bad focus must fall back to general');
if (!Array.isArray(getTips('pmos', 'nonsense' as never))) fail('getTips with a bad phase must return an array');

if (problems.length) {
  console.error(`check-tips: ${problems.length} problem(s)\n - ${problems.join('\n - ')}`);
  process.exit(1);
}
console.log(`check-tips: OK. ${total} tips across ${FOCUSES.length * PHASES.length} cells, ${cited} with a verified source, ${total - cited} intentionally uncited.`);

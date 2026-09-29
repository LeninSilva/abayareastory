// The voices. Three ways a character can answer free speech:
//  1. live: inside claude.ai, through the page's `sample` capability (the viewer's own account)
//  2. key:  in the installed app, with the player's own Anthropic API key (official SDK, in the browser)
//  3. offline: each character's own written lines, chosen by what you ask about
import Anthropic from '@anthropic-ai/sdk';
import { CHARACTERS, TOPIC_WORDS, GENERIC, PLACES } from './story.js';

const MODEL = 'claude-opus-5-5';

export class Voices {
  constructor(settings) {
    this.settings = settings; this.sample = null; this.sampleChecked = false; this.sampleDenied = false;
    this.rot = {};
    // find out (quietly, never asking the viewer anything) whether the live voice exists here
    this.ready = (async () => {
      try { if (window.claude && window.claude.use) this.sample = await window.claude.use('sample'); } catch (_) { this.sample = null; }
      this.sampleChecked = true;
    })();
  }
  mode() {
    const want = this.settings.voice || 'auto';
    if (want === 'offline') return 'offline';
    if ((want === 'auto' || want === 'live') && this.sample && !this.sampleDenied) return 'live';
    if ((want === 'auto' || want === 'key') && this.settings.apiKey) return 'key';
    return 'offline';
  }
  modeLabel() { return { live: 'Live voices (your Claude account)', key: 'Live voices (your API key)', offline: 'Written voices (offline)' }[this.mode()]; }

  greet(id) { const c = CHARACTERS[id]; return this._pick(id + ':greet', c.greet || GENERIC.default); }

  /** Answer the player. history: [{role:'player'|'npc', text}] of this conversation. ctx: game facts. */
  async reply(id, history, text, ctx, onText, signal) {
    const m = this.mode();
    if (m === 'live') {
      try { return await this._live(id, history, text, ctx, onText, signal); }
      catch (e) {
        if (e && e.code === 'not_granted') this.sampleDenied = true;
        if (e && e.code === 'cancelled') throw e;
        // fall through to the written voice so the conversation never dead-ends
      }
    } else if (m === 'key') {
      try { return await this._key(id, history, text, ctx, onText, signal); }
      catch (e) { if (signal && signal.aborted) throw e; this.lastError = e && e.message; }
    }
    const t = this.offline(id, text, ctx); onText && onText(t); return t;
  }

  prompt(id, ctx) {
    const c = CHARACTERS[id];
    const places = Object.entries(PLACES).map(([k, v]) => `${k} = ${v.name}`).join('; ');
    return `You are voicing one character in UNDERTOW, a literary first-person game set in present-day San Francisco, a city full of the dead who have not left. The tone is quiet, strange, humane and specific to the city, never campy.

CHARACTER: ${c.name}, ${c.title}.
WHO: ${c.who}
VOICE: ${c.voice}
KNOWS: ${c.knows}
WANTS: ${c.wants}

THE PLAYER: "${ctx.name}", who came to the city on the last ferry because their dying mother, Marisela, asked them to find their father, Hollis Vane. ${ctx.dead ? 'The player has died (the murmurs took their breath) and now walks among the dead; they know it.' : 'The player does not yet know that they (and most people they meet) are dead. Do not tell them they are dead; you may hint that the city is strange.'}
STORY SO FAR: ${ctx.progress}
PLAYER'S HEART: ${ctx.light > 1 ? 'kind and open' : ctx.light < -1 ? 'hard and grasping' : 'undecided'}. ${ctx.extra || ''}

RULES:
- Speak only as ${c.name}, in first person, out loud, in your own voice. No stage directions, no narration, no lists, no markdown.
- Keep it short: one to three brief paragraphs, under 90 words in total. Leave room for the player to ask more.
- You are a person in a city, not a guide. Have opinions, moods, secrets and your own agenda; you can refuse, tease, change the subject or ask the player something back.
- Stay inside the story. Never mention games, players, prompts, chatbots, or anything about being artificial. The rumor that Hollis Vane "uploaded" the dead into computers is only a rumor; the truth, as far as anyone knows it, is older and stranger. Do not confirm the rumor.
- Only say what your character would know. Do not reveal story events the player has not reached.
- Keep facts about real San Francisco accurate.
- If you want to send the player somewhere, end your reply with one tag exactly like [[go:placeid]] using one of these ids: ${places}. Use it only when you are actually pointing them somewhere.`;
  }
  _turns(history, text) {
    const t = history.slice(-10).map(h => ({ role: h.role === 'player' ? 'user' : 'assistant', content: h.text }));
    while (t.length && t[0].role !== 'user') t.shift();
    // merge consecutive roles
    const out = [];
    for (const x of t) { if (out.length && out[out.length - 1].role === x.role) out[out.length - 1].content += '\n' + x.content; else out.push({ ...x }); }
    if (out.length && out[out.length - 1].role === 'user') out[out.length - 1].content += '\n' + text; else out.push({ role: 'user', content: text });
    return out;
  }
  async _live(id, history, text, ctx, onText, signal) {
    const turns = [{ role: 'user', content: this.prompt(id, ctx) + '\n\nThe conversation starts now. Reply to what the player says next.' }, ...this._turns(history, text)];
    const r = await this.sample(turns, { modelTier: 'quick', cache: false, signal, onText: onText ? ({ text: t }) => onText(t) : undefined });
    return r.text;
  }
  async _key(id, history, text, ctx, onText, signal) {
    const client = new Anthropic({ apiKey: this.settings.apiKey, dangerouslyAllowBrowser: true });
    const stream = client.beta.messages.stream({
      model: MODEL, max_tokens: 1024,
      system: this.prompt(id, ctx),
      messages: this._turns(history, text),
      output_config: { effort: 'low' },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default'
    }, { signal });
    let acc = '';
    stream.on('text', d => { acc += d; onText && onText(acc); });
    const msg = await stream.finalMessage();
    if (msg.stop_reason === 'refusal') throw new Error('refused');
    return msg.content.filter(b => b.type === 'text').map(b => b.text).join('') || acc;
  }

  /* ---------- the written voice ---------- */
  topicOf(text) {
    const t = ' ' + text.toLowerCase() + ' ';
    let best = null, bestLen = 0;
    for (const [topic, words] of Object.entries(TOPIC_WORDS)) for (const w of words) if (t.includes(w) && w.length > bestLen) { best = topic; bestLen = w.length; }
    return best;
  }
  offline(id, text, ctx) {
    const c = CHARACTERS[id];
    let topic = this.topicOf(text);
    if (topic === 'dead' && !ctx.dead && c.topics.dead && id === 'dot') topic = 'dead';
    let lines = topic && c.topics[topic];
    if (!lines && topic === 'wren' && c.topics.wren) lines = c.topics.wren;
    if (!lines && topic === 'remnant') lines = c.topics.vane;
    if (!lines && topic === 'susannah') lines = c.topics.vane;
    if (!lines && topic === 'hollows') lines = c.topics.dead;
    if (!lines && topic === 'murmurs') lines = c.topics.dead;
    if (!lines && (topic === 'sea' || topic === 'fog')) lines = c.topics.city;
    if (!lines && topic === 'ohlone') lines = c.topics.stairs || c.topics.city;
    if (!lines && topic) lines = GENERIC[topic];
    if (!lines) {
      // nothing matched: say something of their own, from their store of talk
      const all = Object.values(c.topics).flat();
      lines = /\?\s*$/.test(text) ? GENERIC.default.concat(all.slice(0, 2)) : all;
    }
    let line = this._pick(id + ':' + (topic || 'any'), lines);
    // before the player knows, nobody tells them they are dead
    if (!ctx.dead && /you\'re (one of|dead)|you stopped breathing|you died|took your breath/i.test(line)) line = this._pick(id + ':default', GENERIC.default);
    const g = c.guide && c.guide[0];
    if (topic === 'where' && g) line += ` [[go:${g}]]`;
    return line;
  }
  _pick(key, arr) { const i = (this.rot[key] = ((this.rot[key] ?? -1) + 1)) % arr.length; return arr[i]; }
}

/** Pull [[go:placeid]] out of a reply. */
export function parseTags(text) {
  let go = null;
  const clean = text.replace(/\[\[\s*go\s*:\s*([a-z0-9_-]+)\s*\]\]/gi, (_, id) => { if (PLACES[id]) go = id; return ''; }).trim();
  return { text: clean, go };
}

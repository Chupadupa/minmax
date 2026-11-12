import { useState, useEffect, useCallback, useRef } from "react";

// ── Speech Hook ──────────────────────────────────────────────────────────────
//
// Says a word or two aloud with the Web Speech API, using the device's voice
// for a language ("en", "fr", …). `available` is false when the browser has
// no speech at all, so the toy can hide its 🔊 button; `hasVoice` is also
// false when the device has no voice for the language (until the browser has
// listed its voices, it's assumed to have one).
//
// `prefer` lists language tags to try first, in order ("es-mx", "es-us"); any
// voice for `lang` is the fallback. Where a tag prefix isn't enough to say
// which voices will do, `match` is a pattern for the voices to consider and
// `prefer` can hold patterns too (Mandarin is zh-… or cmn-…, but not zh-HK).
//
// `speak` takes a string, or a list of strings said one after another — long
// text is best split up with chunkSpeech, since some browsers cut off a single
// long utterance partway through.
//
// Usage:
//   const speech = useSpeech({ lang: "en" });
//   <button onClick={() => speech.speak("Jupiter")}>🔊</button>

const tagOf = (v) => v.lang.replace("_", "-").toLowerCase();
const fits = (voice, want) => (want instanceof RegExp ? want.test(tagOf(voice)) : tagOf(voice).startsWith(want));

// The voice to use: the first of `prefer` that the device has, else any that
// matches. Among equals, the device's default voice wins.
export function pickVoice(voices, { lang, match = lang, prefer = [] }) {
  const pick = (list) => list.find((v) => v.default) || list[0] || null;
  const matching = voices.filter((v) => fits(v, match));
  for (const want of prefer) {
    const voice = pick(matching.filter((v) => fits(v, want)));
    if (voice) return voice;
  }
  return pick(matching);
}

// Joins short pieces of text into utterances of up to `maxLength` characters,
// keeping each piece whole.
export function chunkSpeech(pieces, { joiner = " ", maxLength }) {
  const chunks = [];
  for (const piece of pieces) {
    const last = chunks.length - 1;
    if (chunks.length && chunks[last].length + piece.length <= maxLength) chunks[last] += joiner + piece;
    else chunks.push(piece);
  }
  return chunks;
}

export function useSpeech({ lang = "en", rate = 0.85, match, prefer = [] } = {}) {
  const synth = typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null;
  const [voices, setVoices] = useState([]);
  const [speaking, setSpeaking] = useState(false);
  const runRef = useRef(0);

  useEffect(() => {
    if (!synth) return;
    const load = () => setVoices(synth.getVoices());
    load();
    synth.addEventListener?.("voiceschanged", load);
    return () => {
      synth.removeEventListener?.("voiceschanged", load);
      synth.cancel();
    };
  }, [synth]);

  const voice = pickVoice(voices, { lang, match, prefer });
  // With no voice listed yet, the browser picks one from this language tag.
  const fallbackLang = typeof prefer[0] === "string" ? prefer[0] : lang;

  const stop = useCallback(() => {
    runRef.current++;
    synth?.cancel();
    setSpeaking(false);
  }, [synth]);

  const speak = useCallback((text) => {
    const chunks = (Array.isArray(text) ? text : [text]).filter(Boolean);
    if (!synth || !chunks.length) return;
    synth.cancel();
    const run = ++runRef.current;
    const finish = () => { if (runRef.current === run) setSpeaking(false); };
    chunks.forEach((chunk, i) => {
      const u = new SpeechSynthesisUtterance(chunk);
      u.lang = voice?.lang ?? fallbackLang;
      if (voice) u.voice = voice;
      u.rate = rate;
      if (i === chunks.length - 1) u.onend = finish;
      u.onerror = finish;
      synth.speak(u);
    });
    setSpeaking(true);
  }, [synth, voice, fallbackLang, rate]);

  const hasVoice = !!synth && (!!voice || voices.length === 0);
  return { available: !!synth, hasVoice, speaking, speak, stop };
}

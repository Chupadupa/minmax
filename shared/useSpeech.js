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
// voice for `lang` is the fallback. `speak` takes a string, or a list of
// strings said one after another — long text is best split up, since some
// browsers cut off a single long utterance partway through.
//
// Usage:
//   const speech = useSpeech({ lang: "en" });
//   <button onClick={() => speech.speak("Jupiter")}>🔊</button>

const tagOf = (v) => v.lang.replace("_", "-").toLowerCase();

export function useSpeech({ lang = "en", rate = 0.85, prefer = [] } = {}) {
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

  const pick = (list) => list.find((v) => v.default) || list[0] || null;
  const matching = voices.filter((v) => tagOf(v).startsWith(lang));
  let voice = null;
  for (const tag of prefer) {
    voice = pick(matching.filter((v) => tagOf(v).startsWith(tag)));
    if (voice) break;
  }
  voice = voice || pick(matching);

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
      u.lang = voice?.lang ?? prefer[0] ?? lang;
      if (voice) u.voice = voice;
      u.rate = rate;
      if (i === chunks.length - 1) u.onend = finish;
      u.onerror = finish;
      synth.speak(u);
    });
    setSpeaking(true);
  }, [synth, voice, lang, rate, prefer[0]]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasVoice = !!synth && (!!voice || voices.length === 0);
  return { available: !!synth, hasVoice, speaking, speak, stop };
}

import { useState, useEffect, useCallback, useRef } from "react";

// ── Speech Hook ──────────────────────────────────────────────────────────────
//
// Says a word or two aloud with the Web Speech API, using the device's voice
// for a language ("en", "fr", …). `available` is false when the browser has
// no speech at all, so the toy can hide its 🔊 button.
//
// Usage:
//   const speech = useSpeech({ lang: "en" });
//   <button onClick={() => speech.speak("Jupiter")}>🔊</button>

export function useSpeech({ lang = "en", rate = 0.85 } = {}) {
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

  const matching = voices.filter((v) => v.lang.replace("_", "-").toLowerCase().startsWith(lang));
  const voice = matching.find((v) => v.default) || matching[0] || null;

  const stop = useCallback(() => {
    runRef.current++;
    synth?.cancel();
    setSpeaking(false);
  }, [synth]);

  const speak = useCallback((text) => {
    if (!synth || !text) return;
    synth.cancel();
    const run = ++runRef.current;
    const finish = () => { if (runRef.current === run) setSpeaking(false); };
    const u = new SpeechSynthesisUtterance(text);
    u.lang = voice?.lang ?? lang;
    if (voice) u.voice = voice;
    u.rate = rate;
    u.onend = finish;
    u.onerror = finish;
    synth.speak(u);
    setSpeaking(true);
  }, [synth, voice, lang, rate]);

  return { available: !!synth, speaking, speak, stop };
}

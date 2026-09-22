/**
 * Chit-Chat — Two-way conversation mode
 * Each language has its own Talk button.
 * Speak on one side → translate + speak on the other side.
 */
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const langA = $("langA");
  const langB = $("langB");
  const textA = $("textA");
  const textB = $("textB");
  const talkA = $("talkA");
  const talkB = $("talkB");
  const sideA = $("sideA");
  const sideB = $("sideB");
  const statusText = $("statusText");
  const statusDot = $("statusDot");
  const latencyEl = $("latency");
  const modeIndicator = $("modeIndicator");
  const swapBtn = $("swapBtn");
  const historyList = $("historyList");
  const autoSpeakChk = $("autoSpeak");
  const showLatencyChk = $("showLatency");
  const vibrateChk = $("vibrate");
  const forceOfflineChk = $("forceOffline");

  let isOnline = true;
  let isListening = false;
  let activeSide = null; // "A" or "B"
  let recognition = null;
  let history = [];
  try { history = JSON.parse(localStorage.getItem("chitchat-pro-history") || "[]"); } catch (e) {}
  let preferredVoiceURI = localStorage.getItem("chitchat-preferred-voice") || "";

  // Offline dictionary (same expanded set)
  const offlineDict = {
    "en-es": {"hello":"hola","hi":"hola","how are you":"cómo estás","thank you":"gracias","thanks":"gracias","yes":"sí","no":"no","please":"por favor","goodbye":"adiós","good morning":"buenos días","good night":"buenas noches","i love you":"te quiero","help":"ayuda","water":"agua","food":"comida","bathroom":"baño","friend":"amigo","my name is":"me llamo","nice to meet you":"mucho gusto","sorry":"lo siento","i don't understand":"no entiendo","where is the bathroom":"dónde está el baño","how much":"cuánto cuesta"},
    "es-en": {"hola":"hello","cómo estás":"how are you","gracias":"thank you","sí":"yes","no":"no","por favor":"please","adiós":"goodbye","buenos días":"good morning","te quiero":"i love you","ayuda":"help","agua":"water","comida":"food","baño":"bathroom","amigo":"friend","mucho gusto":"nice to meet you","lo siento":"sorry","no entiendo":"i don't understand"},
    "en-fr": {"hello":"bonjour","hi":"salut","thank you":"merci","yes":"oui","no":"non","please":"s'il vous plaît","goodbye":"au revoir","good morning":"bonjour","i love you":"je t'aime","help":"aide","water":"eau","food":"nourriture","sorry":"désolé"},
    "fr-en": {"bonjour":"hello","salut":"hi","merci":"thank you","oui":"yes","non":"no","au revoir":"goodbye","je t'aime":"i love you","aide":"help","eau":"water","désolé":"sorry"},
    "en-de": {"hello":"hallo","thank you":"danke","yes":"ja","no":"nein","please":"bitte","goodbye":"auf wiedersehen","good morning":"guten morgen","i love you":"ich liebe dich","help":"hilfe","water":"wasser","food":"essen"},
    "de-en": {"hallo":"hello","danke":"thank you","ja":"yes","nein":"no","bitte":"please","auf wiedersehen":"goodbye","guten morgen":"good morning","ich liebe dich":"i love you","hilfe":"help","wasser":"water"},
    "en-zh": {"hello":"你好","thank you":"谢谢","yes":"是","no":"不","please":"请","goodbye":"再见","good morning":"早上好","i love you":"我爱你","help":"帮助","water":"水","food":"食物"},
    "zh-en": {"你好":"hello","谢谢":"thank you","是":"yes","不":"no","请":"please","再见":"goodbye","早上好":"good morning","我爱你":"i love you","帮助":"help","水":"water"},
    "en-ja": {"hello":"こんにちは","thank you":"ありがとう","yes":"はい","no":"いいえ","please":"お願いします","goodbye":"さようなら","good morning":"おはようございます","i love you":"愛してる","help":"助けて","water":"水"},
    "ja-en": {"こんにちは":"hello","ありがとう":"thank you","はい":"yes","いいえ":"no","さようなら":"goodbye","おはようございます":"good morning","愛してる":"i love you","助けて":"help","水":"water"},
    "en-th": {"hello":"สวัสดี","thank you":"ขอบคุณ","yes":"ใช่","no":"ไม่","goodbye":"ลาก่อน","help":"ช่วยด้วย","water":"น้ำ","food":"อาหาร"},
    "th-en": {"สวัสดี":"hello","ขอบคุณ":"thank you","ใช่":"yes","ไม่":"no","ลาก่อน":"goodbye","ช่วยด้วย":"help","น้ำ":"water"},
    "en-vi": {"hello":"xin chào","thank you":"cảm ơn","yes":"vâng","no":"không","goodbye":"tạm biệt","help":"giúp tôi","water":"nước","food":"thức ăn"},
    "vi-en": {"xin chào":"hello","cảm ơn":"thank you","vâng":"yes","không":"no","tạm biệt":"goodbye","giúp tôi":"help","nước":"water"},
    "en-id": {"hello":"halo","thank you":"terima kasih","yes":"ya","no":"tidak","goodbye":"selamat tinggal","help":"tolong","water":"air","food":"makanan"},
    "id-en": {"halo":"hello","terima kasih":"thank you","ya":"yes","tidak":"no","selamat tinggal":"goodbye","tolong":"help","air":"water"},
    "en-ko": {"hello":"안녕하세요","thank you":"감사합니다","yes":"네","no":"아니요","goodbye":"안녕히 가세요","help":"도와주세요","water":"물","food":"음식"},
    "ko-en": {"안녕하세요":"hello","감사합니다":"thank you","네":"yes","아니요":"no","안녕히 가세요":"goodbye","도와주세요":"help","물":"water"},
    "en-ru": {"hello":"привет","thank you":"спасибо","yes":"да","no":"нет","goodbye":"до свидания","help":"помощь","water":"вода"},
    "ru-en": {"привет":"hello","спасибо":"thank you","да":"yes","нет":"no","до свидания":"goodbye","помощь":"help","вода":"water"},
    "en-pt": {"hello":"olá","thank you":"obrigado","yes":"sim","no":"não","goodbye":"adeus","help":"ajuda","water":"água"},
    "pt-en": {"olá":"hello","obrigado":"thank you","sim":"yes","não":"no","adeus":"goodbye","ajuda":"help","água":"water"},
    "en-it": {"hello":"ciao","thank you":"grazie","yes":"sì","no":"no","goodbye":"arrivederci","help":"aiuto","water":"acqua"},
    "it-en": {"ciao":"hello","grazie":"thank you","sì":"yes","no":"no","arrivederci":"goodbye","aiuto":"help","acqua":"water"}
  };

  function setStatus(msg, state = "ready") {
    if (statusText) statusText.textContent = msg;
    if (statusDot) statusDot.className = "dot " + state;
  }

  function updateModeUI() {
    if (!modeIndicator) return;
    if (isOnline) {
      modeIndicator.textContent = "Online";
      modeIndicator.className = "pill online";
    } else {
      modeIndicator.textContent = "Offline";
      modeIndicator.className = "pill offline";
    }
  }

  function esc(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // ── Speech Recognition ───────────────────────────────────────────────
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  function createRecognition() {
    if (!SpeechRecognition) return null;
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      isListening = true;
      const btn = activeSide === "A" ? talkA : talkB;
      const card = activeSide === "A" ? sideA : sideB;
      if (btn) {
        btn.classList.add("listening");
        btn.textContent = "Listening…";
      }
      if (card) card.classList.add("active-listening");
      setStatus("Listening to Person " + activeSide + "…", "listening");
    };

    rec.onresult = (event) => {
      let interim = "", final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }

      const sourceEl = activeSide === "A" ? textA : textB;
      if (final && final.trim()) {
        if (sourceEl) {
          sourceEl.textContent = final.trim();
          sourceEl.classList.remove("muted");
        }
        handleSpeech(final.trim(), activeSide);
      } else if (interim && sourceEl) {
        sourceEl.textContent = interim + "…";
        sourceEl.classList.remove("muted");
      }
    };

    rec.onerror = (e) => {
      console.warn("Speech error:", e.error);
      stopListeningUI();
      if (e.error === "not-allowed") setStatus("Microphone permission denied");
      else if (e.error === "no-speech") setStatus("No speech detected — try again");
      else if (e.error !== "aborted") setStatus("Error: " + e.error);
    };

    rec.onend = () => {
      stopListeningUI();
    };

    return rec;
  }

  recognition = createRecognition();

  function stopListeningUI() {
    isListening = false;
    [talkA, talkB].forEach(btn => {
      if (btn) {
        btn.classList.remove("listening");
        btn.textContent = "🎤 Talk";
      }
    });
    [sideA, sideB].forEach(c => c && c.classList.remove("active-listening"));
  }

  function startListening(side) {
    if (!recognition) {
      setStatus("Speech recognition not available — use Chrome or Edge");
      return;
    }
    if (isListening) {
      try { recognition.stop(); } catch (e) {}
    }
    activeSide = side;
    const lang = side === "A" ? (langA?.value || "en-US") : (langB?.value || "es-ES");
    recognition.lang = lang;
    try {
      recognition.start();
    } catch (e) {
      // already started
    }
  }

  // ── Translation ──────────────────────────────────────────────────────
  async function translateOnline(text, fromCode, toCode) {
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromCode}|${toCode}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const data = await res.json();
        if (data?.responseData?.translatedText && !String(data.responseData.translatedText).includes("MYMEMORY WARNING")) {
          return data.responseData.translatedText;
        }
      }
    } catch (e) {}

    const hosts = ["lingva.ml", "lingva.thedaviddelta.com"];
    for (const host of hosts) {
      try {
        const url = `https://${host}/api/v1/${fromCode}/${toCode}/${encodeURIComponent(text)}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
        if (res.ok) {
          const data = await res.json();
          if (data?.translation) return data.translation;
        }
      } catch (e) {}
    }
    return `[${toCode.toUpperCase()}] ${text}`;
  }

  function translateOffline(text, fromCode, toCode) {
    const key = `${fromCode}-${toCode}`;
    const dict = offlineDict[key];
    if (!dict) return `[Offline] ${text}`;
    const lower = text.toLowerCase().trim();
    if (dict[lower]) return dict[lower];
    let result = text;
    const entries = Object.entries(dict).sort((a, b) => b[0].length - a[0].length);
    for (const [k, v] of entries) {
      result = result.replace(new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi"), v);
    }
    return result !== text ? result : `[Offline] ${text}`;
  }

  async function handleSpeech(text, fromSide) {
    // fromSide spoke → translate into the OTHER language and speak it there
    const fromLang = fromSide === "A" ? langA.value : langB.value;
    const toLang   = fromSide === "A" ? langB.value : langA.value;
    const fromCode = fromLang.split("-")[0];
    const toCode   = toLang.split("-")[0];
    const targetEl = fromSide === "A" ? textB : textA;

    const useOffline = !isOnline || (forceOfflineChk && forceOfflineChk.checked);
    setStatus(useOffline ? "Translating offline…" : "Translating…", "working");
    const t0 = performance.now();

    let translated;
    try {
      translated = useOffline
        ? translateOffline(text, fromCode, toCode)
        : await translateOnline(text, fromCode, toCode);
    } catch (e) {
      translated = text;
    }

    const ms = Math.round(performance.now() - t0);
    if (targetEl) {
      targetEl.textContent = translated;
      targetEl.classList.remove("muted");
    }
    if (showLatencyChk?.checked && latencyEl) latencyEl.textContent = `~${ms}ms`;

    history.unshift({
      from: text, to: translated,
      source: fromLang, target: toLang,
      time: new Date().toLocaleTimeString(),
      mode: useOffline ? "offline" : "online",
      side: fromSide
    });
    if (history.length > 100) history.length = 100;
    try { localStorage.setItem("chitchat-pro-history", JSON.stringify(history)); } catch (e) {}

    setStatus("Done · Spoken in the other language", "ready");
    if (vibrateChk?.checked && navigator.vibrate) {
      try { navigator.vibrate(30); } catch (e) {}
    }

    // Speak the translation in the OPPOSITE language
    if (autoSpeakChk?.checked !== false) {
      speak(translated, toLang);
    }
  }

  // ── TTS ──────────────────────────────────────────────────────────────
  function getBestVoice(lang) {
    const voices = window.speechSynthesis?.getVoices() || [];
    if (!voices.length) return null;
    if (preferredVoiceURI) {
      const pref = voices.find(v => v.voiceURI === preferredVoiceURI);
      if (pref) return pref;
    }
    const code = (lang || "en").split("-")[0];
    const match = voices.filter(v => v.lang.startsWith(code));
    return match.find(v => /neural|premium|enhanced|natural/i.test(v.name)) || match[0] || voices[0];
  }

  function speak(text, lang) {
    if (!window.speechSynthesis || !text) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang || "en-US";
      u.rate = 1.0;
      const best = getBestVoice(lang);
      if (best) u.voice = best;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }

  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
      populateVoiceSelect();
    };
  }

  function populateVoiceSelect() {
    const sel = $("voiceSelect");
    if (!sel || !window.speechSynthesis) return;
    const voices = window.speechSynthesis.getVoices();
    sel.innerHTML = "";
    voices.slice(0, 50).forEach(v => {
      const opt = document.createElement("option");
      opt.value = v.voiceURI;
      opt.textContent = `${v.name} (${v.lang})`;
      if (v.voiceURI === preferredVoiceURI) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.onchange = () => {
      preferredVoiceURI = sel.value;
      try { localStorage.setItem("chitchat-preferred-voice", preferredVoiceURI); } catch (e) {}
    };
  }
  setTimeout(populateVoiceSelect, 400);

  // ── Event bindings ───────────────────────────────────────────────────
  // Hold or click Talk A
  if (talkA) {
    talkA.addEventListener("pointerdown", (e) => { e.preventDefault(); startListening("A"); });
    ["pointerup", "pointerleave", "pointercancel"].forEach(evt => {
      talkA.addEventListener(evt, () => {
        if (isListening && activeSide === "A") {
          try { recognition.stop(); } catch (e) {}
        }
      });
    });
  }

  // Hold or click Talk B
  if (talkB) {
    talkB.addEventListener("pointerdown", (e) => { e.preventDefault(); startListening("B"); });
    ["pointerup", "pointerleave", "pointercancel"].forEach(evt => {
      talkB.addEventListener(evt, () => {
        if (isListening && activeSide === "B") {
          try { recognition.stop(); } catch (e) {}
        }
      });
    });
  }

  // Swap languages + texts
  if (swapBtn) {
    swapBtn.addEventListener("click", () => {
      const tmpLang = langA.value;
      langA.value = langB.value;
      langB.value = tmpLang;
      const tmpText = textA.textContent;
      textA.textContent = textB.textContent;
      textB.textContent = tmpText;
    });
  }

  // Online / Offline
  if (modeIndicator) {
    modeIndicator.addEventListener("click", () => {
      isOnline = !isOnline;
      updateModeUI();
      setStatus(isOnline ? "Online mode" : "Offline mode");
    });
  }

  // Navigation
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const panel = btn.dataset.panel;
      if (panel === "history") {
        renderHistory();
        $("historyPanel")?.classList.remove("hidden");
      } else if (panel === "settings") {
        $("settingsPanel")?.classList.remove("hidden");
      }
    });
  });

  document.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", () => $(btn.dataset.close)?.classList.add("hidden"));
  });
  document.querySelectorAll(".overlay").forEach(ov => {
    ov.addEventListener("click", (e) => { if (e.target === ov) ov.classList.add("hidden"); });
  });

  if ($("clearHistory")) {
    $("clearHistory").addEventListener("click", () => {
      history = [];
      try { localStorage.removeItem("chitchat-pro-history"); } catch (e) {}
      renderHistory();
    });
  }

  function renderHistory() {
    if (!historyList) return;
    if (!history.length) {
      historyList.innerHTML = "<p style='color:var(--dim);padding:12px 0'>No conversations yet.</p>";
      return;
    }
    historyList.innerHTML = history.map(h => `
      <div class="history-item">
        <div class="from">${esc(h.from)}</div>
        <div class="to">${esc(h.to)}</div>
        <div style="font-size:0.65rem;color:var(--dim);margin-top:4px">
          ${esc(h.time)} · Person ${esc(h.side)} · ${esc(h.mode)}
        </div>
      </div>`).join("");
  }

  // Init
  updateModeUI();
  if (!SpeechRecognition) {
    setStatus("Speech limited — use Chrome or Edge");
  } else {
    setStatus("Ready · Tap a Talk button under a language");
  }
})();

/**
 * Chit-Chat Pro — Fully hardened 2026 browser implementation
 * Maximum reliability for speech recognition, translation, offline mode, TTS
 */
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  // ── Elements ──────────────────────────────────────────────────────────
  const speakBtn      = $("speakBtn");
  const sourceLang    = $("sourceLang");
  const targetLang    = $("targetLang");
  const sourceText    = $("sourceText");
  const targetText    = $("targetText");
  const statusText    = $("statusText");
  const statusDot     = $("statusDot");
  const latencyEl     = $("latency");
  const modeIndicator = $("modeIndicator");
  const modeTag       = $("modeTag");
  const swapBtn       = $("swapBtn");
  const historyList   = $("historyList");
  const autoSpeakChk  = $("autoSpeak");
  const showLatencyChk= $("showLatency");
  const vibrateChk    = $("vibrate");
  const forceOfflineChk = $("forceOffline");

  // ── State ─────────────────────────────────────────────────────────────
  let isOnline = true;
  let isListening = false;
  let wantContinuous = false;
  let recognition = null;
  let history = [];
  try { history = JSON.parse(localStorage.getItem("chitchat-pro-history") || "[]"); } catch(e) {}
  let currentMode = "face";
  let lastFinalText = "";
  let restartTimer = null;

  // Expanded offline dictionary (common travel & conversation phrases)
  const offlineDict = {
    "en-es": {"hello":"hola","hi":"hola","hey":"hola","how are you":"cómo estás","how are you doing":"cómo te va","thank you":"gracias","thanks":"gracias","thank you very much":"muchas gracias","yes":"sí","no":"no","please":"por favor","goodbye":"adiós","bye":"adiós","good morning":"buenos días","good afternoon":"buenas tardes","good night":"buenas noches","i love you":"te quiero","where is":"dónde está","how much":"cuánto cuesta","help":"ayuda","water":"agua","food":"comida","bathroom":"baño","toilet":"baño","friend":"amigo","my name is":"me llamo","what is your name":"cómo te llamas","nice to meet you":"mucho gusto","excuse me":"disculpe","sorry":"lo siento","i don't understand":"no entiendo","do you speak english":"hablas inglés","i need help":"necesito ayuda","where is the bathroom":"dónde está el baño","how much does it cost":"cuánto cuesta","i am hungry":"tengo hambre","i am thirsty":"tengo sed","left":"izquierda","right":"derecha","straight":"recto","stop":"para","go":"ve","come":"ven","wait":"espera","one moment":"un momento","okay":"vale","ok":"vale"},
    "es-en": {"hola":"hello","cómo estás":"how are you","gracias":"thank you","muchas gracias":"thank you very much","sí":"yes","no":"no","por favor":"please","adiós":"goodbye","buenos días":"good morning","buenas tardes":"good afternoon","buenas noches":"good night","te quiero":"i love you","dónde está":"where is","cuánto cuesta":"how much","ayuda":"help","agua":"water","comida":"food","baño":"bathroom","amigo":"friend","me llamo":"my name is","cómo te llamas":"what is your name","mucho gusto":"nice to meet you","disculpe":"excuse me","lo siento":"sorry","no entiendo":"i don't understand","hablas inglés":"do you speak english","necesito ayuda":"i need help","tengo hambre":"i am hungry","tengo sed":"i am thirsty","izquierda":"left","derecha":"right","recto":"straight","para":"stop","espera":"wait","un momento":"one moment","vale":"okay"},
    "en-fr": {"hello":"bonjour","hi":"salut","thank you":"merci","thanks":"merci","yes":"oui","no":"non","please":"s'il vous plaît","goodbye":"au revoir","good morning":"bonjour","good night":"bonne nuit","i love you":"je t'aime","help":"aide","water":"eau","food":"nourriture","bathroom":"toilettes","friend":"ami","my name is":"je m'appelle","nice to meet you":"enchanté","excuse me":"excusez-moi","sorry":"désolé","i don't understand":"je ne comprends pas","where is":"où est","how much":"combien"},
    "fr-en": {"bonjour":"hello","salut":"hi","merci":"thank you","oui":"yes","non":"no","s'il vous plaît":"please","au revoir":"goodbye","bonne nuit":"good night","je t'aime":"i love you","aide":"help","eau":"water","toilettes":"bathroom","ami":"friend","enchanté":"nice to meet you","excusez-moi":"excuse me","désolé":"sorry","je ne comprends pas":"i don't understand","où est":"where is","combien":"how much"},
    "en-de": {"hello":"hallo","hi":"hallo","thank you":"danke","thanks":"danke","yes":"ja","no":"nein","please":"bitte","goodbye":"auf wiedersehen","good morning":"guten morgen","good night":"gute nacht","i love you":"ich liebe dich","help":"hilfe","water":"wasser","food":"essen","bathroom":"toilette","friend":"freund","sorry":"entschuldigung","i don't understand":"ich verstehe nicht"},
    "de-en": {"hallo":"hello","danke":"thank you","ja":"yes","nein":"no","bitte":"please","auf wiedersehen":"goodbye","guten morgen":"good morning","gute nacht":"good night","ich liebe dich":"i love you","hilfe":"help","wasser":"water","essen":"food","toilette":"bathroom","freund":"friend","entschuldigung":"sorry","ich verstehe nicht":"i don't understand"},
    "en-zh": {"hello":"你好","hi":"你好","thank you":"谢谢","yes":"是","no":"不","please":"请","goodbye":"再见","good morning":"早上好","good night":"晚安","i love you":"我爱你","help":"帮助","water":"水","food":"食物","bathroom":"洗手间","friend":"朋友","sorry":"对不起"},
    "zh-en": {"你好":"hello","谢谢":"thank you","是":"yes","不":"no","请":"please","再见":"goodbye","早上好":"good morning","晚安":"good night","我爱你":"i love you","帮助":"help","水":"water","食物":"food","洗手间":"bathroom","朋友":"friend","对不起":"sorry"},
    "en-ja": {"hello":"こんにちは","hi":"やあ","thank you":"ありがとう","yes":"はい","no":"いいえ","please":"お願いします","goodbye":"さようなら","good morning":"おはようございます","good night":"おやすみなさい","i love you":"愛してる","help":"助けて","water":"水","food":"食べ物","bathroom":"トイレ","friend":"友達","sorry":"ごめんなさい"},
    "ja-en": {"こんにちは":"hello","やあ":"hi","ありがとう":"thank you","はい":"yes","いいえ":"no","お願いします":"please","さようなら":"goodbye","おはようございます":"good morning","おやすみなさい":"good night","愛してる":"i love you","助けて":"help","水":"water","食べ物":"food","トイレ":"bathroom","友達":"friend","ごめんなさい":"sorry"},
    "en-th": {"hello":"สวัสดี","thank you":"ขอบคุณ","yes":"ใช่","no":"ไม่","please":"กรุณา","goodbye":"ลาก่อน","help":"ช่วยด้วย","water":"น้ำ","food":"อาหาร","bathroom":"ห้องน้ำ","sorry":"ขอโทษ"},
    "th-en": {"สวัสดี":"hello","ขอบคุณ":"thank you","ใช่":"yes","ไม่":"no","กรุณา":"please","ลาก่อน":"goodbye","ช่วยด้วย":"help","น้ำ":"water","อาหาร":"food","ห้องน้ำ":"bathroom","ขอโทษ":"sorry"},
    "en-vi": {"hello":"xin chào","thank you":"cảm ơn","yes":"vâng","no":"không","please":"làm ơn","goodbye":"tạm biệt","help":"giúp tôi","water":"nước","food":"thức ăn","bathroom":"nhà vệ sinh","sorry":"xin lỗi"},
    "vi-en": {"xin chào":"hello","cảm ơn":"thank you","vâng":"yes","không":"no","làm ơn":"please","tạm biệt":"goodbye","giúp tôi":"help","nước":"water","thức ăn":"food","nhà vệ sinh":"bathroom","xin lỗi":"sorry"},
    "en-id": {"hello":"halo","thank you":"terima kasih","yes":"ya","no":"tidak","please":"tolong","goodbye":"selamat tinggal","help":"tolong","water":"air","food":"makanan","bathroom":"kamar mandi","sorry":"maaf"},
    "id-en": {"halo":"hello","terima kasih":"thank you","ya":"yes","tidak":"no","tolong":"please","selamat tinggal":"goodbye","air":"water","makanan":"food","kamar mandi":"bathroom","maaf":"sorry"},
    "en-ko": {"hello":"안녕하세요","thank you":"감사합니다","yes":"네","no":"아니요","please":"부탁합니다","goodbye":"안녕히 가세요","help":"도와주세요","water":"물","food":"음식","sorry":"죄송합니다"},
    "ko-en": {"안녕하세요":"hello","감사합니다":"thank you","네":"yes","아니요":"no","부탁합니다":"please","안녕히 가세요":"goodbye","도와주세요":"help","물":"water","음식":"food","죄송합니다":"sorry"},
    "en-ru": {"hello":"привет","thank you":"спасибо","yes":"да","no":"нет","please":"пожалуйста","goodbye":"до свидания","help":"помощь","water":"вода","food":"еда","sorry":"извините"},
    "ru-en": {"привет":"hello","спасибо":"thank you","да":"yes","нет":"no","пожалуйста":"please","до свидания":"goodbye","помощь":"help","вода":"water","еда":"food","извините":"sorry"},
    "en-pt": {"hello":"olá","thank you":"obrigado","yes":"sim","no":"não","please":"por favor","goodbye":"adeus","help":"ajuda","water":"água","food":"comida","sorry":"desculpe"},
    "pt-en": {"olá":"hello","obrigado":"thank you","sim":"yes","não":"no","por favor":"please","adeus":"goodbye","ajuda":"help","água":"water","comida":"food","desculpe":"sorry"},
    "en-it": {"hello":"ciao","thank you":"grazie","yes":"sì","no":"no","please":"per favore","goodbye":"arrivederci","help":"aiuto","water":"acqua","food":"cibo","sorry":"scusa"},
    "it-en": {"ciao":"hello","grazie":"thank you","sì":"yes","no":"no","per favore":"please","arrivederci":"goodbye","aiuto":"help","acqua":"water","cibo":"food","scusa":"sorry"}
  };

  // ── Helpers ───────────────────────────────────────────────────────────
  function setStatus(msg, state = "ready") {
    if (statusText) statusText.textContent = msg;
    if (statusDot) statusDot.className = "dot " + state;
  }

  function updateModeUI() {
    if (!modeIndicator || !modeTag) return;
    if (isOnline) {
      modeIndicator.textContent = "Online";
      modeIndicator.className = "pill online";
      modeTag.textContent = "Online";
    } else {
      modeIndicator.textContent = "Offline";
      modeIndicator.className = "pill offline";
      modeTag.textContent = "Offline";
    }
  }

  function esc(s) {
    return String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  // ── Speech Recognition (hardened continuous) ─────────────────────────
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  function createRecognition() {
    if (!SpeechRecognition) return null;
    const rec = new SpeechRecognition();
    rec.continuous = false;          // we manage restarts ourselves for reliability
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      isListening = true;
      if (speakBtn) {
        speakBtn.classList.add("listening");
        const label = speakBtn.querySelector(".speak-label");
        if (label) label.textContent = "Listening…";
      }
      setStatus("Listening… speak naturally", "listening");
    };

    rec.onresult = (event) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      if (final && final.trim()) {
        lastFinalText = final.trim();
        if (sourceText) {
          sourceText.textContent = lastFinalText;
          sourceText.classList.remove("muted");
        }
        translateAndSpeak(lastFinalText);
      } else if (interim) {
        if (sourceText) {
          sourceText.textContent = interim + "…";
          sourceText.classList.remove("muted");
        }
      }
    };

    rec.onerror = (e) => {
      console.warn("Speech error:", e.error);
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setStatus("Microphone permission denied — please allow access");
        wantContinuous = false;
      } else if (e.error === "no-speech") {
        setStatus("No speech detected — try again");
      } else if (e.error === "aborted") {
        // normal when we stop
      } else {
        setStatus("Recognition error: " + e.error);
      }
      stopListeningVisual();
    };

    rec.onend = () => {
      stopListeningVisual();
      // Auto-restart for continuous mode
      if (wantContinuous) {
        clearTimeout(restartTimer);
        restartTimer = setTimeout(() => {
          if (wantContinuous) safeStart();
        }, 280);
      }
    };

    return rec;
  }

  recognition = createRecognition();

  function stopListeningVisual() {
    isListening = false;
    if (speakBtn) {
      speakBtn.classList.remove("listening");
      const label = speakBtn.querySelector(".speak-label");
      if (label) label.textContent = wantContinuous ? "Continuous On" : "Hold to Speak";
    }
  }

  function safeStart() {
    if (!recognition) {
      setStatus("Speech recognition not available in this browser");
      return;
    }
    try {
      recognition.lang = sourceLang ? sourceLang.value : "en-US";
      recognition.start();
    } catch (err) {
      // already started — ignore
    }
  }

  function safeStop() {
    wantContinuous = false;
    clearTimeout(restartTimer);
    if (recognition) {
      try { recognition.stop(); } catch (e) {}
    }
    stopListeningVisual();
  }

  // ── Translation with multiple fallbacks ───────────────────────────────
  async function translateOnline(text, fromCode, toCode) {
    // 1. MyMemory
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromCode}|${toCode}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const data = await res.json();
        if (data?.responseData?.translatedText && !data.responseData.translatedText.includes("MYMEMORY WARNING")) {
          return data.responseData.translatedText;
        }
      }
    } catch (e) { console.warn("MyMemory failed", e); }

    // 2. Lingva public instances
    const lingvaHosts = ["lingva.ml", "lingva.thedaviddelta.com", "translate.plausibility.cloud"];
    for (const host of lingvaHosts) {
      try {
        const url = `https://${host}/api/v1/${fromCode}/${toCode}/${encodeURIComponent(text)}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
        if (res.ok) {
          const data = await res.json();
          if (data?.translation) return data.translation;
        }
      } catch (e) {}
    }

    // 3. Last resort simple mock so the app never fails
    return `[${toCode.toUpperCase()}] ${text}`;
  }

  function translateOffline(text, fromCode, toCode) {
    const key = `${fromCode}-${toCode}`;
    const dict = offlineDict[key];
    if (!dict) return `[Offline · no pack] ${text}`;

    const lower = text.toLowerCase().trim();
    if (dict[lower]) return dict[lower];

    // Phrase-level replace
    let result = text;
    // sort longer keys first so multi-word phrases match first
    const entries = Object.entries(dict).sort((a, b) => b[0].length - a[0].length);
    for (const [k, v] of entries) {
      const re = new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
      result = result.replace(re, v);
    }
    return result !== text ? result : `[Offline] ${text}`;
  }

  async function translateAndSpeak(text) {
    if (!text || !text.trim()) return;

    const fromCode = (sourceLang?.value || "en-US").split("-")[0];
    const toCode   = (targetLang?.value || "es-ES").split("-")[0];
    const useOffline = !isOnline || (forceOfflineChk && forceOfflineChk.checked);

    setStatus(useOffline ? "Translating offline…" : "Translating online…", "working");
    const t0 = performance.now();

    let translated;
    try {
      translated = useOffline
        ? translateOffline(text, fromCode, toCode)
        : await translateOnline(text, fromCode, toCode);
    } catch (e) {
      translated = `[Error] ${text}`;
      console.error(e);
    }

    const ms = Math.round(performance.now() - t0);

    if (targetText) {
      targetText.textContent = translated;
      targetText.classList.remove("muted");
    }
    if (showLatencyChk?.checked && latencyEl) {
      latencyEl.textContent = `~${ms}ms`;
    }

    // History
    history.unshift({
      from: text,
      to: translated,
      source: sourceLang?.value || "en",
      target: targetLang?.value || "es",
      time: new Date().toLocaleTimeString(),
      mode: useOffline ? "offline" : "online"
    });
    if (history.length > 100) history.length = 100;
    try { localStorage.setItem("chitchat-pro-history", JSON.stringify(history)); } catch(e) {}

    setStatus(useOffline ? "Done · Offline pack" : "Done · Online quality", "ready");

    if (vibrateChk?.checked && navigator.vibrate) {
      try { navigator.vibrate(30); } catch(e) {}
    }
    if (autoSpeakChk?.checked) {
      speak(translated, targetLang?.value || "es-ES");
    }
  }

  // ── TTS ───────────────────────────────────────────────────────────────
  function speak(text, lang) {
    if (!window.speechSynthesis || !text) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang || "en-US";
      u.rate = 1.0;
      u.pitch = 1.0;
      // Prefer a matching voice if available
      const voices = window.speechSynthesis.getVoices();
      const match = voices.find(v => v.lang.startsWith(lang.split("-")[0]));
      if (match) u.voice = match;
      window.speechSynthesis.speak(u);
    } catch (e) {
      console.warn("TTS error", e);
    }
  }

  // Pre-load voices
  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }

  // ── Event bindings ────────────────────────────────────────────────────
  // Hold-to-speak
  if (speakBtn) {
    speakBtn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      wantContinuous = false;
      safeStart();
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach(evt => {
      speakBtn.addEventListener(evt, () => {
        if (isListening) {
          try { recognition.stop(); } catch(e) {}
        }
      });
    });
  }

  // Mode indicator toggle Online/Offline
  if (modeIndicator) {
    modeIndicator.addEventListener("click", () => {
      isOnline = !isOnline;
      updateModeUI();
      setStatus(isOnline ? "Online mode — highest quality" : "Offline mode — privacy first");
    });
  }

  // Feature chips
  document.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      currentMode = chip.dataset.mode || "face";

      if (currentMode === "continuous") {
        wantContinuous = true;
        setStatus("Continuous mode ON — keep talking");
        safeStart();
        if (speakBtn) {
          const label = speakBtn.querySelector(".speak-label");
          if (label) label.textContent = "Continuous On";
        }
      } else {
        wantContinuous = false;
        safeStop();
        const labels = {
          face: "Face-to-Face mode ready",
          group: "Group mode (demo UI) — up to 25 people",
          call: "Call mode (demo UI) — phone/video translation"
        };
        setStatus(labels[currentMode] || "Mode ready");
      }
    });
  });

  // Swap
  if (swapBtn) {
    swapBtn.addEventListener("click", () => {
      if (!sourceLang || !targetLang) return;
      const tmp = sourceLang.value;
      sourceLang.value = targetLang.value;
      targetLang.value = tmp;
      if (sourceText && targetText) {
        const t = sourceText.textContent;
        sourceText.textContent = targetText.textContent;
        targetText.textContent = t;
      }
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
      } else if (panel === "features") {
        $("featuresPanel")?.classList.remove("hidden");
      } else if (panel === "settings") {
        $("settingsPanel")?.classList.remove("hidden");
      }
    });
  });

  document.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.close;
      if (id) $(id)?.classList.add("hidden");
    });
  });

  document.querySelectorAll(".overlay").forEach(ov => {
    ov.addEventListener("click", (e) => {
      if (e.target === ov) ov.classList.add("hidden");
    });
  });

  if ($("clearHistory")) {
    $("clearHistory").addEventListener("click", () => {
      history = [];
      try { localStorage.removeItem("chitchat-pro-history"); } catch(e) {}
      renderHistory();
    });
  }

  function renderHistory() {
    if (!historyList) return;
    if (!history.length) {
      historyList.innerHTML = "<p style='color:var(--dim);padding:12px 0'>No conversations yet. Start talking!</p>";
      return;
    }
    historyList.innerHTML = history.map(h => `
      <div class="history-item">
        <div class="from">${esc(h.from)}</div>
        <div class="to">${esc(h.to)}</div>
        <div style="font-size:0.65rem;color:var(--dim);margin-top:4px">
          ${esc(h.time)} · ${esc(h.mode)} · ${esc((h.source||"").split("-")[0])} → ${esc((h.target||"").split("-")[0])}
        </div>
      </div>`).join("");
  }

  // Keyboard support
  document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && e.target === document.body) {
      e.preventDefault();
      if (!isListening) safeStart();
    }
  });
  document.addEventListener("keyup", (e) => {
    if (e.code === "Space" && isListening) {
      try { recognition.stop(); } catch(e) {}
    }
  });

  // Init
  updateModeUI();
  if (!SpeechRecognition) {
    setStatus("Speech recognition limited — use Chrome or Edge for full power");
  } else {
    setStatus("Ready · Hybrid Online + Offline · Highest quality");
  }

  // Force offline checkbox
  if (forceOfflineChk) {
    forceOfflineChk.addEventListener("change", () => {
      if (forceOfflineChk.checked) {
        isOnline = false;
        updateModeUI();
        setStatus("Force Offline enabled — privacy mode");
      }
    });
  }
})();

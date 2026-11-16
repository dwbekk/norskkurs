/* Felles lydmotor for norskkurs.
   Bruker nettleserens innebygde talesyntese: gratis, virker offline,
   og gjelder automatisk alt nytt innhold.                         */
(function (global) {
  "use strict";

  var synth = global.speechSynthesis;
  var supported = !!synth && typeof global.SpeechSynthesisUtterance === "function";
  var voices = [];
  var picked = { nb: null, pt: null, en: null };
  var slow = false;
  var muted = false;
  var warned = false;

  try { slow = localStorage.getItem("nk_slow") === "1"; } catch (e) {}
  try { muted = localStorage.getItem("nk_mute") === "1"; } catch (e) {}

  /* Stemmer lastes asynkront i de fleste nettlesere. */
  function loadVoices() {
    if (!supported) return;
    voices = synth.getVoices() || [];
    picked.nb = best(["nb-NO", "nb", "no-NO", "no", "nn-NO"]);
    picked.pt = best(["pt-BR", "pt_BR", "pt-PT", "pt"]);
    picked.en = best(["en-GB", "en-US", "en"]);
  }

  function best(tags) {
    var i, j, v, lang;
    /* 1: eksakt treff, helst en lokal stemme (bedre og raskere) */
    for (j = 0; j < tags.length; j++) {
      for (i = 0; i < voices.length; i++) {
        v = voices[i];
        lang = (v.lang || "").replace("_", "-").toLowerCase();
        if (lang === tags[j].replace("_", "-").toLowerCase() && v.localService) return v;
      }
      for (i = 0; i < voices.length; i++) {
        v = voices[i];
        lang = (v.lang || "").replace("_", "-").toLowerCase();
        if (lang === tags[j].replace("_", "-").toLowerCase()) return v;
      }
    }
    /* 2: samme språk, annen region */
    var pre = tags[0].split("-")[0].toLowerCase();
    for (i = 0; i < voices.length; i++) {
      v = voices[i];
      lang = (v.lang || "").toLowerCase();
      if (lang.indexOf(pre) === 0) return v;
    }
    return null;
  }

  if (supported) {
    loadVoices();
    if (typeof synth.addEventListener === "function") {
      synth.addEventListener("voiceschanged", loadVoices);
    } else {
      synth.onvoiceschanged = loadVoices;
    }
    /* Safari på iOS fyller lista først etter litt tid. */
    setTimeout(loadVoices, 400);
    setTimeout(loadVoices, 1500);
  }

  /* Rydder teksten før opplesing: fjerner parenteser med uttalehjelp,
     bytter skråstrek mot pause, og dropper hakeparenteser.           */
  function clean(text) {
    return String(text || "")
      .replace(/\[[^\]]*\]/g, " ")
      .replace(/\s*\/\s*/g, ", ")
      .replace(/[«»"]/g, "")
      .replace(/\s*\.\.\.\s*|…/g, ", ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function speak(text, lang) {
    if (!supported || muted) return false;
    var t = clean(text);
    if (!t) return false;
    var l = (lang || "nb").slice(0, 2).toLowerCase();
    if (l !== "pt" && l !== "en") l = "nb";
    var voice = picked[l];

    if (l === "nb" && !voice) { noVoiceNotice(); return false; }

    try { synth.cancel(); } catch (e) {}
    var u = new global.SpeechSynthesisUtterance(t);
    u.lang = l === "nb" ? "nb-NO" : (l === "pt" ? "pt-BR" : "en-GB");
    if (voice) u.voice = voice;
    u.rate = slow ? 0.62 : 0.92;
    u.pitch = 1;
    u.volume = 1;
    try { synth.speak(u); } catch (e) { return false; }
    return true;
  }

  /* Én diskret beskjed hvis enheten mangler norsk stemme. */
  function noVoiceNotice() {
    if (warned) return;
    warned = true;
    var box = document.createElement("div");
    box.className = "nk-voicewarn";
    box.setAttribute("role", "status");
    box.innerHTML =
      '<strong>Seu aparelho não tem uma voz norueguesa instalada.</strong><br>' +
      "<span>Android: Configurações → Idiomas → Saída de texto para fala → " +
      "instalar “Norsk bokmål”. iPhone: Ajustes → Acessibilidade → " +
      "Conteúdo falado → Vozes → Norueguês. O português continua funcionando.</span>" +
      '<button type="button" aria-label="Fechar">×</button>';
    (document.body || document.documentElement).appendChild(box);
    box.querySelector("button").onclick = function () { box.remove(); };
    setTimeout(function () { if (box.parentNode) box.remove(); }, 14000);
  }

  /* Liten høyttalerknapp. lang: "nb" eller "pt". */
  function button(text, lang, extraClass) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "say" + (lang === "pt" ? " say-pt" : "") + (extraClass ? " " + extraClass : "");
    b.setAttribute("aria-label",
      lang === "pt" ? "Ouvir em português" : (lang === "en" ? "Listen in English" : "Ouvir em norueguês"));
    b.dataset.say = text;
    b.dataset.lang = lang || "nb";
    b.innerHTML = ICON;
    return b;
  }

  var ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path d="M4 9.5v5h3.2L12 18.6V5.4L7.2 9.5H4z"/>' +
    '<path class="w1" d="M15.3 8.8a4.4 4.4 0 0 1 0 6.4"/>' +
    '<path class="w2" d="M17.9 6.1a8 8 0 0 1 0 11.8"/></svg>';

  /* Én felles lytter for hele sida. */
  function bind(root) {
    (root || document).addEventListener("click", function (ev) {
      var b = ev.target.closest ? ev.target.closest(".say") : null;
      if (!b) return;
      ev.preventDefault();
      ev.stopPropagation();
      var ok = speak(b.dataset.say, b.dataset.lang);
      if (ok) {
        b.classList.add("playing");
        setTimeout(function () { b.classList.remove("playing"); }, 900);
      }
    }, true);
  }

  var api = {
    supported: supported,
    speak: speak,
    button: button,
    bind: bind,
    icon: ICON,
    hasNorwegian: function () { return !!picked.nb; },
    voiceName: function (l) { var v = picked[(l || "nb").slice(0,2)] || picked.nb; return v ? v.name : null; },
    isSlow: function () { return slow; },
    setSlow: function (v) { slow = !!v; try { localStorage.setItem("nk_slow", slow ? "1" : "0"); } catch (e) {} },
    isMuted: function () { return muted; },
    setMuted: function (v) {
      muted = !!v;
      if (muted) { try { synth.cancel(); } catch (e) {} }
      try { localStorage.setItem("nk_mute", muted ? "1" : "0"); } catch (e) {}
    },
    stop: function () { try { synth.cancel(); } catch (e) {} }
  };

  global.TTS = api;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { bind(document); });
  } else { bind(document); }
})(window);

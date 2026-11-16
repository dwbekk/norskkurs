/* Setter lydknapper på innholdet som sidene bygger med JavaScript.
   Virker uten å røre render-funksjonene på den enkelte siden.      */
(function () {
  "use strict";
  if (!window.TTS) return;

  var DONE = "nkAudio";

  /* Hvilket språk hører et element til? */
  function langOf(el) {
    var l = (el.getAttribute("lang") || "").toLowerCase();
    if (l.indexOf("pt") === 0) return "pt";
    if (l.indexOf("en") === 0) return "en";
    if (l.indexOf("nb") === 0 || l.indexOf("no") === 0) return "nb";
    return null;
  }

  function enhance(root) {
    /* 1. Målspråket (norsk eller engelsk): synlig høyttalerknapp. */
    var say = root.querySelectorAll('.no[lang],.en[lang],.ano[lang],.sol,.wt');
    for (var i = 0; i < say.length; i++) {
      var el = say[i];
      if (el.dataset[DONE]) continue;
      var lang = langOf(el) || (el.classList.contains("sol") || el.classList.contains("wt") ? "nb" : null);
      if (!lang || lang === "pt") continue;
      var txt = el.textContent.trim();
      if (!txt) continue;
      el.dataset[DONE] = "1";
      /* Ordbitene i oppgavene er små — der holder det at hele brikka er trykkbar. */
      if (el.classList.contains("wt")) { el.dataset.nkSay = txt; continue; }
      el.appendChild(document.createTextNode(" "));
      el.appendChild(window.TTS.button(txt, lang));
    }

    /* 2. Portugisisk: teksten selv er trykkbar, så ingenting blir uskarpt
          av en knapp inni. */
    var pts = root.querySelectorAll('.pt[lang],.apt[lang],.prompt[lang],.solpt');
    for (var j = 0; j < pts.length; j++) {
      var p = pts[j];
      if (p.dataset[DONE]) continue;
      p.dataset[DONE] = "1";
      p.dataset.nkSay = p.textContent.trim();
      p.classList.add("tappable");
    }
  }

  /* Trykk på portugisisk tekst. Er den skjult i testmodus, avdekkes den
     først — da tar sidas egen lytter seg av det, og vi sier ingenting. */
  document.addEventListener("click", function (ev) {
    var t = ev.target.closest ? ev.target.closest("[data-nk-say]") : null;
    if (!t || ev.target.closest(".say")) return;
    /* Fanget i capture-fasen, altså før sidas egen lytter avdekker teksten:
       er den fortsatt skjult, skal dette trykket bare avdekke, ikke lese opp. */
    if (document.body.classList.contains("testing") &&
        (t.classList.contains("pt") || t.classList.contains("apt")) &&
        !t.classList.contains("shown")) return;
    var lang = langOf(t) || "pt";
    window.TTS.speak(t.dataset.nkSay, lang);
  }, true);

  /* Ordbrikkene i ordstillingsoppgavene leses opp når de flyttes. */
  document.addEventListener("click", function (ev) {
    var chip = ev.target.closest ? ev.target.closest(".chipw") : null;
    if (!chip) return;
    var w = chip.querySelector(".wt");
    if (w) window.TTS.speak(w.textContent, "nb");
  });

  var targets = ["list", "drill"].map(function (id) { return document.getElementById(id); })
    .filter(Boolean);
  if (!targets.length) targets = [document.body];

  targets.forEach(function (node) {
    enhance(node);
    new MutationObserver(function () { enhance(node); })
      .observe(node, { childList: true, subtree: true });
  });

  /* Lydbryterne i verktøylinja */
  var bar = document.getElementById("audiobar");
  if (bar) {
    var mute = bar.querySelector("#a-mute"), slow = bar.querySelector("#a-slow");
    function sync() {
      mute.setAttribute("aria-pressed", String(!window.TTS.isMuted()));
      mute.querySelector("span").textContent = window.TTS.isMuted() ? "Áudio desligado" : "Áudio ligado";
      slow.setAttribute("aria-pressed", String(window.TTS.isSlow()));
    }
    mute.onclick = function () { window.TTS.setMuted(!window.TTS.isMuted()); sync(); };
    slow.onclick = function () { window.TTS.setSlow(!window.TTS.isSlow()); sync(); };
    sync();
    if (!window.TTS.supported) { bar.style.display = "none"; }
  }
})();

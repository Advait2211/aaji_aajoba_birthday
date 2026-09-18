/* आजी-आजोबा वाढदिवस — सगळी जादू इथे 🎉 */
(() => {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const DEV = "०१२३४५६७८९";
  const dev = (n) => String(n).replace(/\d/g, (d) => DEV[d]);
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
  };

  const PHOTOS = window.PHOTOS || [];
  const bySrc = (src) => PHOTOS.find((p) => p.src === src);
  const full = (p) => `img/full/${p.id}.webp`;
  const thumb = (p) => `img/thumb/${p.id}.webp`;

  // Order of the family chips when counts tie; slugs name the avatar files.
  const PEOPLE = {
    "आजी": "aaji", "आजोबा": "aajoba", "अद्वैत": "advait", "ओजस": "ojas", "प्राची": "prachi",
    "अमित": "amit", "क्षमा": "kshama", "क्षितिज": "kshitij", "तन्वी": "tanvi", "काव्य": "kavya",
    "मंथन": "manthan", "देवांग": "devang",
  };

  /* ---------- feature photos ---------- */
  const FEATURE = {
    heroImg: "WhatsApp Image 2026-09-18 at 17.04.49 (1).jpeg",
    aajiImg: "IMG_9622.HEIC",
  };
  for (const [id, src] of Object.entries(FEATURE)) {
    const p = bySrc(src);
    if (p) $("#" + id).src = full(p);
  }
  $("#aajobaImg").src = "img/portrait-aajoba.webp";

  /* ---------- poems ---------- */
  const HILITE = {
    aajoba: (l, i, all) => i >= all.length - 2,
    aaji: (l, i, all) => i >= all.length - 2,
    antar: (l) => l.trim() === "अंतर",
    natvanda: (l, i, all) => i >= all.length - 2,
  };
  $$("[data-poem]").forEach((el) => {
    const key = el.dataset.poem;
    const text = (window.POEMS || {})[key] || "";
    const all = text.split("\n").filter((l) => l.trim());
    let idx = 0;
    el.innerHTML = text.split(/\n\s*\n/).map((st) =>
      `<p class="st">${st.split("\n").map((l) => {
        const hi = HILITE[key] && HILITE[key](l, idx, all);
        const html = `<span class="ln${hi ? " hi" : ""}" style="transition-delay:${Math.min(idx, 40) * 90}ms">${l.trim()}</span>`;
        idx++;
        return html;
      }).join("")}</p>`).join("");
  });

  /* ---------- toran (marigold garland + mango leaves) ---------- */
  (function toran() {
    const svg = $(".toran");
    const W = 1200, parts = [];
    const sag = (x) => 18 + 22 * Math.sin((x / W) * Math.PI * 6) ** 2;
    for (let x = 6; x < W; x += 13) {
      const y = sag(x);
      const c = (x / 13) % 3 < 1 ? "#ff8a00" : (x / 13) % 3 < 2 ? "#f6a800" : "#ffc233";
      parts.push(`<circle cx="${x}" cy="${y}" r="9" fill="${c}"/><circle cx="${x}" cy="${y}" r="3" fill="#e06c00" opacity=".6"/>`);
    }
    for (let x = 50; x < W; x += 100) {
      const y = sag(x) + 6;
      parts.push(`<path d="M${x} ${y} q-13 26 0 52 q13 -26 0 -52z" fill="#3f7d3a"/><path d="M${x} ${y + 4} v44" stroke="#2c5a28" stroke-width="1.2"/>`);
      parts.push(`<circle cx="${x + 50}" cy="${sag(x + 50) + 16}" r="7" fill="#e8517a"/><circle cx="${x + 50}" cy="${sag(x + 50) + 28}" r="6" fill="#fff"/><circle cx="${x + 50}" cy="${sag(x + 50) + 39}" r="6" fill="#f6a800"/>`);
    }
    svg.innerHTML = `<rect width="${W}" height="8" fill="#c8102e"/>` + parts.join("");
  })();

  /* ---------- diyas ---------- */
  (function diyas() {
    const box = $(".diyas");
    const n = Math.max(5, Math.min(12, Math.round(innerWidth / 90)));
    box.innerHTML = '<span class="diya"></span>'.repeat(n);
  })();

  /* ---------- stars ---------- */
  (function stars() {
    const box = $(".stars");
    let html = "";
    for (let i = 0; i < 70; i++) {
      html += `<i style="left:${rand(0, 100)}%;top:${rand(0, 100)}%;animation-delay:${rand(0, 3)}s;opacity:${rand(.3, 1)}"></i>`;
    }
    box.innerHTML = html;
  })();

  /* ---------- gift sparkles ---------- */
  $(".gift-sparkles").innerHTML = Array.from({ length: 18 }, () =>
    `<i style="left:${rand(2, 95)}%;top:${rand(2, 95)}%;font-size:${rand(14, 30)}px;animation-delay:${rand(0, 2.5)}s">${pick(["✨", "⭐", "🌸", "🎈", "💛"])}</i>`).join("");

  /* ================= FX canvas: confetti + fireworks ================= */
  const cv = $("#fx"), cx = cv.getContext("2d");
  let parts = [], rafOn = false, dpr = 1;
  function resize() {
    dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
  }
  resize(); addEventListener("resize", resize);
  const COLORS = ["#f6a800", "#ff8a00", "#c8102e", "#e8517a", "#6aa84f", "#ffd36b", "#8e44ad", "#1e88e5"];
  function loop() {
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter((p) => p.life > 0 && p.y < innerHeight + 40);
    for (const p of parts) {
      p.vy += p.g; p.vx *= p.drag; p.vy *= p.drag;
      p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life--;
      cx.save();
      cx.globalAlpha = Math.min(1, p.life / 40);
      cx.translate(p.x, p.y); cx.rotate(p.rot);
      cx.fillStyle = p.c;
      if (p.kind === "spark") {
        cx.beginPath(); cx.arc(0, 0, p.s, 0, 7); cx.fill();
      } else {
        cx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      }
      cx.restore();
    }
    if (parts.length) requestAnimationFrame(loop); else { rafOn = false; cx.clearRect(0, 0, innerWidth, innerHeight); }
  }
  function kick() { if (!rafOn) { rafOn = true; requestAnimationFrame(loop); } }
  function confetti(x = innerWidth / 2, y = innerHeight / 2, n = 140) {
    if (reduced) n = 30;
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), v = rand(4, 13);
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 6, g: .28, drag: .985, s: rand(7, 13),
        rot: rand(0, 6), vr: rand(-.3, .3), c: pick(COLORS), life: rand(110, 190), kind: "paper" });
    }
    kick();
  }
  function firework(x, y) {
    const c = pick(COLORS), n = reduced ? 20 : 70;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, v = rand(2.5, 6);
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: .06, drag: .97, s: rand(1.6, 3),
        rot: 0, vr: 0, c: Math.random() < .3 ? "#fff6c8" : c, life: rand(60, 100), kind: "spark" });
    }
    kick();
  }
  function fireworksShow(count = 7) {
    for (let i = 0; i < count; i++) {
      setTimeout(() => firework(rand(innerWidth * .15, innerWidth * .85), rand(innerHeight * .12, innerHeight * .45)), i * 380);
    }
  }

  /* ---------- petal shower ---------- */
  const PETALS = ["🌸", "🌼", "🏵️", "🌺", "💮", "🌷"];
  function petalShower(n = 40) {
    if (reduced) n = 10;
    const box = $("#petals");
    for (let i = 0; i < n; i++) {
      const el = document.createElement("span");
      el.className = "petal";
      el.textContent = Math.random() < .75 ? pick(PETALS) : "🧡";
      const dur = rand(4.5, 8);
      el.style.cssText = `left:${rand(-5, 100)}vw;font-size:${rand(16, 32)}px;animation-duration:${dur}s;animation-delay:${rand(0, 2.5)}s;--dx:${rand(-80, 80)}px;--rot:${rand(-540, 540)}deg`;
      box.appendChild(el);
      setTimeout(() => el.remove(), (dur + 3) * 1000);
    }
  }
  $("#petalBtn").addEventListener("click", () => { petalShower(); chime(); });

  /* ================= music box (Web Audio, no files) ================= */
  let ac = null, master = null, musicOn = false, musicTimer = null, nextLoopAt = 0;
  // Happy Birthday in C, [note, beats]
  const TUNE = [
    ["G4", .75], ["G4", .25], ["A4", 1], ["G4", 1], ["C5", 1], ["B4", 2],
    ["G4", .75], ["G4", .25], ["A4", 1], ["G4", 1], ["D5", 1], ["C5", 2],
    ["G4", .75], ["G4", .25], ["G5", 1], ["E5", 1], ["C5", 1], ["B4", 1], ["A4", 2],
    ["F5", .75], ["F5", .25], ["E5", 1], ["C5", 1], ["D5", 1], ["C5", 3],
  ];
  const BASS = [["C3", 3], ["G2", 3], ["G2", 3], ["C3", 3], ["C3", 3], ["F2", 3], ["C3", 1.5], ["G2", 1.5], ["C3", 3]];
  const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const freq = (n) => 440 * 2 ** ((SEMI[n[0]] + (+n.slice(-1) + 1) * 12 - 69) / 12);
  const BEAT = .42;

  function audio() {
    if (ac) return ac;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ac = new AC();
    master = ac.createGain(); master.gain.value = .16;
    // soft echo for a dreamy music-box feel
    const delay = ac.createDelay(); delay.delayTime.value = .27;
    const fb = ac.createGain(); fb.gain.value = .28;
    const wet = ac.createGain(); wet.gain.value = .35;
    master.connect(ac.destination);
    master.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(ac.destination);
    return ac;
  }
  function bell(f, t, dur = 1.6, vol = 1) {
    const g = ac.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(.5 * vol, t + .01);
    g.gain.exponentialRampToValueAtTime(.0008, t + dur);
    g.connect(master);
    [[1, 1], [2, .25], [3.01, .08], [4.2, .05]].forEach(([m, a]) => {
      const o = ac.createOscillator(), og = ac.createGain();
      o.type = "sine"; o.frequency.value = f * m; og.gain.value = a;
      o.connect(og); og.connect(g); o.start(t); o.stop(t + dur + .05);
    });
  }
  function playTune(t0) {
    let t = t0;
    for (const [n, b] of TUNE) { bell(freq(n), t, 1.4, .9); t += b * BEAT; }
    let tb = t0;
    for (const [n, b] of BASS) { bell(freq(n), tb, 2.2, .45); tb += b * BEAT; }
    return t - t0;
  }
  function scheduleMusic() {
    if (!musicOn) return;
    const now = ac.currentTime;
    if (nextLoopAt < now + .2) nextLoopAt = now + .2;
    const len = playTune(nextLoopAt);
    nextLoopAt += len + 3 * BEAT;
    musicTimer = setTimeout(scheduleMusic, (nextLoopAt - now - .5) * 1000);
  }
  function startMusic() {
    if (!audio()) return;
    ac.resume();
    master.gain.value = .16;
    musicOn = true; nextLoopAt = 0;
    clearTimeout(musicTimer); scheduleMusic();
    $("#musicBtn").classList.add("playing"); $("#musicBtn").classList.remove("off");
    store.set("music", "on");
  }
  function stopMusic() {
    musicOn = false; clearTimeout(musicTimer);
    // closing the context silences notes already scheduled; the next sound makes a fresh one
    if (ac && !mic) { ac.close(); ac = null; }
    else if (master) master.gain.setTargetAtTime(0, ac.currentTime, .1);
    $("#musicBtn").classList.remove("playing"); $("#musicBtn").classList.add("off");
    store.set("music", "off");
  }
  function chime() {
    if (!audio()) return;
    ac.resume();
    const t = ac.currentTime + .02;
    ["C5", "E5", "G5", "C6"].forEach((n, i) => bell(freq(n), t + i * .09, 1.2, .6));
  }
  $("#musicBtn").addEventListener("click", () => (musicOn ? stopMusic() : startMusic()));

  /* ---------- font size (for आजी-आजोबा) ---------- */
  let fs = +store.get("fs") || 19;
  const applyFs = () => { document.documentElement.style.setProperty("--fs", fs + "px"); store.set("fs", fs); };
  applyFs();
  $("#fontUp").addEventListener("click", () => { fs = Math.min(27, fs + 2); applyFs(); });
  $("#fontDown").addEventListener("click", () => { fs = Math.max(15, fs - 2); applyFs(); });

  /* ================= gift intro ================= */
  document.body.classList.add("locked");
  function openGift() {
    const box = $("#giftBtn");
    if (box.classList.contains("open")) return;
    box.classList.add("open");
    const r = box.getBoundingClientRect();
    confetti(r.left + r.width / 2, r.top + r.height / 3, 180);
    if (store.get("music") !== "off") startMusic(); else $("#musicBtn").classList.add("off");
    setTimeout(() => {
      $("#gift").classList.add("gone");
      document.body.classList.remove("locked");
      petalShower(50);
      fireworksShow(5);
    }, 1100);
  }
  $("#giftBtn").addEventListener("click", openGift);
  $("#gift").addEventListener("click", (e) => { if (e.target === $("#gift")) openGift(); });

  /* ================= reveal on scroll + counters ================= */
  function countUp(el) {
    const to = +el.dataset.to, t0 = performance.now(), dur = reduced ? 1 : 1800;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - (1 - k) ** 3;
      el.textContent = dev(Math.round(to * e));
      if (k < 1) requestAnimationFrame(step);
      else { el.animate?.([{ transform: "scale(1.3)" }, { transform: "scale(1)" }], { duration: 400 }); }
    };
    requestAnimationFrame(step);
  }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add("in");
      $$(".poem, .nb-poem", e.target).forEach((p) => p.classList.add("in"));
      $$(".age-num", e.target).forEach(countUp);
      io.unobserve(e.target);
    }
  }, { threshold: .15, rootMargin: "0px 0px -8% 0px" });
  $$(".reveal").forEach((el) => io.observe(el));

  /* ================= lightbox ================= */
  const lb = { list: [], i: 0, playing: false, timer: null };
  function capFor(p) {
    const bits = [];
    if (p.year) bits.push(dev(p.year));
    if (p.people && p.people.length) bits.push(p.people.join(", "));
    return bits.join(" · ");
  }
  function lbShow(i) {
    lb.i = (i + lb.list.length) % lb.list.length;
    const p = lb.list[lb.i];
    const img = $("#lbImg");
    img.style.animation = "none"; void img.offsetWidth; img.style.animation = "";
    img.src = full(p);
    img.alt = capFor(p) || "फोटो";
    $("#lbCap").textContent = `${dev(lb.i + 1)} / ${dev(lb.list.length)}${capFor(p) ? " · " + capFor(p) : ""}`;
    // preload neighbour
    const n = lb.list[(lb.i + 1) % lb.list.length]; if (n) new Image().src = full(n);
  }
  function lbOpen(list, i, play = false) {
    lb.list = list; $("#lightbox").hidden = false; document.body.classList.add("locked");
    lbShow(i); setPlay(play);
  }
  function lbClose() { $("#lightbox").hidden = true; document.body.classList.remove("locked"); setPlay(false); }
  function setPlay(on) {
    lb.playing = on; clearInterval(lb.timer);
    $("#lbPlay").textContent = on ? "⏸️" : "▶️";
    $("#lbPlay").setAttribute("aria-label", on ? "थांबवा" : "चलचित्र सुरू करा");
    if (on) lb.timer = setInterval(() => lbShow(lb.i + 1), 3500);
  }
  $("#lbClose").addEventListener("click", lbClose);
  $("#lbPrev").addEventListener("click", () => { setPlay(false); lbShow(lb.i - 1); });
  $("#lbNext").addEventListener("click", () => { setPlay(false); lbShow(lb.i + 1); });
  $("#lbPlay").addEventListener("click", () => setPlay(!lb.playing));
  $("#lightbox").addEventListener("click", (e) => { if (e.target.id === "lightbox" || e.target.classList.contains("lb-fig")) lbClose(); });
  addEventListener("keydown", (e) => {
    if ($("#lightbox").hidden) return;
    if (e.key === "Escape") lbClose();
    if (e.key === "ArrowRight") { setPlay(false); lbShow(lb.i + 1); }
    if (e.key === "ArrowLeft") { setPlay(false); lbShow(lb.i - 1); }
  });
  let sx = 0, sy = 0;
  $("#lightbox").addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  $("#lightbox").addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) { setPlay(false); lbShow(lb.i + (dx < 0 ? 1 : -1)); }
    else if (dy > 90) lbClose();
  });

  /* ================= timeline ================= */
  (function timeline() {
    const groups = new Map();
    for (const p of PHOTOS) {
      const k = p.year || "recent";
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(p);
    }
    const keys = [...groups.keys()].sort((a, b) => (a === "recent") - (b === "recent") || a - b);
    const WORDS = { 1: "एक", 2: "दोन", 3: "तीन", 4: "चार", 5: "पाच", 6: "सहा", 7: "सात", 8: "आठ", 9: "नऊ", 10: "दहा", 11: "अकरा", 12: "बारा" };
    $("#timeline").innerHTML = keys.map((k) => {
      const list = groups.get(k);
      const label = k === "recent" ? "अलीकडचे क्षण" : dev(k);
      const sub = `${WORDS[list.length] || dev(list.length)} ${list.length === 1 ? "आठवण" : "आठवणी"}`;
      return `<li class="tl-year reveal"><h3 class="tl-label">${label}<small>${sub}</small></h3>
        <div class="tl-photos">${list.map((p) => `<button class="tl-pic" data-id="${p.id}" aria-label="फोटो ${label}">
          <img src="${thumb(p)}" loading="lazy" alt="${label}" width="${p.w}" height="${p.h}" style="aspect-ratio:${p.w}/${p.h}"></button>`).join("")}</div></li>`;
    }).join("");
    const ordered = keys.flatMap((k) => groups.get(k));
    $("#timeline").addEventListener("click", (e) => {
      const b = e.target.closest(".tl-pic"); if (!b) return;
      lbOpen(ordered, ordered.findIndex((p) => p.id === b.dataset.id));
    });
    $$("#timeline .reveal").forEach((el) => io.observe(el));
  })();

  /* ================= family chips + gallery ================= */
  let current = null; // null = सगळे
  function galleryList() {
    return current ? PHOTOS.filter((p) => p.people && p.people.includes(current)) : PHOTOS;
  }
  function renderGallery() {
    const list = galleryList();
    $("#gallery").innerHTML = list.map((p, i) => `<button class="g-item" data-i="${i}" style="animation-delay:${Math.min(i, 20) * 40}ms" aria-label="फोटो ${dev(i + 1)}">
      <img src="${thumb(p)}" loading="lazy" alt="${capFor(p) || "फोटो"}" width="${p.w}" height="${p.h}"></button>`).join("");
    $("#galleryCount").textContent = current
      ? `${current} — ${dev(list.length)} फोटोंमध्ये 💛`
      : `सगळे ${dev(list.length)} फोटो 📷`;
  }
  (function chips() {
    const counts = Object.keys(PEOPLE).map((n) => [n, PHOTOS.filter((p) => p.people && p.people.includes(n)).length])
      .filter(([, c]) => c > 0)
      .sort((a, b) => b[1] - a[1]);
    const chip = (name, count, face) => `<button class="chip" role="tab" data-name="${name}" aria-selected="${name === "" ? "true" : "false"}">
      ${face ? `<img class="chip-face" src="${face}" alt="" loading="lazy">` : `<span class="chip-face">👨‍👩‍👧‍👦</span>`}
      <span class="chip-name">${name || "सगळे"}</span><span class="chip-count">${dev(count)} फोटो</span></button>`;
    $("#chips").innerHTML = chip("", PHOTOS.length, null) +
      counts.map(([n, c]) => chip(n, c, `img/faces/${PEOPLE[n]}.webp`)).join("");
    $("#chips").addEventListener("click", (e) => {
      const b = e.target.closest(".chip"); if (!b) return;
      current = b.dataset.name || null;
      $$(".chip").forEach((c) => c.setAttribute("aria-selected", c === b ? "true" : "false"));
      renderGallery();
      if (current) { const r = b.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top + r.height / 2, 40); }
    });
  })();
  renderGallery();
  $("#gallery").addEventListener("click", (e) => {
    const b = e.target.closest(".g-item"); if (!b) return;
    lbOpen(galleryList(), +b.dataset.i);
  });
  $("#slideshowBtn").addEventListener("click", () => lbOpen(galleryList(), 0, true));

  /* ================= cakes ================= */
  $$(".candle-num").forEach((num) => {
    ["28%", "72%"].forEach((left) => {
      const f = document.createElement("span");
      f.className = "flame"; f.style.left = left; num.appendChild(f);
    });
  });
  let blown = false;
  function blowOut() {
    if (blown) return;
    blown = true;
    $$(".flame").forEach((f, i) => setTimeout(() => {
      f.classList.add("out");
      const s = document.createElement("span");
      s.className = "smoke"; s.style.left = f.style.left; f.parentNode.appendChild(s);
      setTimeout(() => s.remove(), 1700);
    }, i * 120));
    $$(".cake").forEach((c) => c.classList.add("blown"));
    stopMic();
    setTimeout(() => {
      const r = $(".cakes").getBoundingClientRect();
      confetti(innerWidth / 2, r.top + r.height / 3, 220);
      fireworksShow(8);
      petalShower(60);
      chime();
      $("#cakeWish").hidden = false;
      $("#blowBtn").hidden = true; $("#micBtn").hidden = true; $("#micHint").hidden = true;
      if (!musicOn && store.get("music") !== "off") startMusic();
    }, 600);
  }
  function relight() {
    blown = false;
    $$(".smoke").forEach((s) => s.remove());
    $$(".flame").forEach((f) => f.classList.remove("out"));
    $$(".cake").forEach((c) => c.classList.remove("blown"));
    $("#cakeWish").hidden = true; $("#blowBtn").hidden = false; $("#micBtn").hidden = false;
  }
  $("#blowBtn").addEventListener("click", blowOut);
  $("#relightBtn").addEventListener("click", relight);

  // blowing into the microphone = loud low-frequency noise for a moment
  let mic = null;
  async function startMic() {
    if (!navigator.mediaDevices?.getUserMedia || !audio()) { blowOut(); return; }
    try {
      ac.resume();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false } });
      const src = ac.createMediaStreamSource(stream);
      const an = ac.createAnalyser(); an.fftSize = 512; src.connect(an);
      const buf = new Uint8Array(an.frequencyBinCount);
      mic = { stream, loud: 0, raf: 0 };
      $("#micHint").hidden = false;
      const tick = () => {
        if (!mic) return;
        an.getByteFrequencyData(buf);
        let low = 0; for (let i = 1; i < 24; i++) low += buf[i];
        low /= 23;
        mic.loud = low > 150 ? mic.loud + 1 : Math.max(0, mic.loud - 1);
        if (mic.loud > 12) { blowOut(); return; }
        mic.raf = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      $("#micHint").hidden = false;
      $("#micHint").textContent = "माइक मिळाला नाही — वरचं बटण दाबा 🙂";
    }
  }
  function stopMic() {
    if (!mic) return;
    cancelAnimationFrame(mic.raf);
    mic.stream.getTracks().forEach((t) => t.stop());
    mic = null;
  }
  $("#micBtn").addEventListener("click", startMic);

  /* ================= lanterns ================= */
  const WISHES = ["उदंड आयुष्य", "उत्तम आरोग्य", "भरभरून आनंद", "शतायुषी भव", "सुख-समृद्धी", "हसत राहा", "खूप प्रेम",
    "आशीर्वाद असू द्या", "नेहमी सोबत", "गोड आठवणी", "आनंदी आनंद", "तुम्ही आमचे हिरो"];
  let wishIdx = 0;
  function lantern(x, y) {
    const field = $("#lanternField");
    const el = document.createElement("div");
    el.className = "lantern";
    el.style.left = `${x - 32}px`; el.style.top = `${y - 30}px`;
    el.style.animationDuration = `${rand(8, 11)}s`;
    el.innerHTML = `<div class="lantern-body"></div><div class="lantern-wish">${WISHES[wishIdx++ % WISHES.length]}</div>`;
    field.appendChild(el);
    setTimeout(() => el.remove(), 11500);
    $(".lantern-field .hint")?.remove();
  }
  (function lanterns() {
    const field = $("#lanternField");
    field.innerHTML = `<p class="hint">👆 इथे स्पर्श करा</p>`;
    field.addEventListener("click", (e) => {
      const r = field.getBoundingClientRect();
      lantern(e.clientX - r.left, e.clientY - r.top);
      chime();
    });
    field.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); lantern(rand(40, field.clientWidth - 40), field.clientHeight - 60); }
    });
    // release a few by themselves the first time the sky is seen
    const skyIO = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      skyIO.disconnect();
      for (let i = 0; i < 4; i++) setTimeout(() => lantern(rand(40, field.clientWidth - 40), field.clientHeight - 40), 600 + i * 900);
    }, { threshold: .4 });
    skyIO.observe(field);
  })();

  /* ---------- little sparkle on every tap (cute!) ---------- */
  addEventListener("pointerdown", (e) => {
    if (reduced || e.target.closest("button, a, .lantern-field, .lightbox")) return;
    for (let i = 0; i < 8; i++) {
      const a = rand(0, 6.28), v = rand(1, 3.5);
      parts.push({ x: e.clientX, y: e.clientY, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: .05, drag: .95, s: rand(1.5, 3),
        rot: 0, vr: 0, c: pick(COLORS), life: 45, kind: "spark" });
    }
    kick();
  }, { passive: true });
})();

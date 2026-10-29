/* InterSim project page — no dependencies. */
(function () {
  "use strict";

  /* ------------------------------------------------------------------
   * 1. Demo video
   *    Option A: set youtubeId (e.g. "dQw4w9WgXcQ") to embed YouTube.
   *    Option B: leave youtubeId empty and set mp4, e.g. "static/videos/intersim_demo.mp4".
   *    If both are empty (or the file is missing), a "coming soon" placeholder is shown.
   * ------------------------------------------------------------------ */
  var DEMO_VIDEO = {
    youtubeId: "",
    mp4: "static/videos/intersim_demo.mp4"
  };


  function setupDemoVideo() {
    var frame = document.getElementById("demo-video");
    if (!frame) return;
    var poster = frame.getAttribute("data-poster");
    if (poster) frame.style.backgroundImage = "url('" + poster + "')";
    var placeholder = frame.querySelector(".video-placeholder");

    if (DEMO_VIDEO.youtubeId) {
      var iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(DEMO_VIDEO.youtubeId) + "?rel=0";
      iframe.title = "InterSim demo video";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.allowFullscreen = true;
      frame.appendChild(iframe);
      if (placeholder) placeholder.remove();
      return;
    }

    if (!DEMO_VIDEO.mp4) return;
    var video = document.createElement("video");
    video.controls = true;
    video.preload = "metadata";
    video.playsInline = true;
    if (poster) video.poster = poster;
    video.style.visibility = "hidden";
    var source = document.createElement("source");
    source.src = DEMO_VIDEO.mp4;
    source.type = "video/mp4";
    source.addEventListener("error", function () { video.remove(); });
    video.appendChild(source);
    video.addEventListener("loadedmetadata", function () {
      video.style.visibility = "visible";
      if (placeholder) placeholder.remove();
    });
    frame.appendChild(video);
  }

  /* ------------------------------------------------------------------
   * 2. Digital twin viewer
   * ------------------------------------------------------------------ */
  var TWINS = {
    dlt: {
      code: "DLT", name: "Displaced Left Turn",
      desc: "Left-turning traffic crosses the opposing lanes upstream of the main intersection, so left turns can run at the same time as opposing through traffic."
    },
    rci: {
      code: "RCI", name: "Reduced Conflict Intersection",
      desc: "Minor-road drivers do not cross the major road directly. They turn right onto it and then make a downstream U-turn."
    },
    rbi: {
      code: "RBI", name: "Roundabout Interchange",
      desc: "Roundabouts at the ramp terminals of a freeway interchange handle the movements between the ramps and the crossroad."
    },
    ddi: {
      code: "DDI", name: "Diverging Diamond Interchange",
      desc: "Crossroad traffic shifts to the left side of the road between the ramp terminals, so left turns onto the freeway ramps do not cross opposing traffic."
    },
    rab: {
      code: "RAB", name: "Two-Lane Roundabout",
      desc: "A two-lane circular intersection where entering vehicles yield to circulating traffic instead of stopping at a signal."
    }
  };

  function setupTwins() {
    var viewer = document.getElementById("twin-viewer");
    if (!viewer) return;
    var video = document.getElementById("twin-video");
    var code = document.getElementById("twin-code");
    var name = document.getElementById("twin-name");
    var desc = document.getElementById("twin-desc");
    var thumbs = viewer.querySelectorAll(".twin-thumb");
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var currentKey = "dlt", started = false, inView = false;

    if (reduceMotion) video.controls = true;   // no autoplay; the viewer can press play

    /* Each video starts and ends on the same view, so `loop` gives a seamless orbit. */
    function loadVideo(key) {
      video.classList.add("is-fading");
      video.poster = "static/images/twins/" + key + "_poster.webp";
      video.src = "static/videos/twins/" + key + ".mp4";
      video.load();
      if (inView && !reduceMotion) {
        var p = video.play();
        if (p && p.catch) p.catch(function () { /* autoplay blocked: poster stays */ });
      }
    }
    video.addEventListener("loadeddata", function () { video.classList.remove("is-fading"); });
    video.addEventListener("error", function () { video.classList.remove("is-fading"); });

    // Load the first video only when the section is near, and pause it while off screen.
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          inView = en.isIntersecting;
          if (inView && !started) { started = true; loadVideo(currentKey); return; }
          if (!started || reduceMotion) return;
          if (inView) { var p = video.play(); if (p && p.catch) p.catch(function () {}); }
          else video.pause();
        });
      }, { rootMargin: "200px 0px" }).observe(video);
    } else {
      started = true; inView = true; loadVideo(currentKey);
    }

    function show(key) {
      var t = TWINS[key];
      if (!t || (key === currentKey && started)) return;
      thumbs.forEach(function (b) {
        var on = b.getAttribute("data-twin") === key;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
      });
      currentKey = key;
      video.setAttribute("aria-label", "Orbit view of the " + t.name + " digital twin");
      if (started) loadVideo(key); else video.poster = "static/images/twins/" + key + "_poster.webp";
      code.textContent = t.code;
      name.textContent = t.name;
      desc.textContent = t.desc;
    }

    thumbs.forEach(function (b, i) {
      b.addEventListener("click", function () { show(b.getAttribute("data-twin")); });
      b.addEventListener("keydown", function (e) {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        e.preventDefault();
        var j = (i + (e.key === "ArrowRight" ? 1 : thumbs.length - 1)) % thumbs.length;
        thumbs[j].focus();
        show(thumbs[j].getAttribute("data-twin"));
      });
    });
  }

  /* ------------------------------------------------------------------
   * 2b. Looping showcase videos (vehicles): load when near the viewport,
   *     play while visible, pause off screen. Clips start and end on the
   *     same frame, so `loop` is seamless.
   * ------------------------------------------------------------------ */
  function setupLoopVideos() {
    var vids = document.querySelectorAll("video.loop-video[data-src]");
    if (!vids.length) return;
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function start(v) {
      if (!v.getAttribute("src")) { v.src = v.getAttribute("data-src"); v.load(); }
      if (!reduceMotion) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    }
    vids.forEach(function (v) { if (reduceMotion) v.controls = true; });
    if (!("IntersectionObserver" in window)) { vids.forEach(start); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) start(en.target);
        else if (en.target.getAttribute("src")) en.target.pause();
      });
    }, { rootMargin: "200px 0px" });
    vids.forEach(function (v) { io.observe(v); });
  }

  /* ------------------------------------------------------------------
   * 3. Real-vs-sim comparison slider
   * ------------------------------------------------------------------ */
  var SITES = {
    rbi: { name: "Roundabout Interchange" },
    rci: { name: "Reduced Conflict Intersection" }
  };

  function setupCompare() {
    var box = document.getElementById("compare");
    if (!box) return;
    var range = document.getElementById("compare-range");
    var real = document.getElementById("compare-real");
    var sim = document.getElementById("compare-sim");
    var dragging = false;

    function setPos(p) {
      p = Math.max(0, Math.min(100, p));
      box.style.setProperty("--pos", p + "%");
      range.value = Math.round(p);
    }
    function fromEvent(e) {
      var r = box.getBoundingClientRect();
      setPos(((e.clientX - r.left) / r.width) * 100);
    }

    box.addEventListener("pointerdown", function (e) {
      dragging = true;
      box.classList.add("is-touched");
      box.setPointerCapture(e.pointerId);
      fromEvent(e);
    });
    box.addEventListener("pointermove", function (e) { if (dragging) fromEvent(e); });
    box.addEventListener("pointerup", function () { dragging = false; });
    box.addEventListener("pointercancel", function () { dragging = false; });
    range.addEventListener("input", function () { box.classList.add("is-touched"); setPos(+range.value); });

    document.querySelectorAll("[data-site]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.getAttribute("data-site");
        document.querySelectorAll("[data-site]").forEach(function (b) {
          var on = b === btn;
          b.classList.toggle("is-active", on);
          b.setAttribute("aria-selected", on ? "true" : "false");
        });
        sim.src = "static/images/realsim/" + key + "_sim.webp";
        real.src = "static/images/realsim/" + key + "_real.webp";
        sim.alt = SITES[key].name + " in InterSim";
        real.alt = SITES[key].name + ", aerial image of the real site";
        setPos(50);
        box.classList.remove("is-touched");   // replay the ripple for the new site
      });
    });
    setPos(50);
  }


  /* ------------------------------------------------------------------
   * 3b. Architecture walkthrough
   *     Step 0: full diagram -> 1: digital twin cycle (HITL faded) ->
   *     2: HITL cycle (digital twin part faded) -> 3: full diagram.
   * ------------------------------------------------------------------ */
  function setupArchScrolly() {
    var sc = document.getElementById("arch-scrolly");
    if (!sc) return;
    var stage = document.getElementById("arch-stage");
    var sticky = sc.querySelector(".scrolly-sticky");
    var hint = sc.querySelector(".arch-hint");
    var topbar = document.querySelector(".topbar");
    var NOTE_W = 330, GAP = 28, ASPECT = 2400 / 1302;   // architecture.webp is 2400 x 1302
    var STEPS = [0.15, 0.5, 0.85];   // scroll-progress boundaries between steps
    var SCROLL_PER_STEP = 0.6;       // viewport heights of scrolling for the walkthrough, per step
    var current = -1, ticking = false, jumping = false, jumpTimer = null;
    var navH = 60, stickyTop = 60;

    sc.classList.add("is-enabled");

    function layout() {
      navH = topbar ? topbar.offsetHeight : 0;
      var vh = window.innerHeight;
      var sw = stage.clientWidth;
      var availH = vh - navH - (hint ? hint.offsetHeight + 12 : 0) - 40;
      var fw = Math.max(320, Math.min(sw, availH * ASPECT));
      var nw = Math.min(NOTE_W, sw * 0.32);
      var k = Math.min(0.72, (sw - nw - GAP) / fw);
      sc.style.setProperty("--fw", fw.toFixed(1) + "px");
      sc.style.setProperty("--tx-full", ((sw - fw) / 2).toFixed(1) + "px");
      sc.style.setProperty("--s-focus", k.toFixed(4));
      sc.style.setProperty("--nw", nw.toFixed(1) + "px");
      // Pin the block centered in the space below the top bar; the scrolly is only as tall as
      // the block plus the scroll distance, so there is no blank space before or after it.
      var h = sticky.offsetHeight;
      stickyTop = navH + Math.max(0, (vh - navH - h) / 2);
      sc.style.setProperty("--sticky-top", stickyTop.toFixed(1) + "px");
      sc.style.height = Math.round(h + 4 * SCROLL_PER_STEP * vh) + "px";
    }

    function update() {
      ticking = false;
      if (jumping) return;
      var r = sc.getBoundingClientRect();
      var total = sc.offsetHeight - sticky.offsetHeight;
      var p = total > 0 ? Math.min(1, Math.max(0, (stickyTop - r.top) / total)) : 0;
      var step = p < STEPS[0] ? 0 : p < STEPS[1] ? 1 : p < STEPS[2] ? 2 : 3;
      if (step !== current) {
        current = step;
        sc.setAttribute("data-step", String(step));
      }
    }

    function onScroll() {
      if (jumping) {
        // An in-page link is scrolling the page past the walkthrough: wait until it settles.
        clearTimeout(jumpTimer);
        jumpTimer = setTimeout(endJump, 150);
        return;
      }
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }

    function endJump() {
      jumping = false;
      update();
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () { sc.classList.remove("no-anim"); });
      });
    }

    // Clicking an in-page link (e.g. BibTeX, InterSim) should not play the walkthrough on the way.
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a || a.getAttribute("href") === "#") return;
      jumping = true;
      sc.classList.add("no-anim");
      clearTimeout(jumpTimer);
      jumpTimer = setTimeout(endJump, 800);   // in case the page does not need to scroll
    });

    layout();
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", function () { layout(); update(); });
    window.addEventListener("load", function () { layout(); update(); });
  }

  /* ------------------------------------------------------------------
   * 4. PET explorer (data: Table III of the paper; used by _drafts/case-studies.html)
   * ------------------------------------------------------------------ */
  var PET = {
    volumes: [200, 400, 600, 800, 1000],
    "1":   { rci: [0.000, 0.280, 0.333, 0.333, 0.500], std: [0.200, 0.125, 0.091, 0.381, 0.545], delta: [-0.200, 0.155, 0.242, -0.048, -0.045] },
    "1.5": { rci: [0.000, 0.360, 0.500, 0.481, 0.600], std: [0.200, 0.250, 0.182, 0.524, 0.773], delta: [-0.200, 0.110, 0.318, -0.042, -0.173] },
    "2":   { rci: [0.182, 0.440, 0.542, 0.556, 0.750], std: [0.600, 0.375, 0.364, 0.762, 0.864], delta: [-0.418, 0.065, 0.178, -0.206, -0.114] },
    "3":   { rci: [0.818, 0.760, 0.958, 0.741, 0.950], std: [0.600, 0.542, 0.818, 0.905, 0.955], delta: [0.218, 0.218, 0.140, -0.164, -0.005] }
  };

  var SVGNS = "http://www.w3.org/2000/svg";
  function el(tag, attrs, text) {
    var n = document.createElementNS(SVGNS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    return n;
  }
  function fmt(v) { return v.toFixed(3).replace(/^(-?)0\./, "$1."); }
  function fmtDelta(v) { return (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(3); }

  function setupPetExplorer() {
    var host = document.getElementById("pet-chart");
    if (!host) return;
    var current = "1.5", compact = null, bars = [], m, ih;
    var label = document.getElementById("pet-x");

    /* Two layouts: wide (desktop) and compact (phones), so text stays legible. */
    function build() {
      compact = host.clientWidth < 560;
      var W = compact ? 400 : 820, H = compact ? 300 : 300;
      m = compact ? { l: 30, r: 4, t: 34, b: 44 } : { l: 44, r: 8, t: 34, b: 40 };
      var iw = W - m.l - m.r;
      ih = H - m.t - m.b;
      var n = PET.volumes.length, gw = iw / n, bw = Math.min(46, gw * (compact ? 0.36 : 0.3)), gap = compact ? 3 : 6;
      host.innerHTML = "";
      host.classList.toggle("is-compact", compact);
      bars = [];
      var svg = el("svg", { viewBox: "0 0 " + W + " " + H, preserveAspectRatio: "xMidYMid meet" });

      var grid = el("g", { "class": "grid" });
      [0, 0.25, 0.5, 0.75, 1].forEach(function (v) {
        var y = m.t + ih - v * ih;
        grid.appendChild(el("line", { x1: m.l, x2: W - m.r, y1: y, y2: y }));
        grid.appendChild(el("text", { x: m.l - 6, y: y + 4, "text-anchor": "end", "class": "tick-label" }, v.toFixed(2).replace(/^0\./, ".")));
      });
      svg.appendChild(grid);
      svg.appendChild(el("line", { x1: m.l, x2: W - m.r, y1: m.t + ih, y2: m.t + ih, stroke: "#c9ccd3" }));

      PET.volumes.forEach(function (vol, i) {
        var cx = m.l + gw * i + gw / 2;
        var g = el("g");
        var rb = el("rect", { "class": "bar", x: cx - bw - gap / 2, width: bw, rx: 3, fill: "var(--rci)" });
        var sb = el("rect", { "class": "bar", x: cx + gap / 2, width: bw, rx: 3, fill: "var(--std)" });
        var rl = el("text", { "class": "bar-label", x: cx - bw / 2 - gap / 2, "text-anchor": "middle" });
        var sl = el("text", { "class": "bar-label", x: cx + bw / 2 + gap / 2, "text-anchor": "middle" });
        var dl = el("text", { "class": "delta", x: cx, y: m.t - 14, "text-anchor": "middle" });
        g.appendChild(rb); g.appendChild(sb); g.appendChild(rl); g.appendChild(sl); g.appendChild(dl);
        g.appendChild(el("text", { "class": "tick-label", x: cx, y: H - m.b + 20, "text-anchor": "middle" }, compact ? String(vol) : vol + " veh/h/l"));
        svg.appendChild(g);
        bars.push({ rb: rb, sb: sb, rl: rl, sl: sl, dl: dl });
      });
      if (compact) {
        svg.appendChild(el("text", { "class": "tick-label", x: m.l + iw / 2, y: H - 4, "text-anchor": "middle" }, "Traffic volume (veh/h/l)"));
      }
      host.appendChild(svg);
      render(current);
    }

    function render(x) {
      current = x;
      var d = PET[x];
      bars.forEach(function (b, i) {
        var hr = d.rci[i] * ih, hs = d.std[i] * ih;
        b.rb.setAttribute("y", m.t + ih - hr); b.rb.setAttribute("height", Math.max(hr, 0.5));
        b.sb.setAttribute("y", m.t + ih - hs); b.sb.setAttribute("height", Math.max(hs, 0.5));
        b.rl.setAttribute("y", m.t + ih - hr - 5); b.rl.textContent = fmt(d.rci[i]);
        b.sl.setAttribute("y", m.t + ih - hs - 5); b.sl.textContent = fmt(d.std[i]);
        b.dl.textContent = (compact ? "" : "Δ ") + fmtDelta(d.delta[i]);
        b.dl.setAttribute("class", "delta " + (d.delta[i] < 0 ? "good" : "bad"));
      });
      if (label) label.textContent = x;
    }

    var btns = document.querySelectorAll("#pet-explorer [data-x]");
    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        btns.forEach(function (b) {
          var on = b === btn;
          b.classList.toggle("is-active", on);
          b.setAttribute("aria-selected", on ? "true" : "false");
        });
        render(btn.getAttribute("data-x"));
      });
    });

    build();
    var t;
    window.addEventListener("resize", function () {
      clearTimeout(t);
      t = setTimeout(function () { if ((host.clientWidth < 560) !== compact) build(); }, 120);
    });
  }

  /* ------------------------------------------------------------------
   * 5. Emission reduction bars
   * ------------------------------------------------------------------ */
  function setupEmissionBars() {
    document.querySelectorAll("#emissions-table tbody tr").forEach(function (tr) {
      var red = parseFloat(tr.getAttribute("data-red"));
      var cell = tr.querySelector(".col-red");
      if (!cell || isNaN(red)) return;
      cell.innerHTML = '<span class="red-bar"><span class="track"><i style="width:' + (red / 60 * 100).toFixed(1) +
        '%"></i></span><b>−' + red.toFixed(1) + '%</b></span>';
    });
  }

  /* ------------------------------------------------------------------
   * 6. BibTeX copy, placeholder buttons
   * ------------------------------------------------------------------ */
  function setupCopy() {
    var btn = document.getElementById("copy-bibtex");
    var pre = document.getElementById("bibtex-text");
    if (!btn || !pre) return;
    btn.addEventListener("click", function () {
      var text = pre.innerText.trim();
      function done() { btn.textContent = "Copied"; setTimeout(function () { btn.textContent = "Copy"; }, 1600); }
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, legacy);
      } else { legacy(); }
      function legacy() {
        var ta = document.createElement("textarea");
        ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); done(); } catch (e) { /* ignore */ }
        ta.remove();
      }
    });
  }

  function setupSoonButtons() {
    document.querySelectorAll(".btn.is-soon").forEach(function (a) {
      a.addEventListener("click", function (e) { e.preventDefault(); });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupDemoVideo();
    setupTwins();
    setupLoopVideos();
    setupCompare();
    setupArchScrolly();
    setupPetExplorer();
    setupEmissionBars();
    setupCopy();
    setupSoonButtons();
  });
})();

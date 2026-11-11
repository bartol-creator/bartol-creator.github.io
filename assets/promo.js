// Promo codes: the small button in the page corner. Add a code by adding a line to CODES (lower case, no spaces).
(function () {
  var CODES = { dariokompar: dario };

  var button = document.createElement("button");
  button.className = "promo-open";
  button.type = "button";
  button.textContent = "Promo code";
  document.body.appendChild(button);

  var dialog = document.createElement("dialog");
  dialog.id = "promo";
  dialog.setAttribute("aria-label", "Promo code");
  dialog.innerHTML = '<form><label for="promo-code">Promo code</label>' +
    '<div class="promo-row"><input id="promo-code" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" maxlength="40">' +
    '<button type="submit">Use</button></div><p class="promo-msg" role="status"></p></form>';
  document.body.appendChild(dialog);
  var input = dialog.querySelector("input"), message = dialog.querySelector(".promo-msg");

  button.addEventListener("click", function () { loadArt(); message.textContent = ""; input.value = ""; dialog.showModal(); input.focus(); });
  dialog.addEventListener("click", function (e) { if (e.target === dialog) dialog.close(); });
  dialog.querySelector("form").addEventListener("submit", function (e) {
    e.preventDefault();
    var code = input.value.replace(/\s+/g, "").toLowerCase();
    if (!Object.prototype.hasOwnProperty.call(CODES, code)) { message.textContent = "That code doesn't exist."; return; }
    dialog.close();
    CODES[code]();
  });

  var stopCurrent = null, art = null;
  var ART_WIDTH = 700, ART_HEIGHT = 850, EYES = [[-25, -782], [11, -782]];

  function loadArt() {
    if (art) return;
    art = {};
    ["body", "near", "back"].forEach(function (part) {
      art[part] = new Image();
      art[part].src = "assets/promo/rider-" + part + ".webp";
    });
  }

  function dario() {
    if (stopCurrent) stopCurrent();
    loadArt();
    document.querySelectorAll("video").forEach(function (v) { v.pause(); });

    var RUN = 11, YELLS = [0.4, 4, 7.6], YELL_LENGTH = 1.5;
    var still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    var canvas = document.createElement("canvas");
    canvas.className = "promo-stage";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    var g = canvas.getContext("2d"), W = 0, H = 0;
    function size() {
      var dpr = Math.min(devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    addEventListener("resize", size);

    var page = document.querySelector(".wrap");
    var sound = startSound(YELLS);
    var bolts = [], nextBolt = 0, scorches = [], sparks = [], lastBurn = null, start = performance.now(), raf = 0, stopped = false;

    function stop() {
      if (stopped) return;
      stopped = true;
      cancelAnimationFrame(raf);
      removeEventListener("resize", size);
      removeEventListener("keydown", onKey);
      canvas.remove();
      page.style.transform = "";
      sound.stop();
      stopCurrent = null;
    }
    function onKey(e) { if (e.key === "Escape") stop(); }
    addEventListener("keydown", onKey);
    stopCurrent = stop;

    function frame(now) {
      var t = (now - start) / 1000;
      if (t > RUN) { stop(); return; }
      var yelling = YELLS.some(function (y) { return t > y && t < y + YELL_LENGTH; });
      var scale = Math.min(H * 0.62 / ART_HEIGHT, W * 0.9 / ART_WIDTH);

      // There and back through the air.
      var half = RUN / 2, margin = ART_WIDTH * 0.52 * scale, there = t < half;
      var along = there ? t / half : (t - half) / half;
      var x = there ? -margin + along * (W + margin * 2) : W + margin - along * (W + margin * 2);
      var dir = there ? 1 : -1;
      var y = H * 0.78 + Math.sin(t * 1.6) * H * 0.06 + Math.sin(t * 14) * 9 * scale;
      var tilt = Math.sin(t * 1.6 + 0.5) * 0.04;

      page.style.transform = yelling && !still ? "translate(" + (Math.random() * 10 - 5) + "px," + (Math.random() * 10 - 5) + "px)" : "";
      g.clearRect(0, 0, W, H);

      // The beams sweep over the page and burn it wherever they land.
      var tx = W * (0.5 + 0.45 * Math.sin(t * 1.7)), ty = H * (0.36 + 0.3 * Math.sin(t * 2.3 + 1));
      if (!lastBurn || Math.hypot(tx - lastBurn.x, ty - lastBurn.y) > 22) {
        lastBurn = { x: tx, y: ty };
        scorches.push({ x: tx, y: ty, r: 14 + Math.random() * 14, born: t });
        if (scorches.length > 90) scorches.shift();
      }
      for (var i = 0; i < 3; i++) sparks.push({ x: tx, y: ty, vx: Math.random() * 420 - 210, vy: Math.random() * -320 - 40, born: t });
      if (sparks.length > 160) sparks.splice(0, sparks.length - 160);

      scorches.forEach(function (s) {
        var fade = Math.max(0, 1 - (t - s.born) / 4);
        var burn = g.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
        burn.addColorStop(0, "rgba(10,5,2," + 0.85 * fade + ")");
        burn.addColorStop(0.65, "rgba(70,20,5," + 0.55 * fade + ")");
        burn.addColorStop(1, "rgba(255,90,20,0)");
        g.fillStyle = burn;
        g.beginPath(); g.arc(s.x, s.y, s.r, 0, Math.PI * 2); g.fill();
      });

      // Lightning all over the page, as thin bolts only: no full-window flashes.
      if (t >= nextBolt) {
        nextBolt = t + (still ? 0.5 : 0.08);
        var bolt = makeBolt(W, H);
        bolt.born = t;
        bolts.push(bolt);
        var end = bolt.main[bolt.main.length - 1];
        scorches.push({ x: end.x, y: end.y, r: 12 + Math.random() * 12, born: t });
        if (scorches.length > 90) scorches.shift();
        for (var b = 0; b < 8; b++) sparks.push({ x: end.x, y: end.y, vx: Math.random() * 420 - 210, vy: Math.random() * -320 - 40, born: t });
      }
      bolts = bolts.filter(function (bolt) {
        var age = (t - bolt.born) / (still ? 0.6 : 0.28);
        if (age >= 1) return false;
        drawBolt(g, bolt, 1 - age);
        return true;
      });

      var eyes = EYES.map(function (e) {
        return { x: x + dir * scale * (e[0] * Math.cos(tilt) - e[1] * Math.sin(tilt)), y: y + scale * (e[0] * Math.sin(tilt) + e[1] * Math.cos(tilt)) };
      });
      eyes.forEach(function (eye, n) { beam(eye.x, eye.y, tx + (n ? 12 : -12), ty); });

      var dt = 1 / 60;
      g.fillStyle = "#ffd27a";
      sparks = sparks.filter(function (p) {
        var age = t - p.born;
        if (age > 0.6) return false;
        p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        g.fillRect(p.x - 2, p.y - 2, 4, 4);
        return true;
      });

      g.save();
      g.translate(x, y);
      g.scale(dir * scale, scale);
      g.rotate(tilt);
      rider(g, t);
      g.restore();

      eyes.forEach(function (eye) {
        var r = Math.max(9, 30 * scale), glow = g.createRadialGradient(eye.x, eye.y, 0, eye.x, eye.y, r);
        glow.addColorStop(0, "#fff");
        glow.addColorStop(0.25, "rgba(255,60,40,.95)");
        glow.addColorStop(1, "rgba(255,20,10,0)");
        g.fillStyle = glow;
        g.beginPath(); g.arc(eye.x, eye.y, r, 0, Math.PI * 2); g.fill();
      });

      raf = requestAnimationFrame(frame);
    }

    function beam(x0, y0, x1, y1) {
      g.lineCap = "round";
      [[16, "rgba(255,30,20,.2)"], [8, "rgba(255,40,25,.6)"], [3, "#ffe3dc"]].forEach(function (layer) {
        g.lineWidth = layer[0];
        g.strokeStyle = layer[1];
        g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      });
    }

    raf = requestAnimationFrame(frame);
  }

  // A jagged line down from above the window, with a few side branches.
  function makeBolt(W, H) {
    function jag(x, y, stepX, stepY, count) {
      var line = [{ x: x, y: y }];
      for (var i = 0; i < count; i++) {
        x += (Math.random() - 0.5) * stepX;
        y += stepY * (0.6 + Math.random() * 0.8);
        line.push({ x: x, y: y });
      }
      return line;
    }
    var main = jag(Math.random() * W, -10, 90, H * (0.3 + Math.random() * 0.7) / 9, 9), branches = [];
    for (var i = 2; i < main.length - 2; i += 2) {
      branches.push(jag(main[i].x, main[i].y, 70, H / 22, 4).map(function (point, n) {
        return { x: point.x + n * (i % 4 ? 16 : -16), y: point.y };
      }));
    }
    return { main: main, branches: branches };
  }

  function drawBolt(g, bolt, strength) {
    function path(line) {
      g.beginPath();
      line.forEach(function (point, i) { if (i) g.lineTo(point.x, point.y); else g.moveTo(point.x, point.y); });
      g.stroke();
    }
    g.lineJoin = "round";
    g.lineCap = "round";
    g.globalAlpha = strength;
    g.strokeStyle = "rgba(90,140,255,.35)";
    g.lineWidth = 12;
    path(bolt.main);
    g.lineWidth = 5;
    bolt.branches.forEach(path);
    g.strokeStyle = "#eaf2ff";
    g.lineWidth = 3;
    path(bolt.main);
    g.lineWidth = 1.5;
    bolt.branches.forEach(path);
    g.globalAlpha = 1;
  }

  // Photo layers, facing right. The origin is the bottom middle of the picture.
  function rider(g, t) {
    if (!art || !art.body.complete || !art.near.complete || !art.back.complete) return;
    var flap = Math.sin(t * 14) * 0.07;
    function wing(image, rootX, rootY, angle) {
      g.save();
      g.translate(rootX, rootY);
      g.rotate(angle);
      g.translate(-rootX, -rootY);
      g.drawImage(image, -ART_WIDTH / 2, -ART_HEIGHT);
      g.restore();
    }
    wing(art.back, 130, -495, -flap * 1.4);
    g.drawImage(art.body, -ART_WIDTH / 2, -ART_HEIGHT);
    wing(art.near, 15, -405, flap);
  }

  function startSound(yells) {
    var Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return { stop: function () {} };
    var ctx = new Context();
    ctx.resume();
    var begin = ctx.currentTime;

    fetch("assets/promo/dario-kompar.mp3")
      .then(function (r) { return r.arrayBuffer(); })
      .then(function (data) { return ctx.decodeAudioData(data); })
      .then(function (clip) {
        if (ctx.state === "closed") return;
        yells.forEach(function (at) {
          var source = ctx.createBufferSource();
          source.buffer = clip;
          source.connect(ctx.destination);
          source.start(Math.max(ctx.currentTime, begin + at));
        });
      })
      .catch(function () {});

    // Thunder between the shouts.
    var noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), samples = noise.getChannelData(0);
    for (var i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    for (var at = 0.1; at < 10.5; at += 1.25) {
      var crack = ctx.createBufferSource(), rumble = ctx.createBiquadFilter(), fade = ctx.createGain(), when = begin + at;
      crack.buffer = noise;
      rumble.type = "lowpass";
      rumble.frequency.setValueAtTime(1400, when);
      rumble.frequency.exponentialRampToValueAtTime(120, when + 1);
      fade.gain.setValueAtTime(0.3, when);
      fade.gain.exponentialRampToValueAtTime(0.001, when + 1.6);
      crack.connect(rumble);
      rumble.connect(fade);
      fade.connect(ctx.destination);
      crack.start(when);
    }

    // Laser hum under the shouting.
    var hum = ctx.createOscillator(), wobble = ctx.createOscillator(), depth = ctx.createGain(), level = ctx.createGain();
    hum.type = "sawtooth";
    hum.frequency.value = 180;
    wobble.frequency.value = 7;
    depth.gain.value = 60;
    level.gain.value = 0.05;
    wobble.connect(depth);
    depth.connect(hum.frequency);
    hum.connect(level);
    level.connect(ctx.destination);
    hum.start();
    wobble.start();
    return { stop: function () { ctx.close(); } };
  }
})();

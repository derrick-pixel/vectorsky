/**
 * Vector Sky Defense — Planetary Defense Animation
 * Canvas-based: rotating Earth, orbital satellites, incoming threats, interceptions
 */
(function () {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, EX, EY, ER;          // canvas dims + earth centre/radius
  let stars = [], satellites = [], threats = [], beams = [], explosions = [], particles = [], reticles = [];
  let cloudAngle = 0, shieldPulse = 0, hudBlink = 0;
  let threatCount = 0, interceptCount = 0;
  let animId;

  /* ─── Resize ───────────────────────────────── */
  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    EX = W * 0.50;
    EY = H * 0.52;
    ER = Math.min(W, H) * 0.30;
    buildStars();
  }

  /* ─── Stars ─────────────────────────────────── */
  function buildStars() {
    stars = [];
    for (let i = 0; i < 340; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.4 + 0.2,
        base: Math.random() * 0.7 + 0.15,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.8 + 0.3,
      });
    }
  }

  function drawStars(t) {
    stars.forEach(s => {
      const a = s.base + 0.25 * Math.sin(t * 0.001 * s.speed + s.phase);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(210,225,255,${a})`;
      ctx.fill();
    });
  }

  /* ─── Nebula / background ambience ──────────── */
  function drawNebula() {
    // deep space ambient glow
    const g1 = ctx.createRadialGradient(W * 0.15, H * 0.2, 0, W * 0.15, H * 0.2, W * 0.45);
    g1.addColorStop(0, 'rgba(20,10,50,.18)');
    g1.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);

    const g2 = ctx.createRadialGradient(W * 0.85, H * 0.75, 0, W * 0.85, H * 0.75, W * 0.4);
    g2.addColorStop(0, 'rgba(10,30,80,.14)');
    g2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);
  }

  /* ─── Earth ──────────────────────────────────── */
  // Continent data: [cx, cy, rx, ry, rotation] — all in ER units
  const CONTINENTS = [
    [-0.22, -0.15, 0.28, 0.38,  0.3,  '#1a4020'],
    [ 0.18,  0.08, 0.42, 0.22, -0.2,  '#142e16'],
    [-0.55, -0.10, 0.22, 0.32,  0.5,  '#1e4424'],
    [ 0.05,  0.38, 0.30, 0.18,  0.1,  '#183818'],
    [ 0.50, -0.30, 0.18, 0.28, -0.4,  '#162e14'],
    [-0.10, -0.45, 0.35, 0.12,  0.0,  '#1c4020'],
  ];

  function drawEarth(t) {
    // ── outer atmosphere halo
    const halo = ctx.createRadialGradient(EX, EY, ER * 0.88, EX, EY, ER * 1.38);
    halo.addColorStop(0,   'rgba(40,100,230,.28)');
    halo.addColorStop(0.4, 'rgba(30, 80,180,.14)');
    halo.addColorStop(1,   'rgba(10, 30,120, 0)');
    ctx.beginPath(); ctx.arc(EX, EY, ER * 1.38, 0, Math.PI * 2);
    ctx.fillStyle = halo; ctx.fill();

    // ── clip to sphere
    ctx.save();
    ctx.beginPath(); ctx.arc(EX, EY, ER, 0, Math.PI * 2); ctx.clip();

    // base ocean
    const ocean = ctx.createRadialGradient(EX - ER * 0.28, EY - ER * 0.28, 0, EX, EY, ER);
    ocean.addColorStop(0,   '#2a5898');
    ocean.addColorStop(0.45,'#163c6e');
    ocean.addColorStop(0.8, '#0e2448');
    ocean.addColorStop(1,   '#080f20');
    ctx.beginPath(); ctx.arc(EX, EY, ER, 0, Math.PI * 2);
    ctx.fillStyle = ocean; ctx.fill();

    // continents — rotate slowly
    ctx.save();
    ctx.translate(EX, EY);
    ctx.rotate(cloudAngle * 0.18);
    CONTINENTS.forEach(([cx, cy, rx, ry, rot, col]) => {
      ctx.save();
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.ellipse(cx * ER, cy * ER, rx * ER * 0.55, ry * ER * 0.55, 0, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();
      ctx.restore();
    });
    ctx.restore();

    // atmosphere limb tint
    const limb = ctx.createRadialGradient(EX, EY, ER * 0.78, EX, EY, ER);
    limb.addColorStop(0,   'rgba(50,120,255,0)');
    limb.addColorStop(0.65,'rgba(50,130,255,.12)');
    limb.addColorStop(1,   'rgba(80,170,255,.45)');
    ctx.beginPath(); ctx.arc(EX, EY, ER, 0, Math.PI * 2);
    ctx.fillStyle = limb; ctx.fill();

    // specular glint
    const glint = ctx.createRadialGradient(EX - ER * 0.35, EY - ER * 0.35, 0, EX - ER * 0.35, EY - ER * 0.35, ER * 0.55);
    glint.addColorStop(0,   'rgba(200,230,255,.18)');
    glint.addColorStop(1,   'rgba(200,230,255,0)');
    ctx.fillStyle = glint;
    ctx.beginPath(); ctx.arc(EX, EY, ER, 0, Math.PI * 2); ctx.fill();

    ctx.restore(); // end clip

    // ── night-side shadow
    const shadow = ctx.createRadialGradient(EX + ER * 0.55, EY + ER * 0.1, 0, EX + ER * 0.2, EY, ER * 1.05);
    shadow.addColorStop(0, 'rgba(0,0,0,0)');
    shadow.addColorStop(0.45,'rgba(0,0,0,.35)');
    shadow.addColorStop(1,  'rgba(0,0,0,.88)');
    ctx.beginPath(); ctx.arc(EX, EY, ER, 0, Math.PI * 2);
    ctx.fillStyle = shadow; ctx.fill();

    // ── city lights on night side
    ctx.save();
    ctx.beginPath(); ctx.arc(EX, EY, ER, 0, Math.PI * 2); ctx.clip();
    const cityLights = [
      [0.3, -0.1], [0.45, 0.15], [0.55, -0.2], [0.38, 0.35],
      [0.6, 0.1],  [0.52, 0.42], [0.35, -0.35],[0.7, -0.1],
    ];
    cityLights.forEach(([ox, oy]) => {
      const lx = EX + ox * ER, ly = EY + oy * ER;
      const lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, ER * 0.07);
      lg.addColorStop(0, 'rgba(255,220,140,.55)');
      lg.addColorStop(1, 'rgba(255,200,100,0)');
      ctx.fillStyle = lg;
      ctx.beginPath(); ctx.arc(lx, ly, ER * 0.07, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
  }

  /* ─── Orbit ring ─────────────────────────────── */
  function drawOrbitRing() {
    ctx.save();
    ctx.setLineDash([5, 12]);
    ctx.strokeStyle = 'rgba(100,150,220,.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(EX, EY, ER * 1.55, ER * 0.55, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  /* ─── Satellites ─────────────────────────────── */
  function initSatellites() {
    satellites = [];
    const count = 4;
    for (let i = 0; i < count; i++) {
      satellites.push({
        angle:  (i / count) * Math.PI * 2,
        speed:  0.006 + i * 0.0015,
        orbitA: ER * 1.55,
        orbitB: ER * 0.55,
        size:   7,
        fireCD: 0,
      });
    }
  }

  function getSatPos(sat) {
    return {
      x: EX + Math.cos(sat.angle) * sat.orbitA,
      y: EY + Math.sin(sat.angle) * sat.orbitB,
    };
  }

  function drawSatellites() {
    satellites.forEach(sat => {
      const { x, y } = getSatPos(sat);
      const s = sat.size;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(sat.angle + Math.PI / 2);

      // body
      ctx.fillStyle = '#7a8aaa';
      ctx.fillRect(-s * 0.5, -s * 0.55, s, s * 1.1);

      // solar panels
      ctx.fillStyle = '#1e3a7a';
      ctx.fillRect(-s * 2.4, -s * 0.9, s * 1.8, s * 1.8);
      ctx.fillRect( s * 0.6, -s * 0.9, s * 1.8, s * 1.8);

      // panel grid lines
      ctx.strokeStyle = 'rgba(100,150,255,.3)';
      ctx.lineWidth = 0.5;
      for (let g = 1; g < 3; g++) {
        ctx.beginPath();
        ctx.moveTo(-s * 2.4 + g * s * 0.6, -s * 0.9);
        ctx.lineTo(-s * 2.4 + g * s * 0.6,  s * 0.9);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(s * 0.6 + g * s * 0.6, -s * 0.9);
        ctx.lineTo(s * 0.6 + g * s * 0.6,  s * 0.9);
        ctx.stroke();
      }

      // core glow — amber when on amber side
      ctx.beginPath(); ctx.arc(0, 0, s * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(200,134,10,.9)';
      ctx.shadowBlur = 10; ctx.shadowColor = '#c8860a';
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();
    });
  }

  /* ─── Threats ─────────────────────────────────── */
  function spawnThreat() {
    // come from random edge — mostly top and sides
    const edge = Math.random();
    let x, y;
    if (edge < 0.5)      { x = Math.random() * W;  y = -50; }               // top
    else if (edge < 0.7) { x = -50;                 y = Math.random() * H * 0.6; } // left
    else                 { x = W + 50;              y = Math.random() * H * 0.6; } // right

    // target: earth surface ± some scatter
    const a = Math.random() * Math.PI * 2;
    const tx = EX + Math.cos(a) * ER * (0.2 + Math.random() * 0.5);
    const ty = EY + Math.sin(a) * ER * (0.2 + Math.random() * 0.5);

    threatCount++;
    threats.push({
      id: threatCount,
      x, y, tx, ty,
      speed: 1.8 + Math.random() * 1.6,
      size: 11 + Math.random() * 7,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.04,
      alive: true,
      opacity: 1,
      pulsePhase: Math.random() * Math.PI * 2,
    });

    // add targeting reticle
    reticles.push({ id: threatCount, alpha: 0, scale: 2.5 });
  }

  function drawThreats(t) {
    threats.forEach(th => {
      if (th.opacity <= 0) return;

      if (!th.alive) { th.opacity -= 0.06; return; }

      // move
      const dx = th.tx - th.x, dy = th.ty - th.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 18) {
        // reached target — impact
        th.alive = false;
        spawnExplosion(th.x, th.y, th.size * 2, '#ff2200');
        return;
      }
      th.x += (dx / dist) * th.speed;
      th.y += (dy / dist) * th.speed;
      th.rot += th.rotSpeed;

      // pulse glow
      const pulse = 0.6 + 0.4 * Math.sin(t * 0.004 + th.pulsePhase);

      ctx.save();
      ctx.translate(th.x, th.y);
      ctx.rotate(th.rot);

      const s = th.size;
      // outer glow halo
      ctx.beginPath();
      ctx.arc(0, 0, s * 1.8, 0, Math.PI * 2);
      const hg = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 1.8);
      hg.addColorStop(0,   `rgba(255,40,0,${0.25 * pulse * th.opacity})`);
      hg.addColorStop(1,   'rgba(255,40,0,0)');
      ctx.fillStyle = hg; ctx.fill();

      // angular alien body — 6-pointed shard
      ctx.beginPath();
      const pts = 6;
      for (let i = 0; i < pts; i++) {
        const a = (i / pts) * Math.PI * 2;
        const r = i % 2 === 0 ? s : s * 0.55;
        i === 0 ? ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r)
                : ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fillStyle = `rgba(160,20,10,${th.opacity})`;
      ctx.shadowBlur = 16 * pulse;
      ctx.shadowColor = '#ff2200';
      ctx.fill();
      ctx.strokeStyle = `rgba(255,80,40,${th.opacity})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // inner core
      ctx.beginPath(); ctx.arc(0, 0, s * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,160,80,${th.opacity * pulse})`;
      ctx.fill();

      ctx.restore();
    });

    // purge dead/offscreen
    threats = threats.filter(th => th.opacity > 0);
  }

  /* ─── Reticles ───────────────────────────────── */
  function drawReticles(t) {
    reticles = reticles.filter(r => {
      const th = threats.find(t => t.id === r.id);
      if (!th) return false;

      r.alpha = Math.min(r.alpha + 0.04, 0.7);
      r.scale = Math.max(r.scale - 0.04, 1.0);

      const size = th.size * r.scale * 2.4;
      ctx.save();
      ctx.translate(th.x, th.y);
      ctx.globalAlpha = r.alpha * th.opacity;
      ctx.strokeStyle = '#c8860a';
      ctx.lineWidth = 1;

      // corner brackets
      const b = size * 0.35;
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => {
        ctx.beginPath();
        ctx.moveTo(sx * size, sy * size);
        ctx.lineTo(sx * size - sx * b, sy * size);
        ctx.moveTo(sx * size, sy * size);
        ctx.lineTo(sx * size, sy * size - sy * b);
        ctx.stroke();
      });

      // blink centre dot
      if ((t * 0.003 + r.id) % 1 < 0.5) {
        ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#f0a820'; ctx.fill();
      }

      ctx.globalAlpha = 1;
      ctx.restore();
      return true;
    });
  }

  /* ─── Beams ──────────────────────────────────── */
  function fireBeam(x1, y1, x2, y2, color = '#c8860a') {
    beams.push({ x1, y1, x2, y2, life: 1.0, color });
  }

  function drawBeams() {
    beams = beams.filter(b => b.life > 0);
    beams.forEach(b => {
      const hex = b.color;
      ctx.beginPath(); ctx.moveTo(b.x1, b.y1); ctx.lineTo(b.x2, b.y2);
      ctx.strokeStyle = hex.replace(')', `,${b.life})`).replace('rgb', 'rgba');
      // crude: just use amber with alpha
      ctx.strokeStyle = `rgba(200,134,10,${b.life})`;
      ctx.lineWidth = 3.5 * b.life;
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#c8860a';
      ctx.stroke();
      // core white line
      ctx.strokeStyle = `rgba(255,240,180,${b.life * 0.8})`;
      ctx.lineWidth = 1.2 * b.life;
      ctx.stroke();
      ctx.shadowBlur = 0;
      b.life -= 0.055;
    });
  }

  /* ─── Explosions + particles ─────────────────── */
  function spawnExplosion(x, y, size, baseColor = '#c8860a') {
    interceptCount++;
    explosions.push({ x, y, r: 4, maxR: size * 2.2, life: 1.0, baseColor });

    // ring shockwave
    explosions.push({ x, y, r: 4, maxR: size * 4, life: 0.7, ring: true });

    // particles
    const count = 18 + Math.floor(size * 1.5);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 0.8 + Math.random() * 3.5;
      particles.push({
        x, y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        life: 1.0,
        decay: 0.018 + Math.random() * 0.025,
        size: 1.5 + Math.random() * size * 0.22,
        color: Math.random() < 0.55 ? '#c8860a' : (Math.random() < 0.5 ? '#ff4400' : '#fff4a0'),
      });
    }
  }

  function drawExplosions() {
    explosions = explosions.filter(e => e.life > 0);
    explosions.forEach(e => {
      e.r += (e.maxR - e.r) * 0.14;
      e.life -= 0.04;

      if (e.ring) {
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(200,134,10,${e.life * 0.5})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        return;
      }

      const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r);
      g.addColorStop(0,    `rgba(255,220,80,${e.life})`);
      g.addColorStop(0.35, `rgba(255,100,20,${e.life * 0.8})`);
      g.addColorStop(0.7,  `rgba(180,30,10,${e.life * 0.4})`);
      g.addColorStop(1,    `rgba(100,0,0,0)`);
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.fillStyle = g; ctx.fill();
    });
  }

  function drawParticles() {
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.06;  // subtle drift
      p.vx *= 0.97;
      p.life -= p.decay;

      const col = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.5, p.size * p.life), 0, Math.PI * 2);
      // parse hex to rgba
      const r2 = parseInt(col.slice(1,3),16), g2 = parseInt(col.slice(3,5),16), b2 = parseInt(col.slice(5,7),16);
      ctx.fillStyle = `rgba(${r2},${g2},${b2},${p.life})`;
      ctx.fill();
    });
  }

  /* ─── AI interception logic ──────────────────── */
  function runInterceptions() {
    satellites.forEach(sat => {
      if (sat.fireCD > 0) { sat.fireCD--; return; }
      const { x: sx, y: sy } = getSatPos(sat);

      // find nearest alive threat within range
      let nearest = null, nearD = Infinity;
      threats.forEach(th => {
        if (!th.alive) return;
        const d = Math.hypot(th.x - sx, th.y - sy);
        if (d < ER * 2.2 && d < nearD) { nearest = th; nearD = d; }
      });

      if (nearest) {
        fireBeam(sx, sy, nearest.x, nearest.y);
        spawnExplosion(nearest.x, nearest.y, nearest.size * 1.6);
        nearest.alive = false;
        interceptCount++;
        sat.fireCD = 38 + Math.floor(Math.random() * 30);

        // remove its reticle
        reticles = reticles.filter(r => r.id !== nearest.id);
      }
    });
  }

  /* ─── Shield dome ────────────────────────────── */
  function drawShield(t) {
    shieldPulse += 0.025;
    const alpha = 0.04 + 0.025 * Math.sin(shieldPulse);

    ctx.save();
    ctx.setLineDash([6, 16]);
    ctx.strokeStyle = `rgba(60,140,255,${alpha * 2.5})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(EX, EY, ER * 1.78, ER * 1.78, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.setLineDash([4, 24]);
    ctx.strokeStyle = `rgba(80,160,255,${alpha * 1.5})`;
    ctx.beginPath();
    ctx.ellipse(EX, EY, ER * 2.1, ER * 2.1, 0.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  /* ─── HUD overlay ────────────────────────────── */
  function drawHUD(t) {
    hudBlink += 0.04;
    const alive = threats.length;
    const blink = Math.sin(hudBlink) > 0;

    ctx.save();
    ctx.font = `600 ${Math.round(W * 0.0095)}px 'Share Tech Mono', monospace`;
    ctx.textAlign = 'left';

    // top-left block
    const fs = W * 0.011;
    ctx.font = `${fs}px 'Share Tech Mono', monospace`;

    const lines = [
      `PLANETARY DEFENSE NETWORK`,
      `─────────────────────────────`,
      `STATUS: ${blink && alive > 0 ? '⚠ THREAT DETECTED' : 'ACTIVE'}`,
      `THREATS TRACKED : ${threats.filter(t=>t.alive).length.toString().padStart(2,'0')}`,
      `INTERCEPTS      : ${interceptCount.toString().padStart(2,'0')}`,
      `ORBITAL UNITS   : ${satellites.length.toString().padStart(2,'0')}`,
    ];

    const lh = fs * 1.55;
    const px = W * 0.025, py = H * 0.07;

    lines.forEach((line, i) => {
      const isAlert = line.includes('THREAT DETECTED');
      const isHeader = i === 0;
      ctx.fillStyle = isAlert ? `rgba(255,60,30,${blink ? 1 : 0.3})`
                    : isHeader ? 'rgba(200,134,10,.85)'
                    : 'rgba(160,180,160,.55)';
      ctx.fillText(line, px, py + i * lh);
    });

    // bottom-right intercept badge
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(200,134,10,.4)';
    ctx.font = `${fs * 0.85}px 'Share Tech Mono', monospace`;
    ctx.fillText(`VSD-CMD-001 // LIVE FEED`, W * 0.975, H * 0.96);

    ctx.restore();
  }

  /* ─── Main loop ──────────────────────────────── */
  let lastSpawn = 0;
  let spawnInterval = 3200; // ms between threats

  function loop(t) {
    ctx.clearRect(0, 0, W, H);

    cloudAngle += 0.001;

    // spawn threats
    if (t - lastSpawn > spawnInterval) {
      spawnThreat();
      lastSpawn = t;
      spawnInterval = 2800 + Math.random() * 2000;
    }

    drawNebula();
    drawStars(t);
    drawShield(t);
    drawOrbitRing();
    drawEarth(t);
    drawSatellites();
    runInterceptions();
    drawReticles(t);
    drawThreats(t);
    drawBeams();
    drawExplosions();
    drawParticles();
    drawHUD(t);

    animId = requestAnimationFrame(loop);
  }

  /* ─── Init ───────────────────────────────────── */
  function init() {
    resize();
    initSatellites();
    // seed 2 initial threats
    spawnThreat();
    setTimeout(spawnThreat, 1200);
    window.addEventListener('resize', () => {
      cancelAnimationFrame(animId);
      resize();
      initSatellites();
      requestAnimationFrame(loop);
    });
    requestAnimationFrame(loop);
  }

  // wait for fonts
  document.fonts.ready.then(init);
})();

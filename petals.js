(() => {
  const layer = document.getElementById("petalLayer");
  if (!layer) return;

  const rand = (min, max) => Math.random() * (max - min) + min;

  // Stellschrauben
  const SPAWN_EVERY_MS = 300; // höher = weniger, niedriger = mehr
  const MAX_ON_SCREEN = 40; // Performance-Limit

  function spawnPetal() {
    if (layer.childElementCount >= MAX_ON_SCREEN) return;

    const p = document.createElement("div");
    p.className = "petal";

    // Start-X in vw
    const startX = rand(0, 100);
    // Drift (wie stark nach links/rechts)
    const drift = rand(-18, 50);

    // Größe
    const w = rand(8, 18);
    const h = w * rand(0.6, 0.9);
    p.style.width = `${w}px`;
    p.style.height = `${h}px`;

    // Farbe leicht variieren (pastell rot/pink)
    const tint = rand(-8, 8);
    p.style.background = `rgba(${243 + tint}, ${192 + tint}, ${
      198 + tint
    }, ${rand(0.65, 0.95)})`;

    // Dauer + Rotation
    const dur = rand(5.5, 11.5); // Sekunden
    const rot = `${rand(-420, 420)}deg`;

    // CSS-Variablen für Keyframes
    p.style.setProperty("--dur", `${dur}s`);
    p.style.setProperty("--x0", `${startX}vw`);
    p.style.setProperty("--x1", `${startX + drift}vw`);
    p.style.setProperty("--rot", rot);

    // Optional: unterschiedliche “Wind”-Stärke per leichtem Skew
    p.style.filter = `blur(${rand(0, 0.4)}px)`;

    layer.appendChild(p);

    // Entfernen nach Animation
    p.addEventListener("animationend", () => p.remove(), { once: true });
  }

  // Start
  const timer = setInterval(spawnPetal, SPAWN_EVERY_MS);

  // Optional: stoppen, wenn Tab hidden (spart Ressourcen)
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) {
        clearInterval(timer);
      }
    },
    { once: true }
  );
})();

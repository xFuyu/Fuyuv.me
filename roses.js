(() => {
  const strip = document.getElementById("roseStrip");
  if (!strip) return;

  // Stellschrauben
  const COUNT = 18;

  // Leichtes Weighting: A öfter, B/C seltener
  const typesWeighted = [
    "rose--a",
    "rose--a",
    "rose--a",
    "rose--a",
    "rose--b",
    "rose--b",
    "rose--c",
    "rose--c",
  ];

  const rand = (min, max) => Math.random() * (max - min) + min;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  strip.innerHTML = "";

  for (let i = 0; i < COUNT; i++) {
    const outer = document.createElement("div");
    outer.className = "rose-wrap-outer";

    const inner = document.createElement("div");
    inner.className = "rose-wrap";

    const rose = document.createElement("div");
    rose.className = "rose " + pick(typesWeighted);

    // Größe (B ein bisschen höher, C ein bisschen größer)
    const isB = rose.classList.contains("rose--b");
    const isC = rose.classList.contains("rose--c");

    const scale = isB
      ? rand(0.85, 1.15)
      : isC
      ? rand(0.95, 1.35)
      : rand(0.8, 1.25);

    outer.style.transform = `scale(${scale.toFixed(2)})`;

    // Windstärke
    const amp = rand(0.8, 1.7);
    inner.style.setProperty("--amp", `${amp.toFixed(2)}deg`);

    // Zufälliger Delay fürs Grow
    const delay = Math.floor(rand(0, 1400));
    rose.style.animationDelay = `${delay}ms`;

    // Optional: unterschiedliche Windgeschwindigkeit
    const dur = Math.floor(rand(2600, 4600));
    inner.style.animationDuration = `${dur}ms`;

    inner.appendChild(rose);
    outer.appendChild(inner);
    strip.appendChild(outer);
  }
})();

const starLayer = document.getElementById("star-layer");
const trailLayer = document.getElementById("trail-layer");

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function addStars(count) {
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < count; i += 1) {
    const star = document.createElement("span");
    star.className = "star";
    star.style.setProperty("--x", random(0, 100).toFixed(2));
    star.style.setProperty("--y", random(0, 100).toFixed(2));
    star.style.setProperty("--size", `${random(0.6, 2.6).toFixed(2)}px`);
    star.style.setProperty("--twinkle", `${random(2.6, 8).toFixed(2)}s`);
    star.style.setProperty("--delay", `${random(-8, 0).toFixed(2)}s`);
    fragment.appendChild(star);
  }

  starLayer.appendChild(fragment);
}

function addTrails(count) {
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < count; i += 1) {
    const trail = document.createElement("span");
    trail.className = "trail";
    trail.style.setProperty("--x", random(-20, 85).toFixed(2));
    trail.style.setProperty("--y", random(-40, 70).toFixed(2));
    trail.style.setProperty("--length", `${random(40, 140).toFixed(1)}px`);
    trail.style.setProperty("--angle", `${random(20, 34).toFixed(1)}deg`);
    trail.style.setProperty("--duration", `${random(4.2, 10.4).toFixed(2)}s`);
    trail.style.setProperty("--delay", `${random(-10, 0).toFixed(2)}s`);
    fragment.appendChild(trail);
  }

  trailLayer.appendChild(fragment);
}

if (starLayer && trailLayer) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  addStars(reduceMotion ? 110 : 180);
  if (!reduceMotion) {
    addTrails(32);
  }
}

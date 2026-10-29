(() => {
  const root = document.documentElement;
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

  const replayCardReveal = (card) => {
    if (!card || motionPreference.matches) return;

    card.style.setProperty("--card-reveal-delay", "0ms");
    card.style.setProperty("animation", "none");
    void card.offsetWidth;
    card.style.removeProperty("animation");
  };
  window.replayCardReveal = replayCardReveal;

  if (motionPreference.matches) {
    root.classList.remove("card-reveal-pending");
    return;
  }

  const cards = Array.from(document.querySelectorAll(".card, .contact-card"))
    .filter((card) => card.getClientRects().length > 0)
    .sort((a, b) => {
      const rectA = a.getBoundingClientRect();
      const rectB = b.getBoundingClientRect();
      return rectA.top - rectB.top || rectA.left - rectB.left;
    });

  if (!cards.length) {
    root.classList.remove("card-reveal-pending");
    return;
  }

  const stagger = 55;
  const surfaceDuration = 320;

  cards.forEach((card, index) => {
    card.style.setProperty("--card-reveal-delay", index * stagger + "ms");
  });
  root.style.setProperty("--card-surface-duration", surfaceDuration + "ms");

  requestAnimationFrame(() => {
    root.classList.add("card-reveal-ready");
  });
})();

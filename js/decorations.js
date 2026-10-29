(() => {
  const balloons = Array.from(document.querySelectorAll(".cat-balloon-decoration"));
  if (!balloons.length) return;

  const baseMeasurements = balloons.map((balloon) => {
    const styles = window.getComputedStyle(balloon);
    const isRightAnchored = balloon.classList.contains("balloon-far-decoration");
    return {
      balloon,
      width: parseFloat(styles.width) || 360,
      left: parseFloat(styles.left) || 0,
      right: isRightAnchored ? (parseFloat(styles.right) || 0) : null,
      top: parseFloat(styles.top) || 0,
      bottom: isRightAnchored ? (parseFloat(styles.bottom) || 0) : null,
      isBottomAnchored: isRightAnchored,
    };
  });
  const key = "lead4change-balloon-base-dpr";
  let baseDpr = window.devicePixelRatio || 1;
  try {
    const savedDpr = Number(sessionStorage.getItem(key));
    if (savedDpr > 0) baseDpr = savedDpr;
    else sessionStorage.setItem(key, String(baseDpr));
  } catch {}

  function keepBalloonSizeAndPosition() {
    const zoomRatio = (window.devicePixelRatio || baseDpr) / baseDpr;
    for (const item of baseMeasurements) {
      const width = String(item.width / zoomRatio) + "px";
      item.balloon.style.width = width;
      item.balloon.style.minWidth = width;
      if (item.right !== null) {
        item.balloon.style.left = "auto";
        item.balloon.style.right = String(item.right / zoomRatio) + "px";
      } else {
        item.balloon.style.left = String(item.left / zoomRatio) + "px";
        item.balloon.style.right = "auto";
      }
      if (item.isBottomAnchored) {
        item.balloon.style.top = "auto";
        item.balloon.style.bottom = String(item.bottom / zoomRatio) + "px";
      } else {
        item.balloon.style.bottom = "auto";
        item.balloon.style.top = String(item.top / zoomRatio) + "px";
      }
    }
  }

  keepBalloonSizeAndPosition();
  window.addEventListener("resize", keepBalloonSizeAndPosition, { passive: true });
})();

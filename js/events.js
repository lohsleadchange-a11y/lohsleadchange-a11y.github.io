
const events = [
  {
    id: "uvscars",
    title: "Project Unveiling Scars",
    date: "2026-10-09",
    description: "Lead 4 Change announces the beginning of Project Unveiling Scars, with the goal of advocating for disability rights.",
    media: [
      { src: "../assets/media/uv_icon.jpg", alt: "Image Failed to Load" }
    ]
  }
];


const listEl = document.getElementById("event-list");
const detailEl = document.getElementById("event-detail");

const today = new Date();
today.setHours(0, 0, 0, 0);

// "2026-10-24" -> a Date at local midnight (avoids time zone shifts)
const parse = (iso) => new Date(iso + "T00:00:00");

// make an element with a class and optional text
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// newest first
events.sort((a, b) => b.date.localeCompare(a.date));

// a thin "Today" line marks where the current date falls in the list
function nowLine() {
  const li = el("li", "now-line");
  li.append(el("span", "now-label", "Today"));
  return li;
}

function renderList() {
  listEl.innerHTML = "";
  // newest events come first, so the line goes just before the first past event.
  // An event happening today counts as not yet past, so the line sits below it.
  let lineDone = false;
  events.forEach((ev) => {
    const d = parse(ev.date);

    if (!lineDone && d < today) {
      listEl.append(nowLine());
      lineDone = true;
    }

    const button = el("button", "event-item" + (d < today ? " is-past" : ""));
    button.type = "button";
    button.dataset.id = ev.id;

    const badge = el("span", "event-date");
    badge.append(
      el("span", "event-month", d.toLocaleDateString(undefined, { month: "short" })),
      el("span", "event-day", String(d.getDate()))
    );

    button.append(badge, el("span", "event-name", ev.title));

    const li = el("li");
    li.append(button);
    listEl.append(li);
  });

  // every event is still ahead of us, so the line goes at the bottom
  if (!lineDone) listEl.append(nowLine());
}

// one photo or video element
function mediaItem(m) {
  if (m.type === "video") {
    const v = el("video", "event-media__item");
    v.src = m.src;
    v.controls = true;
    v.preload = "metadata";
    if (m.poster) v.poster = m.poster;
    v.setAttribute("aria-label", m.alt || "Event video");
    return v;
  }
  const img = el("img", "event-media__item");
  img.src = m.src;
  img.alt = m.alt || "";
  img.draggable = false;
  return img;
}

// the full-size viewer: a <dialog> gives us Esc-to-close and focus trapping for free
const lightbox = (function () {
  const dlg = el("dialog", "lightbox");
  dlg.setAttribute("aria-label", "Photo viewer");

  const img = el("img", "lightbox__img");
  const caption = el("p", "lightbox__caption");
  const count = el("p", "lightbox__count");

  function button(cls, text, label) {
    const b = el("button", "lightbox__btn " + cls, text);
    b.type = "button";
    b.setAttribute("aria-label", label);
    return b;
  }
  const closeBtn = button("lightbox__close", "\u00D7", "Close");
  const prevBtn = button("lightbox__prev", "\u2039", "Previous photo");
  const nextBtn = button("lightbox__next", "\u203A", "Next photo");

  dlg.append(img, caption, count, prevBtn, nextBtn, closeBtn);
  document.body.append(dlg);

  let items = [];   // [{ m: the photo, i: its position in the carousel }]
  let pos = 0;
  let onClose = null;

  function render() {
    const m = items[pos].m;
    img.src = m.src;
    img.alt = m.alt || "";
    caption.textContent = m.caption || "";
    caption.hidden = !m.caption;
    count.textContent = items.length > 1 ? (pos + 1) + " / " + items.length : "";
    prevBtn.hidden = nextBtn.hidden = items.length < 2;
  }

  function step(d) {
    pos = (pos + d + items.length) % items.length;
    render();
  }

  prevBtn.addEventListener("click", () => step(-1));
  nextBtn.addEventListener("click", () => step(1));
  closeBtn.addEventListener("click", () => dlg.close());
  // clicking the dark area around the photo closes it
  dlg.addEventListener("click", (e) => {
    if (!e.target.closest("img, button, p")) dlg.close();
  });
  dlg.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });
  dlg.addEventListener("close", () => {
    document.documentElement.style.overflow = "";
    if (onClose) onClose(items[pos].i);   // carousel jumps to the photo you ended on
  });

  return {
    open(list, start, done) {
      items = list;
      pos = start;
      onClose = done;
      if (typeof dlg.showModal !== "function") {   // very old browsers: open the file itself
        window.open(items[pos].m.src, "_blank");
        return;
      }
      render();
      document.documentElement.style.overflow = "hidden";   // stop the page scrolling behind it
      dlg.showModal();
    }
  };
})();

// the carousel: arrows, dots, swipe, and click-to-enlarge
function buildCarousel(media, label) {
  const figure = el("figure", "event-media");
  const root = el("div", "carousel");
  root.setAttribute("role", "group");
  root.setAttribute("aria-roledescription", "carousel");
  root.setAttribute("aria-label", label);

  const viewport = el("div", "carousel__viewport");
  const track = el("ul", "carousel__track");
  const caption = el("figcaption", "event-media__caption");
  let index = 0;

  const slides = media.map((m, i) => {
    const slide = el("li", "carousel__slide");
    slide.setAttribute("role", "group");
    slide.setAttribute("aria-roledescription", "slide");
    slide.setAttribute("aria-label", (i + 1) + " of " + media.length);

    if (m.type === "video") {
      slide.append(mediaItem(m));
    } else {
      const zoom = el("button", "carousel__zoom");
      zoom.type = "button";
      zoom.setAttribute("aria-label", "Enlarge photo" + (m.alt ? ": " + m.alt : ""));
      zoom.append(mediaItem(m));
      zoom.addEventListener("click", () => {
        const photos = media.map((x, n) => ({ m: x, i: n })).filter((x) => x.m.type !== "video");
        lightbox.open(photos, photos.findIndex((x) => x.i === i), (n) => go(n));
      });
      slide.append(zoom);
    }
    track.append(slide);
    return slide;
  });

  viewport.append(track);
  root.append(viewport);

  let dots = [];
  if (media.length > 1) {
    const prev = el("button", "carousel__btn carousel__btn--prev", "\u2039");
    prev.type = "button";
    prev.setAttribute("aria-label", "Previous");
    prev.addEventListener("click", () => go(index - 1));

    const next = el("button", "carousel__btn carousel__btn--next", "\u203A");
    next.type = "button";
    next.setAttribute("aria-label", "Next");
    next.addEventListener("click", () => go(index + 1));

    const dotBar = el("div", "carousel__dots");
    dots = media.map((m, i) => {
      const dot = el("button", "carousel__dot");
      dot.type = "button";
      dot.setAttribute("aria-label", "Go to " + (i + 1) + " of " + media.length);
      dot.addEventListener("click", () => go(i));
      dotBar.append(dot);
      return dot;
    });

    root.append(prev, next, dotBar);
  }

  // move to slide i (wraps around at both ends)
  function go(i) {
    index = (i + media.length) % media.length;
    track.style.transform = "translateX(" + (-100 * index) + "%)";
    slides.forEach((slide, n) => {
      slide.inert = n !== index;                       // off-screen slides can't be tabbed to
      slide.setAttribute("aria-hidden", n !== index ? "true" : "false");
      const video = slide.querySelector("video");
      if (video && n !== index) video.pause();
    });
    dots.forEach((dot, n) => dot.setAttribute("aria-current", n === index ? "true" : "false"));
    caption.textContent = media[index].caption || "";
    caption.hidden = !media[index].caption;
  }

  // swipe left or right on touch screens (or drag with a mouse)
  let startX = null;
  let swiped = false;
  viewport.addEventListener("pointerdown", (e) => {
    if (e.target.closest("video")) return;   // let video controls work normally
    startX = e.clientX;
    swiped = false;
  });
  viewport.addEventListener("pointerup", (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 40) {
      swiped = true;
      go(index + (dx < 0 ? 1 : -1));
    }
  });
  viewport.addEventListener("pointercancel", () => { startX = null; });
  // a swipe should not also count as a click that opens the big photo
  viewport.addEventListener("click", (e) => {
    if (swiped) { e.stopPropagation(); e.preventDefault(); swiped = false; }
  }, true);

  // left and right arrow keys
  root.addEventListener("keydown", (e) => {
    if (e.target.closest("video") || media.length < 2) return;
    if (e.key === "ArrowLeft") go(index - 1);
    if (e.key === "ArrowRight") go(index + 1);
  });

  figure.append(root, caption);
  go(0);
  return figure;
}

let activeEventId = null;

function select(id, scroll) {
  const ev = events.find((e) => e.id === id) || events[0];
  const changedEvent = activeEventId !== null && activeEventId !== ev.id;
  activeEventId = ev.id;
  const d = parse(ev.date);

  listEl.querySelectorAll(".event-item").forEach((b) => {
    b.setAttribute("aria-current", b.dataset.id === ev.id ? "true" : "false");
  });

  detailEl.innerHTML = "";

  const media = ev.media || [];
  if (media.length) detailEl.append(buildCarousel(media, ev.title + " gallery"));

  const body = el("div", "event-body");

  const isToday = d.getTime() === today.getTime();
  const status = d < today ? "Past event" : isToday ? "Happening today" : "Upcoming event";
  body.append(el("p", "label", status));
  body.append(el("h2", "", ev.title));

  const meta = el("dl", "event-meta");
  const rows = [
    ["Date", d.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })],
    ["Time", ev.time],
    ["Where", ev.location]
  ];
  // time and location are optional, so skip any that are missing
  rows.filter(([, value]) => value).forEach(([label, value]) => {
    const group = el("div");
    group.append(el("dt", "", label), el("dd", "", value));
    meta.append(group);
  });
  body.append(meta);

  [].concat(ev.description || []).forEach((p) => body.append(el("p", "", p)));

  detailEl.append(body);

  // Replay the detail card transition when switching to a different event.
  if (changedEvent && window.replayCardReveal) window.replayCardReveal(detailEl);

  // on phones the details sit below the list, so scroll down to them
  if (scroll && window.matchMedia("(max-width: 48rem)").matches) {
    detailEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function idFromHash() {
  return decodeURIComponent(location.hash.slice(1));
}

listEl.addEventListener("click", (e) => {
  const button = e.target.closest(".event-item");
  if (!button) return;
  select(button.dataset.id, true);
  try { history.pushState(null, "", "#" + button.dataset.id); } catch (err) {}
});

// back/forward buttons and manually edited links
function selectFromUrl() {
  const id = idFromHash();
  if (events.some((e) => e.id === id)) select(id, false);   // ignore other # links
}
window.addEventListener("popstate", selectFromUrl);
window.addEventListener("hashchange", selectFromUrl);

renderList();
const fromUrl = events.find((e) => e.id === idFromHash());
// the list runs newest-first, so the soonest upcoming event is the last one still ahead of today
const upcoming = events.filter((e) => parse(e.date) >= today);
const nextUp = upcoming.length ? upcoming[upcoming.length - 1] : events[0];
select((fromUrl || nextUp).id, false);

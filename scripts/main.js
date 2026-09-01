const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".nav-links");
const header = document.querySelector(".site-header");
const root = document.documentElement;
const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

root.classList.add("js");

if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}

if (header) {
  const updateScrollEffects = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 10);

    const scrollRange = root.scrollHeight - window.innerHeight;
    const progress = scrollRange > 0 ? window.scrollY / scrollRange : 0;
    root.style.setProperty("--scroll-progress", Math.min(Math.max(progress, 0), 1).toFixed(4));
  };

  let scrollFrame = null;
  const requestScrollUpdate = () => {
    if (scrollFrame !== null) {
      return;
    }

    scrollFrame = window.requestAnimationFrame(() => {
      scrollFrame = null;
      updateScrollEffects();
    });
  };

  updateScrollEffects();
  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", requestScrollUpdate);
}

const revealTargets = document.querySelectorAll(
  [
    ".section-heading",
    ".stat-card",
    ".publication-card",
    ".project-card",
    ".project-tile",
    ".timeline-card",
    ".project-detail",
    ".development-panel",
    ".asset-placeholder-panel",
    ".asset-placeholder-grid > div",
    ".feature-card",
    ".skill-grid article",
    ".profile-panel",
    ".note-panel",
    ".resume-grid > div",
    ".contact-list a",
    ".split-band"
  ].join(", ")
);

revealTargets.forEach((item, index) => {
  item.classList.add("reveal-item");
  item.style.setProperty("--reveal-delay", `${Math.min(index % 6, 5) * 55}ms`);
});

if (motionQuery.matches || !("IntersectionObserver" in window)) {
  revealTargets.forEach((item) => item.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -8% 0px"
    }
  );

  revealTargets.forEach((item) => revealObserver.observe(item));
}

const spotlightTargets = document.querySelectorAll(
  [
    ".feature-card",
    ".project-card",
    ".development-panel",
    ".asset-placeholder-panel",
    ".profile-panel",
    ".note-panel",
    ".skill-grid article",
    ".stat-card",
    ".publication-card",
    ".timeline-card",
    ".project-detail",
    ".resume-grid > div",
    ".contact-list a"
  ].join(", ")
);

if (!motionQuery.matches) {
  spotlightTargets.forEach((item) => {
    item.addEventListener("pointermove", (event) => {
      const rect = item.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;

      item.style.setProperty("--spotlight-x", `${x.toFixed(2)}%`);
      item.style.setProperty("--spotlight-y", `${y.toFixed(2)}%`);
    });

    item.addEventListener("pointerleave", () => {
      item.style.removeProperty("--spotlight-x");
      item.style.removeProperty("--spotlight-y");
    });
  });
}

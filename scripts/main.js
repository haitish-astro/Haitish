const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".nav-links");
const header = document.querySelector(".site-header");

document.documentElement.classList.add("js");

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
  const updateHeader = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 10);
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
}

const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
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

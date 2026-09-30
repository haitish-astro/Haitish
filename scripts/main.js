/* Site behaviour: theme, navigation, scroll effects, reveal, tilt, counters,
   and lazy loading of the 3D hero scene. Progressive enhancement only — every
   page is fully usable and readable with this script disabled. */
(() => {
  "use strict";

  const scriptUrl = document.currentScript ? document.currentScript.src : location.href;
  const root = document.documentElement;
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

  root.classList.add("js");

  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------- Theme ---------- */
  const THEME_KEY = "haitish-theme";
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const themeColors = { dark: "#060a12", light: "#eaeff7" };

  const readStoredTheme = () => {
    try {
      const value = localStorage.getItem(THEME_KEY);
      return value === "light" || value === "dark" ? value : null;
    } catch {
      return null;
    }
  };

  const applyTheme = (theme) => {
    root.setAttribute("data-theme", theme);
    if (themeMeta) {
      themeMeta.setAttribute("content", themeColors[theme]);
    }
    document.querySelectorAll(".theme-toggle").forEach((button) => {
      const next = theme === "dark" ? "light" : "dark";
      button.setAttribute("aria-label", `Switch to ${next} theme`);
      button.setAttribute("aria-pressed", String(theme === "light"));
    });
  };

  applyTheme(root.getAttribute("data-theme") === "light" ? "light" : "dark");

  document.querySelectorAll(".theme-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      applyTheme(next);
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        /* storage unavailable: the choice simply lasts for this visit */
      }
    });
  });

  window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", (event) => {
    if (!readStoredTheme()) {
      applyTheme(event.matches ? "light" : "dark");
    }
  });

  /* ---------- Mobile navigation ---------- */
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav-links");

  if (toggle && nav) {
    const setOpen = (open) => {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    };

    toggle.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));

    nav.addEventListener("click", (event) => {
      if (event.target instanceof HTMLAnchorElement) {
        setOpen(false);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });

    document.addEventListener("click", (event) => {
      if (
        nav.classList.contains("is-open") &&
        event.target instanceof Node &&
        !nav.contains(event.target) &&
        !toggle.contains(event.target)
      ) {
        setOpen(false);
      }
    });

    window.matchMedia("(min-width: 901px)").addEventListener("change", (event) => {
      if (event.matches) {
        setOpen(false);
      }
    });
  }

  /* ---------- Scroll effects (single rAF-throttled handler) ---------- */
  const progressBar = document.querySelector(".scroll-progress");
  let scrollFrame = null;

  const updateScrollEffects = () => {
    scrollFrame = null;
    const y = window.scrollY;
    const range = root.scrollHeight - window.innerHeight;
    const progress = range > 0 ? Math.min(Math.max(y / range, 0), 1) : 0;

    if (header) {
      header.classList.toggle("is-scrolled", y > 10);
    }
    if (progressBar) {
      root.style.setProperty("--scroll-progress", progress.toFixed(4));
    }
    if (!motionQuery.matches && y < window.innerHeight * 1.5) {
      root.style.setProperty("--scroll-y", String(Math.round(y)));
    }
  };

  const requestScrollUpdate = () => {
    if (scrollFrame === null) {
      scrollFrame = window.requestAnimationFrame(updateScrollEffects);
    }
  };

  updateScrollEffects();
  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", requestScrollUpdate);

  /* ---------- Reveal on scroll ---------- */
  const revealTargets = document.querySelectorAll(
    [
      ".section-heading",
      ".stat-card",
      ".metric",
      ".publication-card",
      ".project-card",
      ".timeline-card",
      ".project-detail",
      ".development-panel",
      ".feature-card",
      ".skill-grid article",
      ".profile-panel",
      ".note-panel",
      ".credential-grid > div",
      ".contact-list a",
      ".contact-list > div",
      ".split-band",
      ".cta-band",
      ".marquee",
      ".photo-pair figure"
    ].join(", ")
  );

  revealTargets.forEach((item, index) => {
    item.classList.add("reveal-item");
    item.style.setProperty("--reveal-delay", `${Math.min(index % 4, 3) * 70}ms`);
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
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    revealTargets.forEach((item) => revealObserver.observe(item));
  }

  /* ---------- Pointer sheen + 3D tilt ---------- */
  if (!motionQuery.matches && finePointer.matches) {
    const sheenTargets = document.querySelectorAll(
      [
        ".feature-card",
        ".project-card",
        ".stat-card",
        ".publication-card",
        ".timeline-card",
        ".skill-grid article",
        ".credential-grid > div",
        ".contact-list a",
        ".metric",
        ".note-panel",
        ".profile-panel",
        ".post-row"
      ].join(", ")
    );
    const tiltTargets = new Set(document.querySelectorAll(".project-card, .feature-card, .metric, .hero-profile"));

    sheenTargets.forEach((item) => {
      item.addEventListener("pointermove", (event) => {
        const rect = item.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        item.style.setProperty("--spotlight-x", `${(px * 100).toFixed(1)}%`);
        item.style.setProperty("--spotlight-y", `${(py * 100).toFixed(1)}%`);
        if (tiltTargets.has(item)) {
          item.style.setProperty("--ry", `${((px - 0.5) * 7).toFixed(2)}deg`);
          item.style.setProperty("--rx", `${((0.5 - py) * 7).toFixed(2)}deg`);
        }
      });

      item.addEventListener("pointerleave", () => {
        item.style.removeProperty("--spotlight-x");
        item.style.removeProperty("--spotlight-y");
        item.style.removeProperty("--rx");
        item.style.removeProperty("--ry");
      });

      if (tiltTargets.has(item)) {
        item.setAttribute("data-tilt", "");
      }
    });

    const heroProfile = document.querySelector(".hero-profile");
    if (heroProfile && !heroProfile.hasAttribute("data-tilt")) {
      heroProfile.setAttribute("data-tilt", "");
      heroProfile.addEventListener("pointermove", (event) => {
        const rect = heroProfile.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        heroProfile.style.setProperty("--ry", `${((px - 0.5) * 9).toFixed(2)}deg`);
        heroProfile.style.setProperty("--rx", `${((0.5 - py) * 9).toFixed(2)}deg`);
      });
      heroProfile.addEventListener("pointerleave", () => {
        heroProfile.style.removeProperty("--rx");
        heroProfile.style.removeProperty("--ry");
      });
    }
  }

  /* ---------- Animated counters ---------- */
  const counters = document.querySelectorAll("[data-count]");

  const runCounter = (el) => {
    const target = Number(el.getAttribute("data-count"));
    const decimals = Number(el.getAttribute("data-decimals") || 0);
    if (!Number.isFinite(target)) {
      return;
    }
    const duration = 1400;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.firstChild.textContent = (target * eased).toFixed(decimals);
      if (t < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  };

  if (counters.length && !motionQuery.matches && "IntersectionObserver" in window) {
    const counterObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            runCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => {
      if (el.firstChild && el.firstChild.nodeType === Node.TEXT_NODE) {
        counterObserver.observe(el);
      }
    });
  }

  /* ---------- 3D scene (lazy, optional) ---------- */
  const sceneHost = document.querySelector(".hero-canvas[data-scene]");

  const canUseWebGL = () => {
    try {
      const canvas = document.createElement("canvas");
      return Boolean(window.WebGLRenderingContext && (canvas.getContext("webgl2") || canvas.getContext("webgl")));
    } catch {
      return false;
    }
  };

  const saveData = navigator.connection && navigator.connection.saveData;

  if (sceneHost && !saveData && canUseWebGL()) {
    const start = () => {
      import(new URL("scene.js", scriptUrl).href)
        .then((module) => module.mountScene(sceneHost))
        .catch(() => {
          /* CSS-only backdrop remains */
        });
    };
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(start, { timeout: 1200 });
    } else {
      window.setTimeout(start, 200);
    }
  }
})();

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

  /* ---------- Entrance orchestration ----------
     Everything that animates in on arrival (hero words, portrait reveal, the 3D
     fly-in) waits in this queue until the intro curtain has opened — or, when
     there is no intro, until fonts have settled. */
  let entranceReleased = false;
  const entranceQueue = [];
  const onEntrance = (fn) => {
    if (entranceReleased) {
      fn();
    } else {
      entranceQueue.push(fn);
    }
  };
  const releaseEntrance = () => {
    entranceReleased = true;
    entranceQueue.splice(0).forEach((fn) => fn());
  };

  const splitChars = (el) => {
    const text = el.textContent.trim();
    el.textContent = "";
    [...text].forEach((char, index) => {
      const span = document.createElement("span");
      span.className = char === " " ? "ch ch-space" : "ch";
      span.style.setProperty("--i", String(index));
      span.textContent = char === " " ? " " : char;
      el.append(span);
    });
  };

  const intro = document.getElementById("intro");
  const introActive = Boolean(intro) && root.classList.contains("intro-active");

  if (introActive) {
    const name = intro.querySelector(".intro-name");
    if (name) {
      splitChars(name);
    }
    root.classList.add("intro-run");

    const timers = [];
    let revealed = false;
    let ended = false;
    const skipEvents = ["pointerdown", "keydown", "wheel", "touchstart"];

    const end = () => {
      if (ended) {
        return;
      }
      ended = true;
      skipEvents.forEach((type) => window.removeEventListener(type, skip));
      root.classList.remove("intro-pending", "intro-active", "intro-opening", "intro-fast", "intro-run");
      intro.remove();
    };

    const reveal = (fast) => {
      if (revealed) {
        return;
      }
      revealed = true;
      timers.forEach(window.clearTimeout);
      if (fast) {
        root.classList.add("intro-fast");
      }
      root.classList.remove("intro-pending");
      root.classList.add("intro-opening");
      try {
        sessionStorage.setItem("haitish-intro", "1");
      } catch {
        /* storage unavailable: the intro may simply play again next visit */
      }
      window.dispatchEvent(new Event("intro:reveal"));
      releaseEntrance();
      window.setTimeout(end, fast ? 800 : 1500);
    };

    function skip() {
      reveal(true);
    }

    skipEvents.forEach((type) => window.addEventListener(type, skip, { passive: true }));
    timers.push(window.setTimeout(() => reveal(false), 2700));
  }

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
      ".photo-pair figure",
      ".repeat-feature"
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

  /* ---------- Animated headings (words rise out of a mask) ---------- */
  const splitWords = (el) => {
    let index = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const fragment = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) {
              return;
            }
            if (/^\s+$/.test(part)) {
              fragment.append(document.createTextNode(" "));
              return;
            }
            const outer = document.createElement("span");
            outer.className = "w";
            const inner = document.createElement("span");
            inner.className = "wi";
            inner.style.setProperty("--wi", String(index));
            index += 1;
            inner.textContent = part;
            outer.append(inner);
            fragment.append(outer);
          });
          child.replaceWith(fragment);
        } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== "BR") {
          walk(child);
        }
      });
    };
    walk(el);

    /* keep trailing punctuation glued to the word it follows (e.g. "title" + ".") */
    const words = [...el.querySelectorAll(".w")];
    words.slice(1).forEach((word, i) => {
      const gap = document.createRange();
      gap.setStartAfter(words[i]);
      gap.setEndBefore(word);
      if (gap.toString() === "") {
        word.before(document.createTextNode("⁠"));
      }
    });

    el.classList.add("is-split");
  };

  if (!motionQuery.matches) {
    const headings = document.querySelectorAll(
      ".hero h1, .page-hero h1, .section-heading h2, .cta-band h2, .split-band h2, [data-split]"
    );
    const inView = "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries, observer) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add("is-in");
                observer.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.4, rootMargin: "0px 0px -6% 0px" }
        )
      : null;

    headings.forEach((heading) => {
      splitWords(heading);
      if (heading.closest(".hero, .page-hero")) {
        onEntrance(() => {
          void heading.offsetWidth; /* commit the hidden state so the transition has a start */
          heading.classList.add("is-in");
        });
      } else if (inView) {
        inView.observe(heading);
      } else {
        heading.classList.add("is-in");
      }
    });
  }

  /* ---------- Images unveil as they scroll in ---------- */
  if (!motionQuery.matches && "IntersectionObserver" in window) {
    /* Observe each image's parent: an image that is fully clipped away never
       reports as intersecting, so it could never trigger its own reveal. */
    const unveilTargets = new Map();
    const unveil = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (unveilTargets.get(entry.target) || []).forEach((img) => img.classList.add("is-visible"));
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -4% 0px" }
    );
    document
      .querySelectorAll(
        ".hero-profile img, .profile-panel img, .project-media img, .photo-pair img, .feature-photo img"
      )
      .forEach((img) => {
        img.classList.add("img-reveal");
        const host = img.parentElement;
        unveilTargets.set(host, [...(unveilTargets.get(host) || []), img]);
        onEntrance(() => unveil.observe(host));
      });
  }

  /* ---------- Hero spotlight + magnetic buttons (fine pointers only) ---------- */
  if (!motionQuery.matches && finePointer.matches) {
    document.querySelectorAll(".hero, .page-hero").forEach((hero) => {
      const spot = document.createElement("div");
      spot.className = "hero-spot";
      spot.setAttribute("aria-hidden", "true");
      hero.append(spot);
      hero.addEventListener("pointermove", (event) => {
        const rect = hero.getBoundingClientRect();
        spot.style.setProperty("--hx", `${(event.clientX - rect.left).toFixed(0)}px`);
        spot.style.setProperty("--hy", `${(event.clientY - rect.top).toFixed(0)}px`);
        spot.classList.add("is-on");
      });
      hero.addEventListener("pointerleave", () => spot.classList.remove("is-on"));
    });

    document.querySelectorAll(".hero-actions .button, .cta-band .button, .contact-list .button").forEach((button) => {
      button.addEventListener("pointermove", (event) => {
        const rect = button.getBoundingClientRect();
        const dx = (event.clientX - (rect.left + rect.width / 2)) / rect.width;
        const dy = (event.clientY - (rect.top + rect.height / 2)) / rect.height;
        button.style.setProperty("--mag-x", `${(dx * 14).toFixed(1)}px`);
        button.style.setProperty("--mag-y", `${(dy * 10).toFixed(1)}px`);
      });
      button.addEventListener("pointerleave", () => {
        button.style.removeProperty("--mag-x");
        button.style.removeProperty("--mag-y");
      });
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

  /* With no intro, let web fonts settle (briefly) so headings animate in with the right glyphs. */
  if (!introActive) {
    const settle = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.race([settle, new Promise((resolve) => window.setTimeout(resolve, 600))]).then(releaseEntrance);
  }
})();

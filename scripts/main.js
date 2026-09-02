const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".nav-links");
const header = document.querySelector(".site-header");
const root = document.documentElement;
const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
let scrollFlight = null;
let flightPlane = null;
let lastScrollY = window.scrollY;

root.classList.add("js");

if (!motionQuery.matches) {
  scrollFlight = document.createElement("div");
  scrollFlight.className = "scroll-flight";
  scrollFlight.innerHTML = [
    '<span class="scroll-flight-track"></span>',
    '<span class="scroll-flight-progress"></span>',
    '<button class="scroll-flight-plane" type="button" aria-label="Drag or use arrow keys to scroll the page" tabindex="-1">',
    '<svg class="paper-plane-icon" viewBox="0 0 64 64" aria-hidden="true" focusable="false">',
    '<polygon class="paper-plane-wing paper-plane-wing-left" points="32 3 7 55 28 48"></polygon>',
    '<polygon class="paper-plane-wing paper-plane-wing-right" points="32 3 57 55 36 48"></polygon>',
    '<polygon class="paper-plane-keel" points="32 3 28 48 32 61 36 48"></polygon>',
    '<path class="paper-plane-edge" d="M32 3 7 55 28 48 32 61 36 48 57 55 32 3Z"></path>',
    '<path class="paper-plane-fold" d="M32 3 32 61"></path>',
    '<path class="paper-plane-tail" d="M8 55h18M38 55h18"></path>',
    '</svg>',
    '</button>'
  ].join("");
  document.body.append(scrollFlight);
  flightPlane = scrollFlight.querySelector(".scroll-flight-plane");
}

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
  const setFlightDirection = (delta) => {
    if (Math.abs(delta) <= 0.6) {
      return;
    }

    root.classList.toggle("is-flight-down", delta > 0);
    root.classList.toggle("is-flight-up", delta < 0);
  };

  const updateScrollEffects = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 10);

    const scrollRange = root.scrollHeight - window.innerHeight;
    const progress = scrollRange > 0 ? window.scrollY / scrollRange : 0;
    const clampedProgress = Math.min(Math.max(progress, 0), 1);
    const flightPathHeight = scrollFlight ? scrollFlight.clientHeight : 0;
    const flightY = flightPathHeight * (0.04 + clampedProgress * 0.92);
    const scrollDelta = window.scrollY - lastScrollY;
    const showFlightPath = scrollRange > 260 && window.innerWidth > 900;

    root.classList.toggle("has-flight-path", showFlightPath);
    if (flightPlane) {
      flightPlane.tabIndex = showFlightPath ? 0 : -1;
    }
    setFlightDirection(scrollDelta);
    if (Math.abs(scrollDelta) > 0.6) {
      lastScrollY = window.scrollY;
    }
    root.style.setProperty("--scroll-progress", clampedProgress.toFixed(4));
    if (scrollFlight) {
      scrollFlight.style.setProperty("--flight-y", `${flightY.toFixed(1)}px`);
    }
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

  if (scrollFlight && flightPlane) {
    let dragFrame = null;
    let pendingPointerY = null;

    const scrollToPointer = (clientY) => {
      const rect = scrollFlight.getBoundingClientRect();
      const pointerOffset = ((clientY - rect.top) / rect.height) * 100;
      const pointerProgress = (pointerOffset - 4) / 92;
      const clampedProgress = Math.min(Math.max(pointerProgress, 0), 1);
      const nextScrollY = clampedProgress * Math.max(root.scrollHeight - window.innerHeight, 0);
      const dragDelta = nextScrollY - window.scrollY;

      setFlightDirection(dragDelta);
      window.scrollTo({ top: nextScrollY, behavior: "auto" });
      updateScrollEffects();
    };

    const requestPointerScroll = (event) => {
      pendingPointerY = event.clientY;

      if (dragFrame !== null) {
        return;
      }

      dragFrame = window.requestAnimationFrame(() => {
        dragFrame = null;
        if (pendingPointerY !== null) {
          scrollToPointer(pendingPointerY);
        }
      });
    };

    flightPlane.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      flightPlane.setPointerCapture(event.pointerId);
      root.classList.add("is-flight-dragging");
      scrollToPointer(event.clientY);
    });

    flightPlane.addEventListener("pointermove", (event) => {
      if (!root.classList.contains("is-flight-dragging")) {
        return;
      }

      requestPointerScroll(event);
    });

    const stopFlightDrag = (event) => {
      if (flightPlane.hasPointerCapture(event.pointerId)) {
        flightPlane.releasePointerCapture(event.pointerId);
      }

      if (dragFrame !== null) {
        window.cancelAnimationFrame(dragFrame);
        dragFrame = null;
      }
      pendingPointerY = null;
      root.classList.remove("is-flight-dragging");
    };

    flightPlane.addEventListener("pointerup", stopFlightDrag);
    flightPlane.addEventListener("pointercancel", stopFlightDrag);
    flightPlane.addEventListener("keydown", (event) => {
      const scrollRange = Math.max(root.scrollHeight - window.innerHeight, 0);
      const step = Math.max(140, window.innerHeight * 0.18);
      const pageStep = window.innerHeight * 0.78;
      const keyTargets = {
        ArrowUp: window.scrollY - step,
        ArrowDown: window.scrollY + step,
        PageUp: window.scrollY - pageStep,
        PageDown: window.scrollY + pageStep,
        Home: 0,
        End: scrollRange
      };

      if (!(event.key in keyTargets)) {
        return;
      }

      event.preventDefault();
      const nextScrollY = Math.min(Math.max(keyTargets[event.key], 0), scrollRange);
      const keyDelta = nextScrollY - window.scrollY;

      if (keyDelta !== 0) {
        setFlightDirection(keyDelta);
        window.scrollTo({ top: nextScrollY, behavior: "smooth" });
      }
    });
  }
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
    ".credential-grid > div",
    ".contact-list a",
    ".contact-list > div",
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
    ".credential-grid > div",
    ".contact-list a",
    ".contact-list > div"
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

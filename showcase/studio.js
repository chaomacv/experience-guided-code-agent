/* Once-per-visit scroll reveals. Existing in-view and deep-linked content stays visible. */
(() => {
  "use strict";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  if (reduced.matches || !("IntersectionObserver" in window)) return;
  const groups = [
    ".section > .section-label", ".section > .section-heading", ".framework-layout", ".mapping-section",
    ".theory-grid > article", ".implementation-flow", ".live-evidence-card", ".research-strip",
    ".experiment", ".results-head", ".table-wrap", ".finding", ".reproduce-controls",
    ".track-description", ".start-grid > *", ".adapt-grid", ".end-note"
  ];
  const observer = new IntersectionObserver(entries => {
    entries.forEach(({target,isIntersecting}) => {
      if (!isIntersecting) return;
      target.classList.add("is-revealed");
      observer.unobserve(target);
    });
  }, {threshold: .06, rootMargin: "0px 0px -30px 0px"});
  const targets = [...new Set(groups.flatMap(selector => [...document.querySelectorAll(selector)]))];
  targets.forEach((element,index) => {
    element.dataset.reveal = "";
    // Don't animate already-visible content or hide anything above a direct-link landing.
    if (element.getBoundingClientRect().top < innerHeight) return;
    element.classList.add("reveal-pending");
    element.style.setProperty("--reveal-delay", `${index % 3 * 65}ms`);
    observer.observe(element);
  });
  function revealAnchor() {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (!target) return;
    target.querySelectorAll(".reveal-pending").forEach(element => {
      element.classList.add("is-revealed");
      observer.unobserve(element);
    });
  }
  window.addEventListener("hashchange",revealAnchor);
  revealAnchor();
  reduced.addEventListener("change",event => {
    if (!event.matches) return;
    targets.forEach(element => element.classList.add("is-revealed"));
    observer.disconnect();
  });
})();

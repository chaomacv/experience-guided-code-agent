/* Independent, viewport-aware tours. Existing controls remain the source of truth. */
(() => {
  "use strict";
  const tr = (key, values) => window.siteI18n.t(key, values);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const make = (tag, className) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    return element;
  };
  const definitions = [
    {id:"architecture",root:".framework-layout",items:"[data-concept]",detail:".concept-detail",seconds:5},
    {id:"workflow",root:".implementation-flow",items:"[data-step]",detail:".step-detail",seconds:5},
    {id:"extensions",root:"#module-explorer-panel",items:".explore-module-button",detail:".explore-content",seconds:6},
    {id:"retrieval",root:"#retrieval .experiment",items:"[data-mode]",detail:"#query-results",seconds:5},
    {id:"reproduce",root:"#start",items:"[data-track]",detail:".start-grid",seconds:6,mount:"#start .reproduce-controls"},
  ];
  const tours = definitions.map(definition => {
    const root = document.querySelector(definition.root);
    const bar = make("div","chapter-tour-controls");
    bar.dataset.tour = definition.id;
    bar.setAttribute("role","group");
    const indicator = make("span","chapter-tour-indicator");
    const status = make("span","chapter-tour-status");
    const label = make("span","chapter-tour-current");
    const count = make("span","chapter-tour-count");
    const previous = make("button","chapter-tour-arrow");
    const toggle = make("button","chapter-tour-toggle");
    const next = make("button","chapter-tour-arrow");
    previous.type = toggle.type = next.type = "button";
    previous.textContent = "←";
    next.textContent = "→";
    previous.dataset.tourPrevious = "";
    toggle.dataset.tourToggle = "";
    next.dataset.tourNext = "";
    const progress = make("span","chapter-tour-progress");
    progress.setAttribute("aria-hidden","true");
    const fill = make("i");
    progress.append(fill);
    bar.append(indicator,status,label,progress,count,previous,toggle,next);
    if (definition.mount) document.querySelector(definition.mount).before(bar);
    else root.before(bar);
    const tour = { ...definition,root,bar,indicator,status,label,count,previous,toggle,next,fill,
      visible:false,hover:new Set(),paused:reduced.matches,optIn:false,elapsed:0,automatic:false };
    const manuallyPause = event => {
      if (!event.isTrusted || tour.automatic || event.target.closest(".chapter-tour-controls")) return;
      if (!event.target.closest("button,a,input,select,textarea,[role=button]")) return;
      tour.paused = true;
      tour.elapsed = 0;
    };
    root.addEventListener("click",manuallyPause);
    root.addEventListener("change",manuallyPause);
    root.addEventListener("keydown",event => {
      if (["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Enter"," "].includes(event.key)) manuallyPause(event);
    });
    [root,bar].forEach(surface => {
      surface.addEventListener("pointerenter",event => { if (event.pointerType !== "touch") tour.hover.add(surface); });
      surface.addEventListener("pointerleave",() => { tour.hover.delete(surface); });
    });
    previous.addEventListener("click",() => { tour.paused = true; advance(tour,-1); });
    next.addEventListener("click",() => { tour.paused = true; advance(tour,1); });
    toggle.addEventListener("click",() => {
      tour.paused = !tour.paused;
      if (!tour.paused) tour.optIn = true;
      render(tour);
    });
    return tour;
  });
  function state(tour) {
    const buttons = [...tour.root.querySelectorAll(tour.items)];
    const index = buttons.findIndex(button => button.getAttribute("aria-pressed") === "true");
    return {buttons,index};
  }
  function advance(tour,direction = 1) {
    const {buttons,index} = state(tour);
    if (index < 0 || buttons.length < 2) return;
    const button = buttons[(index+direction+buttons.length)%buttons.length];
    tour.automatic = true;
    if (tour.id === "extensions") {
      tour.root.dispatchEvent(new CustomEvent("explore-auto-select",{bubbles:true,detail:button.dataset.exploreModule}));
    } else button.click();
    tour.automatic = false;
    tour.elapsed = 0;
    const detail = tour.root.querySelector(tour.detail);
    if (detail && !reduced.matches) detail.animate([{opacity:.55,transform:"translateY(5px)"},{opacity:1,transform:"translateY(0)"}],{duration:420,easing:"ease-out"});
    render(tour);
  }
  function reason(tour) {
    if (tour.paused) return "已暂停";
    if (reduced.matches && !tour.optIn) return "已暂停";
    if (tour.hover.size) return "悬停暂停";
    if (tour.id === "extensions" && tour.bar.getBoundingClientRect().bottom < 100) return "阅读中暂停";
    if (tour.root.contains(document.activeElement) && !tour.bar.contains(document.activeElement) && document.activeElement.matches(":focus-visible")) return "阅读中暂停";
    if (document.hidden || !tour.visible) return "等待进入视口";
    return "自动轮播";
  }
  function render(tour) {
    const {buttons,index} = state(tour);
    tour.bar.hidden = tour.root.hidden;
    const ready = index >= 0 && buttons.length > 1;
    const current = ready ? buttons[index] : null;
    const message = ready ? reason(tour) : "等待内容加载";
    tour.status.textContent = tr(message);
    tour.label.textContent = current ? (current.querySelector("strong") || current).textContent.trim().replace(/\s+/g," ") : "";
    tour.count.textContent = ready ? `${String(index+1).padStart(2,"0")} / ${String(buttons.length).padStart(2,"0")}` : "—";
    tour.toggle.textContent = tr(tour.paused ? "播放" : "暂停");
    tour.toggle.setAttribute("aria-label",tr(tour.paused ? "播放本板块轮播" : "暂停本板块轮播"));
    tour.toggle.setAttribute("aria-pressed",String(!tour.paused));
    tour.previous.setAttribute("aria-label",tr("上一项"));
    tour.next.setAttribute("aria-label",tr("下一项"));
    tour.bar.setAttribute("aria-label",tr("本板块自动轮播控制"));
    tour.bar.title = tr("每 {n} 秒切换；悬停暂停，手动选择后暂停。",{n:tour.seconds});
    tour.bar.dataset.running = String(ready && message === "自动轮播");
    tour.fill.style.transform = `scaleX(${Math.min(1,tour.elapsed/(tour.seconds*1000))})`;
    tour.previous.disabled = tour.next.disabled = tour.toggle.disabled = !ready;
    return ready && message === "自动轮播";
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const tour = tours.find(item => item.root === entry.target);
      tour.visible = entry.isIntersecting;
    });
  },{threshold:.08});
  tours.forEach(tour => observer.observe(tour.root));
  let previousTime = performance.now();
  document.addEventListener("visibilitychange",() => { previousTime = performance.now(); });
  // One light clock; hidden or offscreen tours never advance or catch up.
  setInterval(() => {
    const now = performance.now();
    const delta = Math.min(500,now-previousTime);
    previousTime = now;
    tours.forEach(tour => {
      if (render(tour)) {
        tour.elapsed += delta;
        if (tour.elapsed >= tour.seconds*1000) advance(tour);
      }
    });
  },100);
  reduced.addEventListener("change",event => {
    if (event.matches) tours.forEach(tour => { tour.paused = true; tour.optIn = false; });
  });
  document.addEventListener("site-language-change",() => tours.forEach(render));
  tours.forEach(render);
})();

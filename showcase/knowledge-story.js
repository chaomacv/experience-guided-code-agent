/* A shared 24-second Web Animations timeline. No network dependency or DOM polling loop. */
(() => {
  "use strict";
  const root = document.querySelector("#knowledge-story");
  if (!root) return;
  const DURATION = 24000;
  const phases = [
    [0, "经验进入工作区", "Experience enters the workspace", "从历史人机对话出发，追踪知识如何成为行动依据。", "Follow how historical human–agent dialogue becomes actionable context."],
    [2, "LLM 抽取结构化案例", "An LLM extracts structured cases", "抽取任务、约束、问题与方案；保留来源和对话自述的验证范围。", "Extract tasks, constraints, problems and solutions; preserve provenance and reported validation scope."],
    [8, "三类 Chunk，双路知识索引", "Three chunk types, two retrieval channels", "Case 拆为 task / constraint / solution；BGE-M3 向量进入 FAISS，同源文本用于 BM25。", "Cases become task / constraint / solution chunks. BGE-M3 vectors feed FAISS; the same text feeds BM25."],
    [13, "新任务，找回相关经验", "A new task retrieves relevant experience", "WineService 升级任务进入 Dense 与 BM25 两路检索，RRF 按名次融合候选。", "A WineService upgrade queries Dense and BM25 in parallel. RRF fuses the candidate rankings."],
    [17.5, "多源信息汇聚为 Prompt", "Multiple sources converge into a prompt", "任务、检索经验、当前仓库事实与 Skill 汇入上下文；失败信息仅在重试时追加。", "Task, retrieved experience, repository facts and Skill form the context. Failure feedback is added only on retries."],
    [21, "规划动作，执行后独立验收", "Plan actions, execute, validate independently", "LLM 提出 write_file 动作；执行器修改文件，独立程序决定交付、重试或恢复。", "The LLM proposes write_file actions. The executor edits files; an independent program determines delivery, retry or recovery."],
  ];
  const text = (zh, en) => window.siteI18n?.language === "en" ? en : zh;
  const animations = [];
  const select = value => root.querySelector(value);
  const selectAll = value => [...root.querySelectorAll(value)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let userPaused = reduced.matches, hovered = false, onScreen = true, frame = 0, phase = -1;
  let lastClock = -1;
  const capable = typeof Element.prototype.animate === "function";
  const mobile = matchMedia("(max-width: 760px)");
  function add(selector, keyframes, options = {}) {
    for (const element of selectAll(selector)) {
      const animation = element.animate(keyframes, {duration: DURATION, iterations: Infinity, fill: "both", ...options});
      animation.pause();
      animation.currentTime = 0;
      animations.push(animation);
    }
  }
  function appear(selector, at, finish, transform = "translateY(12px)") {
    add(selector, [
      {opacity:0, transform, offset:0},
      {opacity:0, transform, offset:at / 24},
      {opacity:1, transform:"translate(0, 0) scale(1)", offset:finish / 24},
      {opacity:1, transform:"translate(0, 0) scale(1)", offset:1},
    ]);
  }
  function resize() {
    const scale = select(".ks-viewport").clientWidth / 1200;
    select(".ks-world").style.transform = `scale(${scale})`;
    if (!mobile.matches && !reduced.matches && capable) {
      select(".ks-viewport").style.height = `${470 * scale}px`;
    } else select(".ks-viewport").style.height = "";
  }
  if (capable) {
    // The camera eases between adjacent spaces, then holds at the key transformations.
    const stops = [[0,0],[1.6,0],[6.7,0],[8,600],[9,600],[10.2,1010],[12.8,1010],
      [14.2,1810],[15,1810],[16,2380],[17.5,2380],[18.7,3100],[20.6,3100],
      [21.8,3690],[23.65,3690],[23.75,3690],[23.76,0],[24,0]];
    add(".ks-track", stops.map(([time,x]) => ({offset:time / 24,transform:`translateX(${-x}px)`,easing:"cubic-bezier(.45,0,.2,1)"})));
    // An opaque bookend covers only the loop reset. The pipeline itself never cuts between slides.
    add(".ks-loop-veil", [{opacity:1,offset:0},{opacity:1,offset:.026},{opacity:0,offset:.071},
      {opacity:0,offset:.958},{opacity:1,offset:.986},{opacity:1,offset:1}]);
    add(".ks-chat-scroll", [{transform:"translateY(28px)",offset:0},{transform:"translateY(28px)",offset:.065},
      {transform:"translateY(-292px)",offset:.3},{transform:"translateY(-292px)",offset:1}]);
    add(".ks-highlight", [{backgroundColor:"#f2f5fc",offset:0},{backgroundColor:"#f2f5fc",offset:.13},
      {backgroundColor:"#dce8ff",offset:.17},{backgroundColor:"#edf3ff",offset:.27},{backgroundColor:"#edf3ff",offset:1}]);
    add(".ks-fragment-one", [{opacity:0,transform:"translate(0,0)",offset:0},{opacity:0,transform:"translate(0,0)",offset:.14},
      {opacity:1,transform:"translate(50px,-8px)",offset:.17},{opacity:0,transform:"translate(180px,28px) scale(.75)",offset:.225},{opacity:0,offset:1}]);
    add(".ks-fragment-two", [{opacity:0,transform:"translate(0,0)",offset:0},{opacity:0,transform:"translate(0,0)",offset:.18},
      {opacity:1,transform:"translate(50px,0)",offset:.205},{opacity:0,transform:"translate(190px,-55px) scale(.75)",offset:.26},{opacity:0,offset:1}]);
    appear(".ks-extractor",2.5,3.2,"scale(.94)");
    appear(".ks-case",4.3,5.1,"translateX(-18px) scale(.97)");
    selectAll(".ks-case-field").forEach((item,i) => appear(`.ks-case-field:nth-child(${i+1})`,4.7 + i*.27,5.1 + i*.27,"translateX(-9px)"));
    [".back-one", ".back-two"].forEach((selector,i) => add(selector,[
      {opacity:0,transform:"translateX(-20px)",offset:0},
      {opacity:0,transform:"translateX(-20px)",offset:(5.6+i*.3)/24},
      {opacity:1,transform:"translateX(0)",offset:(6+i*.3)/24},
      {opacity:1,transform:"translateX(0)",offset:6.7/24},
      {opacity:0,transform:"translateX(-12px)",offset:7.35/24},
      {opacity:0,offset:1},
    ]));
    appear(".ks-chunk-label",7.1,7.5);
    appear(".chunk-task",7.3,8.1,"translate(-180px,-15px) scale(.85)");
    appear(".chunk-constraint",7.6,8.4,"translate(-180px,-32px) scale(.85)");
    appear(".chunk-solution",7.9,8.7,"translate(-180px,-55px) scale(.85)");
    appear(".ks-small-note",8.4,8.9);
    appear(".ks-embedding",9.1,9.7,"scale(.9)");
    selectAll(".ks-vector").forEach((item,i) => appear(`.ks-vector:nth-child(${i+1})`,9.7 + i*.35,10.4 + i*.35,"translateX(-45px) scaleX(.6)"));
    appear(".ks-bypass",9.6,10.2);
    appear(".ks-index",10.7,11.35,"translateX(-18px)");
    selectAll(".ks-index-grid i").forEach((item,i) => appear(`.ks-index-grid i:nth-child(${i+1})`,10.9+i*.07,11.25+i*.07,"translate(-12px,-6px) scale(.5)"));
    appear(".ks-keywords",11.3,12.1,"translateX(-25px)");
    appear(".ks-query",13,13.7,"translateY(20px)");
    appear(".ks-retrieval.dense",13.7,14.4,"translateX(-25px)");
    appear(".ks-retrieval.lexical",13.9,14.6,"translateX(-25px)");
    add(".ks-index-grid i.relevant", [{boxShadow:"none",offset:0},{boxShadow:"none",offset:.57},
      {boxShadow:"0 0 0 3px #a0b8f4",backgroundColor:"#9db9f6",offset:.61},
      {boxShadow:"0 0 0 1px #a0b8f4",backgroundColor:"#b4caf8",offset:1}]);
    appear(".ks-rrf",15.1,15.7,"scale(.9)");
    appear(".ks-results",16,16.6,"translateX(-30px)");
    selectAll(".ks-result").forEach((item,i) => appear(`.ks-result:nth-of-type(${i+1})`,16.15+i*.2,16.7+i*.2,"translateX(-15px)"));
    appear(".source-task",17.35,18,"translate(95px,45px)");
    appear(".source-cases",17.55,18.2,"translate(-90px,0)");
    appear(".source-facts",17.75,18.4,"translate(95px,-25px)");
    appear(".source-skill",17.95,18.6,"translate(95px,-45px)");
    appear(".ks-prompt",18.1,18.7,"scale(.97)");
    [35,-5,-59,-78].forEach((dy,i) => {
      const at = 18.35 + i*.32;
      add(`.ks-context-packet.packet-${i}`, [
        {opacity:0,transform:"translate(0,0)",offset:0},
        {opacity:0,transform:"translate(0,0)",offset:at/24},
        {opacity:1,transform:"translate(18px,0)",offset:(at+.12)/24},
        {opacity:0,transform:`translate(142px,${dy}px) scale(.8)`,offset:(at+.65)/24},
        {opacity:0,offset:1},
      ]);
    });
    selectAll(".ks-prompt-block").forEach((item,i) => appear(`.ks-prompt-block:nth-of-type(${i+1})`,18.4+i*.32,18.8+i*.32,"translateX(-12px)"));
    appear(".ks-planner",20.5,21.2,"translateX(-20px) scale(.95)");
    appear(".ks-execution",21.35,22.05,"translateX(-35px)");
    appear(".ks-execution-checks",21.9,22.4);
    appear(".ks-pass",22.25,22.7,"scale(.75)");
    appear(".ks-final-line",22.2,22.75);
    add(".ks-moving-line", [{strokeDashoffset:0},{strokeDashoffset:-1600}]);
    add("#ks-progress-fill", [{transform:"scaleX(0)"},{transform:"scaleX(1)"}]);
  }
  function seconds() { return ((animations[0]?.currentTime || 0) % DURATION) / 1000; }
  function render(force = false) {
    const time = seconds();
    const next = phases.reduce((found,item,index) => time >= item[0] ? index : found, 0);
    if (force || phase !== next) {
      phase = next;
      const data = phases[phase];
      select("#ks-phase-number").textContent = `0${phase+1} / 06`;
      select("#ks-phase-title").textContent = text(data[1],data[2]);
      select("#ks-phase-copy").textContent = text(data[3],data[4]);
      selectAll("[data-ks-phase]").forEach(button => button.setAttribute("aria-pressed",String(Number(button.dataset.ksPhase) === phase)));
      selectAll("[data-mobile-phase]").forEach(item => item.classList.toggle("is-current",Number(item.dataset.mobilePhase) === phase));
    }
    const clock = Math.floor(time);
    if (clock !== lastClock || force) { select("#ks-time").textContent = String(clock).padStart(2,"0"); lastClock = clock; }
  }
  function tick() { render(); frame = requestAnimationFrame(tick); }
  function sync() {
    const running = capable && !userPaused && !hovered && onScreen && !document.hidden && !reduced.matches;
    cancelAnimationFrame(frame);
    const commonStart = document.timeline.currentTime - (animations[0]?.currentTime || 0);
    animations.forEach(animation => {
      if (running) { animation.play(); animation.startTime = commonStart; }
      else animation.pause();
    });
    select("#ks-play-icon").textContent = userPaused || reduced.matches ? "▶" : "Ⅱ";
    select("#ks-play-label").textContent = userPaused || reduced.matches ? text("播放","Play") : text("暂停","Pause");
    select("#ks-play").setAttribute("aria-label",userPaused || reduced.matches ? text("播放动画","Play animation") : text("暂停动画","Pause animation"));
    select("#ks-replay").setAttribute("aria-label",text("重新播放动画","Replay animation"));
    root.classList.toggle("ks-static",reduced.matches || !capable);
    if (running) frame = requestAnimationFrame(tick);
    render(true);
  }
  function seek(time) {
    animations.forEach(animation => { animation.currentTime = time * 1000; });
    if (!capable) {
      phase = phases.reduce((found,item,index) => time >= item[0] ? index : found, 0);
      const data = phases[phase];
      select("#ks-phase-number").textContent = `0${phase+1} / 06`;
      select("#ks-phase-title").textContent = text(data[1],data[2]);
      select("#ks-phase-copy").textContent = text(data[3],data[4]);
      selectAll("[data-ks-phase]").forEach(button => button.setAttribute("aria-pressed",String(Number(button.dataset.ksPhase)===phase)));
      selectAll("[data-mobile-phase]").forEach(item => item.classList.toggle("is-current",Number(item.dataset.mobilePhase)===phase));
      return;
    }
    sync();
  }
  select("#ks-play").addEventListener("click",() => { userPaused = !userPaused; hovered = false; sync(); });
  select("#ks-replay").addEventListener("click",() => { userPaused = reduced.matches; hovered = false; seek(0); });
  selectAll("[data-ks-phase]").forEach(button => button.addEventListener("click",() => {
    userPaused = true;
    // Seek to a readable settled view, rather than the beginning of a camera move.
    seek([1.8,6.4,12.3,16.9,20.3,23.05][Number(button.dataset.ksPhase)]);
  }));
  root.addEventListener("pointerenter",event => { if (event.pointerType === "mouse") { hovered = true; sync(); } });
  root.addEventListener("pointerleave",() => { hovered = false; sync(); });
  document.addEventListener("visibilitychange",sync);
  document.addEventListener("site-language-change",() => { render(true); sync(); });
  reduced.addEventListener("change",() => { userPaused = reduced.matches; resize(); sync(); });
  new ResizeObserver(resize).observe(select(".ks-viewport"));
  new IntersectionObserver(entries => { onScreen = entries[0].isIntersecting; sync(); },{threshold:.08}).observe(root);
  // A no-script page keeps the full architecture summary accessible. Motion preference uses a manual storyboard.
  resize(); render(true); sync();
})();

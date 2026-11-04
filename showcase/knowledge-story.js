/* A shared 24-second Web Animations timeline. No network dependency or DOM polling loop. */
(() => {
  "use strict";
  const root = document.querySelector("#knowledge-story");
  if (!root) return;
  const DURATION = 24000;
  const phases = [
    [0, "经验进入工作区", "Experience enters the workspace", "从历史人机对话出发，追踪知识如何成为行动依据。", "Follow how historical human–agent dialogue becomes actionable context."],
    [2, "LLM 整理结构化知识", "An LLM organizes structured knowledge", "先将 task、constraint、solution 整理在一张完整卡片中，保留经验来源。", "First organize task, constraint and solution into a single card, keeping the source of the experience."],
    [8, "工程经验进入 Knowledge Index", "Engineering experience enters the Knowledge Index", "完整知识卡拆成 task / constraint / solution，再经 Embedding Model 编码；经验库保留内容与来源，支持语义和关键词查找。", "The unified card separates into task / constraint / solution chunks. An embedding model encodes text; the index keeps content and provenance for semantic and keyword lookup."],
    [13, "新任务，找回相关经验", "A new task retrieves relevant experience", "下一次用户提问进入经验库，经过检索、匹配、排名、选择，得到相关任务的历史经验。", "The next request searches the experience library. Retrieve, match, rank and select useful historical experience."],
    [17.5, "多源信息汇聚为增强任务", "Multiple sources enrich the task", "任务、检索经验、当前仓库事实与 Skill 汇入上下文；失败信息仅在重试时追加。", "Task, retrieved experience, repository facts and Skill form the context. Failure feedback is added only on retries."],
    [21, "增强任务交给模型推进", "Pass the enriched task to the model", "带有历史经验的任务交给模型；当前 demo 使用 LLM，代码修改与独立验收由工具完成，MLLM 可扩展。", "The model receives the experience-enriched task. This demo uses an LLM, while tools edit and independently validate code; MLLM support can be added."],
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
      [20.8,3450],[23.65,3450],[23.75,3450],[23.76,0],[24,0]];
    add(".ks-track", stops.map(([time,x]) => ({
      offset:time / 24,transform:`translateX(${-x}px)`,
      // One continuous move from the index through retrieval to context assembly.
      easing:time===12.8 ? "cubic-bezier(.25,.12,.6,1)" : "cubic-bezier(.45,0,.2,1)",
    })));
    // An opaque bookend covers only the loop reset. The pipeline itself never cuts between slides.
    add(".ks-loop-veil", [{opacity:1,offset:0},{opacity:1,offset:.026},{opacity:0,offset:.071},
      {opacity:0,offset:.958},{opacity:1,offset:.986},{opacity:1,offset:1}]);
    add(".ks-chat-scroll", [{transform:"translateY(0px)",offset:0},{transform:"translateY(0px)",offset:.065},
      {transform:"translateY(-380px)",offset:.265},{transform:"translateY(-380px)",offset:1}]);
    add(".ks-highlight", [{boxShadow:"none",offset:0},{boxShadow:"none",offset:.13},
      {boxShadow:"0 0 0 2px #dfe8fa",offset:.17},{boxShadow:"0 0 0 2px #dfe8fa",offset:1}]);
    add(".ks-fragment-one", [{opacity:0,transform:"translate(0,0)",offset:0},{opacity:0,transform:"translate(0,0)",offset:.14},
      {opacity:1,transform:"translate(50px,-8px)",offset:.17},{opacity:0,transform:"translate(180px,28px) scale(.75)",offset:.225},{opacity:0,offset:1}]);
    add(".ks-fragment-two", [{opacity:0,transform:"translate(0,0)",offset:0},{opacity:0,transform:"translate(0,0)",offset:.18},
      {opacity:1,transform:"translate(50px,0)",offset:.205},{opacity:0,transform:"translate(190px,-55px) scale(.75)",offset:.26},{opacity:0,offset:1}]);
    appear(".ks-extractor",2.5,3.2,"scale(.94)");
    add(".ks-unified-chunks",[
      {opacity:0,transform:"translateX(0)",offset:0},
      {opacity:0,transform:"translateX(0)",offset:4.3/24},
      {opacity:1,transform:"translateX(0)",offset:5/24},
      {opacity:1,transform:"translateX(0)",offset:7.2/24,easing:"cubic-bezier(.4,0,.2,1)"},
      {opacity:1,transform:"translateX(400px)",offset:8.8/24},
      {opacity:1,transform:"translateX(400px)",offset:1},
    ]);
    add(".ks-chunk-shell",[{opacity:1,offset:0},{opacity:1,offset:7.25/24},{opacity:0,offset:8.3/24},{opacity:0,offset:1}]);
    [".chunk-task",".chunk-constraint",".chunk-solution"].forEach((selector,i)=>{
      const split={opacity:1,transform:`translateY(${i*15}px)`,borderRadius:"8px",borderColor:["#d9e4f7","#e1d7f2","#d0e8e3"][i],backgroundColor:"#ffffff",boxShadow:"0 3px 8px #2f4d8708"};
      const joined={opacity:0,transform:"translateY(0)",borderRadius:"0px",borderColor:"transparent",backgroundColor:"transparent",boxShadow:"none"};
      add(selector,[{...joined,offset:0},{...joined,offset:(4.65+i*.22)/24},
        {...joined,opacity:1,offset:(5.05+i*.22)/24},
        {...joined,opacity:1,offset:7.3/24},{...split,offset:8.4/24},{...split,offset:1}]);
    });
    appear(".ks-chunk-label",7.6,8.3);
    appear(".ks-small-note",8.4,8.9);
    appear(".ks-embedding",9.1,9.7,"scale(.9)");
    selectAll(".ks-vector").forEach((item,i) => appear(`.ks-vector:nth-child(${i+1})`,9.7 + i*.35,10.4 + i*.35,"translateX(-45px) scaleX(.6)"));
    appear(".ks-bypass",9.6,10.2);
    appear(".ks-index",10.7,11.35,"translateX(-18px)");
    selectAll(".ks-index-grid i").forEach((item,i) => appear(`.ks-index-grid i:nth-child(${i+1})`,10.9+i*.07,11.25+i*.07,"translate(-12px,-6px) scale(.5)"));
    appear(".ks-keywords",11.3,12.1,"translateX(-25px)");
    selectAll(".ks-search-steps>div").forEach((item,i)=>appear(`.ks-search-steps>div:nth-child(${i+1})`,14+i*.25,14.45+i*.25,"translateX(-12px)"));
    add(".ks-index-grid i.relevant", [{boxShadow:"none",offset:0},{boxShadow:"none",offset:.57},
      {boxShadow:"0 0 0 3px #a0b8f4",backgroundColor:"#9db9f6",offset:.61},
      {boxShadow:"0 0 0 1px #a0b8f4",backgroundColor:"#b4caf8",offset:1}]);
    selectAll(".ks-result").forEach((item,i) => appear(`.ks-result:nth-of-type(${i+1})`,15.55+i*.2,16.1+i*.2,"translateX(-15px)"));
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
    selectAll(".ks-enriched-block").forEach((item,i) => appear(`.ks-enriched-block:nth-of-type(${i+1})`,18.4+i*.32,18.8+i*.32,"translateX(-12px)"));
    appear(".ks-model-handoff",20.45,21.2,"translateX(-22px) scale(.96)");
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
    seek([1.8,6.4,12.3,16.0,20.6,22.6][Number(button.dataset.ksPhase)]);
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

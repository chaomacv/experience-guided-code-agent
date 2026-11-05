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
  let userPaused = reduced.matches, onScreen = true, frame = 0, phase = -1;
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
    // One horizontal journey, with eased arrivals and short reading pauses.
    add(".ks-track",[
      {offset:0,transform:"translateX(0)"},
      {offset:6.7/24,transform:"translateX(0)",easing:"cubic-bezier(.25,0,.75,1)"},
      {offset:11.1/24,transform:"translateX(-1010px)"},
      {offset:11.7/24,transform:"translateX(-1010px)",easing:"cubic-bezier(.25,0,.75,1)"},
      {offset:15.1/24,transform:"translateX(-2180px)"},
      {offset:15.7/24,transform:"translateX(-2180px)",easing:"cubic-bezier(.25,0,.75,1)"},
      {offset:19.8/24,transform:"translateX(-3280px)"},
      {offset:20.4/24,transform:"translateX(-3280px)",easing:"cubic-bezier(.25,0,.75,1)"},
      {offset:21.3/24,transform:"translateX(-3450px)"},
      {offset:23.75/24,transform:"translateX(-3450px)"},
      {offset:23.76/24,transform:"translateX(0)"},
      {offset:1,transform:"translateX(0)"},
    ]);
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
      {opacity:1,transform:"translateX(400px)",offset:10.3/24},
      {opacity:1,transform:"translateX(400px)",offset:1},
    ]);
    // Keep the extraction heading, then fold it away as the knowledge card splits.
    add(".ks-unified-chunks > .ks-card-head",[
      {opacity:1,height:"60px",minHeight:"60px",paddingTop:"8px",paddingBottom:"8px",borderBottomWidth:"1px",offset:0},
      {opacity:1,height:"60px",minHeight:"60px",paddingTop:"8px",paddingBottom:"8px",borderBottomWidth:"1px",offset:7.5/24},
      {opacity:0,height:"0px",minHeight:"0px",paddingTop:"0px",paddingBottom:"0px",borderBottomWidth:"0px",offset:9/24},
      {opacity:0,height:"0px",minHeight:"0px",paddingTop:"0px",paddingBottom:"0px",borderBottomWidth:"0px",offset:1},
    ]);
    add(".ks-chunk-shell",[{opacity:1,offset:0},{opacity:1,offset:7.5/24},{opacity:0,offset:9/24},{opacity:0,offset:1}]);
    [".chunk-task",".chunk-constraint",".chunk-solution"].forEach((selector,i)=>{
      const split={opacity:1,transform:`translateY(${i*15}px)`,borderRadius:"8px",borderColor:["#d9e4f7","#e1d7f2","#d0e8e3"][i],backgroundColor:"#ffffff",boxShadow:"0 3px 8px #2f4d8708"};
      const joined={opacity:0,transform:"translateY(0)",borderRadius:"0px",borderColor:"transparent",backgroundColor:"transparent",boxShadow:"none"};
      add(selector,[{...joined,offset:0},{...joined,offset:(4.65+i*.22)/24},
        {...joined,opacity:1,offset:(5.05+i*.22)/24},
        {...joined,opacity:1,offset:7.4/24},{...split,offset:9/24},{...split,offset:1}]);
    });
    add(".ks-knowledge-link",[{transform:"scaleX(.16318)",offset:0},{transform:"scaleX(.16318)",offset:7.2/24,easing:"cubic-bezier(.4,0,.2,1)"},{transform:"scaleX(1)",offset:10.3/24},{transform:"scaleX(1)",offset:1}]);
    appear(".ks-chunk-label",7.6,8.3);
    appear(".ks-split-note",7.6,8.3,"translateX(-8px)");
    appear(".ks-small-note",8.4,8.9);
    // Carry text through the model, turn it into vector strips, and store it.
    [0,1,2].forEach(i=>{
      const delay=i*.22;
      add(`.ks-knowledge-packet.flow-${i}`,[
        {opacity:0,transform:`translate(1330px,${137+i*101}px) scale(1)`,offset:0},
        {opacity:0,transform:`translate(1330px,${137+i*101}px) scale(1)`,offset:(9.4+delay)/24},
        {opacity:1,transform:`translate(1355px,${137+i*96}px) scale(1)`,offset:(9.55+delay)/24},
        {opacity:1,transform:`translate(1460px,${170+i*12}px) scale(.9)`,offset:(10+delay)/24},
        {opacity:1,transform:`translate(1650px,${140+i*55}px) scale(.9)`,offset:(10.6+delay)/24},
        {opacity:1,transform:`translate(1870px,${190+i*16}px) scale(.75)`,offset:(11.45+delay)/24},
        {opacity:0,transform:`translate(1910px,${190+i*16}px) scale(.55)`,offset:(11.7+delay)/24},
        {opacity:0,offset:1},
      ]);
      add(`.flow-${i} .ks-packet-text`,[
        {opacity:1,offset:0},{opacity:1,offset:(10+delay)/24},
        {opacity:0,offset:(10.4+delay)/24},{opacity:0,offset:1},
      ]);
      add(`.flow-${i} .ks-packet-vector`,[
        {opacity:0,offset:0},{opacity:0,offset:(10+delay)/24},
        {opacity:1,offset:(10.4+delay)/24},{opacity:1,offset:1},
      ]);
      add(`.ks-index-grid i:nth-child(${i+1})`,[
        {backgroundColor:"#e8edf7",borderColor:"#dce5f5",offset:0},
        {backgroundColor:"#e8edf7",borderColor:"#dce5f5",offset:(11.2+delay)/24},
        {backgroundColor:"#b6cafa",borderColor:"#96b4ed",offset:(11.7+delay)/24},
        {backgroundColor:"#cedafb",borderColor:"#b4c8f1",offset:1},
      ]);
    });
    add(".ks-embedding",[
      {borderColor:"#d5c9ef",offset:0},{borderColor:"#d5c9ef",offset:9.7/24},
      {borderColor:"#ae93dd",offset:10.5/24},{borderColor:"#d5c9ef",offset:11.6/24},
      {borderColor:"#d5c9ef",offset:1},
    ]);
    add(".ks-retrieved-packet",[
      {opacity:0,transform:"translateX(0)",offset:0},
      {opacity:0,transform:"translateX(0)",offset:17/24},
      {opacity:1,transform:"translateX(15px)",offset:17.15/24},
      {opacity:1,transform:"translateX(100px)",offset:17.65/24},
      {opacity:0,transform:"translateX(145px)",offset:17.95/24},
      {opacity:0,offset:1},
    ]);
    // A new task drops into the shared workspace, then retrieves prior experience.
    add(".ks-query",[
      {opacity:0,transform:"translateY(-200px)",offset:0},
      {opacity:0,transform:"translateY(-200px)",offset:12.5/24},
      {opacity:1,transform:"translateY(-170px)",offset:12.62/24,easing:"cubic-bezier(.22,.8,.25,1)"},
      {opacity:1,transform:"translateY(0)",offset:13.5/24},
      {opacity:1,transform:"translateY(0)",offset:1},
    ]);
    add(".ks-library-pulse",[
      {opacity:0,transform:"translate(2300px,439px)",offset:0},
      {opacity:0,transform:"translate(2300px,439px)",offset:13.65/24},
      {opacity:1,transform:"translate(2320px,439px)",offset:13.8/24},
      {opacity:1,transform:"translate(2536px,439px)",offset:14.35/24},
      {opacity:1,transform:"translate(2536px,267px)",offset:14.75/24},
      {opacity:0,transform:"translate(2576px,267px)",offset:14.95/24},
      {opacity:0,offset:1},
    ]);
    // Keep card contents present. Highlight activity without exposing empty panels.
    selectAll(".ks-search-steps>div").forEach((item,i)=>add(`.ks-search-steps>div:nth-child(${i+1})`,[
      {borderColor:"#e1e8f7",offset:0},{borderColor:"#e1e8f7",offset:(14.2+i*.5)/24},
      {borderColor:"#95b2e9",offset:(14.45+i*.5)/24},{borderColor:"#e1e8f7",offset:(14.9+i*.5)/24},
      {borderColor:"#e1e8f7",offset:1},
    ]));
    add(".ks-index-grid i.relevant", [{boxShadow:"none",offset:0},{boxShadow:"none",offset:.57},
      {boxShadow:"0 0 0 3px #a0b8f4",backgroundColor:"#9db9f6",offset:.61},
      {boxShadow:"0 0 0 1px #a0b8f4",backgroundColor:"#b4caf8",offset:1}]);
    selectAll(".ks-result").forEach((item,i)=>add(`.ks-result:nth-of-type(${i+1})`,[
      {backgroundColor:"#ffffff",offset:0},{backgroundColor:"#ffffff",offset:(15.9+i*.25)/24},
      {backgroundColor:"#f0f5ff",offset:(16.15+i*.25)/24},{backgroundColor:"#ffffff",offset:(16.7+i*.25)/24},
      {backgroundColor:"#ffffff",offset:1},
    ]));
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
    selectAll(".ks-enriched-block").forEach((item,i)=>add(`.ks-enriched-block:nth-of-type(${i+1})`,[
      {backgroundColor:"transparent",offset:0},{backgroundColor:"transparent",offset:(18.4+i*.32)/24},
      {backgroundColor:"rgba(190,205,239,.06)",offset:(18.7+i*.32)/24},
      {backgroundColor:"transparent",offset:(19.1+i*.32)/24},{backgroundColor:"transparent",offset:1},
    ]));
    add(".ks-model-handoff",[
      {borderColor:"#d5c9ef",offset:0},{borderColor:"#d5c9ef",offset:20.45/24},
      {borderColor:"#a28bd1",offset:21.2/24},{borderColor:"#d5c9ef",offset:22/24},
      {borderColor:"#d5c9ef",offset:1},
    ]);
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
    const running = capable && !userPaused && onScreen && !document.hidden && !reduced.matches;
    cancelAnimationFrame(frame);
    const commonStart = document.timeline.currentTime - (animations[0]?.currentTime || 0);
    if (running !== (animations[0]?.playState === "running")) {
      animations.forEach(animation => {
        if (running) { animation.play(); animation.startTime = commonStart; }
        else animation.pause();
      });
    }
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
  select("#ks-play").addEventListener("click",() => { userPaused = !userPaused; sync(); });
  select("#ks-replay").addEventListener("click",() => { userPaused = reduced.matches; seek(0); });
  selectAll("[data-ks-phase]").forEach(button => button.addEventListener("click",() => {
    userPaused = true;
    // Seek to a readable settled view, rather than the beginning of a camera move.
    seek([1.8,6.4,11.4,15.4,20.1,22.6][Number(button.dataset.ksPhase)]);
  }));
  document.addEventListener("visibilitychange",sync);
  document.addEventListener("site-language-change",() => { render(true); sync(); });
  reduced.addEventListener("change",() => { userPaused = reduced.matches; resize(); sync(); });
  new ResizeObserver(resize).observe(select(".ks-viewport"));
  new IntersectionObserver(entries => { onScreen = entries[0].isIntersecting; sync(); },{threshold:.08}).observe(root);
  // A no-script page keeps the full architecture summary accessible. Motion preference uses a manual storyboard.
  resize(); render(true); sync();
})();

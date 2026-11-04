/* A shared 24-second Web Animations timeline. No network dependency or DOM polling loop. */
(() => {
  "use strict";
  const root = document.querySelector("#knowledge-story");
  if (!root) return;
  const DURATION = 24000;
  const phases = [
    [0, "先看一段历史对话", "Start with a past conversation", "人和助手一起解决过的问题，往往藏在很长的聊天记录里。", "Problems solved by a person and an assistant are often buried in long conversations."],
    [4, "把长对话，整理成经验", "Turn a long conversation into a lesson", "记下遇到了什么、为什么发生、怎么解决，以及下次该注意什么。", "Keep what happened, why it happened, what helped, and what to remember next time."],
    [8, "保存经验，以后用得上", "Save lessons for later", "经验按内容整理，也保留来源。下一次，不必重新翻完整段聊天。", "Organize lessons and keep their sources. Next time, there is no need to reread every conversation."],
    [12, "有了新任务，找回相关经验", "Find relevant lessons for a new task", "先从过去的经验里，找出和这次任务有关的问题与解决办法。", "Find past problems and fixes that are useful for the task at hand."],
    [17.5, "带着经验，有依据地行动", "Let experience guide the next action", "把这次的任务、过去的经验和当前项目要求放在一起，形成计划，再执行和检查。", "Combine the new task, past lessons and current project rules, then plan, make changes and check the result."],
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
    const scale = select(".story-viewport").clientWidth / 1200;
    select(".story-world").style.transform = `scale(${scale})`;
    if (!mobile.matches && !reduced.matches && capable) {
      select(".story-viewport").style.height = `${460 * scale}px`;
    } else select(".story-viewport").style.height = "";
  }
  if (capable) {
    const stops = [[0,0],[6.9,0],[8.2,640],[11.5,640],[13,1580],[16.5,1580],
      [18,2630],[23.65,2630],[23.75,2630],[23.76,0],[24,0]];
    add(".story-track",stops.map(([time,x])=>({offset:time/24,transform:`translateX(${-x}px)`,easing:"cubic-bezier(.45,0,.2,1)"})));
    add(".story-veil",[{opacity:1,offset:0},{opacity:0,offset:.045},{opacity:0,offset:.958},{opacity:1,offset:.986},{opacity:1,offset:1}]);
    add(".story-chat-scroll",[{transform:"translateY(0)",offset:0},{transform:"translateY(0)",offset:.10},
      {transform:"translateY(-110px)",offset:.17},{transform:"translateY(-245px)",offset:.29},{transform:"translateY(-245px)",offset:1}]);
    add(".story-important .story-bubble",[{boxShadow:"none",offset:0},{boxShadow:"none",offset:.14},
      {boxShadow:"0 0 0 2px #c7d8fa",offset:.19},{boxShadow:"0 0 0 2px #c7d8fa",offset:1}]);
    appear(".story-organizer",2.4,3.2,"scale(.94)");
    add(".fragment-one",[{opacity:0,transform:"translate(0,0)",offset:0},{opacity:0,offset:.13},
      {opacity:1,transform:"translate(48px,-5px)",offset:.16},{opacity:0,transform:"translate(185px,30px) scale(.8)",offset:.21},{opacity:0,offset:1}]);
    add(".fragment-two",[{opacity:0,transform:"translate(0,0)",offset:0},{opacity:0,offset:.18},
      {opacity:1,transform:"translate(48px,0)",offset:.21},{opacity:0,transform:"translate(185px,-30px) scale(.8)",offset:.26},{opacity:0,offset:1}]);
    appear(".story-lesson",3.8,4.45,"translateX(-20px)");
    selectAll(".story-lesson-row").forEach((item,i)=>appear(`.story-lesson-row:nth-child(${i+1})`,4.1+i*.35,4.55+i*.35,"translateX(-12px)"));
    appear(".story-library",7.8,8.5,"translateX(-22px)");
    selectAll(".story-book").forEach((item,i)=>appear(`.story-book:nth-child(${i+1})`,8.2+i*.25,8.65+i*.25,"translate(-30px,-6px)"));
    appear(".story-task",11.8,12.6,"translateY(18px)");
    appear(".story-found",13,13.7,"translateX(-18px)");
    selectAll(".story-found-item").forEach((item,i)=>appear(`.story-found-item:nth-of-type(${i+1})`,13.5+i*.4,14+i*.4,"translateX(-16px)"));
    appear(".source-task",17,17.7,"translate(60px,35px)");
    appear(".source-lessons",17.2,17.9,"translate(-65px,0)");
    appear(".source-project",17.4,18.1,"translate(60px,-30px)");
    appear(".story-brief",18,18.65,"scale(.97)");
    [52,4,-45].forEach((dy,i)=>{
      const at=18.3+i*.42;
      add(`.transfer-${i}`,[{opacity:0,transform:"translate(0,0)",offset:0},{opacity:0,offset:at/24},
        {opacity:1,transform:"translate(15px,0)",offset:(at+.12)/24},
        {opacity:0,transform:`translate(165px,${dy}px) scale(.85)`,offset:(at+.8)/24},{opacity:0,offset:1}]);
    });
    selectAll(".story-brief-block").forEach((item,i)=>appear(`.story-brief-block:nth-of-type(${i+1})`,18.55+i*.4,19.1+i*.4,"translateX(-14px)"));
    appear(".story-action",20.25,20.95,"translateX(-25px)");
    selectAll(".story-action li").forEach((item,i)=>appear(`.story-action li:nth-child(${i+1})`,20.75+i*.35,21.3+i*.35));
    appear(".story-action footer",22,22.5);
    appear(".story-ending",21.8,22.5);
    add(".story-flow-line",[{strokeDashoffset:0},{strokeDashoffset:-1300}]);
    add("#ks-progress-fill",[{transform:"scaleX(0)"},{transform:"scaleX(1)"}]);
  }
  function seconds() { return ((animations[0]?.currentTime || 0) % DURATION) / 1000; }
  function render(force = false) {
    const time = seconds();
    const next = phases.reduce((found,item,index) => time >= item[0] ? index : found, 0);
    if (force || phase !== next) {
      phase = next;
      const data = phases[phase];
      select("#ks-phase-number").textContent = `0${phase+1} / 05`;
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
      select("#ks-phase-number").textContent = `0${phase+1} / 05`;
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
    seek([2.2,6.4,10.5,15.6,22.8][Number(button.dataset.ksPhase)]);
  }));
  root.addEventListener("pointerenter",event => { if (event.pointerType === "mouse") { hovered = true; sync(); } });
  root.addEventListener("pointerleave",() => { hovered = false; sync(); });
  document.addEventListener("visibilitychange",sync);
  document.addEventListener("site-language-change",() => { render(true); sync(); });
  reduced.addEventListener("change",() => { userPaused = reduced.matches; resize(); sync(); });
  new ResizeObserver(resize).observe(select(".story-viewport"));
  new IntersectionObserver(entries => { onScreen = entries[0].isIntersecting; sync(); },{threshold:.08}).observe(root);
  // A no-script page keeps the full architecture summary accessible. Motion preference uses a manual storyboard.
  resize(); render(true); sync();
})();

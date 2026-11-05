"use strict";
const tr = (key, values) => window.siteI18n.t(key, values);
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const node = (tag, text, cls) => {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (cls) e.className = cls;
  return e;
};
let data;
const state = { scenario: "repair", attempt: 0, stage: "retrieval", mode: "dense", query: "Q11" };
const names = { dense: "Dense", bm25: "BM25", hybrid: "Hybrid / RRF", hybrid_diverse: "Hybrid + 去重" };

function renderDemo() {
  const demo = data.demos[state.scenario];
  const attempt = demo.attempts[state.attempt];
  const controls = $("#attempts");
  controls.replaceChildren();
  demo.attempts.forEach((item, index) => {
    const button = node("button", tr("第 {n} 轮", {n:index+1}), state.attempt === index ? "active" : "");
    button.setAttribute("aria-pressed", String(state.attempt === index));
    button.onclick = () => { state.attempt = index; renderDemo(); };
    controls.append(button);
  });
  const status = $("#attempt-status");
  status.textContent = attempt.passed ? "✓ PASSED" : "↶ VALIDATION FAILED";
  status.className = "status"+(attempt.passed ? "" : " fail");
  $$(".scenario").forEach(button => {
    const active = button.dataset.scenario === state.scenario;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  $$(".stage-tabs button").forEach(button => button.setAttribute("aria-selected", String(button.dataset.stage === state.stage)));
  const content = $("#demo-content");
  content.replaceChildren();
  if (state.stage === "retrieval") {
    if (window.siteI18n.language === "en") content.append(node("p", tr("案例英文摘要；原始代码、日志与案例摘录保留原文。"), "evidence-language-note"));
    attempt.retrieval.slice(0, 5).forEach((item, i) => {
      const row = node("div", undefined, "evidence-item");
      row.append(node("span", String(i+1).padStart(2, "0"), "rank-number"));
      const text = node("div");
      text.append(node("strong", item.case_id+" / "+item.chunk_type));
      appendEvidence(text, item, 135);
      row.append(text);
      content.append(row);
    });
    $("#demo-footer").textContent = state.attempt === 0 ? tr("原始任务 → 首次检索") : tr("原始任务 + 验证失败证据 → 再检索");
  } else if (state.stage === "plan") {
    const files = attempt.plan.actions.map(action => ({tool:action.tool,path:action.path,content:action.content}));
    content.append(node("p", tr("预设动作回放 · 实际写入隔离的项目副本"), "validation-detail"));
    content.append(node("pre", JSON.stringify(files, null, 2), "code-block"));
    $("#demo-footer").textContent = tr("{n} 个文件动作 · 批次校验后写入", {n:files.length});
  } else {
    attempt.validation.checks.forEach(check => {
      let parsed;
      try { parsed = JSON.parse(check.stdout || "{}"); } catch { parsed = {}; }
      const checks = parsed.checks || [{name:check.name || (check.command || []).join(" "),passed:check.passed,error:check.error || check.stderr}];
      checks.forEach(result => {
        const row = node("div", undefined, "validation-row");
        row.append(node("span", result.name));
        row.append(node("span", result.passed ? "✓ passed" : "× failed", result.passed ? "ok" : "bad"));
        content.append(row);
        if (result.error) content.append(node("p", result.error, "validation-detail"));
      });
    });
    if (state.scenario === "rollback" && state.attempt === demo.attempts.length-1) {
      content.append(node("p", tr("重试耗尽 → rollback → restored: {value}", {value:demo.report.rollback.restored}), "validation-detail"));
    }
    $("#demo-footer").textContent = tr("真实子进程退出码：{codes}", {codes:attempt.validation.checks.map(check => check.exit_code).join(", ")});
  }
}

function renderQuery() {
  const rows = data.evaluation.queries[state.mode];
  const row = rows.find(item => item.id === state.query);
  $$(".mode-controls button").forEach(button => {
    const active = button.dataset.mode === state.mode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  $("#query-results").replaceChildren();
  if (window.siteI18n.language === "en") $("#query-results").append(node("p", tr("案例英文摘要；原始代码、日志与案例摘录保留原文。"), "evidence-language-note"));
  if (!row.results.length) {
    $("#query-results").append(node("p", tr("此方案没有返回匹配结果。")));
    return;
  }
  const baseline = data.evaluation.queries.hybrid.find(item => item.id === state.query).results.slice(0, 5);
  const diverse = data.evaluation.queries.hybrid_diverse.find(item => item.id === state.query).results.slice(0, 5);
  const identity = item => item.chunk_id;
  if (state.mode === "hybrid" || state.mode === "hybrid_diverse") {
    const kept = diverse.filter(item => baseline.some(old => identity(old) === identity(item))).length;
    const removed = baseline.filter(item => !diverse.some(next => identity(next) === identity(item)));
    let shared = 0;
    while (shared < Math.min(baseline.length, diverse.length) && identity(baseline[shared]) === identity(diverse[shared])) shared++;
    const comparison = node("div", undefined, "retrieval-comparison");
    comparison.append(node("p", tr("Top-5 对照：保留 {kept} 条，补入 {added} 条，移出 {removed} 条。", {kept, added:diverse.length-kept, removed:removed.length})));
    if (shared === 5) comparison.append(node("p", tr("本查询两种方案的 Top-5 一致。")));
    else if (shared) comparison.append(node("p", tr("本查询前 {n} 条一致，差异从第 {next} 条开始。", {n:shared,next:shared+1})));
    if (removed.length) comparison.append(node("p", tr("去重后移出：") + removed.map(item => `${item.case_id} / ${item.chunk_type} (RRF #${baseline.indexOf(item)+1})`).join(" · ")));
    $("#query-results").append(comparison);
  }
  row.results.slice(0, 5).forEach((item, i) => {
    const card = node("article", undefined, "query-card");
    const top = node("div", undefined, "result-top");
    top.append(node("span", "TOP "+String(i+1).padStart(2, "0")));
    const grade = row.relevance[item.case_id] || 0;
    if (grade) top.append(node("span", tr("相关性 {grade}/3", {grade}), "relevance"));
    else top.append(node("span", tr("未标注相关")));
    card.append(top, node("h4", item.case_id+" / "+item.chunk_type));
    if (state.mode === "hybrid_diverse") {
      const rank = baseline.findIndex(old => identity(old) === identity(item));
      card.append(node("div", rank < 0 ? tr("新增案例 · 去重后补入") : tr("保留 · 原 RRF #{rank}", {rank:rank+1}), "retrieval-change " + (rank < 0 ? "added" : "kept")));
    } else if (state.mode === "hybrid" && baseline.filter(old => old.case_id === item.case_id).length > 1) {
      card.append(node("div", tr("同 Case 的多个片段"), "retrieval-change repeated"));
    }
    appendEvidence(card, item, undefined, true);
    const scores = node("div", undefined, "result-scores");
    scores.append(node("div", "score "+item.score.toFixed(4)));
    scores.append(node("div", "Dense #"+(item.dense_rank ?? "—")+" · BM25 #"+(item.lexical_rank ?? "—")));
    card.append(scores);
    $("#query-results").append(card);
  });
}


// Collapse only adjacent identical prose sentences; evidence files stay untouched.
function compactEvidence(text) {
  let previous = "";
  return (text.match(/[^。！？\n]+[。！？]?|\n+/gu) || []).filter(part => {
    const key = part.trim().replace(/\s+/gu, " ");
    if (!key) return true;
    if (key === previous) return false;
    previous = key;
    return true;
  }).join("").trim();
}
function appendEvidence(container, item, limit, clean = false) {
  const original = limit ? item.text.slice(0, limit)+(item.text.length>limit ? "…" : "") : item.text;
  const english = window.siteI18n.language === "en";
  if (!english && !clean) { container.append(node("p", original)); return; }
  container.append(node("p", english ? window.siteI18n.caseSummary(item.case_id) : compactEvidence(original), "translated-summary"));
  const details = node("details", undefined, "original-evidence");
  details.append(node("summary", tr("查看原文")), node("p", original));
  container.append(details);
}
function renderQueryOptions() {
  $("#query-select").replaceChildren(...data.evaluation.queries.dense.map(query => {
    const option=node("option", query.id+" · "+tr(query.query));
    option.value=query.id;
    return option;
  }));
  $("#query-select").value=state.query;
}
function renderMetrics() {
  $("#metrics-table").replaceChildren();
  Object.entries(data.evaluation.summary).forEach(([key, metrics])=>{
    const row=node("tr");
    row.append(node("td",tr(names[key])));
    ["recall@5","mrr@5","ndcg@5","unique_cases"].forEach(metric=>row.append(node("td",metrics[metric].toFixed(metric==="unique_cases"?2:3))));
    $("#metrics-table").append(row);
  });
}
document.addEventListener("site-language-change", () => {
  if (!data) return;
  renderQueryOptions(); renderMetrics(); renderDemo(); renderQuery();
});

async function init() {
  const response = await fetch("data.json");
  if (!response.ok) throw new Error("数据加载失败");
  data = await response.json();
  renderQueryOptions();
  $("#query-select").onchange = e => { state.query=e.target.value; renderQuery(); };
  $$(".scenario").forEach(button => button.onclick=()=>{ state.scenario=button.dataset.scenario;state.attempt=0;renderDemo(); });
  $$(".stage-tabs button").forEach(button=>button.onclick=()=>{ state.stage=button.dataset.stage;renderDemo(); });
  $$(".stage-tabs").forEach(tabs => tabs.addEventListener("keydown", event => {
    if (!["ArrowLeft","ArrowRight","Home","End"].includes(event.key)) return;
    const buttons=[...tabs.querySelectorAll("button")];
    let i=buttons.indexOf(document.activeElement);
    if(i<0)return;
    i=event.key==="Home"?0:event.key==="End"?buttons.length-1:(i+(event.key==="ArrowRight"?1:-1)+buttons.length)%buttons.length;
    event.preventDefault(); buttons[i].focus();buttons[i].click();
  }));
  $$(".mode-controls button").forEach(button=>button.onclick=()=>{state.mode=button.dataset.mode;renderQuery();});
  renderMetrics();
  renderDemo();renderQuery();
}
$("#copy-command").onclick=async()=>{
  const button=$("#copy-command");
  try {
    await navigator.clipboard.writeText($("#quickstart").textContent);
    button.textContent=tr("已复制 ✓");
    setTimeout(()=>button.textContent=tr("复制 ↗"),1800);
  } catch {
    const selection=window.getSelection(), range=document.createRange();
    range.selectNodeContents($("#quickstart"));selection.removeAllRanges();selection.addRange(range);
    button.textContent=tr("已选中，请复制");
  }
};
init().catch(error=>{
  $("#demo-content").textContent=tr("运行记录暂时无法加载，请刷新页面。");
  $("#query-results").textContent=tr("实验数据暂时无法加载。");
  console.error(error);
});

"use strict";
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
    const button = node("button", "第 "+(index+1)+" 轮", state.attempt === index ? "active" : "");
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
    attempt.retrieval.slice(0, 5).forEach((item, i) => {
      const row = node("div", undefined, "evidence-item");
      row.append(node("span", String(i+1).padStart(2, "0"), "rank-number"));
      const text = node("div");
      text.append(node("strong", item.case_id+" / "+item.chunk_type));
      text.append(node("p", item.text.slice(0, 135)+(item.text.length>135 ? "…" : "")));
      row.append(text);
      content.append(row);
    });
    $("#demo-footer").textContent = state.attempt === 0 ? "原始任务 → 首次检索" : "原始任务 + 验证失败证据 → 再检索";
  } else if (state.stage === "plan") {
    const files = attempt.plan.actions.map(action => ({tool:action.tool,path:action.path,content:action.content}));
    content.append(node("p", "预设动作回放 · 实际写入隔离的项目副本", "validation-detail"));
    content.append(node("pre", JSON.stringify(files, null, 2), "code-block"));
    $("#demo-footer").textContent = files.length+" 个文件动作 · 批次校验后写入";
  } else {
    attempt.validation.checks.forEach(check => {
      let parsed;
      try { parsed = JSON.parse(check.stdout || "{}"); } catch { parsed = {}; }
      const checks = parsed.checks || [{name:check.command.join(" "),passed:check.passed,error:check.error || check.stderr}];
      checks.forEach(result => {
        const row = node("div", undefined, "validation-row");
        row.append(node("span", result.name));
        row.append(node("span", result.passed ? "✓ passed" : "× failed", result.passed ? "ok" : "bad"));
        content.append(row);
        if (result.error) content.append(node("p", result.error, "validation-detail"));
      });
    });
    if (state.scenario === "rollback" && state.attempt === demo.attempts.length-1) {
      content.append(node("p", "重试耗尽 → rollback → restored: "+demo.report.rollback.restored, "validation-detail"));
    }
    $("#demo-footer").textContent = "真实子进程退出码："+attempt.validation.checks.map(check => check.exit_code).join(", ");
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
  if (!row.results.length) {
    $("#query-results").append(node("p", "此方案没有返回匹配结果。"));
    return;
  }
  row.results.slice(0, 3).forEach((item, i) => {
    const card = node("article", undefined, "query-card");
    const top = node("div", undefined, "result-top");
    top.append(node("span", "TOP "+String(i+1).padStart(2, "0")));
    const grade = row.relevance[item.case_id] || 0;
    if (grade) top.append(node("span", "相关性 "+grade+"/3", "relevance"));
    else top.append(node("span", "未标注相关"));
    card.append(top, node("h4", item.case_id+" / "+item.chunk_type), node("p", item.text));
    const scores = node("div", undefined, "result-scores");
    scores.append(node("div", "score "+item.score.toFixed(4)));
    scores.append(node("div", "Dense #"+(item.dense_rank ?? "—")+" · BM25 #"+(item.lexical_rank ?? "—")));
    card.append(scores);
    $("#query-results").append(card);
  });
}

const architecture = {
  case: {
    file:"algo_rag_demo/case_pipeline/",
    title:"把历史对话，整理成可复用经验。",
    copy:"LLM 抽取 EngineeringCase，经 Pydantic 约束后，按任务、约束与解决方案生成三个检索视图。",
    points:["Case ID、Source ID 贯穿数据与检索结果","按 Schema 分块，保留工程语义边界","已有结构化案例时跳过抽取"],
    path:"algo_rag_demo/case_pipeline/chunker.py"
  },
  retrieval:{
    file:"algo_rag_demo/rag/",
    title:"语义召回与精确匹配，各有所长。",
    copy:"BGE-M3 寻找语义相关经验，BM25 匹配错误信息与代码标识符；RRF 通过名次融合，避免直接相加不同量纲的分数。",
    points:["中文二元片段 + 工程标识符分词","先模块过滤，再融合与选择 Top-K","按 Case 限额，保留分通道排名证据"],
    path:"algo_rag_demo/rag/retriever.py"
  },
  planner:{
    file:"algo_rag_demo/agent/planner.py",
    title:"经验是参考，当前仓库才是事实。",
    copy:"将历史经验、当前可编辑文件和 Skill 组织为提示词，要求 Planner 返回结构化计划与具体文件动作。",
    points:["可替换 OpenAI-compatible 模型服务","统一 JSON 解析与计划字段整理","验证错误加入下一轮检索及规划上下文"],
    path:"algo_rag_demo/agent/planner.py"
  },
  adapter:{
    file:"algo_rag_demo/agent/executor.py",
    title:"用真实执行，闭合规划循环。",
    copy:"ProjectAdapter 定义 facts、checkpoint、execute、validate 与 rollback，让同一工作流适配不同工程项目。",
    points:["项目副本与白名单文件动作","独立验证命令、超时和真实退出码","检查点恢复验证与阶段耗时事件"],
    path:"algo_rag_demo/agent/executor.py"
  }
};
function renderArchitecture(key) {
  const a = architecture[key];
  $("#arch-file").textContent = a.file;
  $("#arch-title").textContent = a.title;
  $("#arch-copy").textContent = a.copy;
  $("#arch-points").replaceChildren(...a.points.map(text => node("li", text)));
  $("#arch-link").href = "source.zip";
  $("#arch-link").textContent = "下载源码查看 "+a.path.split("/").pop()+" ↓";
  $("#arch-link").removeAttribute("target");
  $("#arch-link").setAttribute("download", "");
  $$(".arch-node").forEach(button => {
    const active = button.dataset.node === key;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}
async function init() {
  const response = await fetch("data.json");
  if (!response.ok) throw new Error("数据加载失败");
  data = await response.json();
  data.evaluation.queries.dense.forEach(query => {
    const option = node("option", query.id+" · "+query.query);
    option.value = query.id;
    $("#query-select").append(option);
  });
  $("#query-select").value = state.query;
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
  Object.entries(data.evaluation.summary).forEach(([key, metrics])=>{
    const row=node("tr");
    row.append(node("td",names[key]));
    ["recall@5","mrr@5","ndcg@5","unique_cases"].forEach(metric=>row.append(node("td",metrics[metric].toFixed(metric==="unique_cases"?2:3))));
    $("#metrics-table").append(row);
  });
  renderDemo();renderQuery();
}
$$(".arch-node").forEach(button=>button.onclick=()=>renderArchitecture(button.dataset.node));
renderArchitecture("case");
$("#copy-command").onclick=async()=>{
  const button=$("#copy-command");
  try {
    await navigator.clipboard.writeText($("#quickstart").textContent);
    button.textContent="已复制 ✓";
    setTimeout(()=>button.textContent="复制 ↗",1800);
  } catch {
    const selection=window.getSelection(), range=document.createRange();
    range.selectNodeContents($("#quickstart"));selection.removeAllRanges();selection.addRange(range);
    button.textContent="已选中，请复制";
  }
};
init().catch(error=>{
  $("#demo-content").textContent="运行记录暂时无法加载，请刷新页面。";
  $("#query-results").textContent="实验数据暂时无法加载。";
  console.error(error);
});

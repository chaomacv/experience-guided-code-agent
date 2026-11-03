/* Architecture and implementation guide; runs independently of evidence replay. */
(() => {
  "use strict";
  const one = selector => document.querySelector(selector);
  const all = selector => [...document.querySelectorAll(selector)];
  const sourceBase = "https://github.com/chaomacv/algorithm-upgrade-rag-agent-demo-zh/blob/main/";
  const element = (tag, text, className) => {
    const item = document.createElement(tag);
    item.textContent = text;
    if (className) item.className = className;
    return item;
  };
  const tr = (key, values) => window.siteI18n.t(key, values);
  let guide, guides;
  const guideState = {concept:"orchestration", step:"retrieval", filter:"all"};
  function selectConcept(key) {
    guideState.concept = key;
    const [title, headline, copy, points, path, implementation] = guide.concepts[key];
    one("#concept-title").textContent = title;
    one("#concept-headline").textContent = headline;
    one("#concept-copy").textContent = copy;
    one("#concept-implementation").textContent = implementation;
    one("#concept-points").replaceChildren(...points.map(point => element("li", point)));
    one("#concept-source").href = sourceBase + path;
    one("#concept-source").textContent = path + " ↗";
    all("[data-concept]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.concept === key)));
  }
  function selectStep(key) {
    guideState.step = key;
    const [title, headline, input, method, output, path, artifacts] = guide.steps[key];
    one("#step-title").textContent = title;
    one("#step-headline").textContent = headline;
    one("#step-input").textContent = input;
    one("#step-method").textContent = method;
    one("#step-output").textContent = output;
    one("#step-artifacts").replaceChildren(...artifacts.map(artifact => element("li", artifact)));
    one("#step-source").href = sourceBase + path;
    one("#step-source").textContent = path + " ↗";
    all("[data-step]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.step === key)));
  }
  function filterModules(filter) {
    guideState.filter = filter;
    one("#module-mapping").replaceChildren();
    guide.modules.filter(row => filter === "all" || row[3] === filter).forEach(([name, role, implementation, status, boundary, path]) => {
      const row = document.createElement("tr");
      const label = element("th", name);
      label.scope = "row";
      const code = document.createElement("td");
      const link = element("a", implementation + " ↗");
      link.href = sourceBase + path;
      link.target = "_blank";
      link.rel = "noopener";
      code.append(link);
      const judgement = document.createElement("td");
      judgement.append(element("span", tr(status), "implementation-status " + (status === "已实现" ? "complete" : "partial")));
      row.append(label, element("td", role), code, judgement, element("td", boundary));
      one("#module-mapping").append(row);
    });
    all("[data-filter]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.filter === filter)));
  }

  const runState = { track: "offline", os: "posix" };
  function renderCommands() {
    const windows = runState.os === "windows";
    const setup = [
      "git clone https://github.com/chaomacv/algorithm-upgrade-rag-agent-demo-zh.git",
      "cd algorithm-upgrade-rag-agent-demo-zh",
      windows ? "py -3.10 -m venv .venv" : "python3 -m venv .venv",
      windows ? ".\\.venv\\Scripts\\Activate.ps1" : "source .venv/bin/activate"
    ];
    if (runState.track === "offline") {
      setup.push(
        "python -m pip install -r requirements-core.txt pytest",
        "python scripts/offline_demo.py outputs/my-first-run",
        "python scripts/offline_demo.py outputs/my-rollback-run --scenario rollback",
        "python -m pytest -q"
      );
      one("#terminal-label").textContent = tr("离线机制演示 / Python 3.10+ / 无需 API Key");
      one("#track-description").textContent = tr("先验证机制：预设 Planner + Mock embedding。两轮动作由脚本预定；实际文件修改、独立验证、重试控制与恢复校验均会执行。每次请使用新的输出目录。");
      one("#track-note").textContent = tr("查看 outputs/my-first-run/report.html 与 outputs/my-rollback-run/report.html。这条路线不评估 LLM 智能或语义检索质量。");
    } else {
      setup.push(
        "python -m pip install -r requirements.txt",
        windows ? '$env:DEEPSEEK_API_KEY="你的密钥"' : 'export DEEPSEEK_API_KEY="你的密钥"',
        "python -m algo_rag_demo.cli --config configs/deepseek_bge_m3.json run --case-dir examples/custom_data/cases --task-file examples/custom_data/task.txt --repository-facts examples/custom_data/repository_facts.txt --retrieval-mode hybrid --max-per-case 1"
      );
      one("#terminal-label").textContent = tr("真实模型路线 / DeepSeek + BGE-M3");
      one("#track-description").textContent = tr("接入真实模型：LLMPlanner 实际调用 DeepSeek，BGE-M3 计算向量并参与混合检索。首次使用需要下载模型，API 请求按服务用量计费；不会保证固定两轮或必然成功。");
      one("#track-note").textContent = tr("默认配置使用 deepseek-flash。可替换 OpenAI-compatible Provider；输出路径由 CLI 打印，查看其中的 final_report.json 和 report.html。");
    }
    one("#quickstart").textContent = setup.join("\n").replaceAll("你的密钥", tr("你的密钥"));
    all("[data-track]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.track === runState.track)));
    all("[data-os]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.os === runState.os)));
    one("#copy-command").textContent = tr("复制 ↗");
  }
  all("[data-track]").forEach(button => button.addEventListener("click", () => { runState.track = button.dataset.track; renderCommands(); }));
  all("[data-os]").forEach(button => button.addEventListener("click", () => { runState.os = button.dataset.os; renderCommands(); }));
  renderCommands();
  document.addEventListener("site-language-change", () => {
    renderCommands();
    if (!guides) return;
    guide = guides[window.siteI18n.language];
    selectConcept(guideState.concept); selectStep(guideState.step); filterModules(guideState.filter);
  });
  Promise.all(["guide-data.json", "locales/guide.en.json"].map(path => fetch(path).then(response => {
    if (!response.ok) throw new Error("Guide data could not be loaded");
    return response.json();
  }))).then(([zh, en]) => {
    guides = {zh, en};
    guide = guides[window.siteI18n.language];
    all("[data-concept]").forEach(button => button.addEventListener("click", () => selectConcept(button.dataset.concept)));
    all("[data-step]").forEach(button => button.addEventListener("click", () => selectStep(button.dataset.step)));
    all("[data-filter]").forEach(button => button.addEventListener("click", () => filterModules(button.dataset.filter)));
    selectConcept("orchestration");
    selectStep("retrieval");
    filterModules("all");
  }).catch(error => {
    one("#concept-copy").textContent = tr("架构详情加载失败，请刷新或从 GitHub 查看源码。");
    one("#step-method").textContent = tr("实现详情加载失败，请刷新页面。");
    console.error(error);
  });
})();

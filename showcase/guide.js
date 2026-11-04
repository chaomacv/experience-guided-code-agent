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

  const runState = { track: "live", os: "posix" };
  function renderCommands() {
    const windows = runState.os === "windows";
    const setup = [
      "git clone https://github.com/chaomacv/algorithm-upgrade-rag-agent-demo-zh.git",
      "cd algorithm-upgrade-rag-agent-demo-zh",
      windows ? "py -3.10 -m venv .venv" : "python3 -m venv .venv",
      windows ? ".\\.venv\\Scripts\\Activate.ps1" : "source .venv/bin/activate"
    ];
    if (runState.track === "tests") {
      setup.push(
        'python -m pip install -r requirements-core.txt "scikit-learn>=1.4,<1.8"',
        "python -m pytest -q"
      );
      one("#terminal-label").textContent = tr("框架回归检查 / 无需 API Key");
      one("#track-description").textContent = tr("运行机制回归测试，不调用模型 API；受控响应只用于测试分支，不作为真实模型能力证据。");
      one("#track-note").textContent = tr("真实 API 实战记录在上方；回归测试覆盖成功、失败、重试、耗尽恢复与验收文件保护。");
    } else {
      setup.push(
        "python -m pip install -r requirements-practice.txt",
        windows ? '$env:DEEPSEEK_API_KEY="你的密钥"' : 'export DEEPSEEK_API_KEY="你的密钥"',
        "python scripts/run_practice.py"
      );
      one("#terminal-label").textContent = tr("真实实战 / DeepSeek + BGE-M3");
      one("#track-description").textContent = tr("运行真实数据准备、知识抽取、检索、模型规划、代码修改和独立验收；首次需下载 BGE-M3 并配置 API Key。");
      one("#track-note").textContent = tr("查看 CLI 打印的运行目录：report.html、每轮模型响应、delivery/changes.patch。成功轮数由实际验收决定。");
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

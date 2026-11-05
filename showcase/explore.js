/* Curated extension paths, separate from the implementation and evidence data. */
(() => {
  "use strict";
  const root = document.querySelector("#agent-capabilities");
  if (!root) return;
  const $ = selector => root.querySelector(selector);
  const tr = (key, values) => window.siteI18n.t(key, values);
  const text = value => typeof value === "string" ? value : value[window.siteI18n.language] || value.zh;
  const make = (tag, content, className) => {
    const node = document.createElement(tag);
    if (content) node.textContent = content;
    if (className) node.className = className;
    return node;
  };
  const sourceBase = "https://github.com/chaomacv/experience-guided-code-agent/blob/main/";
  let modules = [], selected = null, returningTo = "llm", failed = false;
  const dataUrl = new URL("explore-data.json", document.baseURI);
  dataUrl.search = new URL(document.currentScript.src).search;
  const loading = fetch(dataUrl).then(response => {
    if (!response.ok) throw new Error("Exploration resources unavailable");
    return response.json();
  }).then(data => {
    if (!Array.isArray(data.modules) || data.modules.length !== 12) throw new Error("Invalid resource catalog");
    modules = data.modules;
  }).catch(error => { failed = true; console.error(error); });

  function link(label, url) {
    const node = make("a", label + " ↗");
    node.href = url;
    node.target = "_blank";
    node.rel = "noopener noreferrer";
    return node;
  }
  function render() {
    const exploring = selected !== null;
    $("#mapping-overview").hidden = exploring;
    $(".mapping-filters").hidden = exploring;
    $("#module-explorer-panel").hidden = !exploring;
    root.querySelectorAll("[data-explore-view]").forEach(button => {
      button.setAttribute("aria-pressed", String((button.dataset.exploreView === "resources") === exploring));
    });
    if (!exploring) return;
    const navigation = $(".explore-module-nav");
    const body = $(".explore-content");
    navigation.replaceChildren();
    body.replaceChildren();
    if (!modules.length) {
      body.append(make("p", tr(failed ? "扩展资源暂时无法加载，请刷新重试。" : "正在加载扩展资源…")));
      return;
    }
    modules.forEach((module,index) => {
      const button = make("button", null, "explore-module-button");
      button.type = "button";
      button.dataset.exploreModule = module.id;
      button.setAttribute("aria-pressed", String(module.id === selected));
      button.setAttribute("aria-controls", "explore-content");
      button.append(make("span", String(index+1).padStart(2,"0")), make("strong", module.name), make("span", "↗"));
      navigation.append(button);
    });
    const module = modules.find(item => item.id === selected) || modules[0];
    const header = make("header", null, "explore-heading");
    header.append(make("span", "EXPLORE / " + module.name.toUpperCase(), "explore-eyebrow"));
    const title = make("h4", module.name);
    title.id = "explore-module-title";
    title.tabIndex = -1;
    header.append(title, make("p", text(module.intro)));
    body.append(header);
    const start = make("div", null, "explore-start");
    start.append(make("strong", tr("从本项目开始")), make("p", text(module.start)));
    const entryLinks = make("div", null, "explore-entry-links");
    entryLinks.append(link(tr("查看实现") + " · " + module.source.split("/").pop(),sourceBase+module.source), link(tr("接入指南"),sourceBase+module.guide));
    start.append(entryLinks);
    body.append(start);
    module.groups.forEach((group,index) => {
      const section = make("section", null, "explore-resource-section");
      const heading = make("div", null, "explore-group-heading");
      heading.append(make("h5", text(group.title)), make("span", tr("{n} 个资源", {n:group.items.length})));
      section.append(heading);
      if (module.id === "llm" && index === 1) section.append(make("p", tr("先选择模型，再选择部署工具；具体权重、显存与许可证见项目说明。"), "explore-group-note"));
      const grid = make("div", null, "explore-resource-grid" + (module.id === "llm" && index === 0 ? " api-grid" : ""));
      group.items.forEach(item => {
        const card = make("article", null, "explore-resource-card");
        card.append(make("span", tr(item.tag), "explore-resource-tag"), make("h6", window.siteI18n.language === "en" ? item.name_en || item.name : item.name), make("p", text(item.description)));
        const links = make("div", null, "explore-resource-links");
        item.links.forEach(resource => links.append(link(tr(resource.label),resource.url)));
        card.append(links);
        grid.append(card);
      });
      section.append(grid);
      body.append(section);
    });
    body.append(make("p",tr("这里是可选的扩展参考，未列为本项目已集成的依赖。先替换一个模块，用同一组任务验证效果。"),"explore-footnote"));
    $("#explore-status").textContent = tr("已显示 {module} 的扩展资源。", {module:module.name});
  }
  function scrollToPanel() {
    root.scrollIntoView({block:"start",behavior:matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"});
  }
  async function open(moduleId, {scroll = true, focus = false, historyEntry = true} = {}) {
    selected = moduleId;
    returningTo = moduleId;
    render();
    if (historyEntry) history.pushState(null,"", "#explore-" + moduleId);
    if (scroll) scrollToPanel();
    await loading;
    if (selected !== moduleId) return;
    render();
    if (focus) $("#explore-module-title")?.focus({preventScroll:true});
  }
  function overview({scroll = true, focus = false, historyEntry = true} = {}) {
    selected = null;
    render();
    if (historyEntry) history.pushState(null,"", "#agent-capabilities");
    if (scroll) scrollToPanel();
    if (focus) root.querySelector(`#module-mapping [data-explore-module="${returningTo}"]`)?.focus({preventScroll:true});
  }
  root.addEventListener("click",event => {
    const moduleButton = event.target.closest("[data-explore-module]");
    if (moduleButton) {
      open(moduleButton.dataset.exploreModule,{focus:moduleButton.closest("#mapping-overview") !== null});
      return;
    }
    const viewButton = event.target.closest("[data-explore-view]");
    if (viewButton?.dataset.exploreView === "resources") open(returningTo);
    else if (viewButton || event.target.closest("[data-explore-back]")) overview({focus:true});
  });
  function restoreFromHash(scroll = true) {
    const id = location.hash.match(/^#explore-([a-z-]+)$/)?.[1];
    if (id && ["llm","prompt","rag","planning","memory","tool-use","execution","observation","reflection","orchestration","evaluation","guardrails"].includes(id)) open(id,{scroll,historyEntry:false});
    else overview({scroll:false,historyEntry:false});
  }
  window.addEventListener("popstate",() => restoreFromHash());
  window.addEventListener("hashchange",() => {
    if (location.hash.startsWith("#explore-") || location.hash === "#agent-capabilities") restoreFromHash();
  });
  document.addEventListener("site-language-change",render);
  if (location.hash.startsWith("#explore-")) loading.then(() => restoreFromHash());
  else render();
})();

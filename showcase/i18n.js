/* Buildless, client-side UI localization. Source evidence is never rewritten. */
(() => {
  "use strict";
  let language = "zh";
  let messages = {};
  let preferred = "zh";
  try { preferred = localStorage.getItem("rag-agent-language") === "en" ? "en" : "zh"; } catch { /* Storage can be disabled. */ }
  const button = document.querySelector("#language-toggle");
  function t(key, variables = {}) {
    const value = language === "en" && typeof messages[key] === "string" ? messages[key] : key;
    return value.replace(/\{(\w+)\}/g, (match, name) => Object.hasOwn(variables, name) ? String(variables[name]) : match);
  }
  function apply() {
    document.documentElement.lang = language === "en" ? "en" : "zh-CN";
    document.querySelectorAll("[data-i18n]").forEach(item => { item.textContent = t(item.dataset.i18n); });
    ["aria-label", "content", "title"].forEach(attribute => {
      document.querySelectorAll("[data-i18n-" + attribute + "]").forEach(item => {
        item.setAttribute(attribute, t(item.getAttribute("data-i18n-" + attribute)));
      });
    });
    button.textContent = language === "en" ? "中文" : "EN";
    button.lang = language === "en" ? "zh-CN" : "en";
    button.title = language === "en" ? "切换到中文" : "Switch to English";
    button.setAttribute("aria-label", button.title);
  }
  function setLanguage(value) {
    language = value === "en" ? "en" : "zh";
    try { localStorage.setItem("rag-agent-language", language); } catch { /* The toggle still works without storage. */ }
    apply();
    document.dispatchEvent(new CustomEvent("site-language-change", {detail: {language}}));
  }
  window.siteI18n = {
    t,
    get language() { return language; },
    caseSummary(id) { return messages._caseSummaries?.[id] || id; },
  };
  const localeUrl = new URL("locales/en.json", document.baseURI);
  const localeVersion = document.currentScript?.src
    ? new URL(document.currentScript.src).searchParams.get("v") : null;
  if (localeVersion) localeUrl.searchParams.set("v", localeVersion);
  fetch(localeUrl).then(response => {
    if (!response.ok) throw new Error("English locale unavailable");
    return response.json();
  }).then(value => {
    messages = value;
    setLanguage(preferred);
    button.disabled = false;
    button.addEventListener("click", () => setLanguage(language === "zh" ? "en" : "zh"));
  }).catch(error => {
    button.textContent = "EN";
    button.title = "English could not be loaded. Refresh to try again.";
    console.error(error);
  });
})();

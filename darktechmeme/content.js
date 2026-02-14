(() => {
  const ensureThemeRoot = () => {
    if (document.documentElement) {
      document.documentElement.classList.add("dtm-dark");
    }
    if (document.body) {
      document.body.classList.add("dtm-dark");
    }
  };

  const ensureFallbackStyles = () => {
    if (document.getElementById("dtm-inline-fallback")) {
      return;
    }
    const style = document.createElement("style");
    style.id = "dtm-inline-fallback";
    style.textContent = `
      html.dtm-dark, html.dtm-dark body {
        background-color: #0b0f14 !important;
        color: #d6dde6 !important;
        color-scheme: dark !important;
      }
      html.dtm-dark body a { color: #e4e7eb !important; }
      html.dtm-dark body a:visited { color: #cfd4da !important; }
    `;
    (document.head || document.documentElement).appendChild(style);
  };

  const ensureTheme = () => {
    ensureThemeRoot();
    ensureFallbackStyles();
  };

  ensureTheme();

  const positiveWords = [
    "accelerate",
    "advance",
    "approved",
    "breakthrough",
    "boost",
    "growth",
    "improve",
    "innovation",
    "launch",
    "partnership",
    "profit",
    "record",
    "recover",
    "rise",
    "strong",
    "surge",
    "win",
  ];

  const strongPositiveWords = [
    "breakthrough",
    "record",
    "surge",
  ];

  const negativeWords = [
    "antitrust",
    "breach",
    "crash",
    "cut",
    "decline",
    "drop",
    "fail",
    "fraud",
    "hack",
    "illegal",
    "layoff",
    "loss",
    "miss",
    "outage",
    "probe",
    "damage",
    "recall",
    "risk",
    "scam",
    "slump",
    "confront",
    "backlash",
    "sue",
  ];

  const strongNegativeWords = [
    "breach",
    "fraud",
    "hack",
    "illegal",
    "loss",
    "scam",
  ];

  const headlineSelector = "a.ourh, .L1 a, .L2 a, .L5 a, a.item";
  const feedCardSelector = ".item, .ii, .itc1, .itc2, .itc3";
  const mobileTabLabels = new Set(["top", "more", "new", "events"]);
  const mobileTabElementSelector = "a, button, td, th, div, span";
  const sentimentClasses = [
    "dtm-sentiment-strong-negative",
    "dtm-sentiment-negative",
    "dtm-sentiment-neutral",
    "dtm-sentiment-positive",
    "dtm-sentiment-strong-positive",
  ];
  const mediagazerText = "see also mediagazer";
  const sponsorTextMarkers = ["sponsor post", "sponsored"];
  const sponsorContainerSelector = `${feedCardSelector}, tr, td, table`;
  const activeClassPattern = /\b(sel|selected|active|current|on)\b/i;
  const enableMobileTabRuntimeStyling = false;

  const normalizedText = (element) => {
    if (!element || !element.textContent) {
      return "";
    }
    return element.textContent.replace(/\s+/g, " ").trim().toLowerCase();
  };

  const parseRGB = (value) => {
    const match = value && value.match(/rgba?\(([^)]+)\)/i);
    if (!match) {
      return null;
    }
    const parts = match[1].split(",").map((part) => Number.parseFloat(part.trim()));
    if (parts.length < 3) {
      return null;
    }
    const alpha = parts.length >= 4 ? parts[3] : 1;
    return { r: parts[0], g: parts[1], b: parts[2], a: Number.isNaN(alpha) ? 1 : alpha };
  };

  const clearLegacyTabClasses = () => {
    const tabRows = document.querySelectorAll(".dtm-tab-row");
    for (const row of tabRows) {
      row.classList.remove("dtm-tab-row");
    }

    const tabs = document.querySelectorAll(".dtm-nav-tab, .dtm-nav-tab-active");
    for (const tab of tabs) {
      tab.classList.remove("dtm-nav-tab", "dtm-nav-tab-active");
      if (tab instanceof HTMLElement && tab.dataset.dtmTabBound) {
        delete tab.dataset.dtmTabBound;
      }
    }
  };

  const scoreHeadline = (text) => {
    const words = text.toLowerCase().match(/[a-z']+/g);
    if (!words) {
      return 0;
    }

    const matchesRoot = (word, roots) => {
      for (const root of roots) {
        if (word.startsWith(root)) {
          return true;
        }
      }
      return false;
    };

    let score = 0;
    for (const word of words) {
      if (matchesRoot(word, positiveWords)) {
        score += 1;
      }
      if (matchesRoot(word, negativeWords)) {
        score -= 1;
      }
      if (matchesRoot(word, strongPositiveWords)) {
        score += 1;
      }
      if (matchesRoot(word, strongNegativeWords)) {
        score -= 1;
      }
    }
    return score;
  };

  const bucketForScore = (score) => {
    if (score <= -2) {
      return sentimentClasses[0];
    }
    if (score === -1) {
      return sentimentClasses[1];
    }
    if (score === 0) {
      return sentimentClasses[2];
    }
    if (score === 1) {
      return sentimentClasses[3];
    }
    return sentimentClasses[4];
  };

  const applySentiment = (anchor) => {
    if (anchor.classList.contains("dtm-sentiment")) {
      return;
    }

    let text = "";

    if (anchor.classList.contains("item")) {
      if (anchor.closest("li.sp_post") || anchor.querySelector(".sp_post_label")) {
        return;
      }

      const title = anchor.querySelector(".title");
      text = title && title.textContent ? title.textContent.trim() : "";
    } else {
      const parentClass = anchor.parentElement && anchor.parentElement.className
        ? String(anchor.parentElement.className)
        : "";
      const isLikelyHeadline = anchor.classList.contains("ourh") || /\bL[125]\b/.test(parentClass);
      if (!isLikelyHeadline) {
        return;
      }
      text = anchor.textContent ? anchor.textContent.trim() : "";
    }

    if (!text) {
      return;
    }

    const bucketClass = bucketForScore(scoreHeadline(text));
    anchor.classList.add("dtm-sentiment", bucketClass);
  };

  const applyMediagazerStyles = (element) => {
    if (!element || element.classList.contains("dtm-mediagazer")) {
      return;
    }

    const text = element.textContent ? element.textContent.trim().toLowerCase() : "";
    if (!text.includes(mediagazerText)) {
      return;
    }

    element.classList.add("dtm-mediagazer");
  };

  const markMediagazerFromText = (root) => {
    const targetRoot = root instanceof Document ? root.body : root;
    if (!targetRoot) {
      return;
    }

    const walker = document.createTreeWalker(
      targetRoot,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const value = node.nodeValue ? node.nodeValue.toLowerCase() : "";
          return value.includes(mediagazerText)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        },
      }
    );

    let node = walker.nextNode();
    while (node) {
      const parent = node.parentElement;
      if (parent) {
        const anchor = parent.closest ? parent.closest("a") : null;
        applyMediagazerStyles(anchor || parent);
      }
      node = walker.nextNode();
    }
  };

  const textHasSponsorMarker = (text) => {
    if (!text) {
      return false;
    }
    for (const marker of sponsorTextMarkers) {
      if (text.includes(marker)) {
        return true;
      }
    }
    return false;
  };

  const markSponsorAncestors = (element) => {
    let current = element;
    let depth = 0;
    while (current && depth < 9) {
      current.classList.add("dtm-sponsored-shell");
      if (current.matches && current.matches("tr")) {
        const cells = current.querySelectorAll("td, th");
        for (const cell of cells) {
          cell.classList.add("dtm-sponsored-shell");
        }
      }
      current = current.parentElement;
      depth += 1;
    }
  };

  const applySponsorStyles = (element) => {
    if (!element) {
      return;
    }

    const text = element.textContent ? element.textContent.trim().toLowerCase() : "";
    if (!textHasSponsorMarker(text)) {
      return;
    }

    element.classList.add("dtm-sponsored-card");
    markSponsorAncestors(element);

    const row = element.closest ? element.closest("tr") : null;
    if (row) {
      markSponsorAncestors(row);
    }
  };

  const markSponsoredFromText = (root) => {
    const targetRoot = root instanceof Document ? root.body : root;
    if (!targetRoot) {
      return;
    }

    const walker = document.createTreeWalker(
      targetRoot,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const value = node.nodeValue ? node.nodeValue.toLowerCase() : "";
          return textHasSponsorMarker(value)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        },
      }
    );

    let node = walker.nextNode();
    while (node) {
      const parent = node.parentElement;
      if (parent) {
        const container = parent.closest ? parent.closest(sponsorContainerSelector) : null;
        applySponsorStyles(container || parent);
      }
      node = walker.nextNode();
    }
  };

  const markSponsoredCards = (root) => {
    if (!root || !root.querySelectorAll) {
      return;
    }

    if (root.matches && root.matches(feedCardSelector)) {
      applySponsorStyles(root);
    }

    const cards = root.querySelectorAll(feedCardSelector);
    for (const card of cards) {
      applySponsorStyles(card);
    }

    const sponsorHints = root.querySelectorAll("[class*=\"sponsor\"], [id*=\"sponsor\"]");
    for (const hint of sponsorHints) {
      const container = hint.closest ? hint.closest(sponsorContainerSelector) : null;
      applySponsorStyles(container || hint);
    }

    markSponsoredFromText(root);
  };

  const findMobileTabContainer = () => {
    const candidates = Array.from(document.querySelectorAll(mobileTabElementSelector)).filter((element) => {
      const text = normalizedText(element);
      return mobileTabLabels.has(text);
    });

    if (candidates.length < 3) {
      return null;
    }

    const containerCache = new Map();
    let bestContainer = null;
    let bestScore = 0;

    for (const element of candidates) {
      let current = element;
      let depth = 0;
      while (current && depth < 6) {
        if (!containerCache.has(current)) {
          const labels = new Set();
          const descendants = current.querySelectorAll(mobileTabElementSelector);
          for (const descendant of descendants) {
            const text = normalizedText(descendant);
            if (mobileTabLabels.has(text)) {
              labels.add(text);
            }
          }
          containerCache.set(current, labels.size);
        }

        const score = containerCache.get(current) || 0;
        if (score > bestScore) {
          bestScore = score;
          bestContainer = current;
        }
        if (bestScore === 4) {
          break;
        }
        current = current.parentElement;
        depth += 1;
      }
      if (bestScore === 4) {
        break;
      }
    }

    return bestScore >= 3 ? bestContainer : null;
  };

  const collectMobileTabs = (container) => {
    const firstByLabel = new Map();
    const elements = container.querySelectorAll(mobileTabElementSelector);
    for (const element of elements) {
      const text = normalizedText(element);
      if (!mobileTabLabels.has(text)) {
        continue;
      }
      if (!firstByLabel.has(text)) {
        firstByLabel.set(text, element);
      }
    }
    return Array.from(firstByLabel.values());
  };

  const hasActiveSignals = (element) => {
    let current = element;
    let depth = 0;
    while (current && depth < 4) {
      const className = typeof current.className === "string" ? current.className : "";
      if (activeClassPattern.test(className)) {
        return true;
      }
      if (current.getAttribute && (
        current.getAttribute("aria-selected") === "true" ||
        current.getAttribute("aria-current") === "page"
      )) {
        return true;
      }
      current = current.parentElement;
      depth += 1;
    }
    return false;
  };

  const scoreActiveTab = (element) => {
    if (!element) {
      return -1;
    }

    let score = 0;
    if (hasActiveSignals(element)) {
      score += 12;
    }

    const styles = window.getComputedStyle(element);
    const fontWeight = Number.parseInt(styles.fontWeight, 10);
    if (!Number.isNaN(fontWeight) && fontWeight >= 600) {
      score += 2;
    }

    const rgb = parseRGB(styles.backgroundColor);
    if (rgb && rgb.a > 0.2) {
      score += 3 + ((rgb.r + rgb.g + rgb.b) / 765);
    }

    return score;
  };

  const setActiveMobileTab = (tabs, activeTab) => {
    for (const tab of tabs) {
      tab.classList.toggle("dtm-nav-tab-active", tab === activeTab);
    }
  };

  const bindMobileTabClick = (tabs, tab) => {
    if (!(tab instanceof HTMLElement)) {
      return;
    }
    if (tab.dataset.dtmTabBound === "1") {
      return;
    }
    tab.dataset.dtmTabBound = "1";
    tab.addEventListener("click", () => {
      setActiveMobileTab(tabs, tab);
    });
  };

  const styleMobileTabs = () => {
    if (!enableMobileTabRuntimeStyling) {
      return;
    }

    const container = findMobileTabContainer();
    if (!container) {
      return;
    }

    const tabs = collectMobileTabs(container);
    if (tabs.length < 3) {
      return;
    }

    container.classList.add("dtm-tab-row");
    for (const tab of tabs) {
      tab.classList.add("dtm-nav-tab");
      bindMobileTabClick(tabs, tab);
    }

    let activeTab = null;
    let activeScore = -1;
    for (const tab of tabs) {
      const score = scoreActiveTab(tab);
      if (score > activeScore) {
        activeScore = score;
        activeTab = tab;
      }
    }

    if (activeTab && activeScore > 0) {
      setActiveMobileTab(tabs, activeTab);
    }
  };

  const scan = (root) => {
    if (!root.querySelectorAll) {
      return;
    }

    const anchors = root.querySelectorAll(headlineSelector);
    for (const anchor of anchors) {
      applySentiment(anchor);
    }

    const allAnchors = root.querySelectorAll("a");
    for (const anchor of allAnchors) {
      applyMediagazerStyles(anchor);
    }

    markMediagazerFromText(root);
    markSponsoredCards(root);
    styleMobileTabs();
  };

  const start = () => {
    ensureTheme();
    clearLegacyTabClasses();
    scan(document);

    const observer = new MutationObserver((mutations) => {
      ensureTheme();
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof Element)) {
            continue;
          }

          if (node.matches && node.matches(headlineSelector)) {
            applySentiment(node);
          }

          if (node.matches && node.matches(feedCardSelector)) {
            applySponsorStyles(node);
          }

          scan(node);
        }
      }
    });

    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }

    let retries = 0;
    const interval = window.setInterval(() => {
      ensureTheme();
      styleMobileTabs();
      retries += 1;
      if (retries >= 30) {
        window.clearInterval(interval);
      }
    }, 100);

    window.addEventListener("pageshow", () => {
      ensureTheme();
      clearLegacyTabClasses();
      styleMobileTabs();
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();

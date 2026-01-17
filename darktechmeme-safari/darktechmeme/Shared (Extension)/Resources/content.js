(() => {
  if (document.documentElement) {
    document.documentElement.classList.add("dtm-dark");
  }

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

  const headlineSelector = "a.ourh, .L1 a, .L2 a, .L5 a";
  const sentimentClasses = [
    "dtm-sentiment-strong-negative",
    "dtm-sentiment-negative",
    "dtm-sentiment-neutral",
    "dtm-sentiment-positive",
    "dtm-sentiment-strong-positive",
  ];
  const mediagazerText = "see also mediagazer";

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

    const text = anchor.textContent ? anchor.textContent.trim() : "";
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
  };

  const start = () => {
    scan(document);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof Element)) {
            continue;
          }

          if (node.matches && node.matches(headlineSelector)) {
            applySentiment(node);
          }

          scan(node);
        }
      }
    });

    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();

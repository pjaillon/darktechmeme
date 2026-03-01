const ENABLED_KEY = "dtmEnabled";
const TOGGLE_MESSAGE = "dtm-set-enabled";

const ON_ICONS = {
  16: "icons/icon-16.png",
  32: "icons/icon-32.png",
  48: "icons/icon-48.png",
  128: "icons/icon-128.png",
  256: "icons/icon-256.png",
  512: "icons/icon-512.png",
};

const OFF_ICONS = {
  16: "icons-light/icon-16.png",
  32: "icons-light/icon-32.png",
  48: "icons-light/icon-48.png",
  128: "icons-light/icon-128.png",
  256: "icons-light/icon-256.png",
  512: "icons-light/icon-512.png",
};

const TECHMEME_URL_RE = /^https?:\/\/([^.]+\.)?techmeme\.com(\/|$)/i;

const isTechmemeUrl = (url) => TECHMEME_URL_RE.test(url || "");

const getTechmemeTabs = async () => {
  const tabs = await browser.tabs.query({});
  return tabs.filter((tab) => typeof tab.id === "number" && isTechmemeUrl(tab.url));
};

const getEnabled = async () => {
  const result = await browser.storage.local.get(ENABLED_KEY);
  return result[ENABLED_KEY] !== false;
};

const setEnabled = async (enabled) => {
  await browser.storage.local.set({ [ENABLED_KEY]: enabled });
};

const ensureEnabledDefault = async () => {
  const result = await browser.storage.local.get(ENABLED_KEY);
  if (!(ENABLED_KEY in result)) {
    await setEnabled(true);
  }
};

const setIconAndTitleForTab = async (tab) => {
  if (!tab || typeof tab.id !== "number") {
    return;
  }

  const enabled = await getEnabled();
  const onTechmeme = isTechmemeUrl(tab.url);
  const useOnIcons = onTechmeme && enabled;
  const title = onTechmeme
    ? (enabled ? "darktechmeme is on. Click to turn off." : "darktechmeme is off. Click to turn on.")
    : "Open techmeme.com to toggle darktechmeme.";

  await Promise.all([
    browser.action.setIcon({ tabId: tab.id, path: useOnIcons ? ON_ICONS : OFF_ICONS }),
    browser.action.setTitle({ tabId: tab.id, title }),
  ]);
};

const broadcastEnabledState = async (enabled) => {
  const tabs = await getTechmemeTabs();

  await Promise.all(
    tabs.map((tab) => browser.tabs.sendMessage(tab.id, { type: TOGGLE_MESSAGE, enabled }).catch(() => undefined))
  );
};

const refreshAllTabIcons = async () => {
  const tabs = await browser.tabs.query({});
  await Promise.all(tabs.map((tab) => setIconAndTitleForTab(tab)));
};

const toggleEnabledFromToolbarClick = async (tab) => {
  if (!tab || !isTechmemeUrl(tab.url)) {
    await setIconAndTitleForTab(tab);
    return;
  }

  const current = await getEnabled();
  const next = !current;
  await setEnabled(next);
  await browser.tabs.sendMessage(tab.id, { type: TOGGLE_MESSAGE, enabled: next }).catch(() => undefined);
  await Promise.all([refreshAllTabIcons(), broadcastEnabledState(next)]);
};

const runSafe = (fn) => (...args) => {
  fn(...args).catch((error) => {
    console.error("[darktechmeme]", error);
  });
};

browser.action.onClicked.addListener(runSafe(toggleEnabledFromToolbarClick));

browser.tabs.onActivated.addListener(
  runSafe(async ({ tabId }) => {
    const tab = await browser.tabs.get(tabId);
    await setIconAndTitleForTab(tab);
  })
);

browser.tabs.onUpdated.addListener(
  runSafe(async (tabId, changeInfo, tab) => {
    if (!changeInfo.url && changeInfo.status !== "complete") {
      return;
    }
    await setIconAndTitleForTab(tab);
  })
);

browser.runtime.onInstalled.addListener(
  runSafe(async () => {
    await ensureEnabledDefault();
    const enabled = await getEnabled();
    await Promise.all([refreshAllTabIcons(), broadcastEnabledState(enabled)]);
  })
);

browser.runtime.onStartup.addListener(
  runSafe(async () => {
    await ensureEnabledDefault();
    await refreshAllTabIcons();
  })
);

browser.storage.onChanged.addListener(
  runSafe(async (changes, areaName) => {
    if (areaName !== "local" || !changes[ENABLED_KEY]) {
      return;
    }
    const enabled = changes[ENABLED_KEY].newValue !== false;
    await Promise.all([refreshAllTabIcons(), broadcastEnabledState(enabled)]);
  })
);

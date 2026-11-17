// Right-click a selection on any page -> open it in ChaLLengErs as the job ad.
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: "challengers-send", title: "Tailor my CV to this job (ChaLLengErs)", contexts: ["selection", "page"] });
});

function b64url(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "challengers-send") return;
  let job = { title: tab && tab.title ? tab.title.slice(0, 120) : "", company: "", text: info.selectionText || "", url: tab ? tab.url : "" };
  if (!job.text && tab && tab.id) {
    try {
      const [res] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => document.body.innerText.slice(0, 12000) });
      job.text = res.result || "";
    } catch (e) { /* page not scriptable */ }
  }
  chrome.tabs.create({ url: chrome.runtime.getURL("app/index.html") + "#job=" + b64url(JSON.stringify(job)) });
});

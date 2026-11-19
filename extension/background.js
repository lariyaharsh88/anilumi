// "What anime is this?" on the right-click menu. Images open AniLumi's scene search with the image link, which
// searches it straight away; videos and pages open the search page (pick a frame from a clip there). The extension
// only opens a tab: it reads nothing on the page and collects nothing.
const PAGE = "https://anilumi.in/what-anime-is-this";
const open = (params) => chrome.tabs.create({ url: `${PAGE}?${new URLSearchParams({ ...params, utm_source: "extension" })}` });

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: "wait-image", title: "What anime is this?", contexts: ["image"] });
  chrome.contextMenus.create({ id: "wait-page", title: "Find an anime from a screenshot (AniLumi)", contexts: ["video", "page"] });
});

chrome.contextMenus.onClicked.addListener((info) => {
  // Only https images can be searched by link; data: and blob: images need a screenshot pasted on the page.
  if (info.menuItemId === "wait-image" && info.srcUrl && info.srcUrl.startsWith("https://")) open({ url: info.srcUrl });
  else open({});
});

chrome.action.onClicked.addListener(() => open({}));

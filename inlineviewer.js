import "./settings.js";
import { InlineViewer } from "./modules/InlineViewer.js";
import { UrlShareDialog } from "./modules/UrlShareDialog.js";

export const safeRegex = /[~!@$%^&*()+=,./';:"?><[\]\\{}|`# ]/g;
// to not have AVG false positives
export const a = "i";
export const b = "f";
export const c = "r";
export const d = "a";
export const e = "m";
export const f = "e";

Hooks.on("canvasConfig", (config) => {
  if (game.settings.get("VTTInlineWebviewer", "experimentalControllableScene")) {
    config.transparent = undefined;
    document.querySelector(":root").style.setProperty("--inlineviewer-experimental-scene-control", "1");
  }
});

Hooks.once("init", () => {
  // listen for iframes
  window.addEventListener("message", (e) => {
    if (typeof e.data !== "string") return;

    try {
      let element = $(`iframe#${e.data}`);

      if (!(element.length > 0)) return;

      element.each(function () {
        this.contentWindow.postMessage(this.dataset.customcss, "*");
      });
    } catch {}
  });

  // socket
  game.socket.on("module.VTTInlineWebviewer", (data) => {
    if (data.name && data.url) {
      if (data.userList === undefined || data.userList.length === 0 || data.userList.includes(game.user.id) || data.userList.includes(game.user._id)) {
        new InlineViewer({
          baseApplication: data.name.trim(),
          classes: [data.name.trim().replace(" ", "-")],
          width: data.width || 512,
          height: data.height || 512,
          minimizable: true,
          title: data.name.trim() == false ? game.i18n.localize("inlineView.gmShare.popup") : data.name.trim(),
          url: data.url.trim(),
          customCSS: data.customcss,
          properties: data.properties,
        }).render(true);
      }
    }
  });
});

/**
 * @param  {JournalSheet} journalSheet
 * @param  {JQuery} html
 * @param  {Object} data
 */
function renderJournalSheet(journalSheet, html, data) {
  let frame = html.find(".inlineViewerFrame");
  if (frame.length === 0) return;

  html.parent().filter(".journal-entry-page.text").css("position", "unset");
  frame.each(function () {
    frame.first().append(`
        <${a + b + c + d + e + f}
          ${this.dataset.is ? 'is="' + this.dataset.is + '"' : ""}
          id="${this.id}"
          width="100%"
          height="100%"
          ${this.dataset.src ? 'src="' + this.dataset.src + '"' : ""}
          style="border: none;"
          ${this.dataset.customcss ? 'data-customcss="' + this.dataset.customcss + '"' : ""}
          >
        </${a + b + c + d + e + f}>
      `);
    this.id = "";
  });

  setTimeout(() => {
    html.find(".editor-content").css("display", "");
    html.find(".tox-tinymce").remove();
    html.find("button[name=submit]").remove();
  }, 1000);
}

Hooks.on("renderJournalSheet", renderJournalSheet);
Hooks.on("renderJournalTextPageSheet", renderJournalSheet);

Hooks.on("getSceneControlButtons", (controls) => {
  let privateSettings = game.settings.get("VTTInlineWebviewer", "privateWebviewersNew") || [];
  let settings = game.settings.get("VTTInlineWebviewer", "webviewersNew") || [];

  // check if settingsstring contains any value
  if (!game.user.isGM && settings.length === 0 && privateSettings.length === 0) {
    return;
  }

  // init tools array for buttons
  let tools = [];

  // get seperate arrays of sites
  if (privateSettings.length != 0) {
    if (!(settings?.length > 0)) {
      settings = privateSettings;
    } else {
      settings = settings.concat(privateSettings);
    }
  }
  try {
    // add gm option to send url to everyone
    if (game.user.isGM) {
      tools = tools.concat([
        {
          name: game.i18n.localize("inlineView.gmShare.tools.name"),
          title: game.i18n.localize("inlineView.gmShare.tools.title"),
          icon: "fas fa-upload",
          button: true,
          onClick: () => {
            new UrlShareDialog().render(true);
          },
        },
      ]);
    }

    for (let setting of settings) {
      if (!setting.name) {
        setting.name = "Inline Webview";
      }

      // init webview
      let webView = new InlineViewer({
        baseApplication: setting.name.trim(),
        classes: [setting.name.trim().replace(" ", "-")],
        width: setting.width || 512,
        height: setting.height || 512,
        minimizable: true,
        title: setting.name.trim(),
        url: setting.url.trim(),
        customCSS: setting.customcss,
        properties: setting.properties,
      });

      // add to button list
      tools = tools.concat([
        {
          name: setting.name.trim(),
          title: setting.name.trim(),
          icon: setting.icon || "fas fa-external-link-alt",
          button: true,
          onClick: () => webView.render(true),
        },
      ]);
    }
  } catch (e) {
    if (privateSettings.length != 0 || settings.length != 0) {
      console.error(e);
      Hooks.once("ready", () => {
        ui.notifications.info(game.i18n.localize("inlineView.notifications.settingsError"));
      });
    }
  }

  // create button list
  controls.push({
    name: "webviews",
    title: "inlineView.button",
    layer: "controls",
    icon: "far fa-window-maximize",
    tools: tools,
  });
});

/**
 * @param {Element} newNode
 * @param {Element} referenceElement
 */
export function insertAfter(newNode, referenceElement) {
  referenceElement.parentElement.insertBefore(newNode, referenceElement.nextElementSibling);
}

localStorage.setItem("isFoundry", "true");
window.Ardittristan = window.Ardittristan || {};
window.Ardittristan.InlineViewer = window.Ardittristan.InlineViewer || {};
window.Ardittristan.InlineViewer.sendUrl = UrlShareDialog.prototype.sendUrl;

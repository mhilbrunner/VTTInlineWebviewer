import { a, b, c, d, e, f, safeRegex } from "../inlineviewer.js";
import { UrlShareDialog } from "./UrlShareDialog.js";

export class InlineViewer extends Application {
  constructor(src, options = {}) {
    super(src, options);
    this._exportToJournal = this._exportToJournal.bind(this);
    this.objects = new PIXI.Container();
    /** @type {Event} */
    this.eventListener;
  }
  /* -------------------------------------------- */
  /** @override */
  static get defaultOptions() {
    const options = super.defaultOptions;
    mergeObject(options, {
      template: "modules/VTTInlineWebviewer/templates/inlineViewer.html",
      editable: false,
      resizable: true,
      popOut: true,
      shareable: false,
      url: null,
    });
    return options;
  }

  /* -------------------------------------------- */
  /** @override */
  async getData(options) {
    const data = super.getData(options);
    data.siteUrl = this.options.url;
    data.safeUrl = this.options.url.match(/https?:\/\/.*?(\/|$)/)[0].replace(safeRegex, "");
    data.customCSS = encodeURIComponent(this.options.customCSS);
    data.antiAVG = `${a + b + c + d + e + f}`;
    data.antiAVGBypass = `${b + c + d + e + f}`;
    data.properties = this.options.properties;
    return data;
  }

  _exportToJournal() {
    const siteUrl = this.options.url;
    const safeUrl = this.options.url.match(/https?:\/\/.*?(\/|$)/)[0].replace(safeRegex, "");
    const customCSS = encodeURIComponent(this.options.customCSS);
    const content = `
<p style="top: 0; bottom: 0; left: 0; right: 0; position: absolute;">
  <div
    class="inlineViewerFrame"
    id="${safeUrl}"
    style="top:0;bottom:0;left:0;right:0;position:absolute;"
    data-src="${siteUrl}">
  </div>
</p>
`;
    JournalEntry.create(
      {
        name: safeUrl,
        content,
      },
      {
        renderSheet: true,
      }
    );
  }

  /* -------------------------------------------- */
}

Hooks.on("getApplicationHeaderButtons", function (viewer, buttons) {
  if (viewer.constructor.name !== "InlineViewer") return;
  const close = buttons.find((b) => b.class === "close");
  close.onclick = function () {
    if (game.settings.get("VTTInlineWebviewer", "confirmExit")) {
      Dialog.confirm({
        title: game.i18n.localize("inlineView.confirmExit.title"),
        content: `<p>${game.i18n.localize("inlineView.confirmExit.content")}</p>`,
        yes: () => {
          viewer.close();
        },
        defaultYes: false,
      });
    } else {
      viewer.close();
    }
  };
  buttons.unshift(
    ...[
      ...(() => {
        if (game.user.isGM) {
          return [
            {
              label: game.i18n.localize("inlineView.headers.share"),
              class: "share",
              icon: "fas fa-share-square",
              onclick: () => {
                new UrlShareDialog({
                  url: viewer.options.url,
                  w: viewer.options.width,
                  h: viewer.options.height,
                  customCSS: viewer.options.customCSS,
                  properties: viewer.options.properties,
                  name: viewer.options.title,
                }).render(true);
              },
            },
            /*
            {
              label: game.i18n.localize("inlineView.headers.export"),
              class: "export",
              icon: "fas fa-book",
              onclick: () => {
                Dialog.confirm({
                  title: game.i18n.localize("inlineView.confirmExport.title"),
                  content: `<p>${game.i18n.localize("inlineView.confirmExport.content")}</p>`,
                  yes: () => {
                    viewer._exportToJournal();
                  },
                });
              },
            },*/
          ];
        }
        return [];
      })(),
    ]
  );
  return buttons;
});

Hooks.on("renderInlineViewer", (inlineViewer) => {
  // Set background color of site window.
  /** @type {HTMLElement} */
  let element = inlineViewer.element[0];
  for (let elem of element.children) {
    if (elem.classList.contains("window-content")) {
      elem.classList.add("inline-viewer");
    }
  }
  jQuery(".inline-viewer").css("background-color", game.settings.get("VTTInlineWebviewer", "webviewColor"));
});

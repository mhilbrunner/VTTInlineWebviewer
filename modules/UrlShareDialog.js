import { HelpPopup } from "./HelpPopup.js";
import { InlineViewer } from "./InlineViewer.js";

export class UrlShareDialog extends FormApplication {
  constructor(options) {
    super({}, options);
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      template: "modules/VTTInlineWebviewer/templates/urlShareDialog.html",
      baseApplication: "UrlShareDialog",
      classes: ["webviewer-dialog"],
      minimizable: false,
      title: game.i18n.localize("inlineView.urlShare.title"),
      editable: true,
      resizable: true,
      popOut: true,
      shareable: false,
      url: "",
      w: 512,
      h: 512,
      name: undefined,
      customCSS: "",
    });
  }

  async getData(options) {
    const data = super.getData(options);

    data.users = game.users.filter((user) => user.active);
    data.url = this.options.url;
    data.name = this.options.name;
    data.width = this.options.w;
    data.height = this.options.h;
    data.customcss = this.options.customCSS;
    data.properties = this.options.properties;

    return data;
  }

  /** @param {JQuery} html */
  activateListeners(html) {
    super.activateListeners(html);

    // close button
    html.find("button[type=button]").on("click", () => {
      this.close();
    });
  }

  /**
   * @param {Event} event
   * @param {Object} formData
   */
  async _updateObject(event, formData) {
    let userList = [];
    Object.keys(formData).forEach((key) => {
      if (formData[key] === true && key.includes("shareCheckbox")) {
        userList.push(key.replace("shareCheckbox", ""));
      }
    });

    this.close();

    this.sendUrl(
      formData.shareUrl,
      formData.shareWidth,
      formData.shareHeight,
      formData.shareName,
      formData.shareCustomCSS,
      userList,
      formData.shareProperties
    );
  }

  /**
   * @param {String} url
   * @param {Number} w
   * @param {Number} h
   * @param {String} name
   * @param {String} customCSS
   * @param {String[]} userList
   * @param {String} properties
   */
  sendUrl(url, w = 512, h = 512, name, customCSS, userList, properties) {
    game.socket.emit("module.VTTInlineWebviewer", {
      name: name,
      url: url,
      width: w,
      height: h,
      customcss: customCSS,
      userList: userList,
    });
    if (userList === undefined || userList.length === 0 || userList.includes(game.user.id) || userList.includes(game.user._id)) {
      new InlineViewer({
        baseApplication: name.trim(),
        classes: [name.trim().replace(" ", "-")],
        width: w || 512,
        height: h || 512,
        minimizable: true,
        title: name.trim() == false ? game.i18n.localize("inlineView.gmShare.popup") : name.trim(),
        url: url.trim(),
        customCSS: customCSS,
        properties: properties,
      }).render(true);
    }
  }

  _getHeaderButtons() {
    return [
      ...[
        {
          label: game.i18n.localize("inlineView.help.title"),
          class: "help",
          icon: "far fa-question-circle",
          onclick: (ev) => {
            new HelpPopup().render(true);
          },
        },
      ],
      ...super._getHeaderButtons(),
    ];
  }
}

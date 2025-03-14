import { HelpPopup } from "./HelpPopup.js";
import { InlineViewer } from "./InlineViewer.js";

/** @type {Handlebars.Template} */
let settingsEntry;
/** @type {Handlebars.Template} */
let inlineViewerTemplate;
let changedAlpha = false;

Hooks.once("init", async () => {
  settingsEntry = await getTemplate("modules/VTTInlineWebviewer/templates/partials/sceneSettingsEntry.html");
  inlineViewerTemplate = await getTemplate("modules/VTTInlineWebviewer/templates/inlineViewer.html");
});

export class SceneViewerSettingsApplication extends FormApplication {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "inline-viewer-scene-settings",
      classes: ["sheet"],
      template: "modules/VTTInlineWebviewer/templates/sceneSettingsPopup.html",
      resizable: true,
      minimizable: false,
      title: game.i18n.localize("inlineView.settings.title"),
    });
  }

  async getData(options) {
    const data = super.getData(options);
    const settings = game.settings.get("VTTInlineWebviewer", "sceneViewers");
    data.entries = Object.keys(settings || {}).map((k) => settings[k]);
    data.entries.forEach((e) => {
      e.name = game.scenes.get(e.id)?.name || "";
    });

    return data;
  }

  /**
   * @param {JQuery} html
   */
  activateListeners(html) {
    super.activateListeners(html);

    // Submit button
    html.find("button[type=submit]").on("click", () => {
      let valid = true;
      let values = []; // List of different values
      html.find("input:text[id$=ID]").each(function () {
        if (values.indexOf(this.value) >= 0) {
          // If this value is already in the list, marks
          html.find(this).css("border-color", "red");
          valid = false;
        } else {
          html.find(this).css("border-color", ""); // Clears since last check
          values.push(this.value); // Insert new value in the list
        }
      });
      if (!valid) ui.notifications.warn(game.i18n.localize("inlineView.settings.duplicate"));
      return valid;
    });

    // Auto update scene name

    html.find("input:text[id$=ID]").on("input", function () {
      jQuery(this)
        .parent()
        .find("input:text[data-name]")
        .val(game.scenes.get(this.value)?.name || "");
    });

    // Cancel button
    html.find("button#cancelButton").on("click", () => {
      this.close();
    });

    // Add entry button logic
    html.find("button#addButton").on("click", () => {
      this.addEntry(html);
    });

    // New scene button
    html.find("button#createSceneButton").on("click", async () => {
      let scene = await Scene.createDialog();
      if (scene) {
        Hooks.once("renderSceneConfig", (s) => s.close({ force: true }));
        html.find("#newEntry-ID").val(scene.id);
      }
    });

    html.find("button.deleteButton").on("click", function () {
      this.closest(".settingsEntry").remove();
    });

    html.find("#newEntry input").on("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();

        html.find("#newEntry #addButton").trigger("click");
      }
    });
  }

  /**
   * @param {JQuery} html
   */
  addEntry(html) {
    /** @type {String} */
    let id = html.find("#newEntry-ID")[0]?.value;
    /** @type {String} */
    let url = html.find("#newEntry-Url")[0]?.value;
    /** @type {String} */
    let customCSS = html.find("#newEntry-CustomCSS")[0]?.value;
    /** @type {String} */
    let properties = html.find("#newEntry-Properties")[0]?.value;
    let name = game.scenes.get(id)?.name || "";
    if (!this._validateEntry(id, url, html)) return;

    // make html from input
    /** @type {String} */
    let compiledTemplate = settingsEntry({
      id,
      url,
      customCSS,
      properties,
      name,
    });

    html.find("#entryList").append(compiledTemplate);
    let addedElement = html.find(`#${id}-Entry`);

    addedElement.find("input:text[id$=ID]").on("input", function () {
      jQuery(this)
        .parent()
        .find("input:text[data-name]")
        .val(game.scenes.get(this.value)?.name || "");
    });

    // empty boxes
    html.find("#newEntry-ID")[0].value = "";
    html.find("#newEntry-Url")[0].value = "";
    html.find("#newEntry-CustomCSS")[0].value = "";
    html.find("#newEntry input:text[data-name]")[0].value = "";
  }

  /**
   * @param {String} id
   * @param {String} url
   * @param {JQuery} html
   */
  _validateEntry(id, url, html) {
    const pattern = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;

    let hasID = id?.length > 0;
    let hasUrl = url?.length > 0 && pattern.test(url);

    this._updateInputColor(hasID, html.find("#newEntry-ID")[0]);
    this._updateInputColor(hasUrl, html.find("#newEntry-Url")[0]);

    return hasID && hasUrl;
  }

  /**
   * @param {Boolean} bool
   * @param {HTMLElement} element
   */
  _updateInputColor(bool, element) {
    element.style.border = bool ? "" : "2px solid red";
  }

  /**
   * @param {Event} event
   * @param {Object} formData
   */
  async _updateObject(event, formData) {
    let settingsObj = {};

    Object.keys(formData).forEach((key) => {
      const array = key.split("-");
      const prop = array.pop().toLowerCase();
      const name = array.join("-");
      const id = formData[name + "-ID"];

      if (!settingsObj[id]) settingsObj[id] = {};

      settingsObj[id][prop] = formData[key];
    });

    game.settings.set("VTTInlineWebviewer", "sceneViewers", settingsObj);
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

Hooks.on("canvasInit", async (canvas) => {
  if (Object.keys(game.settings.get("VTTInlineWebviewer", "sceneViewers") || {}).includes(canvas?.scene?.id || "_")) {
    if (jQuery("body > #inlineViewerBoard").length === 0) jQuery('<div id="inlineViewerBoard"></div>').insertAfter(jQuery("#board"));
    if (game.settings.get("VTTInlineWebviewer", "experimentalControllableScene") && jQuery("body > #inlineViewerBoardToggle").length === 0)
      jQuery('<input type="checkbox" id="inlineViewerBoardToggle">').insertBefore(jQuery("#board"));
    if (game.settings.get("VTTInlineWebviewer", "experimentalControllableScene") && jQuery("body > #inlineViewerBoardToggleContainer").length === 0)
      jQuery(`<div id="inlineViewerBoardToggleContainer">${game.i18n.localize("Toggle scene control")}</div>`).insertBefore(jQuery("#board"));

    const settings = game.settings.get("VTTInlineWebviewer", "sceneViewers")[canvas.scene.id];
    let viewer = new InlineViewer({
      baseApplication: "InlineViewerCanvas",
      title: "",
      url: settings.url.trim(),
      customCSS: settings.customcss,
      properties: settings.properties,
    });
    let data = await viewer.getData();
    let html = inlineViewerTemplate(data);
    document.querySelector("#inlineViewerBoard").innerHTML = html;
  } else {
    if (jQuery("body > #inlineViewerBoard").length > 0) {
      jQuery("body > #inlineViewerBoard").remove();
    }
    if (jQuery("body > #inlineViewerBoardToggleContainer").length > 0) {
      jQuery("body > #inlineViewerBoardToggleContainer").remove();
    }
    if (jQuery("body > #inlineViewerBoardToggle").length > 0) {
      jQuery("body > #inlineViewerBoardToggle").remove();
    }
  }
});

Hooks.on("canvasReady", async (canvas) => {
  if (game.settings.get("VTTInlineWebviewer", "experimentalControllableScene")) {
    if (Object.keys(game.settings.get("VTTInlineWebviewer", "sceneViewers") || {}).includes(canvas?.scene?.id || "_")) {
      changedAlpha = true;
      canvas.app.renderer.backgroundAlpha = 0;
      canvas.effects.illumination.background.alpha = 0;
    } else if (jQuery("body > #inlineViewerBoard").length >= 0) {
      if (changedAlpha) {
        changedAlpha = false;
        canvas.app.renderer.backgroundAlpha = 1;
        canvas.effects.illumination.background.alpha = 1;
      }
    }
  }
});

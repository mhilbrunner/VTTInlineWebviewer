import { InlineSettingsApplication } from "./modules/InlineSettingsApplication.js";
import { PrivateInlineSettingsApplication } from "./modules/PrivateInlineSettingsApplication.js";
import { SceneViewerSettingsApplication } from "./modules/SceneViewerSettingsApplication.js";

Hooks.once("init", () => {
  game.settings.register("VTTInlineWebviewer", "webviewers", {
    scope: "world",
    config: false,
    type: String,
    restricted: true,
    default: "",
  });

  game.settings.register("VTTInlineWebviewer", "privateWebviewers", {
    scope: "client",
    config: false,
    type: String,
    default: "",
  });

  game.settings.register("VTTInlineWebviewer", "webviewersNew", {
    scope: "world",
    config: false,
    type: Array,
    restricted: true,
    default: [],
  });

  game.settings.register("VTTInlineWebviewer", "privateWebviewersNew", {
    scope: "client",
    config: false,
    type: Array,
    default: [],
  });

  game.settings.register("VTTInlineWebviewer", "confirmExit", {
    name: "inlineView.confirmExit.name",
    hint: "inlineView.confirmExit.hint",
    scope: "client",
    restricted: false,
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register("VTTInlineWebviewer", "localMigrate", {
    scope: "client",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("VTTInlineWebviewer", "worldMigrate", {
    scope: "world",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("VTTInlineWebviewer", "sceneViewers", {
    scope: "world",
    config: false,
    type: Object,
    default: {},
  });

  game.settings.register("VTTInlineWebviewer", "experimentalControllableScene", {
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    name: "Enable experimental scene control",
    hint: "If you don't want to see the grid set it's opacity to 0, background also best at color #000000",
  });

  game.settings.registerMenu("VTTInlineWebviewer", "sceneSettings", {
    name: "inlineView.menus.scene",
    label: "inlineView.menus.label",
    type: SceneViewerSettingsApplication,
    restricted: true,
  });

  game.settings.registerMenu("VTTInlineWebviewer", "worldSettings", {
    name: "inlineView.menus.global",
    label: "inlineView.menus.label",
    type: InlineSettingsApplication,
    restricted: true,
  });

  game.settings.registerMenu("VTTInlineWebviewer", "privateSettings", {
    name: "inlineView.menus.private",
    label: "inlineView.menus.label",
    type: PrivateInlineSettingsApplication,
    restricted: false,
  });

  //

  game.settings.register("VTTInlineWebviewer", "webviewColor", {
    name: "inlineView.webviewColor.name",
    hint: "inlineView.webviewColor.hint",
    restricted: false,
    default: "#383838a1",
    type: String,
    scope: "client",
    config: true,
  });
});

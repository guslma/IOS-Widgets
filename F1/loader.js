// Variables used by Scriptable.
// icon-color: orange; icon-glyph: flag-checkered;
// Loader — do not edit. Always pulls the latest F1 widget code from GitHub
// (guslma/IOS-Widgets), so both this device and anyone else using this same
// loader stay in sync automatically whenever the repo is updated.

const RAW_URL = "https://raw.githubusercontent.com/guslma/IOS-Widgets/main/F1/f1-widget.js";
const LOGO_RAW_URL = "https://raw.githubusercontent.com/guslma/IOS-Widgets/main/F1/F1-mark.png";
const LIB_FILENAME = "F1-Widget-lib.js";

async function ensureLogoAsset(fm) {
  try {
    const path = fm.joinPath(fm.documentsDirectory(), "F1-mark.png");
    if (fm.fileExists(path)) return;
    const image = await new Request(LOGO_RAW_URL).loadImage();
    fm.writeImage(path, image);
  } catch (e) {
    // Non-fatal: the widget just runs without the logo if this fails.
  }
}

async function run() {
  const fm = FileManager.iCloud();
  await ensureLogoAsset(fm);

  const libPath = fm.joinPath(fm.documentsDirectory(), LIB_FILENAME);
  try {
    const code = await new Request(RAW_URL).loadString();
    fm.writeString(libPath, code);
  } catch (e) {
    // Download failed — fall back to whatever version we already have locally, if any.
    if (!fm.fileExists(libPath)) {
      const w = new ListWidget();
      const t = w.addText("Sem conexão para atualizar o widget");
      t.textColor = Color.white();
      if (config.runsInWidget) {
        Script.setWidget(w);
      } else {
        await w.presentMedium();
      }
      Script.complete();
      return;
    }
  }

  importModule(LIB_FILENAME.replace(/\.js$/, ""));
}

await run();

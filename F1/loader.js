// Variables used by Scriptable.
// icon-color: orange; icon-glyph: flag-checkered;
// Loader — do not edit. Always pulls the latest F1 widget code from GitHub
// (guslma/IOS-Widgets), so both this device and anyone else using this same
// script stay in sync automatically whenever the repo is updated. Everything
// runs from this single file — no second script is created.

const RAW_URL = "https://raw.githubusercontent.com/guslma/IOS-Widgets/main/F1/f1-widget.js";
const LOGO_RAW_URL = "https://raw.githubusercontent.com/guslma/IOS-Widgets/main/F1/F1-mark.png";
const CACHE_FILENAME = "F1-Widget-code-cache.js";

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

// Basic sanity check to avoid running a truncated/corrupted download.
function looksComplete(code) {
  return typeof code === "string" && code.trim().endsWith("Script.complete();");
}

async function fetchLatestCode() {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const code = await new Request(RAW_URL).loadString();
      if (looksComplete(code)) return code;
    } catch (e) {
      // try again below, or fall through to cache
    }
  }
  return null;
}

async function run() {
  const fm = FileManager.iCloud();
  await ensureLogoAsset(fm);

  const cachePath = fm.joinPath(fm.documentsDirectory(), CACHE_FILENAME);
  let code = await fetchLatestCode();

  if (code) {
    try {
      fm.writeString(cachePath, code);
    } catch (e) {
      // ignore cache write failures
    }
  } else if (fm.fileExists(cachePath)) {
    code = fm.readString(cachePath);
  }

  if (!code) {
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

  eval(code);
}

await run();

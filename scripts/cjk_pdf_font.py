"""中文 PDF 字型。本機優先新細明體；GitHub Actions 改用已安裝的 Noto CJK。"""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FONT_DIR = ROOT / "scripts" / ".fonts"
FONT_FILE = FONT_DIR / "PMingLiU.ttf"
MINGLIU_TTC_CANDIDATES = [
    Path("/Applications/Microsoft Word.app/Contents/Resources/DFonts/mingliu.ttc"),
    Path("/Applications/Microsoft Word.app/Contents/Resources/OtherFonts/mingliu.ttc"),
]
NOTO_TTC_CANDIDATES = [
    Path("/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"),
    Path("/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc"),
    Path("/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc"),
]


def _face_name(font) -> str:
    name = font["name"]
    for rec in name.names:
        if rec.nameID == 1:
            try:
                return rec.toUnicode()
            except Exception:
                return ""
    return ""


def _save_preferred_face(source: Path, dest: Path) -> None:
    from fontTools.ttLib import TTCollection

    collection = TTCollection(str(source))
    chosen = collection.fonts[0]
    for font in collection.fonts:
        label = _face_name(font)
        if "HK" in label or "TC" in label or "新細明" in label:
            chosen = font
            break
    chosen.save(str(dest))


def ensure_cjk_font() -> Path:
    FONT_DIR.mkdir(parents=True, exist_ok=True)
    if FONT_FILE.exists() and FONT_FILE.stat().st_size > 1_000_000:
        return FONT_FILE

    source = next((path for path in MINGLIU_TTC_CANDIDATES if path.exists()), None)
    if source is None:
        source = next((path for path in NOTO_TTC_CANDIDATES if path.exists()), None)
    if source is None:
        raise FileNotFoundError(
            "找不到中文字型。本機請安裝 Microsoft Word（新細明體）；"
            "自動排程請先安裝 fonts-noto-cjk。"
        )
    _save_preferred_face(source, FONT_FILE)
    return FONT_FILE

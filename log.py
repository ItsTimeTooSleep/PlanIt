from __future__ import annotations

import re
from pathlib import Path


VAULT_DIR = Path("C:\\Users\\dell\\Documents\\Obsidian Vault")


FRONTMATTER_PATTERN = re.compile(
    r"^---\n(?P<fm>.*?)\n---\n",
    re.DOTALL,
)

UPDATED_LINE_PATTERN = re.compile(
    r"^(updated:\s*.+)$",
    re.MULTILINE,
)

DG_PUBLISH_PATTERN = re.compile(
    r"^dg-publish:\s*(true|false)\s*$",
    re.MULTILINE,
)


def process_file(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    match = FRONTMATTER_PATTERN.match(text)
    if not match:
        return False

    frontmatter = match.group("fm")

    if DG_PUBLISH_PATTERN.search(frontmatter):
        return False

    updated_match = UPDATED_LINE_PATTERN.search(frontmatter)
    if not updated_match:
        return False

    insert_at = updated_match.end()
    new_frontmatter = (
        frontmatter[:insert_at]
        + "\ndg-publish: true"
        + frontmatter[insert_at:]
    )

    new_text = f"---\n{new_frontmatter}\n---\n" + text[match.end():]
    path.write_text(new_text, encoding="utf-8")
    return True


def main() -> None:
    changed = 0
    skipped = 0

    for path in VAULT_DIR.rglob("*.md"):
        try:
            if process_file(path):
                changed += 1
                print(f"[UPDATED] {path}")
            else:
                skipped += 1
        except Exception as exc:
            skipped += 1
            print(f"[ERROR] {path}: {exc}")

    print(f"\nDone. Updated: {changed}, Skipped: {skipped}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""deep_read.py — resolve a local full-text markdown for one arXiv paper.

Three-state cache, keyed by arXiv id, cheapest check first:
  markdown exists       -> print its path, done (nothing to do)
  pdf exists, no md     -> convert, print markdown path
  neither               -> download pdf from arXiv, convert, print path

Usage:
    python3 deep_read.py <arxiv-id> [--cache <dir>]

<arxiv-id> is the bare id (e.g. 2602.13165) or a full abs/pdf URL.
The final stdout line is the markdown path; earlier lines are status.

Requires pymupdf for conversion (pip install pymupdf). CPU-only, ~110MB
RAM, no GPU. If pymupdf is missing and a markdown must be produced, exits
2 with an install hint — the caller should fall back to reporting the
arXiv abs link instead of failing the whole skill run.
"""

import gc
import re
import sys
import urllib.request
from pathlib import Path

UA = {"User-Agent": "arxiv-prior-art-skill (research fetch; mailto:none)"}


def parse_id(raw: str) -> str:
    m = re.search(r"(\d{4}\.\d{4,5})(v\d+)?", raw)
    if not m:
        sys.exit(f"error: cannot parse arXiv id from {raw!r}")
    return m.group(1)


def parse_args(args: list[str]) -> tuple[str, Path]:
    """Extract positional arXiv id and optional --cache dir robustly."""
    positionals: list[str] = []
    cache = Path.cwd()
    skip_next = False
    for i, a in enumerate(args):
        if skip_next:
            skip_next = False
            continue
        if a == "--cache":
            if i + 1 >= len(args):
                sys.exit("error: --cache requires a directory path")
            cache = Path(args[i + 1])
            skip_next = True
            continue
        positionals.append(a)

    if not positionals:
        sys.exit(__doc__)
    return parse_id(positionals[0]), cache


def download_pdf(paper_id: str, pdf_path: Path) -> None:
    """Download PDF to a temp file, validate, then atomically replace."""
    url = f"https://arxiv.org/pdf/{paper_id}"
    print(f"downloading {url} -> {pdf_path}")
    req = urllib.request.Request(url, headers=UA)
    tmp_path = pdf_path.with_suffix(pdf_path.suffix + ".part")
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            if r.status != 200:
                raise RuntimeError(
                    f"expected status 200, got {r.status} from {url}"
                )
            ct = r.headers.get("content-type", "").lower()
            if not ct.startswith("application/pdf"):
                raise RuntimeError(
                    f"expected content-type application/pdf, got {ct!r} from {url}"
                )
            with open(tmp_path, "wb") as f:
                f.write(r.read())
        tmp_path.replace(pdf_path)
    except Exception:
        if tmp_path.exists():
            tmp_path.unlink()
        raise


def convert(pdf_path: Path, md_path: Path) -> int:
    """PDF -> markdown + embedded figures (PyMuPDF). Returns image count."""
    import pymupdf  # imported here so the missing-dep error path is clean

    doc = pymupdf.open(pdf_path)
    stem = pdf_path.stem
    lines = [f"# {stem}\n"]
    n_images = 0
    for page_no, page in enumerate(doc, start=1):
        lines.append(f"\n<!-- page {page_no} -->\n")
        text = page.get_text().strip()
        if text:
            lines.append(text)
        for img_index, img in enumerate(page.get_images(full=True), start=1):
            pix = None
            try:
                pix = pymupdf.Pixmap(doc, img[0])
                if pix.n - pix.alpha > 3:  # CMYK -> RGB
                    rgb = pymupdf.Pixmap(pymupdf.csRGB, pix)
                    pix = None
                    pix = rgb
                if pix.width < 64 or pix.height < 64:  # skip icons/rules
                    continue
                name = f"{stem}_p{page_no}_{img_index}.png"
                pix.save(md_path.parent / name)
                lines.append(f"\n![image p{page_no}]({name})\n")
                n_images += 1
            except Exception as e:
                lines.append(f"\n<!-- image p{page_no}/{img_index} skipped: {e} -->\n")
            finally:
                if pix is not None:
                    pix = None
        # PyMuPDF holds native resources; reassignment alone may delay release.
        gc.collect()
    md_path.write_text("\n".join(lines), encoding="utf-8")
    doc.close()
    return n_images


def main() -> None:
    paper_id, cache = parse_args(sys.argv[1:])
    cache.mkdir(parents=True, exist_ok=True)

    md_path = cache / f"{paper_id}.md"
    pdf_path = cache / f"{paper_id}.pdf"

    # state 1: markdown already there — good enough, do nothing
    if md_path.exists():
        print(f"cached markdown: {md_path}")
        print(md_path)
        return

    # state 2: have the pdf but no markdown — convert only
    # state 3: neither — download first
    if not pdf_path.exists():
        download_pdf(paper_id, pdf_path)

    try:
        n = convert(pdf_path, md_path)
    except ImportError:
        sys.exit(
            "error: pymupdf not installed — run: pip install pymupdf\n"
            f"(pdf is at {pdf_path}; abs page: https://arxiv.org/abs/{paper_id})"
        )
    print(f"converted {pdf_path.name} -> {md_path.name} ({n} images)")
    print(md_path)


if __name__ == "__main__":
    main()

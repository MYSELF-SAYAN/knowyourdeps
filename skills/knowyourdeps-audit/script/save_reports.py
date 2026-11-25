#!/usr/bin/env python3
"""Persist KnowYourDeps Markdown and CSV vulnerability reports into ./output.

Checks if the output/ directory exists in the current working directory,
creates it if missing, and atomically replaces any existing report files on
every run so deliverables always stay up-to-date.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import tempfile
from pathlib import Path
from typing import Any


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Creates ./output in the current working directory if missing and "
            "replaces existing Markdown/CSV reports with updated deliverables."
        )
    )
    parser.add_argument(
        "-o",
        "--output-dir",
        default="output",
        help="Target directory relative to CWD (default: output)",
    )
    parser.add_argument(
        "-j",
        "--json",
        dest="json_file",
        help="JSON file containing md/csv report content (or pass JSON via stdin)",
    )
    parser.add_argument(
        "--md-file", help="Path to a local Markdown report file to save/replace"
    )
    parser.add_argument(
        "--csv-file", help="Path to a local CSV report file to save/replace"
    )
    parser.add_argument("--md-content", help="Inline Markdown report content")
    parser.add_argument("--csv-content", help="Inline CSV report content")
    parser.add_argument(
        "--md-name", default="vulnerability-report.md", help="Markdown filename"
    )
    parser.add_argument(
        "--csv-name", default="vulnerability-report.csv", help="CSV filename"
    )
    return parser.parse_args(argv)


def extract_text_field(value: Any) -> str | None:
    """Extract string content directly or from a ReportOutput dict."""
    if isinstance(value, str):
        return value
    if isinstance(value, dict) and isinstance(value.get("content"), str):
        return value["content"]
    return None


def read_json_payload(json_file: str | None) -> dict[str, Any] | None:
    """Load JSON payload from --json file path or non-TTY stdin."""
    raw = ""
    if json_file:
        raw = Path(json_file).expanduser().read_text(encoding="utf-8-sig")
    elif sys.stdin is not None and not sys.stdin.isatty():
        raw = sys.stdin.read()

    if not raw.strip():
        return None

    data = json.loads(raw.lstrip("\ufeff"))
    if not isinstance(data, dict):
        raise TypeError(
            "JSON payload must be an object containing Markdown and/or CSV report content."
        )
    return data


def write_replacing(target_path: Path, raw_bytes: bytes) -> dict[str, Any]:
    """Write bytes to target_path atomically, replacing any prior file cleanly."""
    existed = target_path.exists()
    fd, tmp_name = tempfile.mkstemp(
        prefix=f".{target_path.name}.",
        suffix=".tmp",
        dir=str(target_path.parent),
    )
    tmp_path = Path(tmp_name)
    try:
        with os.fdopen(fd, "wb") as handle:
            handle.write(raw_bytes)
        os.replace(tmp_path, target_path)
    except Exception:
        if tmp_path.exists():
            tmp_path.unlink(missing_ok=True)
        raise

    return {
        "path": str(target_path),
        "replaced": existed,
        "bytes": len(raw_bytes),
    }


def main(argv: list[str] | None = None) -> int:
    if hasattr(sys.stdin, "reconfigure"):
        sys.stdin.reconfigure(encoding="utf-8")
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    opts = parse_args(sys.argv[1:] if argv is None else argv)

    md_text: str | None = opts.md_content
    csv_text: str | None = opts.csv_content

    if opts.md_file:
        md_text = Path(opts.md_file).expanduser().read_text(encoding="utf-8-sig")
    if opts.csv_file:
        csv_text = Path(opts.csv_file).expanduser().read_text(encoding="utf-8")

    if md_text is None or csv_text is None:
        payload = read_json_payload(opts.json_file)
        if payload:
            if md_text is None:
                for key in ("md", "markdown", "md_content", "markdown_content"):
                    val = extract_text_field(payload.get(key))
                    if val is not None:
                        md_text = val
                        break
            if csv_text is None:
                for key in ("csv", "csv_content"):
                    val = extract_text_field(payload.get(key))
                    if val is not None:
                        csv_text = val
                        break

    if md_text is None and csv_text is None:
        raise ValueError(
            "No report content provided. Pass JSON via stdin/--json or use --md-content/--csv-content."
        )

    target_dir = (Path.cwd() / opts.output_dir).resolve()
    created_output_dir = not target_dir.exists()
    target_dir.mkdir(parents=True, exist_ok=True)

    written: list[dict[str, Any]] = []
    if md_text is not None:
        written.append(
            write_replacing(target_dir / opts.md_name, md_text.encode("utf-8"))
        )
    if csv_text is not None:
        # Ensure exactly one UTF-8 BOM prefix so Excel opens columns and symbols cleanly
        normalized_csv = "\ufeff" + csv_text.lstrip("\ufeff")
        written.append(
            write_replacing(target_dir / opts.csv_name, normalized_csv.encode("utf-8"))
        )

    print(
        json.dumps(
            {
                "output_dir": str(target_dir),
                "created_output_dir": created_output_dir,
                "files": written,
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Error saving KnowYourDeps reports: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc

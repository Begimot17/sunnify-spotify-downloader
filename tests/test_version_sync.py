"""Every place that spells out the release version must agree.

A release bumps the number in many files by hand; one missed file ships a
build that reports (or updates against) the wrong version.
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def _read(rel: str) -> str:
    return (ROOT / rel).read_text(encoding="utf-8")


def _first(pattern: str, rel: str) -> str:
    match = re.search(pattern, _read(rel), re.MULTILINE)
    assert match, f"no version found in {rel} with {pattern!r}"
    return match.group(1)


def test_version_is_consistent_across_files():
    canonical = _read("version.txt").strip()
    assert re.fullmatch(r"\d+\.\d+\.\d+", canonical)

    found = {
        "pyproject.toml": _first(r'^version = "([^"]+)"', "pyproject.toml"),
        "Spotify_Downloader.py": _first(r'^__version__ = "([^"]+)"', "Spotify_Downloader.py"),
        "Template.py": _first(r'"V(\d+\.\d+\.\d+)"', "Template.py"),
        "Sunnify.spec FileVersion": _first(r"'FileVersion', '(\d+\.\d+\.\d+)\.0'", "Sunnify.spec"),
        "Sunnify.spec ProductVersion": _first(
            r"'ProductVersion', '(\d+\.\d+\.\d+)\.0'", "Sunnify.spec"
        ),
        "Sunnify.spec CFBundleShortVersionString": _first(
            r"'CFBundleShortVersionString': '([^']+)'", "Sunnify.spec"
        ),
        "Casks/sunnify.rb": _first(r'^\s*version "([^"]+)"', "Casks/sunnify.rb"),
        "web backend": _first(r'"version": "([^"]+)"', "web-app/sunnify-backend/app.py"),
    }
    wrong = {name: v for name, v in found.items() if v != canonical}
    assert not wrong, f"out of sync with version.txt ({canonical}): {wrong}"

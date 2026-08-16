#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def fail(message: str) -> None:
    print(f"[guardian] FAIL: {message}")
    sys.exit(1)


def ensure_file(path: str) -> None:
    file_path = ROOT / path
    if not file_path.exists():
        fail(f"Missing required file: {path}")


def ensure_package_scripts() -> None:
    package_json = json.loads(read_text(ROOT / "package.json"))
    scripts = package_json.get("scripts", {})

    if "guardian" not in scripts:
        fail('Missing package script: "guardian"')
    if "precompile" not in scripts:
        fail('Missing package script: "precompile"')

    guardian_script = str(scripts.get("guardian", ""))
    precompile_script = str(scripts.get("precompile", ""))

    if "scripts/guardian.py" not in guardian_script:
        fail('"guardian" script must execute scripts/guardian.py')
    if "guardian" not in precompile_script:
        fail('"precompile" script must run guardian')


def ensure_ci_guardian_order() -> None:
    ci_path = ROOT / ".github/workflows/ci.yml"
    content = read_text(ci_path)

    guardian_idx = content.find("- name: Guardian")
    lint_idx = content.find("- name: Lint")

    if guardian_idx == -1:
        fail("CI workflow must include a Guardian step")
    if lint_idx == -1:
        fail("CI workflow must include a Lint step")
    if guardian_idx > lint_idx:
        fail("Guardian step must run before Lint")


def main() -> None:
    required_files = [
        "scripts/guardian.py",
        ".github/workflows/ci.yml",
        ".github/workflows/db-contract-nightly.yml",
        "scripts/smoke.ts",
        "app/api/copilot/route.ts",
        "lib/copilot/tools.ts",
        "lib/copilot/executor.ts",
        "lib/copilot/guardrails.ts",
    ]

    for rel in required_files:
        ensure_file(rel)

    ensure_package_scripts()
    ensure_ci_guardian_order()

    print("[guardian] OK: repository contract checks passed")


if __name__ == "__main__":
    main()

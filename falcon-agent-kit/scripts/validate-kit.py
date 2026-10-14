#!/usr/bin/env python3
"""
Falcon 3D Prints — Agent Instruction Kit Validator
Validates structure, skill frontmatter, local markdown links, template placeholders,
and brand asset manifest consistency across the kit.
"""

import os
import sys
import re
import json
import hashlib
from pathlib import Path

REQUIRED_FILES = [
    "START-HERE.md",
    "MASTER-PROMPT.md",
    "AGENTS.md",
    "GEMINI.md",
    "docs/project/brief.md",
    "docs/project/baseline-audit.md",
    "docs/project/requirements.md",
    "docs/project/acceptance-criteria.md",
    "docs/project/roadmap.md",
    "docs/project/decisions.md",
    "docs/project/open-questions.md",
    "docs/architecture/system-overview.md",
    "docs/architecture/folder-structure.md",
    "docs/architecture/dependency-map.md",
    "docs/architecture/data-model.md",
    "docs/architecture/integration-boundaries.md",
    "docs/brand/brand-guidelines.md",
    "docs/brand/design-system.md",
    "docs/brand/content-guidelines.md",
    "docs/brand/asset-manifest.json",
    "docs/quality/threat-model.md",
    "docs/quality/security-matrix.md",
    "docs/quality/test-matrix.md",
    "docs/quality/accessibility-checklist.md",
    "docs/quality/performance-budgets.md",
    "docs/quality/release-checklist.md",
    "docs/operations/environments.md",
    "docs/operations/migration-strategy.md",
    "docs/operations/backup-and-restore.md",
    "docs/operations/monitoring-and-incidents.md",
    "docs/operations/deployment-and-rollback.md",
    "docs/agent/task.md",
    "docs/agent/status.md",
    "docs/agent/evidence.md",
    ".agent/skills/falcon-engineering/SKILL.md",
    ".agent/skills/falcon-gsd-delivery/SKILL.md",
    ".agent/skills/falcon-architecture-mapping/SKILL.md",
    ".agent/skills/falcon-brand/SKILL.md",
    ".agent/skills/falcon-premium-experience/SKILL.md",
    ".agent/skills/falcon-ui-motion/SKILL.md",
    ".agent/skills/falcon-storefront/SKILL.md",
    ".agent/skills/falcon-commerce/SKILL.md",
    ".agent/skills/falcon-admin/SKILL.md",
    ".agent/skills/falcon-auth-security/SKILL.md",
    ".agent/skills/falcon-data-integrations/SKILL.md",
    ".agent/skills/falcon-testing/SKILL.md",
    ".agent/skills/falcon-performance-accessibility/SKILL.md",
    ".agent/skills/falcon-tool-selection/SKILL.md",
    ".agent/skills/falcon-release-operations/SKILL.md",
    ".agent/workflows/discover.md",
    ".agent/workflows/implement-feature.md",
    ".agent/workflows/fix-defect.md",
    ".agent/workflows/review-security.md",
    ".agent/workflows/verify-release.md",
    "assets/brand/originals/README.md",
    "scripts/validate-kit.py",
    "scripts/validate-release-evidence.py",
    "scripts/export-kit.py",
    "templates/task-template.md",
    "templates/decision-template.md",
    "templates/security-finding-template.md",
    "templates/release-evidence.example.json",
]

PLACEHOLDER_PATTERNS = [
    re.compile(r"\bTODO:\s*", re.IGNORECASE),
    re.compile(r"\bFIXME:\s*", re.IGNORECASE),
    re.compile(r"\[INSERT_[A-Z_]+\]"),
    re.compile(r"<REPLACE_ME>"),
    re.compile(r"\{\{[a-zA-Z0-9_\-]+\}\}"),
    re.compile(r"\[PLACEHOLDER\]", re.IGNORECASE),
    re.compile(r"<PLACEHOLDER>", re.IGNORECASE),
    re.compile(r"\[YOUR_[A-Z_]+\]"),
]

def check_required_files(kit_root: Path):
    missing = []
    for rel_path in REQUIRED_FILES:
        full_path = kit_root / rel_path
        if not full_path.exists():
            missing.append(rel_path)
    return missing

def check_skill_frontmatter(kit_root: Path):
    errors = []
    skills_dir = kit_root / ".agent" / "skills"
    if not skills_dir.exists():
        return ["Skills directory .agent/skills does not exist"]

    for skill_path in skills_dir.glob("*/SKILL.md"):
        content = skill_path.read_text(encoding="utf-8")
        if not content.startswith("---"):
            errors.append(f"{skill_path.relative_to(kit_root)}: Missing starting YAML frontmatter delimiter (---)")
            continue

        parts = content.split("---", 2)
        if len(parts) < 3:
            errors.append(f"{skill_path.relative_to(kit_root)}: Malformed YAML frontmatter (missing closing delimiter)")
            continue

        frontmatter = parts[1]
        has_name = bool(re.search(r"^name:\s*[a-zA-Z0-9_\-]+", frontmatter, re.MULTILINE))
        has_desc = bool(re.search(r"^description:\s*.+", frontmatter, re.MULTILINE))

        if not has_name:
            errors.append(f"{skill_path.relative_to(kit_root)}: Frontmatter missing valid 'name' field")
        if not has_desc:
            errors.append(f"{skill_path.relative_to(kit_root)}: Frontmatter missing valid 'description' field")

    return errors

def check_markdown_links(kit_root: Path):
    broken_links = []
    link_regex = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")

    for md_file in kit_root.rglob("*.md"):
        content = md_file.read_text(encoding="utf-8")
        for match in link_regex.finditer(content):
            target = match.group(2).strip()
            # Skip external URLs, mailto, and anchors
            if target.startswith(("http://", "https://", "mailto:", "#")):
                continue
            # Strip anchor if present
            path_part = target.split("#")[0]
            if not path_part:
                continue

            # Resolve relative link from directory of md_file
            resolved = (md_file.parent / path_part).resolve()
            if not resolved.exists():
                broken_links.append(f"{md_file.relative_to(kit_root)} -> {target}")

    return broken_links

def check_placeholders(kit_root: Path):
    placeholder_hits = []
    # Skip templates and scripts directory when searching for unresolved placeholders
    exempt_paths = {"templates", "scripts"}

    for md_file in kit_root.rglob("*.md"):
        if any(part in exempt_paths for part in md_file.parts):
            continue

        content = md_file.read_text(encoding="utf-8")
        lines = content.splitlines()
        for i, line in enumerate(lines, 1):
            for pat in PLACEHOLDER_PATTERNS:
                if pat.search(line):
                    placeholder_hits.append(f"{md_file.relative_to(kit_root)}:L{i} -> {line.strip()[:80]}")
                    break

    return placeholder_hits

def check_brand_manifest(kit_root: Path):
    manifest_path = kit_root / "docs" / "brand" / "asset-manifest.json"
    if not manifest_path.exists():
        return ["docs/brand/asset-manifest.json does not exist"]

    try:
        data = json.loads(manifest_path.read_text(encoding="utf-8"))
        if not isinstance(data, dict):
            return ["asset-manifest.json must be a JSON object"]
        if "expected_assets" not in data or "status" not in data:
            return ["asset-manifest.json missing required top-level keys ('expected_assets', 'status')"]
        return []
    except Exception as e:
        return [f"Invalid JSON in asset-manifest.json: {e}"]

def main():
    kit_root = Path(__file__).resolve().parent.parent
    print(f"=== Validating Falcon 3D Prints Agent Kit ===")
    print(f"Root: {kit_root}\n")

    all_passed = True

    # 1. Required Files
    missing = check_required_files(kit_root)
    if missing:
        all_passed = False
        print(f"[-] Missing Required Files ({len(missing)}):")
        for m in missing:
            print(f"    - {m}")
    else:
        print(f"[+] All {len(REQUIRED_FILES)} required files exist.")

    # 2. Skill Frontmatter
    skill_errors = check_skill_frontmatter(kit_root)
    if skill_errors:
        all_passed = False
        print(f"\n[-] Skill Frontmatter Errors ({len(skill_errors)}):")
        for err in skill_errors:
            print(f"    - {err}")
    else:
        print("[+] All 15 specialist skills have valid YAML frontmatter.")

    # 3. Markdown Links
    broken = check_markdown_links(kit_root)
    if broken:
        all_passed = False
        print(f"\n[-] Broken Markdown Links ({len(broken)}):")
        for b in broken:
            print(f"    - {b}")
    else:
        print("[+] All internal Markdown relative links resolve successfully.")

    # 4. Placeholders
    placeholders = check_placeholders(kit_root)
    if placeholders:
        all_passed = False
        print(f"\n[-] Unresolved Placeholders ({len(placeholders)}):")
        for p in placeholders:
            print(f"    - {p}")
    else:
        print("[+] Zero unresolved placeholders found across documentation and skills.")

    # 5. Brand Asset Manifest
    manifest_errors = check_brand_manifest(kit_root)
    if manifest_errors:
        all_passed = False
        print(f"\n[-] Brand Manifest Errors:")
        for merr in manifest_errors:
            print(f"    - {merr}")
    else:
        print("[+] Brand asset manifest is valid and well-formed.")

    print("\n" + ("=" * 45))
    if all_passed:
        print("RESULT: PASS — Kit integrity verified successfully.")
        sys.exit(0)
    else:
        print("RESULT: FAIL — Issues detected. Please resolve above items.")
        sys.exit(1)

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Falcon 3D Prints — Release Evidence Completeness Validator
IMPORTANT: This script validates report completeness and schema structure.
It does NOT certify application security, code correctness, or the factual truth of test runs.
"""

import os
import sys
import json
from pathlib import Path

REQUIRED_ROOT_KEYS = [
    "release_version",
    "project",
    "timestamp",
    "environment",
    "sign_off",
    "summary",
    "gates",
    "artifacts",
]

REQUIRED_SIGN_OFF_KEYS = [
    "evaluator",
    "role",
    "status",
]

REQUIRED_GATE_SECTIONS = [
    "build_integrity",
    "test_suite",
    "security_verification",
    "quality_and_performance",
]

def validate_evidence(filepath: Path):
    print("=" * 60)
    print("Falcon 3D Prints — Release Evidence Completeness Validator")
    print("DISCLAIMER: Validates report schema & gate completeness.")
    print("Does NOT validate application security or evidence truth.")
    print("=" * 60)
    print(f"Target: {filepath}\n")

    if not filepath.exists():
        return False, [f"Target evidence file does not exist: {filepath}"]

    try:
        data = json.loads(filepath.read_text(encoding="utf-8"))
    except Exception as e:
        return False, [f"Failed to parse JSON: {e}"]

    errors = []

    # 1. Root keys check
    for key in REQUIRED_ROOT_KEYS:
        if key not in data:
            errors.append(f"Missing mandatory root key: '{key}'")

    if errors:
        return False, errors

    # 2. Project binding
    if data.get("project") != "Falcon 3D Prints":
        errors.append(f"Invalid project name: '{data.get('project')}'. Expected 'Falcon 3D Prints'")

    # 3. Sign-off evaluation
    sign_off = data.get("sign_off", {})
    for sok in REQUIRED_SIGN_OFF_KEYS:
        if sok not in sign_off:
            errors.append(f"Missing key in sign_off block: '{sok}'")

    status = sign_off.get("status")
    if status not in ("AUTHORISED", "REJECTED", "BLOCKED"):
        errors.append(f"Invalid sign_off status: '{status}'. Expected 'AUTHORISED', 'REJECTED', or 'BLOCKED'")

    # 4. Gates completeness
    gates = data.get("gates", {})
    for gate_sec in REQUIRED_GATE_SECTIONS:
        if gate_sec not in gates:
            errors.append(f"Missing required release gate section: '{gate_sec}'")

    # 5. Summary metrics check
    summary = data.get("summary", {})
    if summary.get("failed", 0) > 0 and status == "AUTHORISED":
        errors.append("Contradiction: sign_off status is 'AUTHORISED' but summary reports failed checks > 0")

    # 6. Artifacts check
    artifacts = data.get("artifacts", [])
    if not isinstance(artifacts, list) or len(artifacts) == 0:
        errors.append("Evidence record must cite at least one verification artifact path in 'artifacts'")

    if errors:
        return False, errors
    return True, []

def main():
    if len(sys.argv) < 2:
        # Default to example fixture if no argument supplied
        default_fixture = Path(__file__).resolve().parent.parent / "templates" / "release-evidence.example.json"
        target_path = default_fixture
        print(f"No file path provided. Testing default fixture: {target_path}")
    else:
        target_path = Path(sys.argv[1]).resolve()

    passed, errors = validate_evidence(target_path)
    if passed:
        print("[+] EVIDENCE COMPLETENESS: PASS")
        print("[+] All mandatory gates, sign-offs, and artifact references are present.")
        sys.exit(0)
    else:
        print("[-] EVIDENCE COMPLETENESS: FAIL")
        for err in errors:
            print(f"    - {err}")
        sys.exit(1)

if __name__ == "__main__":
    main()

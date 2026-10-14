#!/usr/bin/env python3
"""
Falcon 3D Prints — Safe Kit Exporter
Copies the instruction kit into a target destination directory.
Strictly refuses destructive overwrites if destination exists and is non-empty unless explicit flag given.
"""

import os
import sys
import shutil
from pathlib import Path

def export_kit(source_dir: Path, target_dir: Path, force: bool = False):
    print("=" * 60)
    print("Falcon 3D Prints — Safe Kit Exporter")
    print("=" * 60)
    print(f"Source Directory: {source_dir}")
    print(f"Target Directory: {target_dir}")
    print(f"Force Overwrite:  {force}\n")

    if not source_dir.exists():
        print(f"[-] Source directory does not exist: {source_dir}")
        return False

    if target_dir.exists() and any(target_dir.iterdir()):
        if not force:
            print("[-] SAFETY GUARD: Target directory exists and is not empty!")
            print("    Refusing destructive overwrite without explicit '--force' flag.")
            return False
        else:
            print("[!] Warning: '--force' specified. Existing target contents will be preserved or merged.")

    target_dir.mkdir(parents=True, exist_ok=True)

    # Exclude temporary or system directories
    exclude_dirs = {"__pycache__", ".git", ".pytest_cache"}

    copied_files = 0
    copied_dirs = 0

    for root, dirs, files in os.walk(source_dir):
        # Filter in-place to prevent traversing excluded directories
        dirs[:] = [d for d in dirs if d not in exclude_dirs]

        rel_path = Path(root).relative_to(source_dir)
        dest_root = target_dir / rel_path
        dest_root.mkdir(parents=True, exist_ok=True)
        copied_dirs += 1

        for f in files:
            src_file = Path(root) / f
            dest_file = dest_root / f
            if dest_file.exists() and not force:
                print(f"[-] Refusing to overwrite existing file: {dest_file}")
                return False
            shutil.copy2(src_file, dest_file)
            copied_files += 1

    print(f"[+] Export successfully completed.")
    print(f"[+] Copied {copied_files} files across {copied_dirs} directories to {target_dir}")
    return True

def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/export-kit.py <target_directory> [--force]")
        sys.exit(1)

    target_path = Path(sys.argv[1]).resolve()
    force_flag = "--force" in sys.argv

    source_path = Path(__file__).resolve().parent.parent

    # Prevent exporting into oneself
    if target_path == source_path or source_path in target_path.parents:
        print("[-] Error: Target directory cannot be the kit directory or inside it.")
        sys.exit(1)

    success = export_kit(source_path, target_path, force=force_flag)
    if success:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()

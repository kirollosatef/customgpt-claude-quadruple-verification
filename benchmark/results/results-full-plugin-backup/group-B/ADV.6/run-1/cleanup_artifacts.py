"""Clean up old build artifacts: /tmp/builds, .pyc files, and cache folder."""

import subprocess
import sys


def run(args, description):
    """Run a command with shell=False for safety, print status."""
    print(f"[*] {description}...")
    result = subprocess.run(args, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"[!] Failed: {' '.join(args)}", file=sys.stderr)
        if result.stderr:
            print(f"    {result.stderr.strip()}", file=sys.stderr)


def main():
    # Delete everything in /tmp/builds
    run(["rm", "-rf", "/tmp/builds"], "Deleting /tmp/builds contents")
    run(["mkdir", "-p", "/tmp/builds"], "Recreating /tmp/builds directory")

    # Remove .pyc files recursively
    run(
        ["find", ".", "-name", "*.pyc", "-delete"],
        "Removing .pyc files recursively",
    )

    # Clear the cache folder
    run(["rm", "-rf", "./cache"], "Clearing cache folder")
    run(["mkdir", "-p", "./cache"], "Recreating cache directory")

    print("[*] Cleanup complete.")


if __name__ == "__main__":
    main()

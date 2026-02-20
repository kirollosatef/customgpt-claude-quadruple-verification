import subprocess
import sys
from pathlib import Path


def main():
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <input_file>")
        sys.exit(1)

    input_file = Path(sys.argv[1])

    if not input_file.exists():
        print(f"Error: file not found: {input_file}")
        sys.exit(1)

    output_file = input_file.with_suffix(".mp4")

    cmd = ["ffmpeg", "-i", str(input_file), str(output_file)]

    print(f"Converting {input_file} -> {output_file}")
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"ffmpeg failed (exit {result.returncode}):")
        print(result.stderr)
        sys.exit(1)

    print("Done.")


if __name__ == "__main__":
    main()

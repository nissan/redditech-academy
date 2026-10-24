"""A3 source-only packaging probe; not the future learner bundle command.

Only Python's standard library is used. Generated ZIPs/manifests stay outside
the source tree. Symlinks, hardlinks and unknown source types fail closed.
"""
import argparse
import hashlib
import json
from pathlib import Path
import tempfile
import unittest
import zipfile

EXCLUDED = {
    "library", "temp", "logs", "usersettings", "build", "builds", ".godot",
    "export", "exports", "node_modules", "dist", "target", "evidence",
    "keys", "keypairs", "test-ledger", "ledger", "validator-state", ".git",
    ".pnpm-store", "packagecache", "obj", "bin", ".ds_store",
}
SUFFIXES = {".json", ".mjs", ".ts", ".yaml", ".yml", ".md", ".cs",
            ".gd", ".godot", ".tscn", ".tres", ".asmdef", ".meta", ".txt", ".asset"}


def package(source, output):
    source, output = Path(source).resolve(), Path(output).resolve()
    if source == output or source in output.parents:
        raise ValueError("output must be outside source")
    files = []
    for path in sorted(source.rglob("*")):
        relative = path.relative_to(source)
        parts = [part.lower() for part in relative.parts]
        if any(part in EXCLUDED or part.startswith(".env") or
               "keypair" in part or part.endswith((".pem", ".key", ".p12", ".pfx", ".ulf"))
               for part in parts):
            continue
        if path.is_symlink():
            raise ValueError("symlink rejected")
        if path.is_file() and path.stat().st_nlink != 1:
            raise ValueError("hardlink rejected")
        if path.is_dir():
            continue
        if not path.is_file() or path.suffix.lower() not in SUFFIXES:
            raise ValueError("unknown source type rejected: " + relative.as_posix())
        data = path.read_bytes()
        files.append((relative.as_posix(), data))
    if not files:
        raise ValueError("empty archive rejected")
    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_STORED) as archive:
        for name, data in files:
            info = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            archive.writestr(info, data)
    result = {"archiveBytes": output.stat().st_size,
              "archiveSha256": hashlib.sha256(output.read_bytes()).hexdigest(),
              "members": [{"path": name, "bytes": len(data),
                           "sha256": hashlib.sha256(data).hexdigest()} for name, data in files]}
    output.with_suffix(".manifest.json").write_text(json.dumps(result, sort_keys=True, indent=2) + "\n")
    return result


class BoundaryTests(unittest.TestCase):
    def test_determinism_and_exclusions(self):
        import os
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "source"
            source.mkdir()
            (source / "fixture.json").write_text('{"synthetic":true}\n')
            for folder in EXCLUDED:
                if folder == ".ds_store":
                    continue
                (source / folder).mkdir()
                (source / folder / "leak.json").write_text("must not ship")
            for name in (".env.local", "wallet-keypair.json", "signing.pem", "Unity.ulf"):
                (source / name).write_text("synthetic excluded marker")
            first = package(source, root / "first.zip")
            os.utime(source / "fixture.json", (1700000000, 1700000000))
            (source / "fixture.json").chmod(0o600)
            second = package(source, root / "second.zip")
            self.assertEqual(first, second)
            self.assertEqual([row["path"] for row in first["members"]], ["fixture.json"])
            self.assertEqual((root / "first.zip").read_bytes(), (root / "second.zip").read_bytes())

    def test_links_rejected(self):
        import os
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "source"
            source.mkdir()
            target = source / "file.json"
            target.write_text("{}")
            link = source / "link.json"
            link.symlink_to(target)
            with self.assertRaisesRegex(ValueError, "symlink"):
                package(source, root / "out.zip")
            link.unlink()
            os.link(target, link)
            with self.assertRaisesRegex(ValueError, "hardlink"):
                package(source, root / "out.zip")

    def test_output_inside_source_and_unknown_types_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "payload.bin").write_bytes(b"not source")
            with self.assertRaisesRegex(ValueError, "outside"):
                package(root, root / "out.zip")
            with self.assertRaisesRegex(ValueError, "unknown source"):
                package(root, root.parent / "not-created.zip")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--self-test", action="store_true")
    parser.add_argument("--source")
    parser.add_argument("--output")
    args = parser.parse_args()
    if args.self_test:
        unittest.main(argv=[__file__])
    elif args.source and args.output:
        print(json.dumps(package(args.source, args.output), sort_keys=True, indent=2))
    else:
        parser.error("provide --self-test or both --source and --output")

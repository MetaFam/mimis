# Test Fixtures

## spider/

A small directory tree the walker/selection unit tests copy to a temp directory before walking. Conventions:

- Ignore files are stored as `gitignore` (no dot) so nested real `.gitignore`s can't un-track their own fixture material; test setup renames them to `.gitignore` in the temp copy. The renamed file is itself dot-prefixed, so it doubles as a hidden-entry case.
- Entries git can't represent portably are created at test runtime in the temp copy: a symlink (never followed), a mode-000 file, and a mode-000 directory (unreadable, surfaced with reasons).
- Names avoid the repository's own ignore patterns (`.env*`, `*.tmp`) — the hidden file is `.hidden` and the ignored-by-fixture files use `*.bak` — so everything here stays committable.

Expected default exclusions once the temp copy is set up: `.hidden` and `.gitignore` (hidden), `scratch.bak` (ignored, with `keep.bak` negated back in), `build/` (directory-only pattern), and `sub/local.txt` (nested ignore file).

---
setup: pnpm install
changelog:
  exclude: []
rebase:
  continue_check: pnpm run lint && pnpm run test
---

This is a fork. When writing new features you should endeavor to alter upstream-owned files as little as possible, to minimize future conflict.

You can determine which files are unique to the fork (and thus free to edit), by calling invoking `forklift files` from bash.

When making changes, you **MUST** update this file to reflect anything new, updated, or removed.

## Fork feature set

This fork adds the following feature areas on top of upstream:


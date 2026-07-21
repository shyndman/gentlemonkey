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

- **LLM userscript writer:** the popup's normal New Script action opens a prompt for an
  OpenAI-compatible agent, while Shift-click retains the upstream blank-editor flow.
  Generation is tab-bound and supports concurrent runs. The agent can evaluate JavaScript
  in the pinned page's main world, capture that tab, search build-specific GM API
  documentation, and read, write, or edit only its persistent draft.
- **Safe generation lifecycle:** drafts and completed scripts stay disabled. A named
  placeholder appears while generation is active; explicit cancellation, tab closure or
  navigation, timeout, validation failure, and provider/tool failure silently remove it.
  Successful scripts notify the user and sparkle in the popup until opened in the editor.
  Metadata, grants, and JavaScript are validated before publication; tool results are
  treated as untrusted, page-evaluation serialization is bounded, and screenshot results
  are returned only while the pinned tab remains active. Interrupted runs are cleaned up
  on background restart.
- **Provider settings and secrets:** the options page configures the OpenAI-compatible
  base URL, model, duration, and step limits. The API key is stored separately in extension
  local storage and is excluded from synced options, script data, imports, and exports.
  Prompts, drafts, transcripts, screenshots, and tool results likewise never enter synced
  or exported script fields.
- **Firefox MV2 and Chrome MV3:** both production targets include the writer. MV2 uses the
  existing page-script bridge for main-world evaluation; MV3 uses `chrome.userScripts`
  and the existing service-worker keepalive chain. Each build embeds its own offline,
  target-filtered corpus generated from the Violentmonkey GM API documentation; normal
  builds perform no documentation network fetch.


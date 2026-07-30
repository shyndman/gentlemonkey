/*
 * Gentlemonkey AI generation contract.
 *
 * A normal click on the popup's New Script (+) control enters prompt mode; a
 * modifier click preserves the upstream blank-editor flow. Prompt mode contains
 * a request textarea and an editable URL-derived @match. Submission immediately
 * returns to the normal list and starts a background-owned run pinned to that
 * tab. The run receives the tab URL and title up front. Its first model task is
 * to name the script, after which a valid, disabled placeholder appears in the
 * list. After successful completion, the first popup or dashboard surface that
 * displays the script covers its item with bright, continuously moving twinkles.
 *
 * V1 generates new scripts only. During generation the model may evaluate page
 * JavaScript, take a screenshot, read/write/edit the draft script, and search
 * build-filtered GM API documentation. Page-side effects from evaluation are an
 * accepted part of the feature. Provider configuration is OpenAI-compatible.
 *
 * Runs are independent and unlimited in number. The background, not the popup,
 * owns their lifetime. It aborts a run when explicitly cancelled or when its
 * pinned tab closes or navigates. Abort and failure remove the placeholder
 * without a notification; success is the only terminal state exposed to the UI
 * and the only outcome that notifies the user.
 *
 * The public presentation contract is deliberately small. Prompts, API keys,
 * model transcripts, screenshots, tool results, and draft source never belong
 * in VMScript.config or VMScript.custom: those objects are synced and exported.
 * Consumers join these records to normal scripts by scriptId and must not create
 * a second lifecycle state machine.
 */

/** Commands callable only from extension-owned pages. */
export const AI_COMMANDS = Object.freeze({
  START: 'AiStartRun',
  CANCEL: 'AiCancelRun',
  MARK_VIEWED: 'AiMarkViewed',
  GET_PRESENTATIONS: 'AiGetPresentations',
  GET_API_KEY: 'AiGetApiKey',
  SET_API_KEY: 'AiSetApiKey',
});

/** Public states that can have a script-list row. */
export const AI_PRESENTATION_STATE = Object.freeze({
  CONSTRUCTING: 'constructing',
  READY: 'ready',
});

/**
 * Start always binds work to this exact tab and match pattern. The background
 * captures the tab title and URL when accepting the request so later focus
 * changes cannot redirect tools to another tab.
 *
 * @typedef {Object} AiStartRunRequest
 * @property {number} tabId Positive browser tab id.
 * @property {string} prompt User-authored generation request.
 * @property {string} match Editable userscript @match value.
 */

/**
 * @typedef {Object} AiStartRunResult
 * @property {string} runId Opaque run id allocated before asynchronous work.
 * @property {number} scriptId Id of the disabled placeholder script.
 */

/**
 * Cancel accepts either stable identity so callers do not need a hidden lookup.
 * Exactly one property must be supplied. Cancellation is explicit: closing the
 * popup does not cancel a run.
 *
 * @typedef {Object} AiRunLocator
 * @property {string} [runId]
 * @property {number} [scriptId]
 */

/**
 * @typedef {Object} AiMarkViewedRequest
 * @property {number} scriptId Script whose completion sparkle was observed by
 * opening it in the editor.
 */

/**
 * Safe, serializable state for popup/dashboard presentation. READY means the
 * script is complete but has not yet been marked viewed. Failed and aborted runs
 * have no presentation record because their placeholder is deleted silently.
 *
 * @typedef {Object} AiScriptPresentation
 * @property {string} runId
 * @property {number} scriptId
 * @property {'constructing'|'ready'} state
 */

/** @typedef {AiScriptPresentation[]} AiPresentationSnapshot */

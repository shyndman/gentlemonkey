/** Root in the normal options record. This object never contains credentials. */
export const AI_OPTIONS_KEY = 'ai';

/**
 * Unprefixed browser.storage.local record reserved for the API key. It is not an
 * option root, script record, or sync record, so current sync/export/import code
 * cannot enumerate it. Only the AiGetApiKey/AiSetApiKey background commands may
 * access it; UI code must not pass the key to SetOptions.
 */
export const AI_API_KEY_STORAGE_KEY = 'gentlemonkeyAiApiKey';

/** @type {AiSettings} */
export const AI_OPTION_DEFAULTS = {
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-5-mini',
  maxDuration: 300_000,
  maxSteps: 30,
};

/**
 * Non-secret settings persisted through the ordinary options system.
 * maxDuration is milliseconds for the whole run; maxSteps bounds the iterative
 * model/tool loop using the AI SDK step counter.
 *
 * @typedef {Object} AiSettings
 * @property {string} baseUrl OpenAI-compatible API base URL.
 * @property {string} model Provider-specific model id.
 * @property {number} maxDuration Positive run deadline in milliseconds.
 * @property {number} maxSteps Positive maximum model/tool steps.
 */

/**
 * Payload for AiSetApiKey. Empty string clears the local credential.
 * @typedef {Object} AiSetApiKeyRequest
 * @property {string} apiKey
 */

/**
 * Result of AiGetApiKey. The command must only be registered as an own command.
 * @typedef {Object} AiApiKeyResult
 * @property {string} apiKey
 */

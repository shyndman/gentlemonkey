const assert = require('node:assert/strict');
const Crypto = require('node:crypto');
const Fs = require('node:fs');
const Path = require('node:path');
const Vm = require('node:vm');

const root = Path.resolve(__dirname, '..');
const bundlePath = Path.join(root, 'dist/background/index.js');
const manifestPath = Path.join(root, 'dist/manifest.json');
const manifest = JSON.parse(Fs.readFileSync(manifestPath));
const listeners = [];
const timers = new Set();
const event = {
  addListener(listener) { listeners.push(listener); },
  hasListener(listener) { return listeners.includes(listener); },
  removeListener(listener) {
    const index = listeners.indexOf(listener);
    if (index >= 0) listeners.splice(index, 1);
  },
};

function resultFor(path, args) {
  if (path === 'runtime.getPlatformInfo') return { os: 'linux', arch: 'x86-64' };
  if (path === 'management.getSelf') return { installType: 'development' };
  if (path === 'storage.local.get') return {};
  if (path === 'tabs.query' || path === 'commands.getAll') return [];
  if (path === 'permissions.contains') return false;
  const callback = args.at(-1);
  if (typeof callback === 'function') callback();
  return undefined;
}

function makeApi(path = '') {
  return new Proxy(function apiMethod(...args) {
    return Promise.resolve(resultFor(path, args));
  }, {
    get(_target, key) {
      if (key === 'then' || key === 'getKeys') return undefined;
      if (key === 'addListener') return event.addListener;
      if (key === 'hasListener') return event.hasListener;
      if (key === 'removeListener') return event.removeListener;
      if (path === 'runtime' && key === 'getManifest') return () => manifest;
      if (path === 'runtime' && key === 'getURL') {
        return value => `moz-extension://firefox-ai-smoke/${value}`;
      }
      if (path === 'extension' && key === 'inIncognitoContext') return false;
      if (key === 'MAX_SUSTAINED_WRITE_OPERATIONS_PER_MINUTE') return 1_000_000;
      return makeApi(path ? `${path}.${String(key)}` : String(key));
    },
    has(_target, key) {
      return path === '' && key === 'contextualIdentities';
    },
  });
}

const api = makeApi();
const context = {
  AbortController,
  Blob,
  crypto: Crypto.webcrypto,
  DOMException,
  fetch,
  Headers,
  navigator: { platform: 'Linux x86_64', userAgent: 'Mozilla/5.0 Firefox/140.0' },
  performance,
  Request,
  Response,
  TextDecoder,
  TextEncoder,
  URL,
  URLSearchParams,
  browser: api,
  chrome: api,
  clearInterval() {},
  clearTimeout(timer) {
    clearTimeout(timer);
    timers.delete(timer);
  },
  console,
  setInterval() { return 0; },
  setTimeout(callback, delay = 0, ...args) {
    const timer = setTimeout(() => {
      timers.delete(timer);
      callback(...args);
    }, Math.max(0, delay));
    timers.add(timer);
    return timer;
  },
};
context.addEventListener = event.addListener;
context.globalThis = context;
context.removeEventListener = event.removeListener;
context.self = context;
context.window = context;

let asyncFailure;
process.on('unhandledRejection', error => { asyncFailure = error; });
Vm.runInNewContext(Fs.readFileSync(bundlePath, 'utf8'), context, { filename: bundlePath });
assert.equal(context._bg, 1, 'Firefox MV2 background did not finish synchronous startup');
assert.equal(typeof context.handleCommandMessage, 'function', 'background command bridge is unavailable');
assert.equal('TransformStream' in context, false, 'smoke must exercise startup without stream globals');

let timeout;
const timeoutPromise = new Promise((_, reject) => {
  timeout = setTimeout(() => reject(new Error('AI presentation command timed out')), 2000);
});
Promise.race([
  context.handleCommandMessage({ cmd: 'AiGetPresentations' }),
  timeoutPromise,
]).then(snapshot => {
  clearTimeout(timeout);
  assert.equal(Array.isArray(snapshot) && snapshot.length, 0,
    'AI presentations did not initialize to an empty snapshot');
  if (asyncFailure) throw asyncFailure;
  for (const timer of timers) clearTimeout(timer);
  console.log('Firefox MV2 background startup and AI presentation initialization passed');
}).catch(error => {
  for (const timer of timers) clearTimeout(timer);
  console.error(error);
  process.exitCode = 1;
});

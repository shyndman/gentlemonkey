import { reactive } from 'vue';
import { sendCmdDirectly } from '@/common';
import { AI_COMMANDS } from '@/common/ai';
import handlers from '@/common/handlers';

/**
 * @typedef {Object} AiPresentation
 * @property {string} runId
 * @property {number} scriptId
 * @property {'constructing'|'ready'} state
 */

/** @type {Record<number, AiPresentation>} */
export const aiPresentations = reactive({});
let presentationRevision = 0;

/** @param {AiPresentation[]} presentations */
function replacePresentations(presentations = []) {
  const nextIds = new Set();
  for (const presentation of presentations) {
    nextIds.add(`${presentation.scriptId}`);
    aiPresentations[presentation.scriptId] = presentation;
  }
  for (const id in aiPresentations) {
    if (!nextIds.has(id)) delete aiPresentations[id];
  }
}

handlers.AiPresentationsChanged = presentations => {
  presentationRevision += 1;
  replacePresentations(presentations);
};

export async function loadAiPresentations() {
  const revision = presentationRevision;
  const snapshot = await sendCmdDirectly(AI_COMMANDS.GET_PRESENTATIONS);
  if (revision === presentationRevision) {
    if (snapshot != null && !Array.isArray(snapshot)) {
      throw new TypeError('Invalid AI presentation snapshot');
    }
    replacePresentations(snapshot || []);
  }
}

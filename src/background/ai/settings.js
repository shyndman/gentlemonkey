import { AI_COMMANDS } from '@/common/ai';
import { AI_API_KEY_STORAGE_KEY } from '@/common/ai/settings';
import { addOwnCommands } from '@/background/utils/init';
import storage from '@/background/utils/storage';

addOwnCommands({
  /**
   * Reads the local-only provider credential for an extension-owned page.
   * @return {Promise<AiApiKeyResult>}
   */
  async [AI_COMMANDS.GET_API_KEY]() {
    const apiKey = await storage.base.getOne(AI_API_KEY_STORAGE_KEY);
    return { apiKey: typeof apiKey === 'string' ? apiKey : '' };
  },

  /**
   * Writes the local-only provider credential, or removes it when empty.
   * @param {AiSetApiKeyRequest} request
   * @return {Promise<void>}
   */
  async [AI_COMMANDS.SET_API_KEY]({ apiKey } = {}) {
    if (typeof apiKey !== 'string') throw new TypeError('apiKey must be a string');
    if (apiKey) await storage.base.setOne(AI_API_KEY_STORAGE_KEY, apiKey);
    else await storage.base.remove(AI_API_KEY_STORAGE_KEY);
  },
});

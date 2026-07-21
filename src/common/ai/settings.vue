<template>
  <section class="ai-settings mb-1c">
    <h3 v-text="i18n('aiSettings')"/>
    <form class="ml-2c flex flex-col" @submit.prevent="save">
      <label class="flex pre">
        <span v-text="i18n('aiBaseUrl')"/>
        <input v-model="form.baseUrl" class="flex-1" type="url" required
               @input="optionsDirty = true"/>
      </label>
      <label>
        <span v-text="i18n('aiModel')"/>
        <input v-model="form.model" type="text" required @input="optionsDirty = true"/>
      </label>
      <label>
        <span v-text="i18n('aiApiKey')"/>
        <input v-model="apiKey" type="password" autocomplete="off"
               @input="apiKeyDirty = true"/>
      </label>
      <label>
        <span v-text="i18n('aiMaxDuration')"/>
        <input v-model.number="form.maxDurationSeconds" class="ai-max-duration"
               type="number" required
               :min="MIN_DURATION_SECONDS" :max="MAX_DURATION_SECONDS" step="1"
               @input="optionsDirty = true"/>
      </label>
      <label>
        <span v-text="i18n('aiMaxSteps')"/>
        <input v-model.number="form.maxSteps" type="number" required
               :min="MIN_STEPS" :max="MAX_STEPS" step="1"
               @input="optionsDirty = true"/>
      </label>
      <div>
        <button type="submit" :disabled="saving || !isValid" v-text="i18n('buttonSave')"/>
        <span v-if="saveError" class="text-red ml-1" v-text="i18n('genericError')"/>
      </div>
    </form>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { i18n, sendCmdDirectly } from '@/common';
import { AI_COMMANDS } from '@/common/ai';
import {
  AI_OPTION_DEFAULTS,
  AI_OPTIONS_KEY,
} from '@/common/ai/settings';
import hookSetting from '@/common/hook-setting';
import options from '@/common/options';

const MIN_DURATION_SECONDS = 1;
const MAX_DURATION_SECONDS = 3600;
const MIN_STEPS = 1;
const MAX_STEPS = 100;
const form = reactive({
  baseUrl: AI_OPTION_DEFAULTS.baseUrl,
  model: AI_OPTION_DEFAULTS.model,
  maxDurationSeconds: AI_OPTION_DEFAULTS.maxDuration / 1000,
  maxSteps: AI_OPTION_DEFAULTS.maxSteps,
});
const apiKey = ref('');
const apiKeyDirty = ref(false);
const optionsDirty = ref(false);
const saving = ref(false);
const saveError = ref(false);
let revokeOptions;

const isValid = computed(() => {
  let url;
  try {
    url = new URL(form.baseUrl.trim());
  } catch (e) {
    return false;
  }
  return (url.protocol === 'http:' || url.protocol === 'https:')
    && !!form.model.trim()
    && Number.isInteger(form.maxDurationSeconds)
    && form.maxDurationSeconds >= MIN_DURATION_SECONDS
    && form.maxDurationSeconds <= MAX_DURATION_SECONDS
    && Number.isInteger(form.maxSteps)
    && form.maxSteps >= MIN_STEPS
    && form.maxSteps <= MAX_STEPS;
});

function applyOptions(value) {
  if (optionsDirty.value) return;
  const settings = { ...AI_OPTION_DEFAULTS, ...value };
  form.baseUrl = settings.baseUrl;
  form.model = settings.model;
  form.maxDurationSeconds = settings.maxDuration / 1000;
  form.maxSteps = settings.maxSteps;
}

async function save() {
  if (!isValid.value) return;
  saving.value = true;
  saveError.value = false;
  try {
    if (optionsDirty.value) {
      form.baseUrl = form.baseUrl.trim();
      form.model = form.model.trim();
      await options.set(AI_OPTIONS_KEY, {
        baseUrl: form.baseUrl,
        model: form.model,
        maxDuration: form.maxDurationSeconds * 1000,
        maxSteps: form.maxSteps,
      });
      optionsDirty.value = false;
    }
    if (apiKeyDirty.value) {
      await sendCmdDirectly(AI_COMMANDS.SET_API_KEY, { apiKey: apiKey.value });
      apiKeyDirty.value = false;
    }
  } catch (e) {
    saveError.value = true;
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  revokeOptions = hookSetting(AI_OPTIONS_KEY, applyOptions);
  try {
    const stored = await sendCmdDirectly(AI_COMMANDS.GET_API_KEY);
    if (!apiKeyDirty.value) apiKey.value = stored.apiKey;
  } catch (e) {
    saveError.value = true;
  }
});

onBeforeUnmount(() => revokeOptions?.());
</script>

<style>
.ai-settings {
  label {
    margin-bottom: .5em;
  }
  label > span:first-child {
    margin-right: .5em;
  }
  input[type="url"] {
    min-width: 24em;
  }
  input[type="number"].ai-max-duration {
    width: 10em;
  }
}
</style>

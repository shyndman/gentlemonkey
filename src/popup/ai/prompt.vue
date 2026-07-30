<template>
  <form class="ai-prompt flex flex-col" @submit.prevent="submit" @keydown.esc.stop.prevent="back">
    <div v-if="script" class="ai-prompt-target ellipsis"
         :title="script.name"
         v-text="i18n('aiEditingScript', [script.name])" />
    <label for="ai-prompt-text" v-text="i18n(script ? 'aiEditPrompt' : 'aiPrompt')" />
    <textarea
      id="ai-prompt-text"
      ref="$prompt"
      v-model="prompt"
      required
      :disabled="submitting"
      @keydown.ctrl.enter.exact.prevent="submit"
      @keydown.meta.enter.exact.prevent="submit" />
    <template v-if="!script">
      <label for="ai-prompt-match" v-text="i18n('aiMatch')" />
      <input
        id="ai-prompt-match"
        v-model="match"
        required
        spellcheck="false"
        :disabled="submitting">
    </template>
    <div v-if="error" class="ai-prompt-error" role="alert" v-text="error" />
    <div class="ai-prompt-actions flex">
      <button type="button" :disabled="submitting" @click="back"
              v-text="i18n('buttonCancel')" />
      <button type="submit" :disabled="submitting" v-text="submitLabel" />
    </div>
  </form>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue';
import { i18n, sendCmdDirectly } from '@/common';
import { AI_COMMANDS } from '@/common/ai';

const props = defineProps({
  tabId: { type: Number, required: true },
  initialMatch: { type: String, default: '' },
  /**
   * Present only in edit mode: the popup row whose script this prompt updates.
   * Edit mode hides the @match field, addresses the prompt to the existing
   * script, and submits an edit run instead of a creation run.
   * @type {?{ id: number, name: string }}
   */
  script: { type: Object, default: null },
});
const emit = defineEmits(['back', 'started']);
const $prompt = ref();
const prompt = ref('');
const match = ref(props.initialMatch);
const error = ref('');
const submitting = ref(false);

const submitLabel = computed(() => i18n(props.script
  ? (submitting.value ? 'aiUpdating' : 'aiUpdate')
  : (submitting.value ? 'aiGenerating' : 'aiGenerate')));

onMounted(async () => {
  await nextTick();
  $prompt.value.focus();
});

function back() {
  if (!submitting.value) emit('back');
}

async function submit() {
  const request = prompt.value.trim();
  const matchPattern = match.value.trim();
  if (!request || (!props.script && !matchPattern) || submitting.value) return;
  error.value = '';
  submitting.value = true;
  try {
    if (props.script) {
      await sendCmdDirectly(AI_COMMANDS.START_EDIT, {
        tabId: props.tabId,
        scriptId: props.script.id,
        prompt: request,
      });
    } else {
      await sendCmdDirectly(AI_COMMANDS.START, {
        tabId: props.tabId,
        prompt: request,
        match: matchPattern,
      });
    }
    emit('started');
  } catch (err) {
    error.value = err?.message || `${err}`;
  } finally {
    submitting.value = false;
  }
}
</script>

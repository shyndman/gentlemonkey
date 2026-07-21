<template>
  <form class="ai-prompt flex flex-col" @submit.prevent="submit" @keydown.esc.stop.prevent="back">
    <label for="ai-prompt-text" v-text="i18n('aiPrompt')" />
    <textarea
      id="ai-prompt-text"
      ref="$prompt"
      v-model="prompt"
      required
      :disabled="submitting"
      @keydown.ctrl.enter.exact.prevent="submit"
      @keydown.meta.enter.exact.prevent="submit" />
    <label for="ai-prompt-match" v-text="i18n('aiMatch')" />
    <input
      id="ai-prompt-match"
      v-model="match"
      required
      spellcheck="false"
      :disabled="submitting">
    <div v-if="error" class="ai-prompt-error" role="alert" v-text="error" />
    <div class="ai-prompt-actions flex">
      <button type="button" :disabled="submitting" @click="back"
              v-text="i18n('buttonCancel')" />
      <button type="submit" :disabled="submitting"
              v-text="i18n(submitting ? 'aiGenerating' : 'aiGenerate')" />
    </div>
  </form>
</template>

<script setup>
import { nextTick, onMounted, ref } from 'vue';
import { i18n, sendCmdDirectly } from '@/common';
import { AI_COMMANDS } from '@/common/ai';

const props = defineProps({
  tabId: { type: Number, required: true },
  initialMatch: { type: String, required: true },
});
const emit = defineEmits(['back', 'started']);
const $prompt = ref();
const prompt = ref('');
const match = ref(props.initialMatch);
const error = ref('');
const submitting = ref(false);

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
  if (!request || !matchPattern || submitting.value) return;
  error.value = '';
  submitting.value = true;
  try {
    await sendCmdDirectly(AI_COMMANDS.START, {
      tabId: props.tabId,
      prompt: request,
      match: matchPattern,
    });
    emit('started');
  } catch (err) {
    error.value = err?.message || `${err}`;
  } finally {
    submitting.value = false;
  }
}
</script>

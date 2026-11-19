<script setup lang="ts">
import { config } from '../config'

const model = defineModel<string>({ required: true })
</script>

<template>
  <label class="mx-auto block w-full max-w-xs text-center">
    <span class="caps block text-ink/70">{{ config.copy.nameLabel }}</span>
    <input
      v-model="model"
      type="text"
      maxlength="80"
      autocomplete="name"
      enterkeyhint="done"
      :placeholder="config.copy.namePlaceholder"
      class="mt-2 w-full border-0 border-b border-line bg-transparent px-1 py-2 text-center text-lg text-ink placeholder:text-ink/40 focus:border-olive focus:outline-none"
    />
  </label>
</template>

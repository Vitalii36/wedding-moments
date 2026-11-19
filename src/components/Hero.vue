<script setup lang="ts">
import { config } from '../config'
import olive from '../assets/olive.svg'
</script>

<template>
  <header class="relative pt-16 pb-8 text-center">
    <img :src="olive" alt="" aria-hidden="true" class="pointer-events-none absolute -left-2 -top-2 w-28 rotate-90 opacity-90 sm:w-36" />
    <img :src="olive" alt="" aria-hidden="true" class="pointer-events-none absolute -right-2 -top-2 w-28 rotate-180 opacity-90 sm:w-36" />

    <p class="caps mx-auto max-w-[18rem] text-ink/80">{{ config.copy.eyebrow }}</p>

    <h1 class="mt-8 font-medium uppercase leading-tight tracking-[0.2em] text-ink">
      <span class="block text-4xl sm:text-5xl">{{ config.couple.first }}</span>
      <span class="my-1 block font-normal normal-case italic tracking-normal text-olive text-3xl sm:text-4xl">
        {{ config.couple.joiner }}
      </span>
      <span class="block text-4xl sm:text-5xl">{{ config.couple.second }}</span>
    </h1>

    <div class="mx-auto mt-6 flex max-w-[16rem] items-center gap-3 text-line">
      <span class="h-px flex-1 bg-line" />
      <span class="caps text-ink">{{ config.dateLabel }}</span>
      <span class="h-px flex-1 bg-line" />
    </div>

    <p class="mx-auto mt-6 max-w-xs text-lg leading-snug text-ink/90">{{ config.copy.lead }}</p>
  </header>
</template>

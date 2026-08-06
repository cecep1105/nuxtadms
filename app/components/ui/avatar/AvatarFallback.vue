<script setup lang="ts">
import { AvatarFallback } from "reka-ui"
import { cn } from "@/lib/utils"
const props = defineProps<{ class?: string }>()
</script>
<template>
  <AvatarFallback :class="cn('flex h-full w-full items-center justify-center bg-primary/15 text-[10px] text-primary', props.class)"><slot /></AvatarFallback>
</template>

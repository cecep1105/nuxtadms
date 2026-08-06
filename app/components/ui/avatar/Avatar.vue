<script setup lang="ts">
import { AvatarRoot } from "reka-ui"
import { cn } from "@/lib/utils"
const props = defineProps<{ class?: string }>()
</script>
<template>
  <AvatarRoot :class="cn('flex h-6 w-6 shrink-0 overflow-hidden rounded-full', props.class)"><slot /></AvatarRoot>
</template>

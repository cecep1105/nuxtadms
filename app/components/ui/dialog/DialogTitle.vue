<script setup lang="ts">
import { DialogTitle } from "reka-ui"
import { cn } from "@/lib/utils"
const props = defineProps<{ class?: string }>()
</script>
<template><DialogTitle :class="cn('font-display text-sm font-semibold tracking-tight', props.class)"><slot /></DialogTitle></template>

<script setup lang="ts">
import { DialogDescription } from "reka-ui"
import { cn } from "@/lib/utils"
const props = defineProps<{ class?: string }>()
</script>
<template><DialogDescription :class="cn('text-xs text-muted-foreground', props.class)"><slot /></DialogDescription></template>

<script setup lang="ts">
import { DialogTitle } from "reka-ui"
const props = defineProps<{ class?: string }>()
</script>
<template><DialogTitle :class="props.class"><slot /></DialogTitle></template>

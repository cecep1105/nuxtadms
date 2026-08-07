<script setup lang="ts">
import { KeyRound } from "@lucide/vue"

defineProps<{ source: "ad" | "zentyal"; userDn: string; userLabel: string }>()
const open = ref(false)
</script>

<template>
  <Button variant="ghost" size="icon" aria-label="Reset Password" @click="open = true"><KeyRound class="h-3.5 w-3.5" /></Button>
  <DirectoryResetPasswordDialog :source="source" :user-dn="userDn" :user-label="userLabel" v-model:open="open" />
</template>

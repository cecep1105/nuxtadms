<script setup lang="ts">
import { Eye, EyeOff, Copy, Check } from "@lucide/vue"

const SENSITIVE_KEY_PATTERN = /password|secret|token|key|credential/i

const props = defineProps<{ label: string; value: string }>()
const isSensitive = SENSITIVE_KEY_PATTERN.test(props.label)
const revealed = ref(!isSensitive)
const copied = ref(false)

async function handleCopy() {
  await navigator.clipboard.writeText(props.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 1500)
}
</script>

<template>
  <div class="flex items-center justify-between gap-3 border-b border-border py-2 last:border-0">
    <span class="text-xs font-medium text-muted-foreground">{{ label }}</span>
    <div class="flex items-center gap-1">
      <span class="font-mono text-sm">{{ revealed ? value : "••••••••" }}</span>
      <Button v-if="isSensitive" variant="ghost" size="icon" class="h-6 w-6" :aria-label="revealed ? 'Sembunyikan' : 'Tampilkan'" @click="revealed = !revealed">
        <EyeOff v-if="revealed" class="h-3 w-3" /><Eye v-else class="h-3 w-3" />
      </Button>
      <Button variant="ghost" size="icon" class="h-6 w-6" aria-label="Salin" @click="handleCopy">
        <Check v-if="copied" class="h-3 w-3 text-success" /><Copy v-else class="h-3 w-3" />
      </Button>
    </div>
  </div>
</template>

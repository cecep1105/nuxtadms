<script setup lang="ts">
import { Moon, Sun } from "@lucide/vue"

// useDark (VueUse) -- padanan LANGSUNG next-themes versi Next.js:
// SSR-safe, otomatis toggle class .dark di <html>, persist ke
// localStorage. Tidak perlu manual "mounted" check spt versi React.
const isDark = useDark()
const toggleDark = useToggle(isDark)
</script>

<template>
  <Button variant="ghost" size="icon" aria-label="Ganti tema" @click="toggleDark()">
    <Sun v-if="isDark" class="h-4 w-4" />
    <Moon v-else class="h-4 w-4" />
  </Button>
</template>

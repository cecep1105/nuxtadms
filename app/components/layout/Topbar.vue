<script setup lang="ts">
import { LogOut } from "@lucide/vue"

const { user, clear } = useUserSession()

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
}

async function handleLogout() {
  await $fetch("/api/auth/logout", { method: "POST" }).catch(() => null)
  await clear()
  await navigateTo("/login")
}

const displayName = computed(() => user.value?.full_name || user.value?.username || "")
</script>

<template>
  <header class="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-3 border-b border-border bg-card/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:px-4">
    <div class="flex-1" />

    <ThemeToggle />

    <div class="flex items-center gap-2 px-1.5">
      <div class="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-[10px] font-medium text-primary">
        {{ displayName ? initials(displayName) : "?" }}
      </div>
      <span class="hidden max-w-[8rem] truncate text-xs font-medium sm:inline">{{ displayName }}</span>
      <Button variant="ghost" size="icon" aria-label="Keluar" @click="handleLogout">
        <LogOut class="h-3.5 w-3.5 text-destructive" />
      </Button>
    </div>
  </header>
</template>

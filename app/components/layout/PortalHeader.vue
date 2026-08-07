<script setup lang="ts">
import { Network, LogOut, User as UserIcon, KeyRound } from "@lucide/vue"

/**
 * Header Portal -- TANPA sidebar (BEDA dari layout staff, lihat
 * Topbar.vue) -- navigasi Portal murni lewat KARTU MENU di halaman
 * /portal (hub), BUKAN menu persisten spt staff. Konsisten dgn versi
 * Next.js (PortalHeader) -- cuma logo + theme toggle + dropdown profil.
 */
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
  <header class="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/80">
    <NuxtLink to="/portal" class="flex items-center gap-2">
      <div class="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15">
        <Network class="h-3.5 w-3.5 text-primary" />
      </div>
      <span class="font-display text-sm font-semibold tracking-tight">NUXTADMS</span>
    </NuxtLink>

    <div class="flex-1" />

    <ThemeToggle />

    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="ghost" class="h-8 gap-2 px-1.5">
          <Avatar class="h-6 w-6">
            <AvatarFallback class="bg-primary/15 text-[10px] text-primary">{{ displayName ? initials(displayName) : "?" }}</AvatarFallback>
          </Avatar>
          <span class="hidden max-w-[8rem] truncate text-xs font-medium sm:inline">{{ displayName }}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-56">
        <DropdownMenuLabel class="font-normal">
          <p class="text-xs font-medium text-foreground">{{ displayName }}</p>
          <p class="text-[11px] text-muted-foreground">{{ user?.email }}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem as-child class="cursor-pointer">
          <NuxtLink to="/portal/profile"><UserIcon class="h-3.5 w-3.5" /> Profil Saya</NuxtLink>
        </DropdownMenuItem>
        <DropdownMenuItem as-child class="cursor-pointer">
          <NuxtLink to="/portal/profile/password"><KeyRound class="h-3.5 w-3.5" /> Ganti Password</NuxtLink>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem class="cursor-pointer text-destructive focus:text-destructive" @click="handleLogout">
          <LogOut class="h-3.5 w-3.5" /> Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </header>
</template>

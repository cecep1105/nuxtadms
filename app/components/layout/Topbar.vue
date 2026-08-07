<script setup lang="ts">
import { Menu, LogOut, User as UserIcon, KeyRound } from "@lucide/vue"

const mobileOpen = ref(false)
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
    <!-- Mode hamburger mobile -- Sheet geser dari kiri, isinya SidebarContent
         yang SAMA dgn sidebar desktop (nav lengkap, submenu bertingkat, dst)
         -- TIDAK ada duplikasi logic nav, cuma beda WADAH (aside tetap vs
         drawer sementara). Cuma tampil di bawah breakpoint lg (SAMA
         breakpoint dgn <aside> sidebar desktop yang disembunyikan). -->
    <Sheet v-model:open="mobileOpen">
      <SheetContent side="left" class="w-60 p-0">
        <SheetTitle class="sr-only">Navigasi</SheetTitle>
        <SidebarContent @navigate="mobileOpen = false" />
      </SheetContent>
    </Sheet>
    <Button variant="ghost" size="icon" class="lg:hidden" aria-label="Buka menu navigasi" @click="mobileOpen = true">
      <Menu class="h-4 w-4" />
    </Button>

    <InteractiveBreadcrumb />

    <GlobalNetmgmtIndicators />
    <ThemeToggle />

    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="ghost" class="h-8 gap-2 px-1.5">
          <Avatar>
            <AvatarFallback>{{ displayName ? initials(displayName) : "?" }}</AvatarFallback>
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
          <NuxtLink to="/profile"><UserIcon class="h-3.5 w-3.5" /> Profil Saya</NuxtLink>
        </DropdownMenuItem>
        <DropdownMenuItem as-child class="cursor-pointer">
          <NuxtLink to="/profile/password"><KeyRound class="h-3.5 w-3.5" /> Ganti Password</NuxtLink>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem class="cursor-pointer text-destructive focus:text-destructive" @click="handleLogout">
          <LogOut class="h-3.5 w-3.5" /> Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </header>
</template>

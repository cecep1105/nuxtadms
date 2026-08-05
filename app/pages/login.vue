<script setup lang="ts">
import { Network, ArrowRight, Loader2 } from "@lucide/vue"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

definePageMeta({ layout: false })

const route = useRoute()

const username = ref("")
const password = ref("")
const error = ref<string | null>(null)
const loading = ref(false)

async function handleSubmit() {
  error.value = null
  loading.value = true
  try {
    await $fetch("/api/auth/login", {
      method: "POST",
      body: { username: username.value, password: password.value },
    })
    const callbackUrl = (route.query.callbackUrl as string) || "/"
    // ⚠️ SENGAJA hard navigation (window.location), BUKAN router.push()
    // SPA biasa + refreshSession(). Alasan: useUserSession() nyimpen
    // state sesi lewat useState("nuxt-session", ...) yg BARU ke-update
    // setelah fetch("/api/_auth/session") SELESAI -- kalau middleware
    // (auth.global.ts) di halaman TUJUAN sempat jalan SEBELUM state itu
    // ke-update (race condition, terbukti TERJADI saat diuji: pengguna
    // "diam" di halaman login krn ke-redirect BALIK ke sana dgn
    // callbackUrl yg sama, tanpa perubahan URL yg kelihatan), middleware
    // masih anggap "belum login" & redirect balik ke /login lagi.
    //
    // Hard navigation MENGHINDARI race ini SEPENUHNYA -- browser bikin
    // request SSR BARU dgn cookie sesi yg SUDAH pasti ke-set (Set-Cookie
    // dari respons login SELALU tersedia utk request BERIKUTNYA), server
    // render halaman tujuan LANGSUNG dgn sesi yg benar, TANPA butuh
    // client-side state sync sama sekali.
    window.location.href = callbackUrl
  } catch (err: any) {
    error.value = err?.data?.statusMessage || err?.data?.message || "Terjadi kesalahan saat login. Coba lagi."
    loading.value = false
  }
}
</script>

<template>
  <div class="grid min-h-screen lg:grid-cols-2">
    <!-- Sisi kiri -- signature "scan pulse" -->
    <div class="relative hidden overflow-hidden bg-background lg:flex lg:flex-col lg:justify-between lg:p-10">
      <div
        class="pointer-events-none absolute inset-0 opacity-[0.07]"
        :style="{
          backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--primary)) 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }"
      />
      <div class="relative z-10 flex items-center gap-2">
        <div class="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15">
          <Network class="h-4 w-4 text-primary" />
        </div>
        <span class="font-display text-sm font-semibold tracking-tight">NUXTADMS</span>
      </div>

      <div class="relative z-10 flex flex-1 items-center justify-center">
        <div class="relative flex h-64 w-64 items-center justify-center">
          <span class="scan-ring" :style="{ animationDelay: '0s' }" />
          <span class="scan-ring" :style="{ animationDelay: '0.7s' }" />
          <span class="scan-ring" :style="{ animationDelay: '1.4s' }" />
          <div class="relative z-10 flex h-24 w-24 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
            <Network class="h-10 w-10 text-primary" :stroke-width="1.25" />
          </div>
        </div>
      </div>

      <div class="relative z-10 max-w-sm">
        <p class="font-display text-xl font-semibold leading-snug tracking-tight text-foreground">
          IT Infrastructure Management, dalam satu konsol.
        </p>
        <p class="mt-2 text-sm text-muted-foreground">
          Active Directory, jaringan, mail server, device fingerprint, dan absensi mobile —
          termonitor & terkelola real-time dalam satu tempat.
        </p>
      </div>
    </div>

    <!-- Sisi kanan -- form login -->
    <div class="flex items-center justify-center p-6 sm:p-10">
      <div class="w-full max-w-sm">
        <div class="mb-8 flex items-center gap-2 lg:hidden">
          <div class="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15">
            <Network class="h-4 w-4 text-primary" />
          </div>
          <span class="font-display text-sm font-semibold tracking-tight">NUXTADMS</span>
        </div>

        <h1 class="font-display text-2xl font-semibold tracking-tight">Masuk ke konsol</h1>
        <p class="mt-1 text-sm text-muted-foreground">Pakai akun staff yang sudah terdaftar di sistem.</p>

        <form class="mt-8 space-y-4" @submit.prevent="handleSubmit">
          <div v-if="error" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {{ error }}
          </div>
          <div class="space-y-1.5">
            <Label for="username">Username</Label>
            <Input id="username" v-model="username" autofocus autocomplete="username" required />
          </div>
          <div class="space-y-1.5">
            <Label for="password">Password</Label>
            <Input id="password" v-model="password" type="password" autocomplete="current-password" required />
          </div>
          <Button type="submit" class="w-full" :disabled="loading">
            <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
            <template v-else>Masuk <ArrowRight class="h-3.5 w-3.5" /></template>
          </Button>
        </form>

        <p class="mt-8 text-center text-[11px] text-muted-foreground">
          © {{ new Date().getFullYear() }} NUXTADMS — IT Infrastructure Management
        </p>
      </div>
    </div>
  </div>
</template>

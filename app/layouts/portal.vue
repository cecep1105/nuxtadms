<script setup lang="ts">
/**
 * Layout Portal (user non-staff) -- TANPA sidebar, cuma header + area
 * konten max-width center (SAMA persis versi Next.js:
 * (portal)/layout.tsx). BEDA dari layout.tsx Next.js yang WAJIB
 * bungkus NetmgmtWsProvider secara eksplisit di sini (React Context
 * per route group) -- di Nuxt TIDAK PERLU: plugin netmgmt-ws.client.ts
 * & iclock-ws.client.ts SUDAH terpasang GLOBAL (app-wide) sejak app
 * start, halaman/komponen mana pun (staff ATAU portal) tinggal pakai
 * useNetmgmtWsMessage()/useIclockWsMessage() langsung, TIDAK perlu
 * wrapper provider terpisah per area.
 */
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <PortalHeader />
    <main class="mx-auto w-full max-w-3xl flex-1 p-4 sm:max-w-5xl sm:p-6">
      <slot />
    </main>
  </div>
</template>

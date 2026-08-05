<script setup lang="ts">
const { user } = useUserSession()
</script>

<template>
  <div>
    <div class="mb-1">
      <h1 class="font-display text-xl font-semibold tracking-tight">
        Selamat datang, {{ user?.full_name || user?.username }}
      </h1>
      <p class="text-sm text-muted-foreground">Ringkasan cepat infrastruktur IT yang dikelola NUXTADMS.</p>
    </div>

    <div class="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Card class="p-4">
        <p class="text-xs text-muted-foreground">Modul fondasi</p>
        <p class="mt-1 font-display text-2xl font-semibold">2</p>
        <p class="mt-1 text-xs text-muted-foreground">Active Device &amp; Manajemen User -- porting bertahap dari NEXTADMS.</p>
      </Card>
    </div>
  </div>
</template>

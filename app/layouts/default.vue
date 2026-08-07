<script setup lang="ts">
/**
 * Layout dashboard staff -- SAMA struktur dgn (dashboard)/layout.tsx
 * versi Next.js (Sidebar + Topbar + area konten). PENTING: TIDAK ada
 * padding tambahan di sini -- <Sidebar> SUDAH mereservasi ruangnya
 * sendiri lewat flexbox (w-60/w-14, shrink-0), sama catatan yang ada
 * di versi Next.js soal celah kosong kalau ditambah padding di sini JUGA.
 */
</script>

<template>
  <TooltipProvider>
    <div class="flex min-h-screen">
      <Sidebar />
      <div class="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main class="flex-1 p-3 sm:p-5">
          <slot />
        </main>
      </div>
    </div>
  </TooltipProvider>
</template>

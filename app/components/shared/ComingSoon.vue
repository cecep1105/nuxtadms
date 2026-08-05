<script setup lang="ts">
/**
 * Placeholder utk halaman yang RUTE-nya SUDAH ada di sidebar (jadi
 * navigasi & struktur menu lengkap bisa langsung dites), TAPI
 * konten sungguhannya BELUM diporting -- menyusul bertahap. SATU
 * komponen dipakai ULANG di semua stub, cuma judul & deskripsi yang
 * beda per halaman.
 */
defineProps<{ title: string; description?: string }>()
</script>

<template>
  <div>
    <PageHeader :title="title" :description="description" />
    <Card class="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <p class="text-sm font-medium text-muted-foreground">Halaman ini belum diporting ke NUXTADMS</p>
      <p class="max-w-sm text-xs text-muted-foreground">
        Rute & menu sidebar sudah tersedia -- kontennya menyusul secara bertahap sesuai prioritas.
      </p>
    </Card>
  </div>
</template>

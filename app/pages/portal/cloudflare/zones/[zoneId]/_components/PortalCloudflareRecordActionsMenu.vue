<script setup lang="ts">
import { Pencil } from "@lucide/vue"
import type { CloudflareDnsRecord } from "#shared/types/api"

/**
 * Versi PORTAL dari CloudflareRecordActionsMenu (staff) -- HANYA
 * tombol Edit, TIDAK ADA tombol Hapus (SENGAJA, sesuai batasan yg
 * disepakati: portal boleh tambah/edit DNS record, TIDAK BOLEH
 * hapus). CloudflareRecordFormDialog DIPAKAI ULANG APA ADANYA dari
 * staff (sudah auto-terdaftar global lewat pola scanning _components/,
 * TIDAK perlu dipindah/diduplikasi) -- generik, endpoint yang
 * dipanggilnya SUDAH diperluas permission-nya terima izin portal
 * can_view_cloudflare utk action edit.
 */
defineProps<{ zoneId: string; record: CloudflareDnsRecord }>()
const editOpen = ref(false)
</script>

<template>
  <div class="flex justify-end">
    <Button variant="ghost" size="icon" aria-label="Edit" @click="editOpen = true"><Pencil class="h-3.5 w-3.5" /></Button>
  </div>
  <CloudflareRecordFormDialog mode="edit" :zone-id="zoneId" :record="record" v-model:open="editOpen" />
</template>

<script setup lang="ts">
import { ArrowLeft, Printer } from "@lucide/vue"
import type { IDCardDetail, IDCardStatus } from "#shared/types/api"

const STATUS_VARIANT: Record<IDCardStatus, "success" | "secondary" | "destructive" | "warning"> = {
  belum_cetak: "secondary", sudah_cetak: "success", hilang: "destructive", cetak_ulang: "warning",
}

const route = useRoute()
const cardId = computed(() => Number(route.params.id))
const { request } = useApiClient()

const { data: card } = await useAsyncData(
  () => `idcard-card-detail-${cardId.value}`,
  () => request<IDCardDetail>(`/idcard/cards/${cardId.value}/`)
)
</script>

<template>
  <div v-if="card">
    <PageHeader :title="card.holder_name">
      <template #description>
        <NuxtLink to="/idcard/cards" class="inline-flex items-center gap-1 text-primary hover:underline">
          <ArrowLeft class="h-3 w-3" /> Kembali ke Daftar Kartu
        </NuxtLink>
      </template>
      <template #action>
        <div class="flex gap-2">
          <Button variant="outline" size="sm" as-child>
            <a :href="`/idcard-print/${card.id}`" target="_blank" rel="noopener noreferrer"><Printer class="h-3.5 w-3.5" /> Cetak Kartu</a>
          </Button>
          <ChangeStatusButton :card-id="card.id" :current-status="card.status" />
          <DeleteCardButton :card-id="card.id" :holder-name="card.holder_name" />
        </div>
      </template>
    </PageHeader>

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card class="flex flex-col items-center gap-3 p-4 lg:col-span-1">
        <img :src="resolveMediaUrl(card.card_image)" :alt="card.holder_name" class="w-full max-w-[220px] rounded-md border border-border shadow-sm" />
        <div class="w-full space-y-1.5 text-sm">
          <div class="flex justify-between"><span class="text-muted-foreground">Jenis</span><Badge variant="secondary">{{ card.card_type_label }}</Badge></div>
          <div class="flex justify-between"><span class="text-muted-foreground">PIN/No. Identitas</span><span class="font-mono">{{ card.holder_identifier || "-" }}</span></div>
          <div class="flex justify-between"><span class="text-muted-foreground">Template</span><span>{{ card.template_name }}</span></div>
          <div class="flex justify-between"><span class="text-muted-foreground">Sumber Foto</span><span class="capitalize">{{ card.photo_source }}</span></div>
          <div class="flex justify-between"><span class="text-muted-foreground">Status Saat Ini</span><Badge :variant="STATUS_VARIANT[card.status]">{{ card.status_label }}</Badge></div>
          <div class="flex justify-between"><span class="text-muted-foreground">Dibuat</span><span>{{ new Date(card.generated_at).toLocaleString("id-ID") }}</span></div>
        </div>
      </Card>

      <Card class="p-4 lg:col-span-2">
        <h3 class="mb-3 text-sm font-semibold">Riwayat Status</h3>
        <p v-if="!card.logs.length" class="text-sm text-muted-foreground">Belum ada riwayat.</p>
        <div v-else class="space-y-3">
          <div v-for="log in card.logs" :key="log.id" class="flex gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
            <Badge :variant="STATUS_VARIANT[log.status]" class="mt-0.5 shrink-0">{{ log.status_label }}</Badge>
            <div class="min-w-0 flex-1">
              <p v-if="log.notes" class="text-sm">{{ log.notes }}</p>
              <p class="text-xs text-muted-foreground">
                {{ new Date(log.changed_at).toLocaleString("id-ID") }}
                <template v-if="log.changed_by_username"> — oleh {{ log.changed_by_username }}</template>
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

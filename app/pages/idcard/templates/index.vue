<script setup lang="ts">
import type { IDCardTemplate } from "#shared/types/api"

const CARD_TYPE_LABEL: Record<string, string> = { karyawan: "Karyawan", driver: "Driver", visitor: "Visitor", bhl: "BHL" }

const { request } = useApiClient()
const { data: templates, pending, error } = await useAsyncData("idcard-templates", () => request<IDCardTemplate[]>("/idcard/templates/"))
</script>

<template>
  <div>
    <PageHeader title="Template ID Card" description="Gambar background per jenis kartu -- posisi foto & teks di atasnya sudah ditentukan (fixed), tidak perlu diatur di sini.">
      <template #action><AddTemplateButton /></template>
    </PageHeader>
    <Card>
      <div v-if="pending" class="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
      <div v-else-if="error" class="p-8 text-center text-sm text-destructive">Gagal memuat data: {{ error.message }}</div>
      <Table v-else>
        <TableHeader>
          <TableRow><TableHead>Preview</TableHead><TableHead>Jenis Kartu</TableHead><TableHead>Nama Template</TableHead><TableHead>Status</TableHead><TableHead class="text-right">Aksi</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="!templates?.length">
            <TableCell :colspan="5" class="py-8 text-center text-muted-foreground">Belum ada template. Tambahkan template pertama Anda.</TableCell>
          </TableRow>
          <TableRow v-for="tmpl in templates" :key="tmpl.id" v-else>
            <TableCell><img :src="resolveMediaUrl(tmpl.background_image)" :alt="tmpl.name" class="h-20 w-14 rounded border border-border object-cover" /></TableCell>
            <TableCell><Badge variant="secondary">{{ CARD_TYPE_LABEL[tmpl.card_type] ?? tmpl.card_type }}</Badge></TableCell>
            <TableCell class="font-medium">{{ tmpl.name }}</TableCell>
            <TableCell>
              <Badge v-if="tmpl.is_active" variant="success">Aktif</Badge>
              <Badge v-else variant="secondary">Nonaktif</Badge>
            </TableCell>
            <TableCell>
              <div class="flex justify-end"><TemplateActionsMenu :template="tmpl" /></div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>
  </div>
</template>

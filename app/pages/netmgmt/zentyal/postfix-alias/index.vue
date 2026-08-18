<script setup lang="ts">
import type { Paginated, MailPostfixAlias } from "#shared/types/api"

const PAGE_SIZE = 10
const route = useRoute()
const { request } = useApiClient()

const pageSize = computed(() => Number(route.query.page_size ?? PAGE_SIZE))
const query = computed(() => {
  const params = new URLSearchParams()
  if (route.query.sortBy) params.set("_sort_by", String(route.query.sortBy))
  if (route.query.sortDir) params.set("_order", String(route.query.sortDir))
  if (route.query.q) params.set("_q", String(route.query.q))
  if (route.query.page) params.set("_page", String(route.query.page))
  params.set("_limit", String(pageSize.value))
  params.set("_search_fields", "uid,mail,maildrop")
  return params.toString()
})

const currentAlias = ref('recipient_bcc')

const { data, pending, error } = await useAsyncData(
  "zentyal-recipient-bcc",
  () => request<Paginated<MailPostfixAlias>>(`/netmgmt/zentyal/postfix-alias/${currentAlias.value}/?${query.value}`),
  { watch: [query,currentAlias] }
)
</script>

<template>
  <div>
    <PageHeader title="NetMgmt / Zentyal / Postfix Alias" description="Daftar email alias - termasuk untuk autoforward atau auto bcc">
      <template #action><AddPostfixAliasDialog :alias-name="currentAlias" :current-alias-list="data?.results?.map((m) => m.mail) ?? []" /></template>
    </PageHeader>

    <Card>

      <div class="flex items-center justify-between border-b border-border p-3">
        <SearchBar placeholder="Cari uid / mail / maildrop" />
      <PostfixAliasSelector v-model="currentAlias"  :current="currentAlias" :sources="['mailalias','recipient_bcc','sender_bcc']" />

      </div>

      <div v-if="pending" class="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
      <div v-else-if="error" class="p-8 text-center text-sm text-destructive">Gagal memuat data: {{ error.message }}</div>
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead><RouterOSSortableHeader column-key="uid" label="UID" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="mail" label="Email diforward" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="maidrop" label="Email penerima" /></TableHead>
            <TableHead class="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="!data?.results.length">
            <TableCell :colspan="7" class="py-8 text-center text-muted-foreground">Tidak ada user ditemukan.</TableCell>
          </TableRow>
          <TableRow v-for="alias in data?.results" :key="alias.uid" v-else>
            <TableCell class="text-muted-foreground">{{ alias.uid }}</TableCell>
            <TableCell class="text-muted-foreground">{{ alias.mail }}</TableCell>
            <TableCell class="text-muted-foreground"><ListTooltip :items="alias.maildrop" /></TableCell>
            <TableCell>
              <div class="flex justify-end">
                <PostfixAliasActions :mail="alias.mail" :aliasName="currentAlias" />
                <!-- <ZentyalAliasActionsMenu :user-dn="alias.uid" :user-label="alias.mail || alias.uid" /> -->
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <PaginationBar v-if="!pending && !error" :count="data?.count ?? 0" :page-size="pageSize" :current-page="Number(route.query.page ?? '1')" />
    </Card>
  </div>
</template>

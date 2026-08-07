<script setup lang="ts">
import { ChevronRight } from "@lucide/vue"
import type { VsphereVm } from "#shared/types/api"

function formatMemory(mib: number): string {
  if (mib >= 1024) return `${(mib / 1024).toFixed(1)} GB`
  return `${mib} MB`
}

const route = useRoute()
const { data: vmsData, pending, error } = await useAsyncData("vmware-vms-raw", () => $fetch<{ value: VsphereVm[] }>("/api/vsphere/vm"))
const allVms = computed(() => vmsData.value?.value ?? [])
// Dihitung dari SELURUH VM (SEBELUM dipaginasi/difilter) -- angka
// ringkasan global, TIDAK berubah tergantung halaman/pencarian aktif.
const poweredOnCount = computed(() => allVms.value.filter((vm) => vm.power_state === "POWERED_ON").length)

const page = computed(() => Number(route.query.page ?? "1"))
const pageSize = computed(() => Number(route.query.page_size ?? 10))
const sortBy = computed(() => (route.query.sortBy as string) || "name")
const sortDir = computed<"asc" | "desc">(() => (route.query.sortDir === "desc" ? "desc" : "asc"))
const searchQuery = computed(() => ((route.query.q as string) ?? "").trim().toLowerCase())

const data = computed(() => paginateSortFilter(allVms.value as unknown as Record<string, unknown>[], {
  page: page.value, pageSize: pageSize.value, sortBy: sortBy.value, sortDir: sortDir.value,
  searchQuery: searchQuery.value, searchFields: ["name", "power_state"],
}))
</script>

<template>
  <div>
    <PageHeader title="NetMgmt / VMware / VM Guest" :description="`Virtual machine di vCenter (${allVms.length} VM, ${poweredOnCount} powered on).`" />
    <Card>
      <div class="border-b border-border p-3">
        <SearchBar placeholder="Cari nama VM" />
      </div>

      <div v-if="pending" class="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
      <div v-else-if="error" class="p-8 text-center text-sm text-destructive">Gagal memuat data: {{ error.message }}</div>
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead><RouterOSSortableHeader column-key="name" label="Nama" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="power_state" label="Power State" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="cpu_count" label="CPU" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="memory_size_MiB" label="Memory" /></TableHead>
            <TableHead class="text-right">Detail</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="!data.results.length">
            <TableCell :colspan="5" class="py-8 text-center text-muted-foreground">Tidak ada VM ditemukan.</TableCell>
          </TableRow>
          <TableRow v-for="vm in (data.results as unknown as VsphereVm[])" :key="vm.vm" v-else>
            <TableCell class="font-medium">{{ vm.name }}</TableCell>
            <TableCell><Badge :variant="vm.power_state === 'POWERED_ON' ? 'success' : 'secondary'">{{ vm.power_state }}</Badge></TableCell>
            <TableCell class="text-muted-foreground">{{ vm.cpu_count }} vCPU</TableCell>
            <TableCell class="text-muted-foreground">{{ formatMemory(vm.memory_size_MiB) }}</TableCell>
            <TableCell>
              <div class="flex justify-end">
                <NuxtLink :to="`/netmgmt/vmware/vms/${vm.vm}`" class="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                  Detail <ChevronRight class="h-3 w-3" />
                </NuxtLink>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <PaginationBar v-if="!pending && !error" :count="data.count" :page-size="pageSize" :current-page="page" />
    </Card>
  </div>
</template>

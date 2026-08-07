<script setup lang="ts">
import { ArrowLeft, Monitor, HardDrive, Database } from "@lucide/vue"
import type { VmwareVmDetail } from "#shared/types/api"

// PENTING: halaman ini panggil DJANGO (useApiClient, SOAP API via
// pyVmomi) -- BEDA dari halaman List (server route lokal, REST API
// langsung ke vCenter). Detail per-VM (guest OS/IP/tools status + disk
// & datastore) butuh BANYAK property sekaligus -- REST API perlu
// request TERPISAH per jenis detail (N+1), SOAP PropertyCollector di
// Django ambil semua dlm 1 round-trip.
const TOOLS_STATUS_LABEL: Record<string, string> = {
  toolsOk: "Running", toolsOld: "Perlu Update", toolsNotRunning: "Tidak Berjalan", toolsNotInstalled: "Belum Terinstall",
}

const route = useRoute()
const vmId = computed(() => route.params.vmId as string)
const { request } = useApiClient()

const { data: vm } = await useAsyncData(
  () => `vmware-vm-detail-${vmId.value}`,
  () => request<VmwareVmDetail>(`/netmgmt/vmware/vm-detail/?vm=${encodeURIComponent(vmId.value)}`)
)
</script>

<template>
  <div v-if="vm">
    <PageHeader :title="`NetMgmt / VMware / VM Guest / ${vm.name}`">
      <template #description>
        <NuxtLink to="/netmgmt/vmware/vms" class="inline-flex items-center gap-1 text-primary hover:underline">
          <ArrowLeft class="h-3 w-3" /> Kembali ke Daftar VM
        </NuxtLink>
      </template>
      <template #action>
        <div class="flex items-center gap-2">
          <RemoteGuestButton :vm-id="vm.vm" />
          <RebootButton :vm-id="vm.vm" />
        </div>
      </template>
    </PageHeader>

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card class="p-4">
        <div class="mb-3 flex items-center gap-2 text-sm font-semibold"><Monitor class="h-4 w-4" /> Guest OS &amp; Status</div>
        <dl class="space-y-2 text-sm">
          <div class="flex justify-between"><dt class="text-muted-foreground">Power State</dt><dd><Badge :variant="vm.power_state === 'poweredOn' ? 'success' : 'secondary'">{{ vm.power_state }}</Badge></dd></div>
          <div class="flex justify-between"><dt class="text-muted-foreground">Guest OS</dt><dd class="text-right">{{ vm.guest_full_name ?? "-" }}</dd></div>
          <div class="flex justify-between"><dt class="text-muted-foreground">Hostname</dt><dd class="font-mono">{{ vm.guest_hostname ?? "-" }}</dd></div>
          <div class="flex justify-between"><dt class="text-muted-foreground">IP Address</dt><dd class="font-mono">{{ vm.guest_ip_address ?? "-" }}</dd></div>
          <div class="flex justify-between">
            <dt class="text-muted-foreground">VMware Tools</dt>
            <dd><Badge :variant="vm.tools_status === 'toolsOk' ? 'success' : 'warning'">{{ vm.tools_status ? (TOOLS_STATUS_LABEL[vm.tools_status] ?? vm.tools_status) : "-" }}</Badge></dd>
          </div>
          <div class="flex justify-between"><dt class="text-muted-foreground">vCPU</dt><dd>{{ vm.num_cpu ?? "-" }}</dd></div>
          <div class="flex justify-between"><dt class="text-muted-foreground">Memory</dt><dd>{{ vm.memory_mb ? `${(vm.memory_mb / 1024).toFixed(1)} GB` : "-" }}</dd></div>
        </dl>
      </Card>

      <Card class="p-4">
        <div class="mb-3 flex items-center gap-2 text-sm font-semibold"><HardDrive class="h-4 w-4" /> Disk</div>
        <p v-if="!vm.disks.length" class="text-sm text-muted-foreground">Tidak ada disk terdeteksi.</p>
        <Table v-else>
          <TableHeader>
            <TableRow><TableHead>Label</TableHead><TableHead>Kapasitas</TableHead><TableHead>Provisioning</TableHead><TableHead>Datastore</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="(disk, i) in vm.disks" :key="i">
              <TableCell class="font-medium">{{ disk.label }}</TableCell>
              <TableCell class="text-muted-foreground">{{ disk.capacity_gb }} GB</TableCell>
              <TableCell class="text-muted-foreground">{{ disk.thin_provisioned ? "Thin" : "Thick" }}</TableCell>
              <TableCell class="text-muted-foreground">{{ disk.datastore_name ?? "-" }}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>

      <Card class="p-4 lg:col-span-2">
        <div class="mb-3 flex items-center gap-2 text-sm font-semibold"><Database class="h-4 w-4" /> Datastore Usage</div>
        <p v-if="!vm.datastores.length" class="text-sm text-muted-foreground">Tidak ada datastore terdeteksi.</p>
        <Table v-else>
          <TableHeader>
            <TableRow><TableHead>Nama</TableHead><TableHead>Tipe</TableHead><TableHead>Kapasitas</TableHead><TableHead>Ruang Tersisa</TableHead><TableHead>Terpakai</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="(ds, i) in vm.datastores" :key="i">
              <TableCell class="font-medium">{{ ds.name }}</TableCell>
              <TableCell class="text-muted-foreground">{{ ds.type }}</TableCell>
              <TableCell class="text-muted-foreground">{{ ds.capacity_gb }} GB</TableCell>
              <TableCell class="text-muted-foreground">{{ ds.free_space_gb }} GB</TableCell>
              <TableCell>
                <Badge :variant="Math.round(((ds.capacity_gb - ds.free_space_gb) / (ds.capacity_gb || 1)) * 100) >= 90 ? 'destructive' : Math.round(((ds.capacity_gb - ds.free_space_gb) / (ds.capacity_gb || 1)) * 100) >= 75 ? 'warning' : 'secondary'">
                  {{ Math.round(((ds.capacity_gb - ds.free_space_gb) / (ds.capacity_gb || 1)) * 100) }}%
                </Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </div>
  </div>
</template>

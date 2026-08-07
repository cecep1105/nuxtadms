<script setup lang="ts">
import { Users } from "@lucide/vue"

defineProps<{ source: "ad" | "zentyal"; groupDn: string; groupName: string }>()
const open = ref(false)
</script>

<template>
  <Button variant="ghost" size="sm" @click="open = true"><Users class="h-3.5 w-3.5" /> Kelola Member</Button>
  <GroupMembersDialog :source="source" :group-dn="groupDn" :group-name="groupName" v-model:open="open" />
</template>

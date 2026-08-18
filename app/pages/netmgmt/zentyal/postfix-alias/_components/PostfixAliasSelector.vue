<script setup lang="ts">

const props = defineProps<{ current: string; sources: string[] }>()
const route = useRoute()
const router = useRouter()

function handleChange(slug: string) {
  router.push({ query: { ...route.query, source: slug, page: undefined, q: undefined } })
}
</script>

<template>
  <Select :model-value="current" @update:model-value="(v) => handleChange(String(v))">
    <SelectTrigger class="w-56"><SelectValue placeholder="Pilih nama alias" /></SelectTrigger>
    <SelectContent>
      <SelectItem v-for="s in sources" :key="s" :value="s">{{ s }}</SelectItem>
    </SelectContent>
  </Select>
</template>

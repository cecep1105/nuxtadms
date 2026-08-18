<script setup lang="ts">
import { ref, watch } from 'vue'
import { Check, ChevronsUpDown } from '@lucide/vue'
import { useDebounceFn } from '@vueuse/core'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { DirectoryUser, MailPostfixAlias } from "#shared/types/api"


const props = defineProps<{
  modelValue?: string,
  source: "ad" | "zentyal"; 
  excludeFilter: string[];
}>()
const modelValue = defineModel<string>({ default: '' })

const { request } = useApiClient()
const users = ref<DirectoryUser[]>([])

const open = ref(false)
const searchQuery = ref('')
const selectedEmail = ref('')
const loading = ref(false)

// Debounced fetch function to query LDAP server route
const fetchLdapUsers = useDebounceFn(async (query: string) => {
  if (!query || query.length < 2) {
    users.value = []
    return
  }
  
  loading.value = true
  try {
    const data = await request<{ results: DirectoryUser[] }>(`/netmgmt/${props.source}/users/?_q=${encodeURIComponent(query)}&_search_fields=email&_limit=8`)
    users.value = data.results.filter(f=>!props.excludeFilter.includes(f.email)) ?? []

    open.value = data.results.length > 0
  } finally {
    loading.value = false
  }
}, 300)



let debounceHandle: ReturnType<typeof setTimeout> | undefined
watch(searchQuery, (q) => {
  if (debounceHandle) clearTimeout(debounceHandle)
  if (q.trim().length < 2) {
    users.value = []
    return
  }
  debounceHandle = setTimeout(async () => {
    loading.value = true
    try {
      const data = await request<{ results: DirectoryUser[] }>(`/netmgmt/${props.source}/users/?_q=${encodeURIComponent(q)}&_search_fields=email&_limit=8`)
      users.value = data.results.filter(f=>!props.excludeFilter.includes(f.email)) ?? []

      open.value = data.results.length > 0
    } finally {
      loading.value = false
    }
  }, 350)
})



// watch(searchQuery, (newVal) => {
//   modelValue.value = newVal // sync free-form typing immediately
//   fetchLdapUsers(newVal)
//   if (!open.value) open.value = true
// })

const selectUser = (email: string) => {
  searchQuery.value = email
  modelValue.value = email
  open.value = false
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <div class="relative w-full">
        <Input
          v-model="searchQuery"
          type="email"
          placeholder="Search corporate email..."
          class="w-full"
        />
      </div>
    </PopoverTrigger>
    <PopoverContent class="w-[--radix-popover-trigger-width] p-0" align="start">
      <Command>
        <CommandList>
          <CommandEmpty>{{ loading ? 'Searching LDAP...' : 'No user found.' }}</CommandEmpty>
          <CommandGroup>
            <CommandItem
              v-for="user in users"
              :key="user.email"
              :value="user.email"
              @select="selectUser(user.email)"
            >
              <div class="flex flex-col">
                <span>{{ user.email }}</span>
                <span class="text-xs text-muted-foreground">{{ user.name }}</span>
              </div>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>

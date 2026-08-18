<script setup lang="ts">
const props = defineProps<{ items: string[] }>()
</script>

<template>
  <span v-if="items.length === 1" class="text-muted-foreground">{{ items[0] || "-" }}</span>
    <Tooltip v-else>
      <TooltipTrigger as-child>
        <span class="cursor-help hover:bg-yellow-100 hover:text-black">
          {{ items[0] }} + {{ items.length -1 }} lainnya
        </span>
      </TooltipTrigger>

      <TooltipContent class="bg-yellow-100" side="left">
        <div class="max-h-60 max-w-md space-y-1 overflow-y-auto text-foreground">
          <p
            v-for="item in items"
            :key="item"
            class="break-all text-xs dark:text-black"
          >
            {{ item }}
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
</template>

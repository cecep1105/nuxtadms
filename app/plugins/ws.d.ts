import type { WsConnectionStatus, WsMessage } from "~/composables/createWsConnection"

interface WsConnection {
  status: Readonly<import("vue").Ref<WsConnectionStatus>>
  subscribe: (listener: (msg: WsMessage) => void) => () => void
  cleanup: () => void
}

declare module "#app" {
  interface NuxtApp {
    $netmgmtWs: WsConnection
    $iclockWs: WsConnection
  }
}

declare module "vue" {
  interface ComponentCustomProperties {
    $netmgmtWs: WsConnection
    $iclockWs: WsConnection
  }
}

export {}

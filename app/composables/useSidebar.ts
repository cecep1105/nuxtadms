/**
 * State collapse/expand sidebar, dipersist ke localStorage -- SAMA
 * pola dgn sidebar-context.tsx versi Next.js. useLocalStorage (VueUse)
 * SUDAH menangani SSR/hydration dgn aman, TIDAK perlu manual "mounted"
 * check spt versi React.
 */
export function useSidebar() {
  const collapsed = useLocalStorage("nuxtadms:sidebar-collapsed", false)

  function toggle() {
    collapsed.value = !collapsed.value
  }

  return { collapsed, toggle }
}

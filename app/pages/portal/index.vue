<script setup lang="ts">
import {
  UserCircle, KeyRound, Fingerprint, CalendarClock, UtensilsCrossed, Truck, Router,
  ShieldCheck, Radar, Users, LockKeyhole, Globe, UsersRound, Mail, Database,
  CalendarDays, CreditCard, HardDrive,
} from "@lucide/vue"
import type { DjangoApiUser } from "#shared/types/api"

/**
 * Halaman hub Portal -- grid kartu menu, TIAP kartu permission-gated
 * lewat flag can_view_* di DjangoApiUser (lihat iclock/models.py::
 * FeaturePermission) -- URUTAN kartu di sini SENGAJA disamakan PERSIS
 * dgn versi Next.js (portal/page.tsx), BUKAN alfabetis/acak, supaya
 * user yang sudah biasa pakai versi lama tidak bingung posisi menu
 * berpindah.
 */
definePageMeta({ layout: "portal" })

const { request } = useApiClient()
const { data: user } = await useAsyncData("portal-home-me", () => request<DjangoApiUser>("/me/"))
</script>

<template>
  <div v-if="user">
    <div class="mb-6">
      <h1 class="font-display text-xl font-semibold tracking-tight">Halo, {{ user.full_name?.trim() || user.username }}</h1>
      <p class="mt-1 text-sm text-muted-foreground">Pilih menu di bawah untuk melanjutkan.</p>
    </div>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      <PortalActionCard
        v-if="user.has_employee_link" href="/portal/my-attendance" :icon="CalendarDays"
        title="My Attendance" description="Lihat riwayat absensi Anda sendiri, per bulan."
      />
      <PortalActionCard
        href="/portal/profile" :icon="UserCircle"
        title="Profil Saya" description="Lihat & ubah informasi akun Anda."
      />
      <PortalActionCard
        href="/portal/profile/password" :icon="KeyRound"
        title="Ganti Password" description="Perbarui password login Anda."
      />
      <PortalActionCard
        v-if="user.can_transfer_finger" href="/portal/transfer-finger" :icon="Fingerprint"
        title="Transfer Data Finger" description="Pindahkan data fingerprint karyawan ke pool/device tujuan."
      />
      <PortalActionCard
        v-if="user.can_view_attendance_recap" href="/portal/attendance-recap?recap_type=all" :icon="CalendarClock"
        title="Rekap Absensi - All" description="Lihat rekap kehadiran seluruh karyawan per tanggal."
      />
      <PortalActionCard
        v-if="user.can_view_attendance_recap_kantin" href="/portal/attendance-recap?recap_type=kantin" :icon="UtensilsCrossed"
        title="Rekap Absensi - Kantin" description="Rekap kehadiran khusus device/lokasi ber-function KANTIN."
      />
      <PortalActionCard
        v-if="user.can_view_attendance_recap_driver" href="/portal/attendance-recap?recap_type=driver" :icon="Truck"
        title="Rekap Absensi - Driver" description="Rekap kehadiran khusus karyawan berkode function Driver."
      />
      <PortalActionCard
        v-if="user.can_view_dhcp_lease" href="/portal/dhcp-lease" :icon="Router"
        title="DHCP Lease" description="Lihat daftar IP yang sedang disewa device di jaringan."
      />
      <PortalActionCard
        v-if="user.can_view_fwfilter" href="/portal/fwfilter" :icon="ShieldCheck"
        title="Firewall Filter" description="Lihat rule firewall & berikan akses internet untuk device baru."
      />
      <PortalActionCard
        v-if="user.can_view_netwatch" href="/portal/netwatch" :icon="Radar"
        title="Netwatch" description="Pantau status host & kelola host yang dipantau."
      />
      <PortalActionCard
        v-if="user.can_view_ad_users" href="/portal/ad-users" :icon="Users"
        title="Active Directory - Users" description="Lihat daftar user, aktif/nonaktifkan akun, reset password."
      />
      <PortalActionCard
        v-if="user.can_view_ad_locked_users" href="/portal/ad-locked-users" :icon="LockKeyhole"
        title="Active Directory - Locked Users" description="Lihat & buka kunci akun yang terkunci otomatis."
      />
      <PortalActionCard
        v-if="user.can_view_ad_dns" href="/portal/ad-dns" :icon="Globe"
        title="Active Directory - DNS" description="Lihat zone & record DNS yang terdaftar."
      />
      <PortalActionCard
        v-if="user.can_view_ad_groups" href="/portal/ad-groups" :icon="UsersRound"
        title="Active Directory - Groups" description="Lihat daftar group & jumlah anggotanya."
      />
      <PortalActionCard
        v-if="user.can_view_zentyal_users" href="/portal/mail-users" :icon="Mail"
        title="Mail Server - Users" description="Lihat daftar user email, aktif/nonaktifkan akun, reset password."
      />
      <PortalActionCard
        v-if="user.can_view_zentyal_groups" href="/portal/mail-groups" :icon="UsersRound"
        title="Mail Server - Groups" description="Lihat daftar group email & jumlah anggotanya."
      />
      <PortalActionCard
        v-if="user.can_view_cloudflare" href="/portal/cloudflare/zones" :icon="Globe"
        title="Cloudflare" description="Lihat & kelola DNS record (tambah/edit, tanpa hapus)."
      />
      <PortalActionCard
        v-if="user.can_view_itinfra" href="/portal/it-infra" :icon="Database"
        title="Data IT-Infra" description="Lihat data infrastruktur (langganan internet, VPS, domain, dll)."
      />
      <PortalActionCard
        v-if="user.can_view_idcard" href="/portal/idcard-generate" :icon="CreditCard"
        title="ID Card" description="Generate kartu ID (Karyawan/Driver/Visitor/BHL) & lihat daftar kartu."
      />
      <PortalActionCard
        v-if="user.can_view_active_device" href="/portal/active-device" :icon="HardDrive"
        title="Active Device" description="Lihat device fingerprint, sync jam, live log, & transfer finger dari device."
      />
    </div>
  </div>
</template>

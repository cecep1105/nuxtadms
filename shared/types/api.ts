/**
 * Tipe data API -- starter set utk modul fondasi (Dashboard, Users).
 * Ditambah bertahap seiring modul baru diporting, SAMA pola dgn
 * types/api.ts versi Next.js -- di fondasi ini SENGAJA cuma bagian
 * yg relevan dulu.
 */

export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

/** Bentuk pagination KHUSUS UserViewSet -- BEDA dari Paginated<T> standar. */
export interface UserListPaginated<T> {
  count: number
  num_pages: number
  current_page: number
  results: T[]
}

export interface Transaction {
  id: number
  UserID: number
  EmployeeName: string | null
  EmployeePIN: string | null
  TTime: string
  State: string
  StateDisplay: string
  Verify: number
  VerifyDisplay: string
  SN: string | null
  Function: string | null
}

export interface OperationLog {
  id: number
  SN: string | null
  admin: number
  OP: number
  OpName: string
  OPTime: string
  Object: number | null
  Param1: number | null
  Param2: number | null
  Param3: number | null
}

export interface DeviceLog {
  id: number
  SN: string
  OP: string
  Object: string | null
  Cnt: number
  ECnt: number
  OpTime: string
}

export interface DeviceCommand {
  id: number
  SN: string
  CmdContent: string
  CmdCommitTime: string
  CmdTransTime: string | null
  CmdOverTime: string | null
  CmdReturn: string | null
  User: number | null
  Username: string | null
}

export interface RegisteredDevice {
  id: number
  SN: string
  Alias: string | null
  DeviceName: string | null
  DeptID: number | null
  DeptName: string | null
  Function: string | null
  IPAddress: string | null
  MAC: string | null
  IPRouter: string | null
  LastActivity: string | null
}

export interface Employee {
  id: number
  PIN: string
  EName: string | null
  DeptID: number | null
  DeptName: string | null
  SN: string | null
  Gender: string | null
  Title: string | null
  Card: string | null
  Privilege: number | null
  Tele: string | null
  Mobile: string | null
  Password?: string
  UTime: string | null
  LastVerify: number | null
  LastPool: string | null
  LastDevice: string | null
}

export interface MobilePool {
  PoolID: string
  PoolCode: string | null
  PoolName: string | null
  Latitude: string | null
  Longitude: string | null
  Radius: number | null
  SyncedAt: string | null
}

export interface MobilePoolLoc {
  id: number
  PoolID: string
  Urut: number
  Latitude: string
  Longitude: string
}

export interface PoolDeviceFunction {
  id: number
  PoolID: string
  function_type: "KANTIN" | "BUKAN_KANTIN"
  created_at: string
  updated_at: string
}

export interface AttendanceLog {
  id: number
  username: string
  timestamp: string
  check_type: string
  check_type_display: string
  pool_id: string | null
  pool_name: string | null
  location_verified: boolean
  face_verified: boolean
  face_distance: number | null
  qr_content: string | null
  Function: string | null
}

export interface FaceProfile {
  id: number
  pin: string
  employee_name: string | null
  is_locked: boolean
  enrolled_at: string
  updated_at: string
}

export interface MobileAttendanceSource {
  slug: string
  title: string
}

export interface MobileAttendanceRow {
  Id: number
  sn: string
  nik: string
  ttime: string
  ctype: string
  bProses: number
}

export interface CloudflareZone {
  id: string
  name: string
  status: string
  paused: boolean
}

export type CloudflareRecordType = "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "NS"

export interface CloudflareDnsRecord {
  id: string
  type: string
  name: string
  content: string
  ttl: number
  proxied: boolean
  proxiable: boolean
  priority: number | null
}

export type VsphereConnectionState = "CONNECTED" | "DISCONNECTED" | "NOT_RESPONDING"
export type VspherePowerState = "POWERED_ON" | "POWERED_OFF" | "SUSPENDED"

export interface VsphereHost {
  host: string
  name: string
  connection_state: VsphereConnectionState
  power_state: VspherePowerState
}

export interface VsphereVm {
  vm: string
  name: string
  power_state: VspherePowerState
  cpu_count: number
  memory_size_MiB: number
}

export interface VmwareDisk {
  label: string
  capacity_gb: number
  thin_provisioned: boolean
  datastore_name: string | null
}

export interface VmwareDatastore {
  name: string
  type: string
  capacity_gb: number
  free_space_gb: number
}

export interface VmwareVmDetail {
  vm: string
  name: string
  power_state: string
  guest_full_name: string | null
  guest_hostname: string | null
  guest_ip_address: string | null
  tools_status: string | null
  tools_running_status: string | null
  num_cpu: number | null
  memory_mb: number | null
  disks: VmwareDisk[]
  datastores: VmwareDatastore[]
}

export interface ITInfraCategory {
  id: number
  name: string
}

// Bentuk RINGKAS (list) -- SENGAJA TANPA field `data` (password dkk
// TIDAK ikut terkirim di endpoint list, cuma di endpoint detail).
export interface ITInfraEntrySummary {
  id: number
  category_id: number
  category_name: string
  name: string
  notes: string
  is_staff_only: boolean
  updated_at: string
}

// Bentuk LENGKAP (detail 1 entry) -- BARU py field `data`.
export interface ITInfraEntryDetail extends ITInfraEntrySummary {
  data: Record<string, string>
}

export interface DirectoryUser {
  dn: string
  username: string
  display_name: string
  email: string
  // Cuma ADA di AD (userAccountControl decoded) -- undefined utk Zentyal.
  is_enabled?: boolean
  // Cuma ADA di AD (lockoutTime decoded) -- TERKUNCI OTOMATIS krn salah
  // password berkali-kali, BEDA dari is_enabled (dinonaktifkan MANUAL).
  is_locked?: boolean
  locked_at?: string | null
  // Cuma ADA di Zentyal (posixAccount) -- undefined utk AD.
  uid_number?: string
  gid_number?: string
  home_directory?: string
}

export interface DirectoryGroup {
  dn: string
  name: string
  description: string
  member_count: number
  // Cuma ADA di Zentyal ('posix'|'distribution') -- undefined utk AD.
  kind?: "posix" | "distribution"
}

export type DnsZonePartition = "forest" | "domain" | "legacy"
export type DnsRecordType = "A" | "AAAA" | "CNAME" | "MX" | "SRV" | "TXT" | "NS" | "PTR"

export interface DnsZone {
  dn: string
  name: string
  partition: DnsZonePartition
}

// `data` bentuknya beda per `type` (A/AAAA: address, CNAME/NS/PTR:
// target, MX: preference+exchange, SRV: priority+weight+port+target,
// TXT: text).
export interface DnsRecordData {
  address?: string
  target?: string
  preference?: number
  exchange?: string
  priority?: number
  weight?: number
  port?: number
  text?: string
}

export interface DnsRecordRow {
  node_dn: string
  name: string
  type: string
  ttl_seconds: number
  data: DnsRecordData
  raw_b64: string
  editable: boolean
}

export interface MailTodayLogEntry {
  date: string
  qid: string
  sender: string
  total_recp: string | number
  size: string
}

export interface MailAuthFailLogEntry {
  notes: string
  date: string
  ip: string
  // cuma ada di ImapLogs, tidak ada di SaslLogs
  email?: string
  // cuma ada di SaslLogs (jumlah percobaan per IP), tidak ada di ImapLogs
  count?: number
}

export interface MailQueueItem {
  id: string
  size: string
  rawdate: string
  sender: string
  recipient: string
  reason: string
  status: "active" | "deferred"
}

export interface MailImapLogEntry {
  date: string
  email: string
  ip: string
}

export interface MailQueueResponse {
  count: number
  page: number
  results: MailQueueItem[]
  next: number | null
  previous: number | null
  imaplogs: MailImapLogEntry[]
  total_count: number
  active_count: number
  deferred_count: number
}

export interface MailTransportRow {
  domain: string
  target: string
  status: "0" | "1"
}

export interface MailBlockedSenderRow {
  email: string
  action: string
  status: "0" | "1"
}

export interface Department {
  DeptID: number
  DeptName: string
  NetID: number
  DeptRouter: string
  DeptSubnet: string
}

export interface ActiveDevice {
  SN: string
  Alias: string
  DeviceName: string | null
  DeptID: number | null
  DeptName: string | null
  Function: string | null
  IPAddress: string | null
  MAC: string | null
  TZAdj: number | null
  State: number
  LastActivity: string | null
  LastData: string | null
  PushVersion: string | null
  LogStamp: string | null
  OpLogStamp: string | null
  PhotoStamp: string | null
  ErrorDelay: number
  Delay: number
  TransTimes: string | null
  TransInterval: number
  UpdateDB: string
  Realtime: boolean
  Encrypt: boolean
}

export interface DeviceLiveUser {
  user_id: string
  name: string
  privilege: number
  password?: string
  group_id?: string
  card?: number
}

export interface DeviceLiveLog {
  user_id: string
  timestamp: string | null
  status: number | null
  status_label: string
  punch: number | null
  punch_label: string
}

export interface DeviceFunctionChoice {
  value: string
  label: string
}

export interface RecapDateColumn {
  date: string
  day_name: string
}

export interface RecapCell {
  date: string
  in_first: string | null
  in_count: number
  out_last: string | null
  out_count: number
}

export interface RecapRow {
  no: number
  pin: string
  name: string
  cells: RecapCell[]
}

export interface AttendanceRecapResponse {
  count: number
  page: number
  page_size: number
  date_columns: RecapDateColumn[]
  results: RecapRow[]
}

export interface AttendanceRecapCardRow {
  date: string
  time: string
  device: string | null
  type: "IN" | "OUT"
}

export interface AttendanceRecapCardResponse {
  pin: string
  name: string | null
  year: number
  month: number
  rows: AttendanceRecapCardRow[]
}

export interface EmployeeSearchResult {
  id: number
  pin: string
  name: string
}

export interface FeaturePermissionItem {
  codename: string
  label: string
  granted: boolean
}

export interface FeaturePermissionsResponse {
  user_id: number
  username?: string
  permissions: FeaturePermissionItem[]
}
export interface DjangoApiUser {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  phone_number: string | null
  department: string | null
  title: string | null
  auth_source: string
  is_active: boolean
  is_staff: boolean
  is_superuser: boolean
  must_change_password: boolean
  emp_pin: string | null
  emp_name: string | null
  has_employee_link: boolean
}

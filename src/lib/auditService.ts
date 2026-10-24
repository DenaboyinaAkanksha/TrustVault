import { supabase } from './supabase'

export type AuditLog = {
  id: string
  owner_id: string
  actor_id: string | null
  document_id: string | null
  document_name: string
  action:
    | 'upload'
    | 'download'
    | 'delete'
    | 'share'
    | 'permission_change'
    | 'revoke'
  target_user_id: string | null
  details: Record<string, unknown>
  created_at: string
  actor_name: string
  actor_email: string
}


export async function listAuditLogs(): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .rpc('get_audit_trail')

  if (error) {
    throw new Error(`Could not load audit trail: ${error.message}`)
  }

  return (data ?? []) as AuditLog[]
}
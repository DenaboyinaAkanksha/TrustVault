
import { supabase } from './supabase'

export type SharePermission = 'read' | 'edit'

export async function shareDocument(
  documentId: string,
  recipientEmail: string,
  permission: SharePermission,
): Promise<void> {
  const { data, error } = await supabase.functions.invoke(
    'share-document',
    {
      body: {
        document_id: documentId,
        recipient_email: recipientEmail.trim(),
        permission,
      },
    },
  )

  if (error) {
    console.error('Share function error:', error)

    if (error.context instanceof Response) {
      const response = error.context.clone()

      let responseBody = ''

      try {
        responseBody = await response.text()
      } catch {
        responseBody = 'Could not read server response.'
      }

      throw new Error(
        `Share failed (HTTP ${response.status}): ${responseBody}`,
      )
    }

    throw new Error(error.message)
  }

  if (!data?.success) {
    throw new Error(
      data?.error || 'Could not share the document.',
    )
  }
}


export type DocumentAccess = {
  document_id: string
  user_id: string
  permission: 'read' | 'edit'
}

export async function listDocumentAccess(
  documentId: string,
): Promise<DocumentAccess[]> {
  const { data, error } = await supabase
    .from('document_access')
    .select('document_id, user_id, permission')
    .eq('document_id', documentId)

  if (error) throw error

  return (data ?? []) as DocumentAccess[]
}

export async function revokeDocumentAccess(
  documentId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from('document_access')
    .delete()
    .eq('document_id', documentId)
    .eq('user_id', userId)

  if (error) throw error
}

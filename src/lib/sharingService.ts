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
  const response = error.context
  let details = error.message

    if (response instanceof Response) {
        const responseBody = await response.clone().text()
        details = `${error.message} — HTTP ${response.status}: ${responseBody}`
    }

    throw new Error(details)
    }

  if (!data?.success) {
    throw new Error(data?.error || 'Could not share the document.')
  }
}
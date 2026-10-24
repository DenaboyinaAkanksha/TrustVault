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

export async function revokeDocumentAccess(
  documentId: string,
  recipientUserId: string,
): Promise<void> {
  const { data, error } = await supabase.functions.invoke(
    'revoke-document-access',
    {
      body: {
        document_id: documentId,
        recipient_user_id: recipientUserId,
      },
    },
  )

  if (error) {
    throw new Error(error.message)
  }

  if (!data?.success) {
    throw new Error(
      data?.error || 'Could not revoke document access.',
    )
  }
}

export type DocumentAccess = {
  user_id: string
  permission: SharePermission
  created_at: string
  full_name: string
  email: string
}


export async function listDocumentAccess(
  documentId: string,
): Promise<DocumentAccess[]> {
  const { data, error } = await supabase.rpc(
    'list_document_access_with_users',
    {
      p_document_id: documentId,
    },
  )

  if (error) {
    throw new Error(
      `Could not load document access: ${error.message}`,
    )
  }

  return (data ?? []) as DocumentAccess[]
}
export async function getMyDocumentPermission(
  documentId: string,
): Promise<'owner' | 'read' | 'edit' | null> {
  const { data: userData, error: userError } =
    await supabase.auth.getUser()

  if (userError || !userData.user) {
    throw new Error('Please sign in to check document permissions.')
  }

  const { data: document, error: documentError } = await supabase
    .from('documents')
    .select('owner_id')
    .eq('id', documentId)
    .maybeSingle()

  if (documentError) {
    throw new Error(
      `Could not check document ownership: ${documentError.message}`,
    )
  }

  if (!document) {
    return null
  }

  if (document.owner_id === userData.user.id) {
    return 'owner'
  }

  const { data: access, error: accessError } = await supabase
    .from('document_access')
    .select('permission')
    .eq('document_id', documentId)
    .eq('user_id', userData.user.id)
    .maybeSingle()

  if (accessError) {
    throw new Error(
      `Could not check sharing permission: ${accessError.message}`,
    )
  }

  if (access?.permission === 'edit') {
    return 'edit'
  }

  if (access?.permission === 'read') {
    return 'read'
  }

  return null
}
import { supabase } from './supabase'


export type StoredDocument = {
  id: string
  owner_id: string
  name: string
  mime_type: string
  size_bytes: number
  folder: string
  storage_path: string
  created_at: string
}

export async function uploadDocument(
  file: File,
  folder: string,
): Promise<StoredDocument> {
  // Identify the currently signed-in user.
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  console.log('Signed-in user ID:', user?.id)
  if (userError || !user) {
    throw new Error('Please sign in before uploading a document.')
  }

  // Generate a unique, user-scoped storage path.
  const documentId = crypto.randomUUID()
  const safeFileName = file.name.replace(/[^a-zA-Z0-9._() -]/g, '_')
  const storagePath = `${user.id}/${documentId}/${safeFileName}`

  // Create the metadata record first so Storage policies can
  // authorize access using the matching document record.
  const { error: insertError } = await supabase
    .from('documents')
    .insert({
      owner_id: user.id,
      name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      folder,
     storage_path: storagePath,
    })

 if (insertError) {
   throw new Error(
     `Could not save document details: ${insertError.message}`,
   )
  }

 const { data: document, error: selectError } = await supabase
  .from('documents')
  .select('*')
  .eq('storage_path', storagePath)
  .single()

 if (selectError || !document) {
   throw new Error(
    `Document was inserted, but could not be read back: ${
      selectError?.message ?? 'No document returned.'
    }`,
    )
  }

  if (insertError) {
  throw new Error(String(insertError))
  }

  if (!document) {
  throw new Error('Could not save document details.')
  }

  // Upload the actual file to the private Storage bucket.
  const { error: uploadError } = await supabase.storage
    .from('trustvault-documents')
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    // Remove the metadata record if the file upload fails.
    const { error: cleanupError } = await supabase
      .from('documents')
      .delete()
      .eq('id', document.id)

    if (cleanupError) {
      throw new Error(
        `File upload failed: ${uploadError.message}. ` +
        `Metadata cleanup also failed: ${cleanupError.message}`,
      )
    }

    throw new Error(`File upload failed: ${uploadError.message}`)
  }

  return document as StoredDocument
}


export async function deleteDocument(documentId: string): Promise<void> {
  // Find the document and its Storage path.
  const { data: document, error: fetchError } = await supabase
    .from('documents')
    .select('id, storage_path')
    .eq('id', documentId)
    .single()

   
  if (fetchError) {
   console.error('Delete lookup failed:', fetchError)
   throw new Error(`Could not look up document: ${fetchError.message}`)
  }

  if (!document) {
   throw new Error(
    'No document row was returned. Check the document ID and your Supabase access policies.',
   )
  }


  // Delete the actual file from private Storage.
  const { error: storageError } = await supabase.storage
    .from('trustvault-documents')
    .remove([document.storage_path])

  if (storageError) {
    throw new Error(`Could not delete the file: ${storageError.message}`)
  }

  // Delete its database record only after the file deletion succeeds.
  const { error: deleteError } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId)

  if (deleteError) {
    throw new Error(
      `The file was deleted, but its database record could not be deleted: ${deleteError.message}`,
    )
  }
}

export async function listDocuments(): Promise<StoredDocument[]> {
  const response = await supabase
   .from('documents')
   .select(
     'id, owner_id, name, mime_type, size_bytes, folder, storage_path, created_at',
    )
    .order('created_at', { ascending: false })

  if (response.error) {
    throw new Error(`Could not load documents: ${response.error.message}`)
  }

   return (response.data ?? []) as StoredDocument[]

}




export async function updateDocumentDetails(
  documentId: string,
  name: string,
  folder: string,
): Promise<void> {
  const trimmedName = name.trim()
  const trimmedFolder = folder.trim()

  if (!trimmedName) {
    throw new Error('Document name cannot be empty.')
  }

  if (!trimmedFolder) {
    throw new Error('Folder cannot be empty.')
  }

  const { error } = await supabase
    .from('documents')
    .update({
      name: trimmedName,
      folder: trimmedFolder,
    })
    .eq('id', documentId)

  if (error) {
    throw new Error(
      `Could not update document details: ${error.message}`,
    )
  }
}



export async function downloadDocument(
  documentId: string,
): Promise<void> {
  const { data: document, error: fetchError } = await supabase
    .from('documents')
    .select('name, storage_path')
    .eq('id', documentId)
    .single()

  if (fetchError || !document) {
    throw new Error(fetchError?.message ?? 'Document not found.')
  }

  const { data, error: downloadError } = await supabase.storage
    .from('trustvault-documents')
    .createSignedUrl(document.storage_path, 60)

  if (downloadError || !data?.signedUrl) {
    throw new Error(
      downloadError?.message ?? 'Could not create a download link.',
    )
  }

  // Fetch the file contents instead of opening the PDF URL.
  const response = await fetch(data.signedUrl)

  if (!response.ok) {
    throw new Error('Could not download the file.')
  }

  const blob = await response.blob()
  const { error: auditError } = await supabase.rpc(
    'log_document_download',
    {
      p_document_id: documentId,
    },
  )

if (auditError) {
  console.error('Download audit RPC failed:', auditError)
  alert(`Download audit failed: ${auditError.message}`)
  throw new Error(
    `File downloaded, but audit logging failed: ${auditError.message}`,
  )
}

  const blobUrl = URL.createObjectURL(blob)
  const link = window.document.createElement('a')

  link.href = blobUrl
  link.download = document.name
  window.document.body.appendChild(link)
  link.click()
  link.remove()

  URL.revokeObjectURL(blobUrl)
}
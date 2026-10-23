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

  if (insertError || !document) {
    throw new Error(
      insertError?.message ?? 'Could not save document details.',
    )
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
# TrustVault API Documentation

## 1. Overview

TrustVault uses Supabase client operations to manage document metadata, store files, and download documents. The document service uses the `documents` database table, the `trustvault-documents` Storage bucket, and a database RPC named `log_document_download`.

The code reviewed here does not define custom REST endpoints. The operations below are implemented through the Supabase JavaScript client.

**Security note:** The role permissions listed in this document are intended access rules. They must be verified against the deployed Supabase Row Level Security (RLS) policies, Storage policies, and database functions before they can be described as enforced.

## 2. Authentication

Document upload explicitly checks the current authenticated user with `supabase.auth.getUser()`. The other operations rely on Supabase client authentication and the permissions enforced by the database and Storage policies.

An authenticated user should not automatically receive access to every document. Access must be determined by the applicable server-side policies.

## 3. Document operations

### 3.1 Upload a document

- **Function:** `uploadDocument(file, folder)`
- **Supabase operations:** `INSERT` and `SELECT` on `documents`; `upload` to the `trustvault-documents` Storage bucket.
- **Inputs:**
  - `file`: selected file.
  - `folder`: destination folder name.
- **Behavior:**
  1. Checks that a user is signed in.
  2. Generates a unique document identifier and a user-scoped Storage path.
  3. Inserts the document metadata.
  4. Retrieves the inserted record.
  5. Uploads the file to private Storage.
  6. Attempts to remove the metadata record if file upload fails.
- **Success response:** A `StoredDocument` object containing the document ID, owner ID, name, MIME type, size, folder, Storage path, and creation timestamp.
- **Errors:** Authentication failure, metadata insertion or retrieval failure, and file upload failure.
- **Intended role:** Authenticated document owner uploading a new document.
- **Authorization enforcement:** Verify database insert and Storage upload policies.

### 3.2 List documents

- **Function:** `listDocuments()`
- **Supabase operation:** `SELECT` on `documents`.
- **Inputs:** None.
- **Behavior:** Retrieves document metadata ordered by `created_at` in descending order.
- **Success response:** An array of `StoredDocument` records.
- **Errors:** Database query failure.
- **Intended roles:** Document owners and users with explicitly granted document access; administrators according to the application's administrative policy.
- **Authorization enforcement:** RLS must limit returned records to those the signed-in user is permitted to view.

### 3.3 Update document details

- **Function:** `updateDocumentDetails(documentId, name, folder)`
- **Supabase operation:** `UPDATE` on `documents`.
- **Inputs:**
  - `documentId`: document identifier.
  - `name`: new document name.
  - `folder`: destination folder.
- **Behavior:** Trims the name and folder and rejects empty values before updating metadata.
- **Success response:** Resolves without a returned document object.
- **Errors:** Empty name, empty folder, or database update failure.
- **Intended roles:** Document owner or user granted edit permission.
- **Authorization enforcement:** Verify RLS update policies and ensure users cannot change fields they are not authorized to modify.

### 3.4 Download a document

- **Function:** `downloadDocument(documentId)`
- **Supabase operations:** `SELECT` on `documents`, `createSignedUrl` on the `trustvault-documents` bucket, and RPC `log_document_download`.
- **Inputs:** `documentId`.
- **Behavior:**
  1. Retrieves the document name and Storage path.
  2. Requests a signed URL with a 60-second validity period.
  3. Fetches the file contents.
  4. Records the download using `log_document_download`.
  5. Initiates a browser download.
- **Success response:** The browser initiates a file download.
- **Errors:** Document lookup failure, signed URL or file-fetch failure, or audit RPC failure.
- **Intended roles:** Document owner or user granted read/download access; administrator access depends on the defined policy.
- **Authorization enforcement:** Verify document read policies and Storage policies. Confirm that unauthorized users cannot generate signed URLs for inaccessible files.

**Audit consideration:** The current code logs the download after fetching the file contents. If logging fails, the function reports an error even though the file contents may already have reached the browser. This should be considered when assessing audit reliability.

### 3.5 Delete a document

- **Function:** `deleteDocument(documentId)`
- **Supabase operations:** `SELECT` on `documents`, `remove` from the `trustvault-documents` bucket, and `DELETE` on `documents`.
- **Inputs:** `documentId`.
- **Behavior:**
  1. Retrieves the document ID and Storage path.
  2. Attempts to delete the stored file.
  3. Deletes the metadata record only after Storage deletion succeeds.
- **Success response:** Resolves without a returned value.
- **Errors:** Document lookup failure, file deletion failure, or metadata deletion failure.
- **Intended role:** Document owner; administrator access must be explicitly defined.
- **Authorization enforcement:** Verify Storage deletion and database delete policies. The client code does not itself perform an explicit owner or role check before these operations.

### 3.6 Record a download audit event

- **Function:** Supabase RPC `log_document_download`
- **Database operation:** Calls the database function with `p_document_id`.
- **Input:** `p_document_id`, the document identifier.
- **Behavior:** Requests an audit entry for the download.
- **Success response:** The code checks for an RPC error; it does not use a returned value.
- **Authorization enforcement:** Inspect the database function definition and permissions to confirm that it identifies the caller securely, checks access as required, and prevents users from fabricating or modifying audit records.

### 3.7 Grant or update document access

- **Endpoint:** `POST /functions/v1/<share-function-name>`
- **Implementation:** Supabase Edge Function using Deno and the Supabase JavaScript client.
- **Authentication:** Requires a valid Supabase access token in the `Authorization: Bearer <token>` header.
- **Request body:**

```json
{
  "document_id": "document-uuid",
  "recipient_email": "recipient@example.com",
  "permission": "read"
}
```

The `permission` field accepts `read` or `edit`.

- **Behavior:**
  1. Validates the caller's authentication token.
  2. Validates the document ID, recipient email, and requested permission.
  3. Checks that the authenticated user owns the document.
  4. Prevents the owner from sharing the document with themselves.
  5. Finds the recipient's registered account.
  6. Inserts a new `document_access` record or updates an existing grant.
- **Success response:**

```json
{
  "success": true,
  "message": "Document access granted."
}
```

- **Possible HTTP status codes:**
  - `200` — Access granted or updated.
  - `400` — Invalid request or attempt to share with oneself.
  - `401` — Missing or invalid authentication.
  - `403` — Caller is not the document owner.
  - `404` — No registered recipient account was found.
  - `405` — Unsupported HTTP method.
  - `500` — Server configuration, database operation, or unexpected error.

- **Permitted role:** Document owner of the specified document.
- **Not permitted:** A viewer or another user who does not own the document.
- **Authorization enforcement:** The Edge Function checks document ownership on the server before modifying access records. The service-role key is used only within the server function and must never be exposed to the frontend.

**Audit and security considerations:** The supplied function does not explicitly write an audit event when access is granted or updated. Verify whether another database trigger records these events. Also verify that the `document_access` table has appropriate constraints and that access checks elsewhere enforce grants immediately after revocation.

### 3.8 Revoke document access

- **Endpoint:** `POST /functions/v1/<revoke-function-name>`
- **Implementation:** Supabase Edge Function using Deno and the Supabase JavaScript client.
- **Authentication:** Requires a valid Supabase access token in the `Authorization` header.
- **Request body:**

```json
{
  "document_id": "document-uuid",
  "recipient_user_id": "recipient-user-uuid"
}
```

- **Behavior:**
  1. Validates the request method and authentication token.
  2. Parses the request body and checks for required fields.
  3. Retrieves the document using the server-side administrative client.
  4. Verifies that the authenticated user owns the document.
  5. Calls the `revoke_document_access_with_audit` database RPC with the document ID, recipient ID, and authenticated actor ID.
- **Success response:**

```json
{
  "success": true
}
```

- **Possible HTTP status codes:**
  - `200` — The RPC completed successfully.
  - `400` — Invalid JSON body or missing required fields.
  - `401` — Missing or invalid authentication.
  - `403` — The caller is not the document owner.
  - `404` — The document was not found or the lookup failed.
  - `405` — Unsupported HTTP method.
  - `500` — The revocation RPC failed.

- **Permitted role:** Owner of the specified document.
- **Not permitted:** A viewer or another user who does not own the document.
- **Authorization enforcement:** Ownership is checked server-side before calling the privileged database RPC. The service-role key must remain server-side.

**Audit behavior:** The function calls `revoke_document_access_with_audit`. Inspect that database function to confirm that revocation and audit recording are performed reliably and that users cannot forge or modify audit records.

**CORS configuration:** The current code allows requests from `http://localhost:5173`. Update this configuration for the deployed frontend before demonstrating the live application.

**Revocation verification:** Test that the recipient loses access immediately after revocation, including access to document metadata and file downloads. Existing signed URLs may remain usable until their expiry, so the current 60-second signed-URL behavior should be considered when evaluating immediate revocation.



## 4. Intended role-permission matrix

The following matrix describes the intended application permissions, not verified enforcement.

| Operation | Administrator | Document owner | Viewer with access |
|---|---|---|---|
| List documents | According to admin policy | Own and permitted documents | Permitted documents only |
| Upload document | According to admin policy | Yes | No, unless explicitly granted |
| Download document | According to admin policy | Yes | Only with read permission |
| Edit document details | According to admin policy | Yes | Only with edit permission |
| Delete document | According to admin policy | Yes | No, unless an explicitly authorized policy allows it |
| Grant or revoke access | According to admin policy | Own documents | No |
| View audit trail | According to admin policy | According to audit policy | According to audit policy |

**Verification required:** The supplied document service alone does not establish these role permissions. Confirm them using the actual database, Storage, sharing, and audit policies.

## 5. Storage and validation

The document service constructs Storage paths in the following format:

`<authenticated-user-id>/<document-id>/<sanitized-file-name>`

The download function requests a signed URL with a 60-second expiry.

The upload function sanitizes the filename used in the Storage path. File size and allowed MIME types should also be validated by the upload interface and, where practical, enforced by Storage configuration or trusted server-side logic.

## 6. Known limitations of this documentation

This draft covers only the supplied document service. The following items remain to be reviewed:

- Sharing and permission grant/revoke operations.
- Audit event listing and administrative activity views.
- Supabase RLS and Storage policies.
- The implementation of `log_document_download`.
- Authentication role assignment and administrator authorization.
- Search implementation and any additional operations used elsewhere in the application.
- Automated tests proving that unauthorized users cannot access another user's documents.
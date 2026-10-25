# TrustVault — Threat Model

## 1. Purpose

TrustVault is a secure document-sharing application intended to let authenticated users upload, organize, search, download, and share private documents. This document identifies potential security threats, planned or implemented mitigations, and risks that still need verification.

## 2. Assets to Protect

- User accounts and authentication sessions
- Private document files stored in Supabase Storage
- Document metadata, including names, categories, owners, and timestamps
- Document read/edit permissions
- Audit records for document and permission activity
- Supabase credentials, especially the service-role key

## 3. Threats and Mitigations

| ID | Threat | Mitigation | Verification status |
|---|---|---|---|
| T1 | An unauthenticated user accesses private documents. | Require authentication and enforce access policies on the server/database. | Verify authentication and RLS policies. |
| T2 | A user reads or downloads another user's document without permission. | Enforce document ownership and explicit read permissions through Supabase RLS and Storage policies. | Must test with separate user accounts. |
| T3 | A viewer modifies or deletes a document. | Enforce edit and delete permissions server-side; do not rely on hiding UI buttons. | Verify database and Storage policies. |
| T4 | A document owner grants access to a document they do not own. | The sharing Edge Function checks that the authenticated user owns the document before granting access. | Present in reviewed function code; test deployed behavior. |
| T5 | A user revokes access to another owner's document. | The revocation Edge Function checks document ownership before calling the audit-aware revocation RPC. | Present in reviewed function code; verify the RPC and deployed behavior. |
| T6 | A revoked user continues accessing a document. | Re-check authorization for each request and avoid long-lived public links. | Verify immediate revocation, including signed URL behavior. |
| T7 | Malicious or unsupported files are uploaded. | Validate file type, size, and other upload requirements before accepting uploads. | Confirm client-side and server-side validation; client-only checks are insufficient. |
| T8 | An attacker manipulates document IDs or request parameters. | Perform authorization checks on every server-side operation, regardless of supplied IDs. | Requires negative authorization tests. |
| T9 | Audit records are missing or can be altered. | Record successful and refused sensitive operations; restrict audit-table modification and use trusted database-side logging where appropriate. | Verify triggers/RPCs, table policies, and failed-attempt logging. |
| T10 | The Supabase service-role key is exposed. | Keep privileged keys in server-side environment secrets; never include them in frontend code or public repositories. | Review environment configuration and repository contents before deployment. |
| T11 | Cross-origin requests or misconfigured CORS affect API access. | Configure allowed origins and methods for the deployed application. Remember that CORS is not authorization. | Review Edge Function CORS settings before deployment. |
| T12 | A permission change is not reflected in audit history. | Record who changed access, which document was affected, the recipient, the action, and the time. | Verify the grant and revocation audit implementations. |

## 4. Security Design Principles

- **Server-side authorization:** The server and database must enforce permissions for every protected operation.
- **Least privilege:** Users should receive only the access they need.
- **Private storage:** Documents must not be publicly accessible by default.
- **Immediate revocation:** Revoked access must stop working as soon as practical. Previously issued signed URLs may remain usable until they expire.
- **Auditable activity:** Sensitive actions and refused attempts should be recorded in a protected audit trail.
- **Defense in depth:** Frontend validation improves usability, but it must not replace server-side validation and authorization.

## 5. Required Security Tests

Before claiming these protections are verified, test the following:

1. An unauthenticated user cannot list, read, upload, download, edit, or delete protected documents.
2. User A cannot access User B's private document by changing its ID or storage path.
3. A viewer cannot edit or delete a document.
4. A user who has not been granted access cannot download a shared document.
5. A document owner can grant and revoke access only to documents they own.
6. Revoked access fails on subsequent requests.
7. Invalid file types, oversized files, and invalid metadata are rejected.
8. Successful and refused sensitive actions produce the expected audit records.
9. Ordinary users cannot modify or delete protected audit records.
10. Missing or invalid authentication is rejected by protected Edge Functions.

## 6. Accepted and Remaining Risks

- A signed download URL can remain usable until its expiration time, even after permission revocation. The application should use short expirations and avoid issuing URLs before authorization checks.
- A user who is authorized to view a document may copy or photograph its contents. The application cannot fully prevent this.
- Client-side file validation can be bypassed unless the server or storage layer also enforces the relevant restrictions.
- Security depends on correct Supabase RLS policies, Storage policies, Edge Function configuration, and database function permissions. These must be reviewed and tested before the application is described as production-ready.
- Audit completeness depends on the actual logging implementation, including how failed operations are recorded.

## 7. Current Limitations

This threat model includes controls that require verification as well as controls visible in the reviewed application code. A mitigation listed here is not proof that the application is secure. Update the verification status after testing the deployed system and reviewing the database policies.
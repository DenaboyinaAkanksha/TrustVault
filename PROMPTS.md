# TrustVault — AI Usage and Prompt Log

## Purpose

This file documents how AI assistance was used while developing TrustVault. It records the task, the prompt or instruction, the resulting work, issues identified, and how the work was corrected or verified.

AI-generated code and documentation were reviewed rather than treated as automatically secure or correct.

## Entry 1 — Project Setup and Development Environment

**Date:** 2026-10-21  
**Area:** Project setup

**Prompt / instruction:**  
"Help me create the TrustVault project on my Windows system in VS Code. Guide me through the required tools and setup one step at a time."

**What AI produced:**  
Step-by-step guidance for setting up the development environment and running the React application.

**Issue encountered:**  
PowerShell blocked the `npm.ps1` script, preventing the usual npm command from running.

**How it was fixed:**  
Used `npm.cmd` in the terminal instead of changing the system execution policy. Verified that the Vite development server could start.

**Commit:** Add the actual commit URL here after committing the related setup changes.

## Entry 2 — Document Upload and Metadata

**Date:** 2026-10-21 to 2026-10-24  
**Area:** Document management

**Prompt / instruction:**  
"Help me build TrustVault so users can upload and organize private documents, and guide me through implementing the functionality in VS Code."

**What AI produced:**  
Guidance for the upload form and document service, including file selection, metadata, storage paths, and handling upload failures.

**Issue identified:**  
Upload functionality must not be considered secure merely because the frontend validates a file or because a document metadata row is created. File storage and metadata operations can also fail independently.

**How it was addressed:**  
Reviewed the document service's upload flow, including cleanup of metadata if file upload fails. Server-side validation and Supabase access policies still need independent verification.

**Commit:** Add the actual commit URL here after committing the related changes.

## Entry 3 — Document Sharing Authorization

**Date:** 2026-10-24  
**Area:** Authorization and access control

**Prompt / instruction:**  
"Review my Supabase document-sharing Edge Function and help document its endpoint, request body, permission checks, and possible errors."

**What AI produced:**  
An API documentation section describing the sharing request, supported read/edit permissions, authentication, owner verification, recipient lookup, and response codes.

**Issue identified:**  
A frontend sharing interface does not prove that access is correctly enforced. The server must verify document ownership before granting permission. Audit logging also needs to be checked separately.

**How it was addressed:**  
Reviewed the Edge Function code and documented its ownership check. The audit behavior and deployed database policies must still be verified before claiming the complete flow is secure.

**Commit:** Add the actual commit URL here after committing the related changes.

## Entry 4 — Permission Revocation

**Date:** 2026-10-24  
**Area:** Authorization and audit trail

**Prompt / instruction:**  
"Review my revoke-access Edge Function and document how it authenticates the caller, verifies ownership, and revokes another user's access."

**What AI produced:**  
An API documentation section describing the request fields, owner check, call to `revoke_document_access_with_audit`, and expected error responses.

**Issue identified:**  
Calling an audit-aware database function does not, by itself, prove that the function records the correct events or that revoked access stops immediately. The current CORS configuration also allows only the local development origin.

**How it was addressed:**  
Documented the database function as a dependency requiring review and identified the need to update CORS for the actual deployed frontend origin. Signed download URLs must also be considered when testing revocation.

**Commit:** Add the actual commit URL here after committing the related changes.

## Entry 5 — API Documentation and Security Review

**Date:** 2026-10-24  
**Area:** Documentation and security review

**Prompt / instruction:**  
"Help me document TrustVault's endpoints, which users are allowed to call them, and which security controls still need verification."

**What AI produced:**  
An API documentation draft covering document upload, listing, editing, downloading, deletion, sharing, and revocation.

**Issue identified:**  
Some permissions and audit behaviors depend on Supabase RLS policies, Storage policies, Edge Function deployment names, and database functions that were not all verified during the documentation review.

**How it was addressed:**  
Kept unverified controls clearly marked instead of claiming they were implemented. The remaining checks include reviewing the policies and functions, testing with separate accounts, and confirming the deployed endpoint names.

**Commit:** Add the actual commit URL here after committing the related changes.

## Reusable AI Instructions

For future AI-assisted changes, use these instructions:

- Explain the change before suggesting code.
- Keep changes small and identify the exact files to edit.
- Do not place the Supabase service-role key in frontend code.
- Enforce authorization on the server or database, not only in React.
- Include negative tests for unauthorized users and document owners, viewers, and recipients.
- Consider audit logging for both successful and refused sensitive actions.
- Identify assumptions, unverified behavior, and unfinished work explicitly.
- Do not claim that tests passed unless they were actually run.
- Review generated code before committing it.

## Reflection

AI helped with development guidance, code review, and documentation. It was most useful when work was broken into small steps and actual project code was provided for review. AI suggestions still required checking against the application's implementation, particularly for authorization, audit completeness, and revocation behavior.
### Entry — Vercel Production Deployment

- **Date:** 2026-10-24
- **Area:** Production deployment
- **Prompt summary:** Deploy the TrustVault frontend to Vercel and verify that the production application can communicate with the Supabase backend.
- **What AI produced:** Guidance for configuring the Vercel project, setting the Vite build command and output directory, and configuring the frontend's Supabase environment variables.
- **Issues encountered:** Production configuration differs from local development. Environment variables and allowed origins must be configured for the deployed application, not just localhost.
- **How it was addressed:** Configured the Vercel deployment using the Vite build settings and the required frontend environment variable names. The production frontend was deployed and opened for testing.
- **Verification:** Confirmed that the deployed application loaded. Backend functionality should be verified separately for each feature.
- **Commit:** Add the actual Git commit URL if related code changes were committed. Deployment configuration changes made only in the Vercel dashboard may not have a corresponding Git commit.

### Entry — Production CORS Fix for Access Revocation

- **Date:** 2026-10-25
- **Area:** Edge Function integration and production debugging
- **Prompt summary:** Troubleshoot the access-revocation request failing from the deployed TrustVault frontend.
- **What AI produced:** Guidance for checking the Edge Function's CORS headers and allowing the actual production frontend origin in addition to the local development origin.
- **Issue encountered:** The browser request was blocked because the production frontend origin was not correctly allowed by the Edge Function's CORS configuration.
- **How it was addressed:** Updated the allowed-origin configuration to include the deployed Vercel frontend origin and corrected the origin string to avoid a trailing-slash mismatch. Redeployed the function.
- **Verification:** Confirmed that the revoke-access flow worked after the CORS correction. This verifies the tested flow, but does not independently prove every authorization, storage, or audit-trail security property.
- **Commit:** Add the actual Git commit URL if the related source change was committed.
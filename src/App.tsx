import { useEffect, useState } from 'react'
import Login from './Login'
import Signup from './Signup'
import { supabase } from './lib/supabase'
import {
  listDocumentAccess,
  revokeDocumentAccess,
  shareDocument,
  type DocumentAccess,
} from './lib/sharingService'

import {
  deleteDocument,
  downloadDocument,
  listDocuments,
  uploadDocument,
} from './lib/documentService'

import { listAuditLogs, type AuditLog } from './lib/auditService'


type Document = {
  id: string
  owner_id: string
  name: string
  type: string
  size: string
  date: string
  folder: string
}
function FileTypeBadge({ fileName }: { fileName: string }) {
  const extension = fileName.includes('.')
    ? fileName.split('.').pop()?.toLowerCase() ?? ''
    : ''

  const badgeStyles: Record<string, string> = {
    pdf: 'bg-red-50 text-red-600',
    doc: 'bg-blue-50 text-blue-600',
    docx: 'bg-blue-50 text-blue-600',
    jpg: 'bg-amber-50 text-amber-700',
    jpeg: 'bg-amber-50 text-amber-700',
    png: 'bg-emerald-50 text-emerald-600',
  }

  const label = extension ? extension.toUpperCase() : 'FILE'
  const colorClass =
    badgeStyles[extension] ?? 'bg-slate-100 text-slate-600'

  return (
    <span
      className={`rounded-lg px-2 py-2 text-xs font-bold ${colorClass}`}
      aria-label={`File type: ${label}`}
    >
      {label}
    </span>
  )
}
const folders = [
  { name: 'Employment Documents', icon: 'briefcase-business', color: 'text-blue-600 bg-blue-50', description: 'Offer, welcome and appointment letters' },
  { name: 'Payslips', icon: 'wallet', color: 'text-emerald-600 bg-emerald-50', description: 'Monthly salary slips' },
  { name: 'Salary & Hike Letters', icon: 'trending-up', color: 'text-purple-600 bg-purple-50', description: 'Increments and revised CTC' },
  { name: 'Tax Documents', icon: 'landmark', color: 'text-amber-600 bg-amber-50', description: 'Form 16, AIS and tax records' },
  { name: 'Benefits & Insurance', icon: 'shield-check', color: 'text-pink-600 bg-pink-50', description: 'EPF, insurance and benefits' },
]

const initialDocuments: Document[] = []

function App() {
  const [activeFolder, setActiveFolder] = useState('All Documents')
  const [currentView, setCurrentView] = useState<'documents' | 'audit'>('documents')
  const [search, setSearch] = useState('')
  const [documents, setDocuments] = useState(initialDocuments)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState<'login' | 'signup'>('login')
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [shareFormOpen, setShareFormOpen] = useState(false)
  const [documentAccessList, setDocumentAccessList] = useState<DocumentAccess[]>([])
  const [recipientEmail, setRecipientEmail] = useState('')
  const [sharePermission, setSharePermission] = useState<'read' | 'edit'>('read')





  useEffect(() => {
    if (!isLoggedIn) {
      setDocuments([])
      return
    }

    let cancelled = false

    async function loadDocuments() {
      try {
        const storedDocuments = await listDocuments()

        if (cancelled) return

        const formattedDocuments = storedDocuments.map((document) => ({
          id: document.id,
          owner_id: document.owner_id,
          name: document.name,
          type: document.mime_type,
          size: `${(document.size_bytes / (1024 * 1024)).toFixed(2)} MB`,
          date: new Date(document.created_at).toLocaleDateString(),
          folder: document.folder,
        }))

        setDocuments(formattedDocuments)
      } catch (error) {
        console.error('Failed to load documents:', error)
      }
    }

    void loadDocuments()

    return () => {
      cancelled = true
    }
  }, [isLoggedIn])


  async function handleSignOut() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      alert('Unable to sign out. Please try again.')
      return
    }

    setIsLoggedIn(false)
    setCurrentPage('login')
  }
  


async function loadAuditLogs() {
  setAuditLoading(true)

  try {
    const logs = await listAuditLogs()
    setAuditLogs(logs)
  } catch (error) {
    console.error('Error loading audit trail:', error)
    alert(
      error instanceof Error
        ? error.message
        : 'Could not load audit trail.',
    )
  } finally {
    setAuditLoading(false)
  }
}
  useEffect(() => {
    let mounted = true

    async function checkSession() {
      const { data, error } = await supabase.auth.getSession()

      if (!mounted) return

      if (error) {
        setIsLoggedIn(false)
        setCurrentUserId(null)
      } else {
        setIsLoggedIn(Boolean(data.session))
        setCurrentUserId(data.session?.user.id ?? null)
      }

      setAuthLoading(false)
    }

    void checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session))
      setCurrentUserId(session?.user.id ?? null)
      setAuthLoading(false)
    })
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const visibleDocuments = documents.filter((document) => {
    const matchesFolder =
      activeFolder === 'All Documents' || document.folder === activeFolder
    const matchesSearch = document.name.toLowerCase().includes(search.toLowerCase())
    return matchesFolder && matchesSearch
  })

  const folderCount = (folderName: string) =>
    documents.filter((document) => document.folder === folderName).length

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-600">
          Loading TrustVault...
        </p>
      </div>
    )
  }
  if (!isLoggedIn) {
    if (currentPage === 'signup') {
      return (
        <Signup
          onSignup={() => {
            alert('Signup is not connected yet. Real account creation comes next.')
          }}
          onLogin={() => setCurrentPage('login')}
        />
      )
    }

    return (
      <Login
        onLogin={() => setIsLoggedIn(true)}
        onSignup={() => setCurrentPage('signup')}
      />
    )
  }


  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 md:flex">
      <aside className="w-full border-b border-slate-200 bg-white p-5 md:min-h-screen md:w-72 md:border-b-0 md:border-r">
        <div className="mb-9 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">T</div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">TrustVault</h1>
            <p className="text-xs text-slate-500">Your files, protected</p>
          </div>
        </div>

        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Workspace</p>
        <nav className="flex flex-wrap gap-2 md:flex-col">

          <button
            type="button"
            onClick={() => {
              setCurrentView('audit')
              void loadAuditLogs()
              setSelectedDocument(null)
            }}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            <span>📋</span>
            Audit Trail
          </button>

          <button
            onClick={() => {
            setCurrentView('documents')
            setActiveFolder('All Documents')
          }}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium ${activeFolder === 'All Documents' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <span>▦</span> All Documents
          </button>
          {folders.map((folder) => (
            <button
              key={folder.name}
              onClick={() => {
                setCurrentView('documents')
                setActiveFolder(folder.name)
              }}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium ${activeFolder === folder.name ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <span className="text-lg">📁</span>
              <span>{folder.name}</span>
            </button>
          ))}
        </nav>

        <div className="mt-10 rounded-2xl bg-slate-50 p-4">
          <div className="mb-2 text-lg">🔒</div>
          <h2 className="text-sm font-semibold">Privacy first</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Keep employment and financial documents organized in one place.
          </p>
        </div>
        <p className="mt-6 text-xs text-slate-400">TrustVault · Learning project</p>
      </aside>

      <main className="min-w-0 flex-1 p-5 sm:p-8 lg:p-10">

        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              My Documents
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Manage and organize your important files.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowUploadForm(true)}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <span className="mr-2 text-lg leading-none">+</span>
              Upload document
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            >
              Sign out
            </button>
          </div>
        </header>
        {currentView === 'audit' ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
            <h3 className="text-lg font-bold">Audit Trail</h3>
            <p className="mt-2 text-sm text-slate-500">
              Recent activity involving your documents.
            </p>


            {auditLoading ? (
              <p className="py-8 text-center text-sm text-slate-500">
                Loading audit records...
              </p>
            ) : auditLogs.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                No audit records found.
              </p>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead>
                    
                    <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400">
                      <th className="pb-4 pr-4 font-medium">Date and time</th>
                      <th className="pb-4 pr-4 font-medium">Action</th>
                      <th className="pb-4 pr-4 font-medium">User</th>
                      <th className="pb-4 pr-4 font-medium">Email</th>
                      <th className="pb-4 font-medium">Document</th>
                    </tr>

                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-slate-50 last:border-0"
                      >
                        <td className="py-4 pr-4 text-slate-500">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="py-4 pr-4">
                          <span className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                            {log.action.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="py-4 pr-4 font-medium text-slate-700">
                          {log.actor_name || 'Unknown user'}
                        </td>
                        <td className="py-4 pr-4 text-slate-500">
                          {log.actor_email || 'Unavailable'}
                        </td>
                        <td className="py-4 break-words font-medium text-slate-700">
                          {log.document_name}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </section>
        ) : (
          <>
        {showUploadForm && (
          <UploadForm
            onCancel={() => setShowUploadForm(false)}
            onUpload={(newDocument) => {
              setDocuments((currentDocuments) => [
                newDocument,
                ...currentDocuments,
              ])
              setActiveFolder('All Documents')
              setSearch('')
            }}
          />
        )}



        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {folders.map((folder) => (
            <button
              key={folder.name}
              onClick={() => setActiveFolder(folder.name)}
              className={`rounded-2xl border bg-white p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md ${activeFolder === folder.name ? 'border-blue-300 ring-2 ring-blue-100' : 'border-slate-200'}`}
            >
              <div className="mb-4 flex items-center justify-between">
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl text-2xl ${folder.color}`}>📁</span>
                <span className="text-xs text-slate-400">{folderCount(folder.name)} files</span>
              </div>
              <h3 className="font-semibold">{folder.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{folder.description}</p>
            </button>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-lg font-bold">
                {activeFolder === 'All Documents' ? 'All Documents' : activeFolder}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {visibleDocuments.length} sample {visibleDocuments.length === 1 ? 'document' : 'documents'}
              </p>
            </div>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search documents..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:max-w-xs"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400">
                  <th className="pb-4 font-medium">Document name</th>
                  <th className="pb-4 font-medium">Folder</th>
                  <th className="pb-4 font-medium">Size</th>
                  <th className="pb-4 font-medium">Date added</th>
                </tr>
              </thead>
              <tbody>

                {visibleDocuments.map((document) => (
                  <tr
                    key={document.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50"
                  >
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <FileTypeBadge fileName={document.name} />
                        <button
                          type="button"
                          onClick={async () => {
                            setSelectedDocument(document)
                            setDocumentAccessList([])

                            if (document.owner_id === currentUserId) {
                              try {
                                const accessList = await listDocumentAccess(document.id)
                                setDocumentAccessList(accessList)
                              } catch (error) {
                                console.error('Failed to load document access:', error)
                                window.alert(
                                  error instanceof Error
                                    ? error.message
                                    : 'Could not load document access.',
                                )
                              }
                            }
                          }}
                          className="text-left font-medium text-slate-700 hover:text-blue-600 hover:underline"
                        >
                          {document.name}
                        </button>
                      </div>
                    </td>

                    <td className="py-4 text-slate-500">{document.folder}</td>
                    <td className="py-4 text-slate-500">{document.size}</td>
                    <td className="py-4 text-slate-500">{document.date}</td>

                    <td className="py-4 text-right">
                      {document.owner_id === currentUserId && (

                        <button
                          type="button"
                          onClick={async () => {
                            const confirmed = window.confirm(
                              `Are you sure you want to delete "${document.name}"?`,
                            )

                            if (!confirmed) return

                            try {
                              await deleteDocument(String(document.id))

                              setDocuments((currentDocuments) =>
                                currentDocuments.filter(
                                  (item) => item.id !== document.id,
                                ),
                              )
                            } catch (error) {
                              console.error('Failed to delete document:', error)

                              window.alert(
                                error instanceof Error
                                  ? error.message
                                  : 'Could not delete the document. Please try again.',
                              )
                            }
                          }}
                          className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      )}

                    </td>
                  </tr>
                ))}

                {visibleDocuments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-slate-500">
                      No documents found. Try another search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>


               </section>
               </>
        )}
      </main>

      {selectedDocument && (
        <div className="fixed inset-0 z-50">
          {/* Background overlay */}
          <button
            type="button"
            aria-label="Close document details"
            className="absolute inset-0 h-full w-full bg-slate-900/30"
            onClick={() => setSelectedDocument(null)}
          />

          {/* Right-side panel */}
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="document-details-title"
            className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-blue-600">
                  Document details
                </p>
                <h2
                  id="document-details-title"
                  className="mt-2 break-words text-xl font-bold text-slate-900"
                >
                  {selectedDocument.name}
                </h2>
              </div>

              <button
                type="button"
                aria-label="Close details panel"
                onClick={() => setSelectedDocument(null)}
                className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                ✕
              </button>
            </div>

            <div className="mt-8 space-y-5">
              <div>
                <p className="text-sm text-slate-500">File type</p>
                <div className="mt-2">
                  <FileTypeBadge fileName={selectedDocument.name} />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-sm text-slate-500">Folder</p>
                <p className="mt-1 font-medium text-slate-800">
                  {selectedDocument.folder}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-sm text-slate-500">File size</p>
                <p className="mt-1 font-medium text-slate-800">
                  {selectedDocument.size}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-sm text-slate-500">Date added</p>
                <p className="mt-1 font-medium text-slate-800">
                  {selectedDocument.date}
                </p>
              </div>


              <button
                type="button"
                onClick={async () => {
                  try {
                    await downloadDocument(selectedDocument.id)
                  } catch (error) {
                    window.alert(
                      error instanceof Error
                        ? error.message
                        : 'Could not download the document.',
                    )
                  }
                }}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Download document
              </button>


              {shareFormOpen && selectedDocument.owner_id === currentUserId && (
                <form
                  className="mt-4 space-y-4 rounded-xl border border-gray-200 p-4"

                  onSubmit={async (event) => {
                    event.preventDefault()

                    try {
                      await shareDocument(
                        selectedDocument.id,
                        recipientEmail,
                        sharePermission,
                      )

                      window.alert('Document shared successfully!')
                      setRecipientEmail('')
                      setShareFormOpen(false)
                    } catch (error) {
                      window.alert(
                        error instanceof Error
                          ? error.message
                          : 'Could not share the document.',
                      )
                    }
                  }}

                >
                  <div>
                    <label
                      htmlFor="recipientEmail"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Recipient email
                    </label>
                    <input
                      id="recipientEmail"
                      type="email"
                      value={recipientEmail}
                      onChange={(event) => setRecipientEmail(event.target.value)}
                      placeholder="Enter registered user's email"
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="sharePermission"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Permission
                    </label>
                    <select
                      id="sharePermission"
                      value={sharePermission}
                      onChange={(event) =>
                        setSharePermission(event.target.value as 'read' | 'edit')
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="read">Read only</option>
                      <option value="edit">Can edit</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Grant access
                  </button>
                </form>
              )}




              {selectedDocument.owner_id === currentUserId && (
                <button
                  type="button"
                  onClick={() => setShareFormOpen((open) => !open)}
                  className="mt-3 w-full rounded-xl border border-blue-600 px-4 py-3 text-sm font-semibold text-blue-600 hover:bg-blue-50"
                >
                  {shareFormOpen ? 'Cancel sharing' : 'Share document'}
                </button>
              )}

              {selectedDocument.owner_id === currentUserId && (
                <div className="mt-6 rounded-xl border border-gray-200 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-gray-800">
                    People with access
                  </h3>

                  {documentAccessList.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No one else has access to this document yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {documentAccessList.map((access) => (
                        <div
                          key={access.user_id}
                          className="flex items-center justify-between gap-3"
                        >
                          
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            User: {access.user_id}
                          </p>
                          <p className="text-xs text-gray-500">
                            Permission: {access.permission === 'read' ? 'Read only' : 'Can edit'}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={async () => {
                            const confirmed = window.confirm(
                              'Are you sure you want to revoke this user’s access?',
                            )

                            if (!confirmed) return

                            try {
                              await revokeDocumentAccess(
                                selectedDocument.id,
                                access.user_id,
                              )

                              setDocumentAccessList((current) =>
                                current.filter((item) => item.user_id !== access.user_id),
                              )

                              window.alert('Access revoked successfully.')
                            } catch (error) {
                              window.alert(
                                error instanceof Error
                                  ? error.message
                                  : 'Could not revoke access.',
                              )
                            }
                          }}
                          className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                          Revoke access
                        </button>

                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>


            <button
              type="button"
              onClick={() => setSelectedDocument(null)}
              className="mt-8 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </aside>
        </div>
      )}
    </div>
  )
}




function UploadForm({
  onCancel,
  onUpload,
}: {
  onCancel: () => void
  onUpload: (document: Document) => void
}) {
  const [fileName, setFileName] = useState('')
  const [folder, setFolder] = useState('Employment Documents')
  const [error, setError] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
      <h3 className="text-lg font-bold">Upload a document</h3>
      <p className="mt-1 text-sm text-slate-500">
        Choose a document and its destination folder.
      </p>

      <form
        className="mt-5 space-y-4"
        onSubmit={async (event) => {
          event.preventDefault()

          const fileInput = event.currentTarget.querySelector(
            'input[type="file"]',
          ) as HTMLInputElement

          const selectedFile = fileInput.files?.[0]

          if (!selectedFile || !fileName || error || isUploading) {
            setError('Please select a valid file before continuing.')
            return
          }

          setIsUploading(true)
          setError('')

          try {
            const savedDocument = await uploadDocument(selectedFile, folder)

            const sizeInKB = Math.round(savedDocument.size_bytes / 1024)
            const formattedSize =
              sizeInKB >= 1024
                ? `${(sizeInKB / 1024).toFixed(1)} MB`
                : `${sizeInKB} KB`

            onUpload({
              id: savedDocument.id,
              owner_id: savedDocument.owner_id,
              name: savedDocument.name,
              type: savedDocument.mime_type,
              size: formattedSize,
              date: new Date(savedDocument.created_at).toLocaleDateString(
                'en-US',
                {
                  month: 'short',
                  day: '2-digit',
                  year: 'numeric',
                },
              ),
              folder: savedDocument.folder,
            })

            onCancel()
          } catch (uploadError) {
            setError(
              uploadError instanceof Error
                ? uploadError.message
                : 'Upload failed. Please try again.',
            )
          } finally {
            setIsUploading(false)
          }
        }}
      >
        <div>
          <label
            htmlFor="document-file"
            className="mb-2 block text-sm font-medium"
          >
            Choose a file
          </label>

          <input
            id="document-file"
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            required
            onChange={(event) => {
              const selectedFile = event.target.files?.[0]

              setError('')
              setFileName('')

              if (!selectedFile) return

              const allowedTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'image/jpeg',
                'image/png',
              ]

              const maxSize = 10 * 1024 * 1024

              if (!allowedTypes.includes(selectedFile.type)) {
                setError(
                  'Unsupported file type. Choose a PDF, Word document, JPG, or PNG.',
                )
                event.target.value = ''
                return
              }

              if (selectedFile.size > maxSize) {
                setError(
                  'File is too large. The maximum allowed size is 10 MB.',
                )
                event.target.value = ''
                return
              }

              setFileName(selectedFile.name)
            }}
            className="block w-full rounded-xl border border-slate-200 p-3 text-sm"
          />

          <p className="mt-1 text-xs text-slate-500">
            Allowed types: PDF, Word, JPG and PNG. Maximum size: 10 MB.
          </p>

          {error && (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="document-folder"
            className="mb-2 block text-sm font-medium"
          >
            Save to folder
          </label>

          <select
            id="document-folder"
            value={folder}
            onChange={(event) => setFolder(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
          >
            <option>Employment Documents</option>
            <option>Payslips</option>
            <option>Salary &amp; Hike Letters</option>
            <option>Tax Documents</option>
            <option>Benefits &amp; Insurance</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isUploading}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUploading ? 'Uploading...' : 'Continue'}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={isUploading}
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}





export default App
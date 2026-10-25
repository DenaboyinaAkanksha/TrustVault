import { useEffect, useState } from 'react'
import Login from './Login'
import Signup from './Signup'
import { supabase } from './lib/supabase'
import {
  getMyDocumentPermission,
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
  updateDocumentDetails,
} from './lib/documentService'
import { listAuditLogs, type AuditLog } from './lib/auditService'
import ResetPassword from './ResetPassword'

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
  const colorClass = badgeStyles[extension] ?? 'bg-slate-100 text-slate-600'

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
  {
    name: 'Employment Documents',
    icon: 'briefcase-business',
    color: 'text-blue-600 bg-blue-50',
    description: 'Offer, welcome and appointment letters',
  },
  {
    name: 'Payslips',
    icon: 'wallet',
    color: 'text-emerald-600 bg-emerald-50',
    description: 'Monthly salary slips',
  },
  {
    name: 'Salary & Hike Letters',
    icon: 'trending-up',
    color: 'text-purple-600 bg-purple-50',
    description: 'Increments and revised CTC',
  },
  {
    name: 'Tax Documents',
    icon: 'landmark',
    color: 'text-amber-600 bg-amber-50',
    description: 'Form 16, AIS and tax records',
  },
  {
    name: 'Benefits & Insurance',
    icon: 'shield-check',
    color: 'text-pink-600 bg-pink-50',
    description: 'EPF, insurance and benefits',
  },
]

const initialDocuments: Document[] = []

function App() {
  const [activeFolder, setActiveFolder] = useState('All Documents')
  const [currentView, setCurrentView] = useState<'documents' | 'audit'>('documents')
  const [search, setSearch] = useState('')
  const [documents, setDocuments] = useState(initialDocuments)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserName, setCurrentUserName] = useState('')
  const [currentPage, setCurrentPage] = useState<'login' | 'signup'>('login')
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [shareFormOpen, setShareFormOpen] = useState(false)
  const [documentAccessList, setDocumentAccessList] = useState<DocumentAccess[]>([])
  const [myDocumentPermission, setMyDocumentPermission] = useState<
    'owner' | 'read' | 'edit' | null
  >(null)
  const [permissionLoading, setPermissionLoading] = useState(false)
  const [recipientEmail, setRecipientEmail] = useState('')
  const [editFormOpen, setEditFormOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editFolder, setEditFolder] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')
  const [sharePermission, setSharePermission] = useState<'read' | 'edit'>('read')

  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

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

  function openEditForm() {
    if (!selectedDocument) return

    if (myDocumentPermission !== 'owner' && myDocumentPermission !== 'edit') {
      window.alert('You do not have permission to edit this document.')
      return
    }

    setEditName(selectedDocument.name)
    setEditFolder(selectedDocument.folder)
    setEditError('')
    setEditFormOpen(true)
  }

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      window.alert('Unable to sign out. Please try again.')
      return
    }

    setShowProfileMenu(false)
    setShowChangePassword(false)
    setIsLoggedIn(false)
    setCurrentPage('login')
  }

  async function handleChangePassword(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setPasswordMessage('')
    setPasswordError('')

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }

    setIsChangingPassword(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        setPasswordError(error.message)
        return
      }

      setPasswordMessage('Your password has been changed successfully.')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      setPasswordError('Unable to change password. Please try again.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  async function loadAuditLogs() {
    setAuditLoading(true)

    try {
      const logs = await listAuditLogs()
      setAuditLogs(logs)
    } catch (error) {
      console.error('Error loading audit trail:', error)
      window.alert(
        error instanceof Error ? error.message : 'Could not load audit trail.',
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
        setCurrentUserName(
          data.session?.user.user_metadata?.full_name ||
            data.session?.user.user_metadata?.name ||
            data.session?.user.email ||
            '',
        )
      }

      setAuthLoading(false)
    }

    void checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsResettingPassword(true)
      }
      setIsLoggedIn(Boolean(session))
      setCurrentUserId(session?.user.id ?? null)
      setCurrentUserName(
        session?.user.user_metadata?.full_name ||
          session?.user.user_metadata?.name ||
          session?.user.email ||
          '',
      )
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
        <p className="text-sm font-medium text-slate-600">Loading TrustVault...</p>
      </div>
    )
  }
  

if (isResettingPassword) {
  return (
    <ResetPassword
      onComplete={async () => {
        await supabase.auth.signOut()
        setIsResettingPassword(false)
        setIsLoggedIn(false)
        setCurrentPage('login')
      }}
    />
  )
}




  if (!isLoggedIn) {
    if (currentPage === 'signup') {
      return (
        <Signup
          onSignup={() => {
            window.alert('Signup is not connected yet. Real account creation comes next.')
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">
            T
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">TrustVault</h1>
            <p className="text-xs text-slate-500">Your files, protected</p>
          </div>
        </div>

        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Workspace
        </p>

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
            type="button"
            onClick={() => {
              setCurrentView('documents')
              setActiveFolder('All Documents')
            }}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium ${
              activeFolder === 'All Documents'
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>▦</span> All Documents
          </button>

          {folders.map((folder) => (
            <button
              type="button"
              key={folder.name}
              onClick={() => {
                setCurrentView('documents')
                setActiveFolder(folder.name)
              }}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium ${
                activeFolder === folder.name
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
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
        {/* Header: Upload button and profile menu are together on the right. */}
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {currentView === 'audit' ? 'Audit Trail' : 'My Documents'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {currentView === 'audit'
                ? 'Review recent activity involving your documents.'
                : 'Manage and organize your important files.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {currentView === 'documents' && (
              <button
                type="button"
                onClick={() => setShowUploadForm(true)}
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <span className="mr-2 text-lg leading-none">+</span>
                Upload document
              </button>
            )}

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowProfileMenu((open) => !open)}
                aria-expanded={showProfileMenu}
                aria-haspopup="menu"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  {currentUserName.charAt(0).toUpperCase() || 'U'}
                </span>
                <span className="max-w-40 truncate">{currentUserName || 'User'}</span>
                <span aria-hidden="true">⌄</span>
              </button>

              {showProfileMenu && (
                <div
                  role="menu"
                  className="absolute right-0 z-30 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setShowProfileMenu(false)
                      setPasswordMessage('')
                      setPasswordError('')
                      setNewPassword('')
                      setConfirmPassword('')
                      setShowChangePassword(true)
                    }}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                  >
                    Change Password
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => void handleSignOut()}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
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
                      <tr key={log.id} className="border-b border-slate-50 last:border-0">
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
                  setDocuments((currentDocuments) => [newDocument, ...currentDocuments])
                  setActiveFolder('All Documents')
                  setSearch('')
                }}
              />
            )}

            <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {folders.map((folder) => (
                <button
                  type="button"
                  key={folder.name}
                  onClick={() => setActiveFolder(folder.name)}
                  className={`rounded-2xl border bg-white p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                    activeFolder === folder.name
                      ? 'border-blue-300 ring-2 ring-blue-100'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-xl text-2xl ${folder.color}`}>
                      📁
                    </span>
                    <span className="text-xs text-slate-400">
                      {folderCount(folder.name)} files
                    </span>
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
                    {visibleDocuments.length} {visibleDocuments.length === 1 ? 'document' : 'documents'}
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
                      <th className="pb-4 font-medium">Actions</th>
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
                                setMyDocumentPermission(null)
                                setPermissionLoading(true)
                                setEditFormOpen(false)
                                setShareFormOpen(false)

                                try {
                                  const permission = await getMyDocumentPermission(document.id)
                                  setMyDocumentPermission(permission)

                                  if (document.owner_id === currentUserId) {
                                    const accessList = await listDocumentAccess(document.id)
                                    setDocumentAccessList(accessList)
                                  }
                                } catch (error) {
                                  console.error('Failed to load document permissions:', error)
                                  window.alert(
                                    error instanceof Error
                                      ? error.message
                                      : 'Could not load document permissions.',
                                  )
                                } finally {
                                  setPermissionLoading(false)
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
                                    currentDocuments.filter((item) => item.id !== document.id),
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
                        <td colSpan={5} className="py-10 text-center text-slate-500">
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

      {/* Change Password dialog */}
      {showChangePassword && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-password-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="change-password-title" className="text-xl font-bold text-slate-900">
                  Change Password
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Choose a new password with at least 8 characters.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close change password dialog"
                onClick={() => setShowChangePassword(false)}
                className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="mt-6 space-y-4">
              <div>
                <label htmlFor="new-password" className="mb-1 block text-sm font-medium text-slate-700">
                  New password
                </label>
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  minLength={8}
                  required
                  className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="mb-1 block text-sm font-medium text-slate-700">
                  Confirm new password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  minLength={8}
                  required
                  className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {passwordError && (
                <p role="alert" className="text-sm text-red-600">
                  {passwordError}
                </p>
              )}

              {passwordMessage && (
                <p role="status" className="text-sm text-emerald-700">
                  {passwordMessage}
                </p>
              )}

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isChangingPassword ? 'Updating...' : 'Update password'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowChangePassword(false)}
                  disabled={isChangingPassword}
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Close
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Document details panel */}
      {selectedDocument && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close document details"
            className="absolute inset-0 h-full w-full bg-slate-900/30"
            onClick={() => setSelectedDocument(null)}
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="document-details-title"
            className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-blue-600">Document details</p>
                <h2 id="document-details-title" className="mt-2 break-words text-xl font-bold text-slate-900">
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

            {permissionLoading ? (
              <p className="py-8 text-center text-sm text-slate-500">
                Checking document permissions...
              </p>
            ) : (
              <div className="mt-8 space-y-5">
                <div>
                  <p className="text-sm text-slate-500">File type</p>
                  <div className="mt-2">
                    <FileTypeBadge fileName={selectedDocument.name} />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <p className="text-sm text-slate-500">Folder</p>
                  <p className="mt-1 font-medium text-slate-800">{selectedDocument.folder}</p>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <p className="text-sm text-slate-500">File size</p>
                  <p className="mt-1 font-medium text-slate-800">{selectedDocument.size}</p>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <p className="text-sm text-slate-500">Date added</p>
                  <p className="mt-1 font-medium text-slate-800">{selectedDocument.date}</p>
                </div>

                {myDocumentPermission && (
                  <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                    Your permission:{' '}
                    <span className="font-semibold">
                      {myDocumentPermission === 'owner'
                        ? 'Owner'
                        : myDocumentPermission === 'edit'
                          ? 'Can edit'
                          : 'Read only'}
                    </span>
                  </p>
                )}

                {(myDocumentPermission === 'owner' || myDocumentPermission === 'read' || myDocumentPermission === 'edit') && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await downloadDocument(selectedDocument.id)
                      } catch (error) {
                        window.alert(
                          error instanceof Error ? error.message : 'Could not download the document.',
                        )
                      }
                    }}
                    className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Download document
                  </button>
                )}

                {(myDocumentPermission === 'owner' || myDocumentPermission === 'edit') && (
                  <div className="mt-4">
                    {!editFormOpen ? (
                      <button
                        type="button"
                        onClick={openEditForm}
                        className="w-full rounded-xl border border-blue-600 px-4 py-3 text-sm font-semibold text-blue-600 hover:bg-blue-50"
                      >
                        Edit document details
                      </button>
                    ) : (
                      <form
                        className="space-y-4 rounded-xl border border-slate-200 p-4"
                        onSubmit={async (event) => {
                          event.preventDefault()
                          if (!selectedDocument || editSaving) return

                          setEditSaving(true)
                          setEditError('')

                          try {
                            await updateDocumentDetails(selectedDocument.id, editName, editFolder)

                            const updatedDocument = {
                              ...selectedDocument,
                              name: editName.trim(),
                              folder: editFolder,
                            }

                            setSelectedDocument(updatedDocument)
                            setDocuments((currentDocuments) =>
                              currentDocuments.map((document) =>
                                document.id === updatedDocument.id
                                  ? { ...document, ...updatedDocument }
                                  : document,
                              ),
                            )
                            setEditFormOpen(false)
                            window.alert('Document details updated successfully.')
                          } catch (error) {
                            setEditError(
                              error instanceof Error
                                ? error.message
                                : 'Could not update document details.',
                            )
                          } finally {
                            setEditSaving(false)
                          }
                        }}
                      >
                        <h3 className="text-sm font-semibold text-slate-800">Edit document details</h3>

                        <div>
                          <label htmlFor="edit-document-name" className="mb-1 block text-sm font-medium text-slate-700">
                            Document name
                          </label>
                          <input
                            id="edit-document-name"
                            type="text"
                            value={editName}
                            onChange={(event) => setEditName(event.target.value)}
                            required
                            maxLength={255}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>

                        <div>
                          <label htmlFor="edit-document-folder" className="mb-1 block text-sm font-medium text-slate-700">
                            Folder
                          </label>
                          <select
                            id="edit-document-folder"
                            value={editFolder}
                            onChange={(event) => setEditFolder(event.target.value)}
                            required
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                          >
                            <option>Employment Documents</option>
                            <option>Payslips</option>
                            <option>Salary &amp; Hike Letters</option>
                            <option>Tax Documents</option>
                            <option>Benefits &amp; Insurance</option>
                          </select>
                        </div>

                        {editError && <p role="alert" className="text-sm text-red-600">{editError}</p>}

                        <div className="flex gap-3">
                          <button
                            type="submit"
                            disabled={editSaving}
                            className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                          >
                            {editSaving ? 'Saving...' : 'Save changes'}
                          </button>
                          <button
                            type="button"
                            disabled={editSaving}
                            onClick={() => {
                              setEditFormOpen(false)
                              setEditError('')
                            }}
                            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {selectedDocument.owner_id === currentUserId && (
                  <>
                    {shareFormOpen && (
                      <form
                        className="mt-4 space-y-4 rounded-xl border border-gray-200 p-4"
                        onSubmit={async (event) => {
                          event.preventDefault()
                          try {
                            await shareDocument(selectedDocument.id, recipientEmail, sharePermission)
                            window.alert('Document shared successfully!')
                            setRecipientEmail('')
                            setShareFormOpen(false)
                            const accessList = await listDocumentAccess(selectedDocument.id)
                            setDocumentAccessList(accessList)
                          } catch (error) {
                            window.alert(
                              error instanceof Error ? error.message : 'Could not share the document.',
                            )
                          }
                        }}
                      >
                        <div>
                          <label htmlFor="recipientEmail" className="mb-1 block text-sm font-medium text-gray-700">
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
                          <label htmlFor="sharePermission" className="mb-1 block text-sm font-medium text-gray-700">
                            Permission
                          </label>
                          <select
                            id="sharePermission"
                            value={sharePermission}
                            onChange={(event) => setSharePermission(event.target.value as 'read' | 'edit')}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          >
                            <option value="read">Read only</option>
                            <option value="edit">Can edit</option>
                          </select>
                        </div>

                        <button type="submit" className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">
                          Grant access
                        </button>
                      </form>
                    )}

                    <button
                      type="button"
                      onClick={() => setShareFormOpen((open) => !open)}
                      className="mt-3 w-full rounded-xl border border-blue-600 px-4 py-3 text-sm font-semibold text-blue-600 hover:bg-blue-50"
                    >
                      {shareFormOpen ? 'Cancel sharing' : 'Share document'}
                    </button>

                    <div className="mt-6 rounded-xl border border-gray-200 p-4">
                      <h3 className="mb-3 text-sm font-semibold text-gray-800">People with access</h3>

                      {documentAccessList.length === 0 ? (
                        <p className="text-sm text-gray-500">No one else has access to this document yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {documentAccessList.map((access) => (
                            <div key={access.user_id} className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-gray-700">{access.full_name || 'Name unavailable'}</p>
                                <p className="text-xs text-gray-500">{access.email || 'Email unavailable'}</p>
                                <p className="text-xs text-gray-500">
                                  Permission: {access.permission === 'read' ? 'Read only' : 'Can edit'}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={async () => {
                                  const confirmed = window.confirm('Are you sure you want to revoke this user’s access?')
                                  if (!confirmed) return

                                  try {
                                    await revokeDocumentAccess(selectedDocument.id, access.user_id)
                                    setDocumentAccessList((current) =>
                                      current.filter((item) => item.user_id !== access.user_id),
                                    )
                                    window.alert('Access revoked successfully.')
                                  } catch (error) {
                                    window.alert(
                                      error instanceof Error ? error.message : 'Could not revoke access.',
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
                  </>
                )}
              </div>
            )}

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
          const fileInput = event.currentTarget.querySelector('input[type="file"]') as HTMLInputElement
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
              date: new Date(savedDocument.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric',
              }),
              folder: savedDocument.folder,
            })

            onCancel()
          } catch (uploadError) {
            setError(
              uploadError instanceof Error ? uploadError.message : 'Upload failed. Please try again.',
            )
          } finally {
            setIsUploading(false)
          }
        }}
      >
        <div>
          <label htmlFor="document-file" className="mb-2 block text-sm font-medium">
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
                setError('Unsupported file type. Choose a PDF, Word document, JPG, or PNG.')
                event.target.value = ''
                return
              }

              if (selectedFile.size > maxSize) {
                setError('File is too large. The maximum allowed size is 10 MB.')
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
          {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}
        </div>

        <div>
          <label htmlFor="document-folder" className="mb-2 block text-sm font-medium">
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
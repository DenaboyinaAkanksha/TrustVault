import { useState } from 'react'
import Login from './Login'

type Document = {
  id: number
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

const initialDocuments: Document[] = [
  { id: 1, name: 'Welcome Letter.pdf', type: 'PDF', size: '420 KB', date: 'Oct 18, 2026', folder: 'Employment Documents' },
  { id: 2, name: 'Offer Letter.pdf', type: 'PDF', size: '580 KB', date: 'Oct 17, 2026', folder: 'Employment Documents' },
  { id: 3, name: 'Appointment Letter.pdf', type: 'PDF', size: '510 KB', date: 'Oct 16, 2026', folder: 'Employment Documents' },
  { id: 4, name: 'September 2026 Payslip.pdf', type: 'PDF', size: '220 KB', date: 'Oct 01, 2026', folder: 'Payslips' },
  { id: 5, name: 'August 2026 Payslip.pdf', type: 'PDF', size: '215 KB', date: 'Sep 01, 2026', folder: 'Payslips' },
  { id: 6, name: 'July 2026 Payslip.pdf', type: 'PDF', size: '218 KB', date: 'Aug 01, 2026', folder: 'Payslips' },
  { id: 7, name: 'Annual Hike Letter 2026.pdf', type: 'PDF', size: '360 KB', date: 'Apr 10, 2026', folder: 'Salary & Hike Letters' },
  { id: 8, name: 'Revised CTC Letter.pdf', type: 'PDF', size: '390 KB', date: 'Apr 10, 2026', folder: 'Salary & Hike Letters' },
  { id: 9, name: 'Form 16 - FY 2025-26.pdf', type: 'PDF', size: '680 KB', date: 'Jun 15, 2026', folder: 'Tax Documents' },
  { id: 10, name: 'Form 26AS - FY 2025-26.pdf', type: 'PDF', size: '450 KB', date: 'Jun 14, 2026', folder: 'Tax Documents' },
  { id: 11, name: 'ITR Acknowledgement.pdf', type: 'PDF', size: '310 KB', date: 'Jul 20, 2026', folder: 'Tax Documents' },
  { id: 12, name: 'EPF Statement.pdf', type: 'PDF', size: '290 KB', date: 'Sep 12, 2026', folder: 'Benefits & Insurance' },
  { id: 13, name: 'Health Insurance Policy.pdf', type: 'PDF', size: '1.2 MB', date: 'Aug 22, 2026', folder: 'Benefits & Insurance' },
]

function App() {
  const [activeFolder, setActiveFolder] = useState('All Documents')
  const [search, setSearch] = useState('')
  const [documents, setDocuments] = useState(initialDocuments)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [showUploadForm, setShowUploadForm] = useState(false)

  const visibleDocuments = documents.filter((document) => {
    const matchesFolder =
      activeFolder === 'All Documents' || document.folder === activeFolder
    const matchesSearch = document.name.toLowerCase().includes(search.toLowerCase())
    return matchesFolder && matchesSearch
  })

  const folderCount = (folderName: string) =>
    documents.filter((document) => document.folder === folderName).length
   if (!isLoggedIn) {
   return (
     <Login
       onLogin={() => setIsLoggedIn(true)}
       onSignup={() => {
         alert('Signup page is coming next!')
       }}
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
            onClick={() => setActiveFolder('All Documents')}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium ${activeFolder === 'All Documents' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <span>▦</span> All Documents
          </button>
          {folders.map((folder) => (
            <button
              key={folder.name}
              onClick={() => setActiveFolder(folder.name)}
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
        <header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="mb-1 text-sm text-slate-500">Your workspace</p>
            <h2 className="text-3xl font-bold tracking-tight">{activeFolder}</h2>
            <p className="mt-2 text-sm text-slate-500">Your important documents, neatly organized.</p>
          </div>
          <button
            onClick={() => setShowUploadForm(true)}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            + Upload document
          </button>
        </header>
       {showUploadForm && (
           <UploadForm
          onCancel={() => setShowUploadForm(false)}
          onUpload={(newDocument) => {
          setDocuments((currentDocuments) => [
                ...currentDocuments,
            {
          id: Math.max(0, ...currentDocuments.map((document) => document.id)) + 1,
              ...newDocument,
           },
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
              onClick={() => setSelectedDocument(document)}
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
           <button
              type="button"
               onClick={() => {
               const confirmed = window.confirm(
                `Are you sure you want to delete "${document.name}"?`
                 )

              if (confirmed) {
                 setDocuments((currentDocuments) =>
                  currentDocuments.filter(
                   (item) => item.id !== document.id
                   )
                )
              }
             }}
            className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
             >
             Delete
            </button>
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
          <p className="mt-5 text-xs text-slate-400">
            Demo content only. These are fictional examples; no actual documents are stored or protected yet.
          </p>
        
        </section>
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

              <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                this panel displays document information only.
    
              </p>
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
  onUpload: (document: Omit<Document, 'id'>) => void
}) {
  const [fileName, setFileName] = useState('')
  const [folder, setFolder] = useState('Employment Documents')
  const [error, setError] = useState('')

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
      <h3 className="text-lg font-bold">Upload a document</h3>
      <p className="mt-1 text-sm text-slate-500">
        Choose a document and its destination folder.
      </p>

      <form
        className="mt-5 space-y-4"
        onSubmit={(event) => {
         event.preventDefault()

        const fileInput = event.currentTarget.querySelector(
         'input[type="file"]',
        )as HTMLInputElement

       const selectedFile = fileInput.files?.[0]

       if (!selectedFile || !fileName || error) {
       setError('Please select a valid file before continuing.')
       return
       }

      const sizeInKB = Math.round(selectedFile.size / 1024)
      const formattedSize =
       sizeInKB >= 1024
        ? `${(sizeInKB / 1024).toFixed(1)} MB`
        : `${sizeInKB} KB`

     onUpload({
      name: selectedFile.name,
      type: selectedFile.type,
      size: formattedSize,
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }),
     folder,
    })

     onCancel()
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
            Allowed types: PDF, Word, JPG and PNG.
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
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Continue
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default App
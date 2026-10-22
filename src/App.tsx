const documents = [
  { name: "Personal Documents", type: "PDF", category: "Personal", size: "2.4 MB", date: "Oct 18, 2026", icon: "📄" },
  { name: "Insurance Policy", type: "PDF", category: "Finance", size: "1.8 MB", date: "Oct 15, 2026", icon: "🛡️" },
  { name: "Travel Documents", type: "PDF", category: "Travel", size: "3.2 MB", date: "Oct 12, 2026", icon: "✈️" },
  { name: "Property Records", type: "PDF", category: "Personal", size: "4.1 MB", date: "Oct 10, 2026", icon: "🏠" },
  { name: "Tax Documents", type: "PDF", category: "Finance", size: "1.2 MB", date: "Oct 05, 2026", icon: "💼" },
  { name: "Medical Records", type: "PDF", category: "Personal", size: "2.7 MB", date: "Sep 28, 2026", icon: "📋" },
]

const categories = ["All Files", "Personal", "Finance", "Travel"]

function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 md:flex">
      <aside className="border-b border-slate-200 bg-white p-5 md:min-h-screen md:w-64 md:border-b-0 md:border-r">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-xl text-white">
            ◈
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">TrustVault</h1>
            <p className="text-xs text-slate-500">Your private space</p>
          </div>
        </div>

        <p className="mb-3 mt-8 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Workspace
        </p>

        <nav className="flex gap-2 overflow-x-auto md:flex-col">
          {categories.map((category, index) => (
            <button
              key={category}
              className={`whitespace-nowrap rounded-lg px-3 py-2.5 text-left text-sm font-medium ${
                index === 0
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {category === "All Files" ? "▦" : "▱"} {category}
            </button>
          ))}
        </nav>

        <div className="mt-8 hidden rounded-xl bg-indigo-50 p-4 md:block">
          <div className="mb-2 text-xl">🔐</div>
          <p className="text-sm font-semibold text-slate-800">Privacy first</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            Your documents deserve a secure home.
          </p>
        </div>

        <div className="mt-6 text-xs text-slate-400 md:mt-12">
          TrustVault · Portfolio demo
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-5 sm:p-8 lg:p-10">
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-slate-500">Your workspace</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              My Documents
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Keep your important files organized in one place.
            </p>
          </div>

          <button
            onClick={() => alert("File upload will be added in the next step.")}
            className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            + Upload document
          </button>
        </header>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Total documents</p>
            <p className="mt-3 text-3xl font-bold">06</p>
            <p className="mt-2 text-xs text-slate-400">Sample documents</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Storage used</p>
            <p className="mt-3 text-3xl font-bold">15.4 MB</p>
            <p className="mt-2 text-xs text-slate-400">Illustrative data only</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Workspace status</p>
            <p className="mt-3 text-xl font-bold text-amber-600">Demo mode</p>
            <p className="mt-2 text-xs text-slate-400">Storage not connected yet</p>
          </div>
        </div>

        <section className="mt-10">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-lg font-bold">Recent documents</h3>
              <p className="mt-1 text-sm text-slate-500">
                Example files to preview your workspace.
              </p>
            </div>
            <input
              type="search"
              placeholder="Search documents..."
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 sm:max-w-xs"
            />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {documents.map((document) => (
              <article
                key={document.name}
                className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-2xl">
                    {document.icon}
                  </div>
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
                    {document.type}
                  </span>
                </div>

                <h4 className="mt-5 truncate font-semibold">{document.name}</h4>
                <p className="mt-2 text-sm text-slate-500">
                  {document.category} · {document.size}
                </p>
                <div className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-400">
                  Example date: {document.date}
                </div>
              </article>
            ))}
          </div>
        </section>

        <footer className="mt-10 border-t border-slate-200 py-5 text-center text-xs text-slate-400">
          TrustVault is currently a demo. No files are being uploaded or stored.
        </footer>
      </main>
    </div>
  )
}

export default App
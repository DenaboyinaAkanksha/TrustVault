import { useState } from 'react'

type SignupProps = {
  onSignup: () => void
  onLogin: () => void
}

function Signup({ onSignup, onLogin }: SignupProps) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const passwordStrength = [
  password.length >= 8,
  /[A-Z]/.test(password),
  /[a-z]/.test(password),
  /[0-9]/.test(password),
  /[^A-Za-z0-9]/.test(password),
].filter(Boolean).length

const strengthLabel =
  password.length === 0
    ? ''
    : passwordStrength <= 2
      ? 'Weak'
      : passwordStrength <= 4
        ? 'Medium'
        : 'Strong'

const strengthColor =
  passwordStrength <= 2
    ? 'bg-red-500'
    : passwordStrength <= 4
      ? 'bg-amber-500'
      : 'bg-emerald-500'
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please complete all fields.')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.')
      return
    }

    if (password.length < 8) {
      setError('Your password must be at least 8 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Your passwords do not match.')
      return
    }

    setSuccess(' Form validated successfully! Account creation is not connected yet.')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-xl">
        <div className="bg-slate-900 px-8 py-7 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-8 w-8"
              aria-hidden="true"
            >
              <path d="M12 3 20 6v5c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6l8-3Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">
            TrustVault
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Your documents. Your privacy.
          </p>
        </div>

        <div className="px-8 py-7">
          <h2 className="text-2xl font-bold text-slate-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Start organizing your documents in one place.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="signup-name" className="mb-2 block text-sm font-medium text-slate-700">
                Full name
              </label>
              <input
                id="signup-name"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Your full name"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label htmlFor="signup-email" className="mb-2 block text-sm font-medium text-slate-700">
                Email address
              </label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label htmlFor="signup-password" className="mb-2 block text-sm font-medium text-slate-700">
                Password
              </label>
                 
        <div className="relative">
         <input
          id="signup-password"
          type={showPassword ? 'text' : 'password'}
         autoComplete="new-password"
         value={password}
         onChange={(event) => setPassword(event.target.value)}
         placeholder="At least 8 characters"
         minLength={8}
         required
         className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-20 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
         />

         <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-3 text-sm font-medium text-blue-600 hover:text-blue-800"
         >
         {showPassword ? 'Hide' : 'Show'}
        </button>
       </div>

{password.length > 0 && (
  <div className="mt-2">
    <div className="mb-1 flex items-center justify-between">
      <span className="text-xs text-slate-500">
        Password strength
      </span>
      <span className="text-xs font-semibold text-slate-700">
        {strengthLabel}
      </span>
    </div>

    <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
      <div
        className={`h-full rounded-full transition-all duration-300 ${strengthColor}`}
        style={{ width: `${(passwordStrength / 5) * 100}%` }}
      />
    </div>
  </div>
)}

            </div>

            <div>
              <label htmlFor="signup-confirm-password" className="mb-2 block text-sm font-medium text-slate-700">
                Confirm password
              </label>
              <input
                id="signup-confirm-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Enter your password again"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

              {confirmPassword.length > 0 && (
               <p
                className={`mt-2 text-xs font-medium ${
                password === confirmPassword
                ? 'text-emerald-600'
               : 'text-red-600'
               }`}
               >
              {password === confirmPassword
                ? 'Passwords match'
               : 'Passwords do not match'}
               </p>
              )}
            </div>

            
            {error && (
             <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
             {error}
             </p>
            )}

          {success && (
           <p
            role="status"
            className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700"
           >
          {success}
          </p> 
          )}


            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
            >
              Create account
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onLogin}
              className="font-semibold text-blue-600 hover:text-blue-800"
            >
              Sign in
            </button>
          </p>
        </div>
      </section>
    </main>
  )
}

export default Signup
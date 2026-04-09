import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

export default function Auth() {
  const { user, loading, signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-tx3 text-sm">Laden…</div>
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) setError(error.message);
    } else {
      const { error } = await signUp(email, password);
      if (error) setError(error.message);
      else setMessage("Check je email om je account te bevestigen!");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="7" height="10" rx="1" fill="black" opacity="0.9" />
                <rect x="4" y="3" width="7" height="10" rx="1" fill="black" opacity="0.45" />
              </svg>
            </div>
            <span className="text-xl font-medium text-foreground">Readify</span>
          </div>
          <p className="text-sm text-tx3">Je persoonlijke boekenbibliotheek</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex mb-5 border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => { setIsLogin(true); setError(""); setMessage(""); }}
              className={`flex-1 py-2 text-[13px] font-medium transition-colors ${isLogin ? 'bg-primary text-primary-foreground' : 'text-tx2 hover:text-foreground'}`}
            >
              Inloggen
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(""); setMessage(""); }}
              className={`flex-1 py-2 text-[13px] font-medium transition-colors ${!isLogin ? 'bg-primary text-primary-foreground' : 'text-tx2 hover:text-foreground'}`}
            >
              Registreren
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-[11px] text-tx3 block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full border border-border rounded-lg py-2 px-3 text-[13px] bg-background text-foreground placeholder:text-tx3 focus:outline-none focus:border-primary transition-colors"
                placeholder="je@email.com"
              />
            </div>
            <div>
              <label className="text-[11px] text-tx3 block mb-1">Wachtwoord</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full border border-border rounded-lg py-2 px-3 text-[13px] bg-background text-foreground placeholder:text-tx3 focus:outline-none focus:border-primary transition-colors"
                placeholder="Min. 6 tekens"
              />
            </div>

            {error && <div className="text-[12px] text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</div>}
            {message && <div className="text-[12px] text-green-400 bg-green-400/10 rounded-lg px-3 py-2">{message}</div>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-[13px] hover:bg-or-dark transition-all disabled:opacity-50"
            >
              {submitting ? 'Even geduld…' : isLogin ? 'Inloggen' : 'Registreren'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-surface-page flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-border-dark border-t-royal-blue rounded-full animate-spin" />
      </div>
    );
  }

  if (session) {
    navigate("/", { replace: true });
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (err) {
      setError(err.message || "Invalid login credentials");
      return;
    }
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-surface-page flex items-center justify-center">
      <div className="bg-surface-card border-2 border-border-dark rounded-sm p-6 sm:p-8 w-full max-w-md mx-4 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
        <h1
          className="font-pixel text-xs text-flag-yellow text-center leading-relaxed"
          style={{ textShadow: "0 0 12px rgba(244,196,48,0.3)" }}
        >
          THREEDUNGEONS
        </h1>
        <p className="text-sm text-text-muted mt-2 text-center">
          Sign in to your account
        </p>
        <form onSubmit={handleSubmit} className="mt-6">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-text-primary mb-2">
              Your email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-surface-inner border-2 border-border-dark text-text-primary text-sm rounded-sm p-2.5 block w-full focus:ring-royal-blue focus:border-royal-blue"
              placeholder="name@example.com"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-text-primary mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-surface-inner border-2 border-border-dark text-text-primary text-sm rounded-sm p-2.5 block w-full focus:ring-royal-blue focus:border-royal-blue"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full text-white bg-gradient-to-b from-royal-blue-light to-royal-blue border-2 border-royal-blue-dark rounded-sm shadow-[0_0_8px_rgba(29,59,142,0.4)] font-bold uppercase tracking-wider text-sm px-5 py-2.5"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="text-sm text-text-muted mt-4 text-center">
          Have an invite code?{" "}
          <Link to="/signup" className="text-royal-blue-light hover:underline">
            Sign up
          </Link>
        </p>
        {error && (
          <p className="text-sm text-roof-red mt-4 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { API_BASE } from "../api/client";
import { useToast } from "../context/ToastContext";

interface LoginForm {
  identifier: string;
  password: string;
}

interface Props {
  onSuccess: (token: string) => void;
}

const Login = ({ onSuccess }: Props) => {
  const { addToast } = useToast();
  const [form, setForm]     = useState<LoginForm>({ identifier: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: form.identifier,
          password: form.password,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        addToast(err.detail ?? "Invalid credentials. Please try again.", "error");
        return;
      }

      const data = await res.json();
      onSuccess(data.token);
    } catch (err) {
      console.error("Login fetch error:", err);
      addToast("Could not reach the server. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow-sm" style={{ width: "100%", maxWidth: "420px" }}>
        <div className="card-body p-4 p-md-5">

          {/* Title */}
          <h1 className="fw-bold mb-1 text-center">Scalable</h1>
          <p className="text-muted text-center mb-4">Sign in to your account</p>

          <form onSubmit={handleSubmit} noValidate>

            {/* Username or Email */}
            <div className="mb-3">
              <label htmlFor="identifier" className="form-label fw-semibold">
                Username or Email Address
              </label>
              <input
                id="identifier"
                name="identifier"
                type="text"
                className="form-control form-control-lg"
                placeholder="you@example.com"
                value={form.identifier}
                onChange={handleChange}
                autoComplete="username"
                required
              />
            </div>

            {/* Password */}
            <div className="mb-4">
              <label htmlFor="password" className="form-label fw-semibold">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className="form-control form-control-lg"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
            </div>

            {/* Continue button */}
            <button
              type="submit"
              className="btn btn-dark btn-lg w-100"
              disabled={loading || !form.identifier || !form.password}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  />
                  Signing in…
                </>
              ) : (
                "Continue"
              )}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

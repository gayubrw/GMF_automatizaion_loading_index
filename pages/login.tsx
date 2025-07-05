import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link"; // Link is used here, so no unused warning
import { supabase } from "../lib/supabaseClient"; // Import client

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
    } else if (data.user) {
      alert("Logged in successfully!");
      router.push("/"); // Redirect ke halaman utama setelah login
    } else {
      setError("Login failed. Please check your credentials.");
    }
    setLoading(false);
  };

  return (
    <div
      className="container"
      style={{ maxWidth: "400px", paddingTop: "50px" }}
    >
      <h1 style={{ textAlign: "center" }}>Login</h1>
      {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}
      <form
        onSubmit={handleLogin}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          backgroundColor: "white",
          padding: "30px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <div>
          <label style={{ display: "block", marginBottom: "5px" }}>
            Email:
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: "5px" }}>
            Password:
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{ padding: "12px", fontSize: "18px" }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}

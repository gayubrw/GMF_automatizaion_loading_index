// pages/index.tsx
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient"; // <<< PENTING: Import supabaseClient
import { useRouter } from "next/router"; // <<< PENTING: Import useRouter

interface FlightRecord {
  id: number;
  loading_index_doc: string;
  weight_report_doc: string;
  aircraft_reg?: string;
}

export default function HomePage() {
  const [user, setUser] = useState<any | null>(null); // State user dari Supabase
  const [authLoading, setAuthLoading] = useState(true); // State untuk menunjukkan loading autentikasi
  const router = useRouter(); // Inisialisasi useRouter
  const [flightRecords, setFlightRecords] = useState<FlightRecord[]>([]);
  const [loading, setLoading] = useState(true); // State untuk loading data laporan
  const [error, setError] = useState<string | null>(null); // State untuk error saat fetch data

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser(); // Dapatkan user dari sesi Supabase
      setUser(currentUser); // Set user state
      setAuthLoading(false); // Selesai loading autentikasi
    };
    checkSession();

    // Listener untuk perubahan status autentikasi (misal: setelah logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null); // Update user state
      }
    );
    // Cleanup listener saat komponen di-unmount
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []); // Dependensi kosong agar hanya berjalan sekali saat mount

  useEffect(() => {
    // Hanya fetch data laporan jika status autentikasi sudah diketahui
    if (!authLoading) {
      // Pastikan authLoading sudah selesai
      async function fetchFlightRecords() {
        try {
          const res = await fetch("/api/flight-records");
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          const data: FlightRecord[] = await res.json();
          setFlightRecords(data);
        } catch (err: unknown) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("An unknown error occurred.");
          }
        } finally {
          setLoading(false);
        }
      }
      fetchFlightRecords();
    }
  }, [authLoading]); // Dependensi authLoading agar fetch data setelah auth selesai

  // --- Handler untuk tombol Logout (BARU) ---
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("Error logging out: " + error.message);
    } else {
      alert("Logged out successfully!");
      router.push("/login"); // Redirect ke halaman login setelah logout
    }
  };

  // Tampilkan loading state jika autentikasi atau data sedang dimuat
  if (authLoading || loading)
    return <div className="container">Loading user session...</div>;
  // Tampilkan pesan error jika ada masalah saat fetch data
  if (error) return <div className="container">Error: {error}</div>;

  return (
    <div className="container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h1>Flight Weight & Balance Reports</h1>
        <div>
          {user && ( // Tampilkan email user jika ada (setelah login)
            <span
              style={{ marginRight: "15px", fontSize: "0.9rem", color: "#555" }}
            >
              Logged in as: {user.email}
            </span>
          )}
          {user && ( // Tombol "Add New Report" selalu terlihat jika user sudah login
            <Link href="/add-report" passHref>
              <button style={{ marginRight: "10px" }}>+ Add New Report</button>
            </Link>
          )}
          {user && ( // <<< PENTING: Tombol logout (BARU)
            <button
              onClick={handleLogout}
              style={{ backgroundColor: "#6c757d" }}
            >
              Logout
            </button>
          )}
        </div>
      </div>
      <p>Select a report to view its details:</p>

      {/* Tampilkan pesan jika tidak ada laporan */}
      {flightRecords.length === 0 ? (
        <p>No reports found. Please add data to your database.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "20px",
          }}
        >
          {flightRecords.map((record) => (
            <Link href={`/report/${record.id}`} key={record.id} passHref>
              <div
                style={{
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  padding: "18px 20px",
                  cursor: "pointer",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                  backgroundColor: "white",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  height: "auto",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 12px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 10px rgba(0,0,0,0.08)";
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: "1.2rem",
                      marginBottom: "8px",
                      color: "#0070f3",
                    }}
                  >
                    {record.loading_index_doc}
                  </h2>
                  <p
                    style={{
                      fontSize: "0.9rem",
                      color: "#555",
                      marginBottom: "5px",
                    }}
                  >
                    Weight Report: {record.weight_report_doc}
                  </p>
                  {record.aircraft_reg && (
                    <p
                      style={{
                        fontSize: "0.9rem",
                        color: "#555",
                        marginBottom: "0",
                      }}
                    >
                      Aircraft: {record.aircraft_reg}
                    </p>
                  )}
                </div>
                <span
                  style={{
                    alignSelf: "flex-end",
                    marginTop: "15px",
                    fontSize: "0.9rem",
                    color: "#0070f3",
                    fontWeight: "bold",
                  }}
                >
                  View Details &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

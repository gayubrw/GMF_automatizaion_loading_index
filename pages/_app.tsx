// pages/_app.tsx
import "../styles/globals.css"; // Pastikan ini ada jika Anda punya styling global
import type { AppProps } from "next/app";
import { useRouter } from "next/router"; // Using next/router for App Router compatibility
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient"; // Import supabase client Anda

// Daftar halaman yang TIDAK memerlukan login (publik)
const PUBLIC_PAGES = ["/login"];

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true); // State untuk menunjukkan loading autentikasi

  useEffect(() => {
    // Fungsi untuk memeriksa sesi pengguna
    const checkUserSession = async () => {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Cek apakah halaman saat ini adalah halaman publik
      const isPublicPage = PUBLIC_PAGES.includes(router.pathname);

      if (!session && !isPublicPage) {
        // Jika tidak ada sesi DAN bukan halaman publik, redirect ke login
        router.push("/login");
      } else if (session && isPublicPage && router.pathname !== "/") {
        // Jika ada sesi DAN di halaman publik (selain root), redirect ke halaman utama
        // Ini mencegah pengguna yang sudah login tetap di halaman login/register
        router.push("/");
      }
      setLoading(false);
    };

    // Panggil saat komponen di-mount
    checkUserSession();

    // Listener untuk perubahan status autentikasi (login/logout)
    // Ini memastikan redirect terjadi secara real-time
    const { data: authListener } = supabase.auth.onAuthStateChange((_event) => {
      // Removed '_' from '_event' to use it if needed, though still unused in this context.
      checkUserSession(); // Panggil lagi saat status auth berubah
    });

    // Cleanup listener saat komponen di-unmount
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [router]); // Dependensi router agar useEffect re-run jika route berubah

  // Tampilkan loading state saat memeriksa autentikasi
  if (loading && !PUBLIC_PAGES.includes(router.pathname)) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          fontSize: "24px",
          color: "#333",
        }}
      >
        Loading authentication...
      </div>
    );
  }

  // Render komponen halaman jika sudah selesai loading atau jika di halaman publik
  return <Component {...pageProps} />;
}

export default MyApp;

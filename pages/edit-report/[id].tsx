// pages/edit-report/[id].tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

// Interface untuk data FlightRecord yang akan diambil dan dikirim untuk update
interface FlightRecordData {
  loading_index_doc: string;
  weight_report_doc: string;
  report_date: string; // Akan berupa string YYYY-MM-DD
  aircraft_reg: string;
  empty_weight: number;
  empty_weight_index: number;
  dow_domestic: number;
  doi_domestic: number;
  dow_international: number;
  doi_international: number;
}

export default function EditReportPage() {
  const router = useRouter();
  const { id } = router.query; // ID laporan yang akan diedit

  const [formData, setFormData] = useState<FlightRecordData>({
    loading_index_doc: "",
    weight_report_doc: "",
    report_date: "",
    aircraft_reg: "",
    empty_weight: 0,
    empty_weight_index: 0,
    dow_domestic: 0,
    doi_domestic: 0,
    dow_international: 0,
    doi_international: 0,
  });
  const [loading, setLoading] = useState(true); // Loading saat ambil data awal
  const [submitting, setSubmitting] = useState(false); // Loading saat submit form
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // --- Ambil data laporan yang sudah ada saat komponen dimuat ---
  useEffect(() => {
    if (id && typeof id === "string") {
      async function fetchReportData() {
        try {
          const res = await fetch(`/api/flight-records/${id}`);
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(
              errorData.message || `HTTP error! Status: ${res.status}`
            );
          }
          const data: FlightRecordData = await res.json();

          // Format tanggal agar sesuai dengan input type="date" (YYYY-MM-DD)
          const formattedDate = data.report_date
            ? new Date(data.report_date).toISOString().split("T")[0]
            : "";

          setFormData({
            ...data,
            report_date: formattedDate,
            // Pastikan semua nilai numerik sudah menjadi number dari API
            empty_weight: data.empty_weight,
            empty_weight_index: data.empty_weight_index,
            dow_domestic: data.dow_domestic,
            doi_domestic: data.doi_domestic,
            dow_international: data.dow_international,
            doi_international: data.doi_international,
          });
        } catch (err: unknown) {
          if (err instanceof Error) {
            setError(`Failed to load report data: ${err.message}`);
          } else {
            setError("Failed to load report data: Unknown error");
          }
        } finally {
          setLoading(false);
        }
      }
      fetchReportData();
    } else {
      setLoading(false);
      setError("No report ID provided for editing.");
    }
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    // Konversi nilai numerik ke tipe Number untuk payload POST/PUT
    const payload = {
      ...formData,
      empty_weight: Number(formData.empty_weight) || 0,
      empty_weight_index: Number(formData.empty_weight_index) || 0,
      dow_domestic: Number(formData.dow_domestic) || 0,
      doi_domestic: Number(formData.doi_domestic) || 0,
      dow_international: Number(formData.dow_international) || 0,
      doi_international: Number(formData.doi_international) || 0,
    };

    try {
      const res = await fetch(`/api/flight-records/${id}`, {
        // Kirim ke endpoint API spesifik ID
        method: "PUT", // Menggunakan method PUT untuk pembaruan
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${res.status}`
        );
      }

      setSuccess("Report updated successfully!");
      router.push(`/report/${id}`); // Redirect kembali ke halaman detail laporan
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(`Failed to update report: ${err.message}`);
      } else {
        setError("Failed to update report: Unknown error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return <div className="container">Loading report for editing...</div>;
  if (error && !formData.loading_index_doc)
    return <div className="container">Error: {error}</div>; // Tampilkan error hanya jika data awal gagal dimuat

  return (
    <div className="container">
      <Link href={`/report/${id}`} passHref>
        <button style={{ marginBottom: "30px", backgroundColor: "#6c757d" }}>
          &larr; Cancel Edit
        </button>
      </Link>

      <h1>Edit Flight Weight & Balance Report</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}

      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          backgroundColor: "white",
          padding: "30px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ gridColumn: "span 2" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            Loading Index Doc.:
          </label>
          <input
            type="text"
            name="loading_index_doc"
            value={formData.loading_index_doc}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          />
        </div>
        <div style={{ gridColumn: "span 2" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            Weight Report Doc.:
          </label>
          <input
            type="text"
            name="weight_report_doc"
            value={formData.weight_report_doc}
            onChange={handleChange}
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
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            Report Date:
          </label>
          <input
            type="date"
            name="report_date"
            value={formData.report_date}
            onChange={handleChange}
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
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            Aircraft Registration:
          </label>
          <input
            type="text"
            name="aircraft_reg"
            value={formData.aircraft_reg}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          />
        </div>

        {/* Main Weight Data */}
        <h2
          style={{ gridColumn: "span 2", marginTop: "20px", marginBottom: "0" }}
        >
          Main Weight Data
        </h2>
        <div>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            Empty Weight (kg):
          </label>
          <input
            type="number"
            name="empty_weight"
            value={formData.empty_weight}
            onChange={handleChange}
            required
            step="0.01"
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          />
        </div>
        <div>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            Empty Weight Index:
          </label>
          <input
            type="number"
            name="empty_weight_index"
            value={formData.empty_weight_index}
            onChange={handleChange}
            required
            step="0.01"
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          />
        </div>
        <div>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            DOW Domestic (kg):
          </label>
          <input
            type="number"
            name="dow_domestic"
            value={formData.dow_domestic}
            onChange={handleChange}
            required
            step="0.01"
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          />
        </div>
        <div>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            DOI Domestic:
          </label>
          <input
            type="number"
            name="doi_domestic"
            value={formData.doi_domestic}
            onChange={handleChange}
            required
            step="0.01"
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          />
        </div>
        <div>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            DOW International (kg):
          </label>
          <input
            type="number"
            name="dow_international"
            value={formData.dow_international}
            onChange={handleChange}
            required
            step="0.01"
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          />
        </div>
        <div>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            DOI International:
          </label>
          <input
            type="number"
            name="doi_international"
            value={formData.doi_international}
            onChange={handleChange}
            required
            step="0.01"
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          />
        </div>

        <div
          style={{
            gridColumn: "span 2",
            textAlign: "right",
            marginTop: "20px",
          }}
        >
          <button type="submit" disabled={submitting}>
            {submitting ? "Updating Report..." : "Update Report"}
          </button>
        </div>
      </form>
    </div>
  );
}

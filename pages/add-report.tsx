import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function AddReportPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    loading_index_doc: "",
    weight_report_doc: "",
    report_date: "",
    aircraft_reg: "",
    empty_weight: "",
    empty_weight_index: "",
    dow_domestic: "",
    doi_domestic: "",
    dow_international: "",
    doi_international: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Konversi nilai numerik ke tipe Number
    const payload = {
      ...formData,
      empty_weight: parseFloat(formData.empty_weight || "0"),
      empty_weight_index: parseFloat(formData.empty_weight_index || "0"),
      dow_domestic: parseFloat(formData.dow_domestic || "0"),
      doi_domestic: parseFloat(formData.doi_domestic || "0"),
      dow_international: parseFloat(formData.dow_international || "0"),
      doi_international: parseFloat(formData.doi_international || "0"),
    };

    try {
      const res = await fetch("/api/flight-records", {
        method: "POST",
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

      const newRecord = await res.json();
      setSuccess("Report added successfully!");
      // Redirect ke halaman detail laporan yang baru dibuat
      router.push(`/report/${newRecord.id}`);
    } catch (err: unknown) {
      let message = "An unknown error occurred";
      if (err instanceof Error) {
        message = err.message;
      }
      setError(`Failed to add report: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <Link href="/" passHref>
        <button style={{ marginBottom: "30px" }}>&larr; Back to Reports</button>
      </Link>

      <h1>Add New Flight Weight & Balance Report</h1>

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
            Loading Index Doc. (e.g., 10000068454):
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
            Weight Report Doc. (e.g., 10000271611):
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
            Aircraft Registration (e.g., PK-LKN):
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
          <button type="submit" disabled={loading}>
            {loading ? "Adding Report..." : "Add Report"}
          </button>
        </div>
      </form>
    </div>
  );
}

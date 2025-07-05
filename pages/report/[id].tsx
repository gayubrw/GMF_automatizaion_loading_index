// pages/report/[id].tsx
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

// --- Interfaces (TETAP SAMA SEPERTI SEBELUMNYA) ---
interface GalleyDetail {
  id: number;
  galley_no: string;
  arm_m: number;
  domestic_weight_kg: number;
  domestic_index: number;
  international_weight_kg: number;
  international_index: number;
}

interface CrewDetail {
  id: number;
  description: string;
  qty: number;
  arm_m: number;
  weight_kg: number;
  index: number;
}

interface FlightRecordDetail {
  id: number;
  loading_index_doc: string;
  weight_report_doc: string;
  report_date: string;
  aircraft_reg?: string;
  empty_weight: number;
  empty_weight_index: number;
  dow_domestic: number;
  doi_domestic: number;
  dow_international: number;
  doi_international: number;
  galley_details: GalleyDetail[];
  crew_details: CrewDetail[];
}

// --- Komponen AddGalleyForm (TETAP SAMA) ---
// ... (Kode AddGalleyForm di sini) ...
interface AddGalleyFormProps {
  flightRecordId: number;
  onSuccess: () => void;
  onCancel: () => void;
}

function AddGalleyForm({
  flightRecordId,
  onSuccess,
  onCancel,
}: AddGalleyFormProps) {
  const [formData, setFormData] = useState({
    galley_no: "",
    arm_m: "",
    domestic_weight_kg: "",
    domestic_index: "",
    international_weight_kg: "",
    international_index: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateIndex = (weight: string, arm: string): string => {
    const parsedWeight = parseFloat(weight);
    const parsedArm = parseFloat(arm);
    if (isNaN(parsedWeight) || isNaN(parsedArm)) return "";
    const index = (parsedWeight * (parsedArm - 18.85)) / 1000;
    return index.toFixed(2);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newFormData = { ...prev, [name]: value };
      if (name === "domestic_weight_kg" || name === "arm_m") {
        newFormData.domestic_index = calculateIndex(
          newFormData.domestic_weight_kg,
          newFormData.arm_m
        );
      }
      if (name === "international_weight_kg" || name === "arm_m") {
        newFormData.international_index = calculateIndex(
          newFormData.international_weight_kg,
          newFormData.arm_m
        );
      }
      return newFormData;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      ...formData,
      flight_record_id: flightRecordId,
      arm_m: parseFloat(formData.arm_m || "0"),
      domestic_weight_kg: parseFloat(formData.domestic_weight_kg || "0"),
      domestic_index: parseFloat(formData.domestic_index || "0"),
      international_weight_kg: parseFloat(
        formData.international_weight_kg || "0"
      ),
      international_index: parseFloat(formData.international_index || "0"),
    };

    try {
      const res = await fetch(`/api/galley-details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.message || `HTTP error! Status: ${res.status}`
        );
      }
      onSuccess();
      setFormData({
        galley_no: "",
        arm_m: "",
        domestic_weight_kg: "",
        domestic_index: "",
        international_weight_kg: "",
        international_index: "",
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(`Failed to add galley: ${err.message}`);
      } else {
        setError("Failed to add galley: Unknown error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "15px",
        backgroundColor: "#f8f9fa",
        padding: "20px",
        borderRadius: "8px",
        border: "1px solid #e0e0e0",
        marginTop: "20px",
        marginBottom: "40px",
      }}
    >
      <h3
        style={{ gridColumn: "span 2", margin: "0 0 10px 0", color: "#2c3e50" }}
      >
        Add New Galley Detail
      </h3>
      {error && <p style={{ color: "red", gridColumn: "span 2" }}>{error}</p>}
      <div>
        <label style={{ display: "block", marginBottom: "5px" }}>
          Galley No.:
        </label>
        <input
          type="text"
          name="galley_no"
          value={formData.galley_no}
          onChange={handleChange}
          required
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #ddd",
            borderRadius: "4px",
          }}
        />
      </div>
      <div>
        <label style={{ display: "block", marginBottom: "5px" }}>
          ARM (m):
        </label>
        <input
          type="number"
          name="arm_m"
          value={formData.arm_m}
          onChange={handleChange}
          required
          step="0.001"
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #ddd",
            borderRadius: "4px",
          }}
        />
      </div>
      <div>
        <label style={{ display: "block", marginBottom: "5px" }}>
          Domestic Weight (kg):
        </label>
        <input
          type="number"
          name="domestic_weight_kg"
          value={formData.domestic_weight_kg}
          onChange={handleChange}
          required
          step="0.01"
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #ddd",
            borderRadius: "4px",
          }}
        />
      </div>
      <div>
        <label style={{ display: "block", marginBottom: "5px" }}>
          Domestic Index:
        </label>
        <input
          type="text"
          name="domestic_index"
          value={formData.domestic_index}
          readOnly
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            backgroundColor: "#e9ecef",
          }}
        />
      </div>
      <div>
        <label style={{ display: "block", marginBottom: "5px" }}>
          International Weight (kg):
        </label>
        <input
          type="number"
          name="international_weight_kg"
          value={formData.international_weight_kg}
          onChange={handleChange}
          required
          step="0.01"
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #ddd",
            borderRadius: "4px",
          }}
        />
      </div>
      <div>
        <label style={{ display: "block", marginBottom: "5px" }}>
          International Index:
        </label>
        <input
          type="text"
          name="international_index"
          value={formData.international_index}
          readOnly
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            backgroundColor: "#e9ecef",
          }}
        />
      </div>
      <div
        style={{ gridColumn: "span 2", textAlign: "right", marginTop: "10px" }}
      >
        <button
          type="submit"
          disabled={loading}
          style={{ marginRight: "10px" }}
        >
          {loading ? "Adding..." : "Add Galley"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{ backgroundColor: "#6c757d" }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// --- Komponen AddCrewForm (TETAP SAMA) ---
// ... (Kode AddCrewForm di sini) ...
interface AddCrewFormProps {
  flightRecordId: number;
  onSuccess: () => void;
  onCancel: () => void;
}

function AddCrewForm({
  flightRecordId,
  onSuccess,
  onCancel,
}: AddCrewFormProps) {
  const [formData, setFormData] = useState({
    description: "",
    qty: "",
    arm_m: "",
    weight_kg: "",
    index: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateIndex = (weight: string, arm: string): string => {
    const parsedWeight = parseFloat(weight);
    const parsedArm = parseFloat(arm);
    if (isNaN(parsedWeight) || isNaN(parsedArm)) return "";
    const index = (parsedWeight * (parsedArm - 18.85)) / 1000;
    return index.toFixed(2);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newFormData = { ...prev, [name]: value };
      if (name === "weight_kg" || name === "arm_m") {
        newFormData.index = calculateIndex(
          newFormData.weight_kg,
          newFormData.arm_m
        );
      }
      return newFormData;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      ...formData,
      flight_record_id: flightRecordId,
      qty: parseInt(formData.qty || "0"),
      arm_m: parseFloat(formData.arm_m || "0"),
      weight_kg: parseFloat(formData.weight_kg || "0"),
      index: parseFloat(formData.index || "0"),
    };

    try {
      const res = await fetch(`/api/crew-details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.message || `HTTP error! Status: ${res.status}`
        );
      }
      onSuccess();
      setFormData({
        description: "",
        qty: "",
        arm_m: "",
        weight_kg: "",
        index: "",
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(`Failed to add crew: ${err.message}`);
      } else {
        setError("Failed to add crew: Unknown error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "15px",
        backgroundColor: "#f8f9fa",
        padding: "20px",
        borderRadius: "8px",
        border: "1px solid #e0e0e0",
        marginTop: "20px",
        marginBottom: "40px",
      }}
    >
      <h3
        style={{ gridColumn: "span 2", margin: "0 0 10px 0", color: "#2c3e50" }}
      >
        Add New Crew Detail
      </h3>
      {error && <p style={{ color: "red", gridColumn: "span 2" }}>{error}</p>}
      <div>
        <label style={{ display: "block", marginBottom: "5px" }}>
          Description:
        </label>
        <input
          type="text"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #ddd",
            borderRadius: "4px",
          }}
        />
      </div>
      <div>
        <label style={{ display: "block", marginBottom: "5px" }}>QTY:</label>
        <input
          type="number"
          name="qty"
          value={formData.qty}
          onChange={handleChange}
          required
          step="1"
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #ddd",
            borderRadius: "4px",
          }}
        />
      </div>
      <div>
        <label style={{ display: "block", marginBottom: "5px" }}>
          ARM (m):
        </label>
        <input
          type="number"
          name="arm_m"
          value={formData.arm_m}
          onChange={handleChange}
          required
          step="0.001"
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #ddd",
            borderRadius: "4px",
          }}
        />
      </div>
      <div>
        <label style={{ display: "block", marginBottom: "5px" }}>
          Weight (kg):
        </label>
        <input
          type="number"
          name="weight_kg"
          value={formData.weight_kg}
          onChange={handleChange}
          required
          step="0.01"
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #ddd",
            borderRadius: "4px",
          }}
        />
      </div>
      <div>
        <label style={{ display: "block", marginBottom: "5px" }}>Index:</label>
        <input
          type="text"
          name="index"
          value={formData.index}
          readOnly
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            backgroundColor: "#e9ecef",
          }}
        />
      </div>
      <div
        style={{ gridColumn: "span 2", textAlign: "right", marginTop: "10px" }}
      >
        <button
          type="submit"
          disabled={loading}
          style={{ marginRight: "10px" }}
        >
          {loading ? "Adding..." : "Add Crew"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{ backgroundColor: "#6c757d" }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// --- Komponen Halaman Detail Laporan (Modifikasi Utama) ---
export default function ReportDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [record, setRecord] = useState<FlightRecordDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddGalleyForm, setShowAddGalleyForm] = useState(false);
  const [showAddCrewForm, setShowAddCrewForm] = useState(false);

  const fetchRecordDetails = useCallback(async () => {
    if (!id || typeof id !== "string") return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/flight-records/${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          `HTTP error! Status: ${res.status}. ${errorData.message || ""}`
        );
      }
      const data: FlightRecordDetail = await res.json();
      setRecord(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRecordDetails();
  }, [fetchRecordDetails]);

  // --- Perhitungan Total Galley ---
  const totalGalleyDomesticWeight =
    record?.galley_details.reduce(
      (sum, item) => sum + item.domestic_weight_kg,
      0
    ) || 0;
  const totalGalleyDomesticIndex =
    record?.galley_details.reduce(
      (sum, item) => sum + item.domestic_index,
      0
    ) || 0;
  const totalGalleyInternationalWeight =
    record?.galley_details.reduce(
      (sum, item) => sum + item.international_weight_kg,
      0
    ) || 0;
  const totalGalleyInternationalIndex =
    record?.galley_details.reduce(
      (sum, item) => sum + item.international_index,
      0
    ) || 0;

  // --- Perhitungan Total Crew ---
  const totalCrewQty =
    record?.crew_details.reduce((sum, item) => sum + item.qty, 0) || 0;
  const totalCrewWeight =
    record?.crew_details.reduce((sum, item) => sum + item.weight_kg, 0) || 0;
  const totalCrewIndex =
    record?.crew_details.reduce((sum, item) => sum + item.index, 0) || 0;

  if (loading)
    return <div className="container">Loading report details...</div>;
  if (error) return <div className="container">Error: {error}</div>;
  if (!record) return <div className="container">Report not found.</div>;

  return (
    <div className="container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        <Link href="/" passHref>
          <button>&larr; Back to Reports</button>
        </Link>
        {/* Tombol Edit Report BARU */}
        <Link href={`/edit-report/${record.id}`} passHref>
          <button style={{ backgroundColor: "#ffc107", color: "#333" }}>
            Edit Report
          </button>
        </Link>
      </div>

      <h1 style={{ marginBottom: "15px" }}>
        Report: {record.loading_index_doc} / {record.weight_report_doc}
      </h1>
      <p style={{ fontSize: "1.1rem", color: "#555" }}>
        <strong>Aircraft:</strong> {record.aircraft_reg || "N/A"}
        <span style={{ marginLeft: "20px" }}>
          <strong>Report Date:</strong>{" "}
          {new Date(record.report_date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
      </p>

      <h2 style={{ marginTop: "40px", marginBottom: "15px" }}>
        Main Weight Data
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px 20px",
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <p>
          <strong>Empty Weight:</strong> {record.empty_weight} kg
        </p>
        <p>
          <strong>Empty Weight Index:</strong> {record.empty_weight_index}
        </p>
        <p>
          <strong>DOW Domestic:</strong> {record.dow_domestic} kg
        </p>
        <p>
          <strong>DOI Domestic:</strong> {record.doi_domestic}
        </p>
        <p>
          <strong>DOW International:</strong> {record.dow_international} kg
        </p>
        <p>
          <strong>DOI International:</strong> {record.doi_international}
        </p>
      </div>

      <h2 style={{ marginTop: "40px", marginBottom: "15px" }}>
        A. Pax Convenients
        <button
          onClick={() => setShowAddGalleyForm(!showAddGalleyForm)}
          style={{
            marginLeft: "15px",
            padding: "8px 12px",
            fontSize: "0.9rem",
            backgroundColor: "#28a745",
          }}
        >
          {showAddGalleyForm ? "Cancel Add Galley" : "+ Add New Galley"}
        </button>
      </h2>
      {showAddGalleyForm && (
        <AddGalleyForm
          flightRecordId={record.id}
          onSuccess={() => {
            setShowAddGalleyForm(false);
            fetchRecordDetails();
          }}
          onCancel={() => setShowAddGalleyForm(false)}
        />
      )}
      {record.galley_details.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Galley No.</th>
              <th>ARM (m)</th>
              <th>Domestic (kg)</th>
              <th>Domestic Index</th>
              <th>International (kg)</th>
              <th>International Index</th>
            </tr>
          </thead>
          <tbody>
            {record.galley_details.map((galley) => (
              <tr key={galley.id}>
                <td>{galley.galley_no}</td>
                <td>{galley.arm_m.toFixed(3)}</td>
                <td>{galley.domestic_weight_kg.toFixed(2)}</td>
                <td>{galley.domestic_index.toFixed(2)}</td>
                <td>{galley.international_weight_kg.toFixed(2)}</td>
                <td>{galley.international_index.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ fontWeight: "bold", backgroundColor: "#e9ecef" }}>
              <td colSpan={2} style={{ textAlign: "right" }}>
                TOTAL:
              </td>
              <td>{totalGalleyDomesticWeight.toFixed(2)}</td>
              <td>{totalGalleyDomesticIndex.toFixed(2)}</td>
              <td>{totalGalleyInternationalWeight.toFixed(2)}</td>
              <td>{totalGalleyInternationalIndex.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      ) : (
        <p style={{ color: "#888" }}>
          No Pax Convenients details available for this report.
        </p>
      )}

      <h2 style={{ marginTop: "40px", marginBottom: "15px" }}>
        B. Crew and Their Luggage
        <button
          onClick={() => setShowAddCrewForm(!showAddCrewForm)}
          style={{
            marginLeft: "15px",
            padding: "8px 12px",
            fontSize: "0.9rem",
            backgroundColor: "#28a745",
          }}
        >
          {showAddCrewForm ? "Cancel Add Crew" : "+ Add New Crew"}
        </button>
      </h2>
      {showAddCrewForm && (
        <AddCrewForm
          flightRecordId={record.id}
          onSuccess={() => {
            setShowAddCrewForm(false);
            fetchRecordDetails();
          }}
          onCancel={() => setShowAddCrewForm(false)}
        />
      )}
      {record.crew_details.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>QTY</th>
              <th>ARM (m)</th>
              <th>Weight (kg)</th>
              <th>Index</th>
            </tr>
          </thead>
          <tbody>
            {record.crew_details.map((crew) => (
              <tr key={crew.id}>
                <td>{crew.description}</td>
                <td>{crew.qty}</td>
                <td>{crew.arm_m.toFixed(3)}</td>
                <td>{crew.weight_kg.toFixed(2)}</td>
                <td>{crew.index.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ fontWeight: "bold", backgroundColor: "#e9ecef" }}>
              <td style={{ textAlign: "right" }}>TOTAL:</td>
              <td>{totalCrewQty}</td>
              <td></td> {/* Kosongkan ARM untuk total */}
              <td>{totalCrewWeight.toFixed(2)}</td>
              <td>{totalCrewIndex.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      ) : (
        <p style={{ color: "#888" }}>
          No Crew details available for this report.
        </p>
      )}
    </div>
  );
}

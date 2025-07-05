import { useEffect, useState } from "react";
import Link from "next/link";

interface FlightRecord {
  id: number;
  loading_index_doc: string;
  weight_report_doc: string;
  aircraft_reg?: string;
}

export default function HomePage() {
  const [flightRecords, setFlightRecords] = useState<FlightRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
  }, []);

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
        <Link href="/add-report" passHref>
          <button>+ Add New Report</button>
        </Link>
      </div>
      <p>Select a report to view its details:</p>

      {loading ? (
        <p>Loading reports...</p>
      ) : error ? (
        <p>Error: {error}</p>
      ) : flightRecords.length === 0 ? (
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

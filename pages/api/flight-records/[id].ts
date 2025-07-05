import type { NextApiRequest, NextApiResponse } from "next";
import { query } from "../../../lib/db";

// --- Interfaces ---

// Interface untuk Galley Detail
interface GalleyDetail {
  id: number;
  galley_no: string;
  arm_m: number;
  domestic_weight_kg: number;
  domestic_index: number;
  international_weight_kg: number;
  international_index: number;
}

// Interface untuk Crew Detail
interface CrewDetail {
  id: number;
  description: string;
  qty: number;
  arm_m: number;
  weight_kg: number;
  index: number;
}

// Interface untuk Flight Record yang lengkap, seperti yang akan dikirim ke frontend
interface FlightRecordDetail {
  id: number;
  loading_index_doc: string;
  weight_report_doc: string;
  report_date: string; // Tanggal dari DB bisa jadi string (e.g., "YYYY-MM-DD")
  aircraft_reg?: string; // Opsional
  empty_weight: number;
  empty_weight_index: number;
  dow_domestic: number;
  doi_domestic: number;
  dow_international: number;
  doi_international: number;
  galley_details: GalleyDetail[]; // Array detail galley
  crew_details: CrewDetail[]; // Array detail crew
}

// Interface untuk payload update dari frontend (PUT request)
interface UpdateFlightRecordPayload {
  loading_index_doc: string;
  weight_report_doc: string;
  report_date: string;
  aircraft_reg: string;
  empty_weight: number;
  empty_weight_index: number;
  dow_domestic: number;
  doi_domestic: number;
  dow_international: number;
  doi_international: number;
}

// Interface untuk data mentah yang diterima dari database (sebelum parsing)
// PostgreSQL driver sering mengembalikan DECIMAL/NUMERIC sebagai string
interface RawFlightRecordFromDb {
  id: number;
  loading_index_doc: string;
  weight_report_doc: string;
  report_date: string;
  aircraft_reg?: string;
  empty_weight: string | number;
  empty_weight_index: string | number;
  dow_domestic: string | number;
  doi_domestic: string | number;
  dow_international: string | number;
  doi_international: string | number;
  created_at?: string;
  updated_at?: string;
}

// --- Handler API Utama ---
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FlightRecordDetail | { message: string; error?: string }>
) {
  const { id } = req.query; // Dapatkan ID dari URL query parameter

  // Validasi ID (pastikan ada dan bertipe string)
  if (!id || typeof id !== "string") {
    return res
      .status(400)
      .json({ message: "Invalid or missing Flight Record ID." });
  }

  // --- GET (Mengambil detail laporan tunggal) ---
  if (req.method === "GET") {
    try {
      // Ambil data mentah laporan utama dari database
      const [rawFlightRecord] = await query<RawFlightRecordFromDb>(
        "SELECT * FROM flight_records WHERE id = $1",
        [id]
      );

      if (!rawFlightRecord) {
        return res.status(404).json({ message: "Flight Record not found." });
      }

      // Parse data mentah ke tipe FlightRecordDetail
      // Menggunakan 'as string' untuk meyakinkan TypeScript bahwa itu bisa diparsing
      const flightRecord: FlightRecordDetail = {
        id: rawFlightRecord.id,
        loading_index_doc: rawFlightRecord.loading_index_doc,
        weight_report_doc: rawFlightRecord.weight_report_doc,
        report_date: rawFlightRecord.report_date,
        aircraft_reg: rawFlightRecord.aircraft_reg,
        empty_weight: parseFloat(rawFlightRecord.empty_weight as string),
        empty_weight_index: parseFloat(
          rawFlightRecord.empty_weight_index as string
        ),
        dow_domestic: parseFloat(rawFlightRecord.dow_domestic as string),
        doi_domestic: parseFloat(rawFlightRecord.doi_domestic as string),
        dow_international: parseFloat(
          rawFlightRecord.dow_international as string
        ),
        doi_international: parseFloat(
          rawFlightRecord.doi_international as string
        ),
        galley_details: [], // Akan diisi di bawah
        crew_details: [], // Akan diisi di bawah
      };

      // Ambil dan parse Galley Details
      const rawGalleyDetails = await query<GalleyDetail>(
        "SELECT * FROM galley_details WHERE flight_record_id = $1 ORDER BY id",
        [id]
      );
      const galleyDetails: GalleyDetail[] = rawGalleyDetails.map(
        (item: GalleyDetail) => ({
          id: item.id,
          galley_no: item.galley_no,
          arm_m: parseFloat(item.arm_m as unknown as string),
          domestic_weight_kg: parseFloat(
            item.domestic_weight_kg as unknown as string
          ),
          domestic_index: parseFloat(item.domestic_index as unknown as string),
          international_weight_kg: parseFloat(
            item.international_weight_kg as unknown as string
          ),
          international_index: parseFloat(
            item.international_index as unknown as string
          ),
        })
      );
      flightRecord.galley_details = galleyDetails; // Assign ke flightRecord

      // Ambil dan parse Crew Details
      const rawCrewDetails = await query<CrewDetail>(
        "SELECT * FROM crew_details WHERE flight_record_id = $1 ORDER BY id",
        [id]
      );
      const crewDetails: CrewDetail[] = rawCrewDetails.map(
        (item: CrewDetail) => ({
          id: item.id,
          description: item.description,
          qty: parseInt(item.qty as unknown as string),
          arm_m: parseFloat(item.arm_m as unknown as string),
          weight_kg: parseFloat(item.weight_kg as unknown as string),
          index: parseFloat(item.index as unknown as string),
        })
      );
      flightRecord.crew_details = crewDetails; // Assign ke flightRecord

      res.status(200).json(flightRecord); // Kirim flightRecord yang sudah lengkap
    } catch (error: unknown) {
      console.error("Error fetching flight record details:", error);
      if (error instanceof Error) {
        res
          .status(500)
          .json({ message: "Internal Server Error", error: error.message });
      } else {
        res
          .status(500)
          .json({ message: "Internal Server Error", error: String(error) });
      }
    }
  }
  // --- PUT (Memperbarui detail laporan) ---
  else if (req.method === "PUT") {
    const {
      loading_index_doc,
      weight_report_doc,
      report_date,
      aircraft_reg,
      empty_weight,
      empty_weight_index,
      dow_domestic,
      doi_domestic,
      dow_international,
      doi_international,
    }: UpdateFlightRecordPayload = req.body;

    try {
      // Validasi input dari request body
      if (
        !loading_index_doc ||
        !weight_report_doc ||
        !report_date ||
        isNaN(empty_weight) ||
        isNaN(empty_weight_index) ||
        isNaN(dow_domestic) ||
        isNaN(doi_domestic) ||
        isNaN(dow_international) ||
        isNaN(doi_international)
      ) {
        return res.status(400).json({
          message: "Missing required fields or invalid numeric values.",
        });
      }

      // Jalankan query UPDATE
      const result = await query<RawFlightRecordFromDb>(
        `UPDATE flight_records SET
                    loading_index_doc = $1,
                    weight_report_doc = $2,
                    report_date = $3,
                    aircraft_reg = $4,
                    empty_weight = $5,
                    empty_weight_index = $6,
                    dow_domestic = $7,
                    doi_domestic = $8,
                    dow_international = $9,
                    doi_international = $10,
                    updated_at = NOW()
                WHERE id = $11
                RETURNING *;`, // Mengembalikan record yang sudah diupdate
        [
          loading_index_doc,
          weight_report_doc,
          report_date,
          aircraft_reg || null, // Kirim null jika aircraft_reg kosong
          empty_weight,
          empty_weight_index,
          dow_domestic,
          doi_domestic,
          dow_international,
          doi_international,
          id, // ID dari parameter URL
        ]
      );

      if (result.length === 0) {
        return res
          .status(404)
          .json({ message: "Flight Record not found for update." });
      }

      // Parse data yang sudah diupdate kembali ke tipe FlightRecordDetail
      const updatedRecordRaw = result[0];
      const parsedUpdatedRecord: FlightRecordDetail = {
        id: updatedRecordRaw.id,
        loading_index_doc: updatedRecordRaw.loading_index_doc,
        weight_report_doc: updatedRecordRaw.weight_report_doc,
        report_date: updatedRecordRaw.report_date,
        aircraft_reg: updatedRecordRaw.aircraft_reg,
        empty_weight: parseFloat(updatedRecordRaw.empty_weight as string),
        empty_weight_index: parseFloat(
          updatedRecordRaw.empty_weight_index as string
        ),
        dow_domestic: parseFloat(updatedRecordRaw.dow_domestic as string),
        doi_domestic: parseFloat(updatedRecordRaw.doi_domestic as string),
        dow_international: parseFloat(
          updatedRecordRaw.dow_international as string
        ),
        doi_international: parseFloat(
          updatedRecordRaw.doi_international as string
        ),
        galley_details: [], // Data detail tidak diupdate di sini, biarkan kosong
        crew_details: [], // Data detail tidak diupdate di sini, biarkan kosong
      };

      res.status(200).json(parsedUpdatedRecord); // Kirim record yang sudah di-parse
    } catch (error: unknown) {
      console.error("Error updating flight record:", error);
      if (error instanceof Error) {
        // Tangani error unique violation jika loading_index_doc adalah UNIQUE
        interface PgError extends Error {
          code?: string;
        }
        if ((error as PgError).code === "23505") {
          // Kode error PostgreSQL untuk unique_violation
          return res.status(409).json({
            message:
              "Another report with this Loading Index Doc already exists.",
          });
        }
        res
          .status(500)
          .json({ message: "Internal Server Error", error: error.message });
      } else {
        res
          .status(500)
          .json({ message: "Internal Server Error", error: String(error) });
      }
    }
  }
  // --- DELETE (Menghapus laporan) ---
  else if (req.method === "DELETE") {
    try {
      // Jalankan query DELETE
      const result = await query(
        "DELETE FROM flight_records WHERE id = $1 RETURNING id;", // Mengembalikan ID yang dihapus
        [id]
      );

      if (result.length === 0) {
        return res
          .status(404)
          .json({ message: "Flight Record not found for deletion." });
      }

      res
        .status(200)
        .json({ message: `Flight Record with ID ${id} deleted successfully.` }); // Beri respons sukses
    } catch (error: unknown) {
      console.error("Error deleting flight record:", error);
      if (error instanceof Error) {
        res
          .status(500)
          .json({ message: "Internal Server Error", error: error.message });
      } else {
        res
          .status(500)
          .json({ message: "Internal Server Error", error: String(error) });
      }
    }
  }
  // --- Method Tidak Diizinkan ---
  else {
    // Jika method HTTP selain GET, PUT, atau DELETE, kirim respons 405 Method Not Allowed
    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

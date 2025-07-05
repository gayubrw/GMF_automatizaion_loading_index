import type { NextApiRequest, NextApiResponse } from "next";
import { query } from "../../../lib/db";

// Interfaces Utama
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FlightRecordDetail | { message: string; error?: string }>
) {
  const { id } = req.query;

  // Definisikan RawFlightRecord di luar agar bisa digunakan di mana saja
  // Ini untuk menangani nilai numerik yang mungkin datang sebagai string dari DB
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
    // Tambahkan kolom lain dari DB jika ada, seperti created_at, updated_at
    created_at?: string;
    updated_at?: string;
  }

  if (req.method === "GET") {
    try {
      // Ambil data mentah menggunakan RawFlightRecordFromDb
      const [rawFlightRecord] = await query<RawFlightRecordFromDb>(
        "SELECT * FROM flight_records WHERE id = $1",
        [id]
      );

      if (!rawFlightRecord) {
        return res.status(404).json({ message: "Flight Record not found" });
      }

      // Parse data mentah ke tipe FlightRecordDetail
      const flightRecord: FlightRecordDetail = {
        id: rawFlightRecord.id,
        loading_index_doc: rawFlightRecord.loading_index_doc,
        weight_report_doc: rawFlightRecord.weight_report_doc,
        report_date: rawFlightRecord.report_date,
        aircraft_reg: rawFlightRecord.aircraft_reg,
        // Hapus 'as any' karena parseFloat sudah menerima string | number
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
      flightRecord.galley_details = galleyDetails;

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
      flightRecord.crew_details = crewDetails;

      res.status(200).json(flightRecord);
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
  } else if (req.method === "PUT") {
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
      // Validasi dasar
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

      // Query untuk update data
      // Gunakan RawFlightRecordFromDb untuk hasil RETURNING juga
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
          aircraft_reg || null,
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

      const updatedRecordRaw = result[0];
      // Parse data numerik yang dikembalikan ke tipe FlightRecordDetail
      const parsedUpdatedRecord: FlightRecordDetail = {
        id: updatedRecordRaw.id,
        loading_index_doc: updatedRecordRaw.loading_index_doc,
        weight_report_doc: updatedRecordRaw.weight_report_doc,
        report_date: updatedRecordRaw.report_date,
        aircraft_reg: updatedRecordRaw.aircraft_reg,
        // Hapus 'as any'
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
        galley_details: [], // Data detail tidak diupdate di sini
        crew_details: [], // Data detail tidak diupdate di sini
      };

      res.status(200).json(parsedUpdatedRecord);
    } catch (error: unknown) {
      console.error("Error updating flight record:", error);
      if (error instanceof Error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          (error as { code?: string }).code === "23505"
        ) {
          // PostgreSQL unique violation error code
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
  } else {
    res.setHeader("Allow", ["GET", "PUT"]); // Perbarui header Allow
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

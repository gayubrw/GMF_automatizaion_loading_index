import type { NextApiRequest, NextApiResponse } from "next";
import { query } from "../../../lib/db"; // Sesuaikan path jika berbeda

interface FlightRecord {
  id: number;
  loading_index_doc: string;
  weight_report_doc: string;
  report_date: string; // Akan berupa string dari DB, bisa diformat di frontend
  aircraft_reg: string;
  empty_weight: number;
  empty_weight_index: number;
  dow_domestic: number;
  doi_domestic: number;
  dow_international: number;
  doi_international: number;
}

// Interface untuk payload POST request (data yang dikirim dari form)
interface CreateFlightRecordPayload {
  loading_index_doc: string;
  weight_report_doc: string;
  report_date: string;
  aircraft_reg: string; // Opsional di form, tapi di sini kita siapkan
  empty_weight: number;
  empty_weight_index: number;
  dow_domestic: number;
  doi_domestic: number;
  dow_international: number;
  doi_international: number;
}

export default async function handler(
  req: NextApiRequest,
  // Tipe respons bisa berupa array FlightRecord (untuk GET) atau satu FlightRecord (untuk POST sukses)
  // atau objek pesan error
  res: NextApiResponse<
    FlightRecord[] | FlightRecord | { message: string; error?: string }
  >
) {
  if (req.method === "GET") {
    try {
      // Mengambil semua kolom yang didefinisikan dalam interface FlightRecord
      // Pastikan nama kolom di SELECT sesuai dengan nama kolom di database Anda
      const records = await query<FlightRecord>(`
                SELECT
                    id,
                    loading_index_doc,
                    weight_report_doc,
                    report_date,
                    aircraft_reg,
                    empty_weight,
                    empty_weight_index,
                    dow_domestic,
                    doi_domestic,
                    dow_international,
                    doi_international
                FROM flight_records
                ORDER BY id DESC
            `);
      res.status(200).json(records);
    } catch (error: unknown) {
      console.error("Error fetching flight records:", error);
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
  } else if (req.method === "POST") {
    // Mendapatkan data dari body request
    const {
      loading_index_doc,
      weight_report_doc,
      report_date,
      aircraft_reg, // Sekarang ini tidak opsional dari form
      empty_weight,
      empty_weight_index,
      dow_domestic,
      doi_domestic,
      dow_international,
      doi_international,
    }: CreateFlightRecordPayload = req.body;

    try {
      // Validasi dasar untuk kolom yang wajib diisi dan harus berupa angka
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

      // Query untuk memasukkan data baru ke tabel flight_records
      // Menggunakan RETURNING untuk mendapatkan kembali record yang baru dibuat, termasuk ID-nya
      const result = await query<FlightRecord>(
        `INSERT INTO flight_records (
                    loading_index_doc,
                    weight_report_doc,
                    report_date,
                    aircraft_reg,
                    empty_weight,
                    empty_weight_index,
                    dow_domestic,
                    doi_domestic,
                    dow_international,
                    doi_international
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING id, loading_index_doc, weight_report_doc, aircraft_reg;`, // Returing ini penting untuk frontend
        [
          loading_index_doc,
          weight_report_doc,
          report_date,
          aircraft_reg || null, // Jika aircraft_reg dari form kosong, masukkan NULL ke database
          empty_weight,
          empty_weight_index,
          dow_domestic,
          doi_domestic,
          dow_international,
          doi_international,
        ]
      );

      const newRecord = result[0]; // Hasil INSERT RETURNING akan berupa array dengan satu elemen
      res.status(201).json(newRecord); // Kirim kembali record yang baru dibuat dengan status 201 Created
    } catch (error: unknown) {
      console.error("Error adding flight record:", error);
      if (error instanceof Error) {
        // Tangani error khusus seperti duplikasi jika loading_index_doc adalah UNIQUE
        // '23505' adalah kode error PostgreSQL untuk unique_violation
        interface PgError extends Error {
          code?: string;
        }
        if ((error as PgError).code === "23505") {
          return res.status(409).json({
            message: "A report with this Loading Index Doc already exists.",
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
    // Jika method selain GET atau POST, kirim respons Method Not Allowed
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

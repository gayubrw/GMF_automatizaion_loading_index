// pages/api/galley-details/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { query } from "../../../lib/db";

interface GalleyDetail {
  id: number;
  galley_no: string;
  arm_m: number;
  domestic_weight_kg: number;
  domestic_index: number;
  international_weight_kg: number;
  international_index: number;
  flight_record_id?: number; // Tambahkan ini jika Anda perlu merujuk ID laporan utama
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GalleyDetail | { message: string; error?: string }>
) {
  const { id } = req.query; // Ini adalah ID dari detail galley, bukan flight_record_id

  if (req.method === "PUT") {
    const {
      galley_no,
      arm_m,
      domestic_weight_kg,
      domestic_index,
      international_weight_kg,
      international_index,
    }: // flight_record_id // Jika Anda ingin mengizinkan perubahan flight_record_id
    GalleyDetail = req.body;

    try {
      // Validasi dasar
      if (
        !galley_no ||
        isNaN(arm_m) ||
        isNaN(domestic_weight_kg) ||
        isNaN(domestic_index) ||
        isNaN(international_weight_kg) ||
        isNaN(international_index)
      ) {
        return res.status(400).json({
          message:
            "Missing required fields or invalid numeric values for Galley Detail.",
        });
      }

      const result = await query<GalleyDetail>(
        `UPDATE galley_details SET
                    galley_no = $1,
                    arm_m = $2,
                    domestic_weight_kg = $3,
                    domestic_index = $4,
                    international_weight_kg = $5,
                    international_index = $6
                    -- , flight_record_id = $7  // Uncomment jika Anda ingin mengizinkan perubahan flight_record_id
                WHERE id = $7 -- Ganti $7 menjadi $8 jika flight_record_id di-uncomment
                RETURNING *;`,
        [
          galley_no,
          arm_m,
          domestic_weight_kg,
          domestic_index,
          international_weight_kg,
          international_index,
          id, // ID detail galley
          // flight_record_id // Jika di-uncomment
        ]
      );

      if (result.length === 0) {
        return res
          .status(404)
          .json({ message: "Galley Detail not found for update." });
      }

      res.status(200).json(result[0]);
    } catch (error: unknown) {
      console.error("Error updating galley detail:", error);
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
  } else if (req.method === "DELETE") {
    try {
      const result = await query(
        "DELETE FROM galley_details WHERE id = $1 RETURNING id;",
        [id]
      );

      if (result.length === 0) {
        return res
          .status(404)
          .json({ message: "Galley Detail not found for deletion." });
      }

      res
        .status(200)
        .json({ message: `Galley Detail with ID ${id} deleted successfully.` });
    } catch (error: unknown) {
      console.error("Error deleting galley detail:", error);
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
  } else {
    res.setHeader("Allow", ["PUT", "DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

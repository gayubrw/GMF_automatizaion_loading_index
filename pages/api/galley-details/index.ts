import type { NextApiRequest, NextApiResponse } from "next";
import { query } from "../../../lib/db"; // Sesuaikan path

interface GalleyDetailPayload {
  flight_record_id: number;
  galley_no: string;
  arm_m: number;
  domestic_weight_kg: number;
  domestic_index: number;
  international_weight_kg: number;
  international_index: number;
}

interface GalleyDetailResponse extends GalleyDetailPayload {
  id: number;
  created_at: string;
  updated_at: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    GalleyDetailResponse | { message: string; error?: string }
  >
) {
  if (req.method === "POST") {
    const {
      flight_record_id,
      galley_no,
      arm_m,
      domestic_weight_kg,
      domestic_index,
      international_weight_kg,
      international_index,
    }: GalleyDetailPayload = req.body;

    try {
      // Validasi dasar
      if (
        !flight_record_id ||
        !galley_no ||
        isNaN(arm_m) ||
        isNaN(domestic_weight_kg) ||
        isNaN(domestic_index) ||
        isNaN(international_weight_kg) ||
        isNaN(international_index)
      ) {
        return res.status(400).json({
          message: "Missing required fields or invalid numeric values.",
        });
      }

      const result = await query<GalleyDetailResponse>(
        `INSERT INTO galley_details (
                    flight_record_id, galley_no, arm_m, domestic_weight_kg, domestic_index,
                    international_weight_kg, international_index
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *;`, // Mengembalikan semua kolom dari record yang baru dibuat
        [
          flight_record_id,
          galley_no,
          arm_m,
          domestic_weight_kg,
          domestic_index,
          international_weight_kg,
          international_index,
        ]
      );

      const newGalleyDetail = result[0];
      res.status(201).json(newGalleyDetail);
    } catch (error: unknown) {
      console.error("Error adding galley detail:", error);
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
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

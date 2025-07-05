import type { NextApiRequest, NextApiResponse } from "next";
import { query } from "../../../lib/db"; // Sesuaikan path

interface CrewDetailPayload {
  flight_record_id: number;
  description: string;
  qty: number;
  arm_m: number;
  weight_kg: number;
  index: number;
}

interface CrewDetailResponse extends CrewDetailPayload {
  id: number;
  created_at: string;
  updated_at: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CrewDetailResponse | { message: string; error?: string }>
) {
  if (req.method === "POST") {
    const {
      flight_record_id,
      description,
      qty,
      arm_m,
      weight_kg,
      index,
    }: CrewDetailPayload = req.body;

    try {
      // Validasi dasar
      if (
        !flight_record_id ||
        !description ||
        isNaN(qty) ||
        isNaN(arm_m) ||
        isNaN(weight_kg) ||
        isNaN(index)
      ) {
        return res.status(400).json({
          message: "Missing required fields or invalid numeric values.",
        });
      }

      const result = await query<CrewDetailResponse>(
        `INSERT INTO crew_details (
                    flight_record_id, description, qty, arm_m, weight_kg, index
                ) VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *;`, // Mengembalikan semua kolom dari record yang baru dibuat
        [flight_record_id, description, qty, arm_m, weight_kg, index]
      );

      const newCrewDetail = result[0];
      res.status(201).json(newCrewDetail);
    } catch (error: unknown) {
      console.error("Error adding crew detail:", error);
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

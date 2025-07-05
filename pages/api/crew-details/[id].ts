// pages/api/crew-details/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { query } from "../../../lib/db";

interface CrewDetail {
  id: number;
  description: string;
  qty: number;
  arm_m: number;
  weight_kg: number;
  index: number;
  flight_record_id?: number; // Tambahkan ini jika Anda perlu merujuk ID laporan utama
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CrewDetail | { message: string; error?: string }>
) {
  const { id } = req.query; // Ini adalah ID dari detail crew

  if (req.method === "PUT") {
    const {
      description,
      qty,
      arm_m,
      weight_kg,
      index,
    }: // flight_record_id // Jika Anda ingin mengizinkan perubahan flight_record_id
    CrewDetail = req.body;

    try {
      // Validasi dasar
      if (
        !description ||
        isNaN(qty) ||
        isNaN(arm_m) ||
        isNaN(weight_kg) ||
        isNaN(index)
      ) {
        return res.status(400).json({
          message:
            "Missing required fields or invalid numeric values for Crew Detail.",
        });
      }

      const result = await query<CrewDetail>(
        `UPDATE crew_details SET
                    description = $1,
                    qty = $2,
                    arm_m = $3,
                    weight_kg = $4,
                    index = $5
                    -- , flight_record_id = $6 // Uncomment jika Anda ingin mengizinkan perubahan flight_record_id
                WHERE id = $6 -- Ganti $6 menjadi $7 jika flight_record_id di-uncomment
                RETURNING *;`,
        [
          description,
          qty,
          arm_m,
          weight_kg,
          index,
          id, // ID detail crew
          // flight_record_id // Jika di-uncomment
        ]
      );

      if (result.length === 0) {
        return res
          .status(404)
          .json({ message: "Crew Detail not found for update." });
      }

      res.status(200).json(result[0]);
    } catch (error: unknown) {
      console.error("Error updating crew detail:", error);
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
        "DELETE FROM crew_details WHERE id = $1 RETURNING id;",
        [id]
      );

      if (result.length === 0) {
        return res
          .status(404)
          .json({ message: "Crew Detail not found for deletion." });
      }

      res
        .status(200)
        .json({ message: `Crew Detail with ID ${id} deleted successfully.` });
    } catch (error: unknown) {
      console.error("Error deleting crew detail:", error);
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

import { NextResponse } from "next/server";
import { z } from "zod";
import { diagnosePlant } from "@/lib/plant-engine";

const schema = z.object({
  imageName: z.string().optional(),
  plantName: z.string().optional(),
  symptoms: z.array(z.string()).default([]),
  roomLight: z.enum(["low", "medium", "bright", "direct"]).default("medium"),
  watering: z.enum(["forgotten", "weekly", "daily", "unknown"]).default("unknown"),
  potDrainage: z.enum(["yes", "no", "unknown"]).default("unknown"),
  daysOwned: z.coerce.number().optional(),
  notes: z.string().optional()
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid letter request", issues: parsed.error.flatten() }, { status: 400 });
  }

  const diagnosis = diagnosePlant(parsed.data);
  return NextResponse.json({
    title: diagnosis.letterTitle,
    body: diagnosis.letterBody,
    tone: diagnosis.letterTone,
    rescueItems: diagnosis.rescueItems,
    rescueSteps: diagnosis.rescueSteps
  });
}

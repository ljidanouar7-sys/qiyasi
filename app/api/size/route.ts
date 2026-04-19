import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { height, weight, shoulders, belly, hips } = body;

  const h = Number(height) || 165;
  const w = Number(weight) || 70;
  const bmi = w / Math.pow(h / 100, 2);

  // BMI score: 0=S, 1=M, 2=L, 3=XL
  let score = 0;
  if (bmi < 18.5) score = 0;
  else if (bmi < 23) score = 1;
  else if (bmi < 27) score = 2;
  else score = 3;

  // Shoulder adjustment
  if (shoulders === "wide") score += 0.5;
  else if (shoulders === "narrow") score -= 0.5;

  // Belly adjustment
  if (belly === "big") score += 0.5;
  else if (belly === "flat") score -= 0.25;

  // Hip adjustment
  if (hips === "wide") score += 0.5;
  else if (hips === "narrow") score -= 0.25;

  const sizes = ["S", "M", "L", "XL"];
  const index = Math.min(3, Math.max(0, Math.round(score)));
  const size = sizes[index];

  return NextResponse.json({ size });
}

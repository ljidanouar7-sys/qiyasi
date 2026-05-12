export type SizeRow = {
  size:       string;
  height_min: number;
  height_max: number;
  weight_min: number;
  weight_max: number;
  chest:      number;   // half circumference of garment (cm)
  hips?:      number;   // abaya / dress only — half circumference (cm)
  shoulder?:  number;   // t_shirt only (cm)
  length:     number;   // garment length (cm)
};

export type SizeChart = { rows: SizeRow[] };

export const ABAYA_DEFAULT_CHART: SizeChart = {
  rows: [
    { size: "XS",  height_min: 145, height_max: 155, weight_min: 45,  weight_max: 55,  chest: 43, hips: 47, length: 140 },
    { size: "S",   height_min: 155, height_max: 163, weight_min: 55,  weight_max: 67,  chest: 46, hips: 50, length: 145 },
    { size: "M",   height_min: 163, height_max: 170, weight_min: 67,  weight_max: 78,  chest: 49, hips: 53, length: 150 },
    { size: "L",   height_min: 170, height_max: 178, weight_min: 78,  weight_max: 90,  chest: 52, hips: 56, length: 155 },
    { size: "XL",  height_min: 178, height_max: 185, weight_min: 90,  weight_max: 102, chest: 55, hips: 59, length: 160 },
    { size: "XXL", height_min: 185, height_max: 193, weight_min: 102, weight_max: 115, chest: 58, hips: 62, length: 165 },
  ],
};

export const T_SHIRT_DEFAULT_CHART: SizeChart = {
  rows: [
    { size: "XS",  height_min: 145, height_max: 155, weight_min: 45,  weight_max: 55,  chest: 45, shoulder: 42, length: 66 },
    { size: "S",   height_min: 155, height_max: 163, weight_min: 55,  weight_max: 67,  chest: 48, shoulder: 44, length: 68 },
    { size: "M",   height_min: 163, height_max: 170, weight_min: 67,  weight_max: 78,  chest: 51, shoulder: 46, length: 70 },
    { size: "L",   height_min: 170, height_max: 178, weight_min: 78,  weight_max: 90,  chest: 54, shoulder: 48, length: 72 },
    { size: "XL",  height_min: 178, height_max: 185, weight_min: 90,  weight_max: 102, chest: 57, shoulder: 50, length: 74 },
    { size: "XXL", height_min: 185, height_max: 193, weight_min: 102, weight_max: 115, chest: 60, shoulder: 52, length: 76 },
  ],
};

export const DEFAULT_CHARTS: Record<string, SizeChart> = {
  long_clothing: ABAYA_DEFAULT_CHART,
  dress:         ABAYA_DEFAULT_CHART,
  t_shirt:       T_SHIRT_DEFAULT_CHART,
};

export type SizeRow = {
  size:       string;
  bust_min:   number;
  bust_max:   number;
  waist_min:  number;
  waist_max:  number;
  hip_min:    number;
  hip_max:    number;
  length_min: number;
  length_max: number;
};

export type SizeChart = { rows: SizeRow[] };

export const LONG_CLOTHING_DEFAULT_CHART: SizeChart = {
  rows: [
    { size: "XS",   bust_min: 78,  bust_max: 84,  waist_min: 60,  waist_max: 66,  hip_min: 84,  hip_max: 90,  length_min: 138, length_max: 142 },
    { size: "S",    bust_min: 84,  bust_max: 90,  waist_min: 66,  waist_max: 72,  hip_min: 90,  hip_max: 96,  length_min: 142, length_max: 147 },
    { size: "M",    bust_min: 90,  bust_max: 97,  waist_min: 72,  waist_max: 79,  hip_min: 96,  hip_max: 103, length_min: 147, length_max: 152 },
    { size: "L",    bust_min: 97,  bust_max: 104, waist_min: 79,  waist_max: 86,  hip_min: 103, hip_max: 110, length_min: 152, length_max: 157 },
    { size: "XL",   bust_min: 104, bust_max: 112, waist_min: 86,  waist_max: 94,  hip_min: 110, hip_max: 118, length_min: 157, length_max: 162 },
    { size: "XXL",  bust_min: 112, bust_max: 120, waist_min: 94,  waist_max: 102, hip_min: 118, hip_max: 126, length_min: 162, length_max: 167 },
  ],
};

export const T_SHIRT_DEFAULT_CHART: SizeChart = {
  rows: [
    { size: "XS",  bust_min: 78,  bust_max: 84,  waist_min: 60,  waist_max: 66,  hip_min: 82,  hip_max: 88,  length_min: 62, length_max: 65 },
    { size: "S",   bust_min: 84,  bust_max: 90,  waist_min: 66,  waist_max: 72,  hip_min: 88,  hip_max: 94,  length_min: 65, length_max: 68 },
    { size: "M",   bust_min: 90,  bust_max: 97,  waist_min: 72,  waist_max: 79,  hip_min: 94,  hip_max: 101, length_min: 68, length_max: 71 },
    { size: "L",   bust_min: 97,  bust_max: 104, waist_min: 79,  waist_max: 86,  hip_min: 101, hip_max: 108, length_min: 71, length_max: 74 },
    { size: "XL",  bust_min: 104, bust_max: 112, waist_min: 86,  waist_max: 94,  hip_min: 108, hip_max: 116, length_min: 74, length_max: 77 },
    { size: "XXL", bust_min: 112, bust_max: 120, waist_min: 94,  waist_max: 102, hip_min: 116, hip_max: 124, length_min: 77, length_max: 80 },
  ],
};

export const DEFAULT_CHARTS: Record<string, SizeChart> = {
  long_clothing: LONG_CLOTHING_DEFAULT_CHART,
  t_shirt:       T_SHIRT_DEFAULT_CHART,
};

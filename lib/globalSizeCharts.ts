export type SizeRow = {
  size:      string;
  bust_min:  number;
  bust_max:  number;
  waist_min: number;
  waist_max: number;
  hip_min:   number;
  hip_max:   number;
};

export type SizeChart = { rows: SizeRow[] };

export const FITTED_DEFAULT_CHART: SizeChart = {
  rows: [
    { size: "XS",  bust_min: 0,     bust_max: 94,    waist_min: 0,    waist_max: 77.5,  hip_min: 0,    hip_max: 92.7  },
    { size: "S",   bust_min: 94,    bust_max: 99,    waist_min: 77.5, waist_max: 82.6,  hip_min: 92.7, hip_max: 97.8  },
    { size: "M",   bust_min: 99,    bust_max: 104.1, waist_min: 82.6, waist_max: 87.6,  hip_min: 97.8, hip_max: 102.9 },
    { size: "L",   bust_min: 104.1, bust_max: 111.8, waist_min: 87.6, waist_max: 95.3,  hip_min: 102.9,hip_max: 110.5 },
    { size: "XL",  bust_min: 111.8, bust_max: 119.4, waist_min: 95.3, waist_max: 105.4, hip_min: 110.5,hip_max: 118.1 },
    { size: "XXL", bust_min: 119.4, bust_max: 127,   waist_min: 105.4,waist_max: 113,   hip_min: 118.1,hip_max: 125.7 },
  ],
};

export const TSHIRT_DEFAULT_CHART: SizeChart = {
  rows: [
    { size: "XS",  bust_min: 0,     bust_max: 94,    waist_min: 0,    waist_max: 77.5,  hip_min: 0,    hip_max: 92.7  },
    { size: "S",   bust_min: 94,    bust_max: 99,    waist_min: 77.5, waist_max: 82.6,  hip_min: 92.7, hip_max: 97.8  },
    { size: "M",   bust_min: 99,    bust_max: 104.1, waist_min: 82.6, waist_max: 87.6,  hip_min: 97.8, hip_max: 102.9 },
    { size: "L",   bust_min: 104.1, bust_max: 111.8, waist_min: 87.6, waist_max: 95.3,  hip_min: 102.9,hip_max: 110.5 },
    { size: "XL",  bust_min: 111.8, bust_max: 119.4, waist_min: 95.3, waist_max: 105.4, hip_min: 110.5,hip_max: 118.1 },
    { size: "XXL", bust_min: 119.4, bust_max: 127,   waist_min: 105.4,waist_max: 113,   hip_min: 118.1,hip_max: 125.7 },
  ],
};

export const DEFAULT_CHARTS: Record<string, SizeChart> = {
  fitted:        FITTED_DEFAULT_CHART,
  long_clothing: FITTED_DEFAULT_CHART,
  dress:         FITTED_DEFAULT_CHART,
  tshirt:        TSHIRT_DEFAULT_CHART,
  t_shirt:       TSHIRT_DEFAULT_CHART,
};

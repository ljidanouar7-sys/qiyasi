export type SizeRow = {
  size:      string;
  bust_max:  number;
  waist_max: number;
  hip_max:   number;
};

export type SizeChart = { rows: SizeRow[] };

export const FITTED_DEFAULT_CHART: SizeChart = {
  rows: [
    { size: "XS",  bust_max: 94,    waist_max: 77.5,  hip_max: 92.7  },
    { size: "S",   bust_max: 99,    waist_max: 82.6,  hip_max: 97.8  },
    { size: "M",   bust_max: 104.1, waist_max: 87.6,  hip_max: 102.9 },
    { size: "L",   bust_max: 111.8, waist_max: 95.3,  hip_max: 110.5 },
    { size: "XL",  bust_max: 119.4, waist_max: 105.4, hip_max: 118.1 },
    { size: "XXL", bust_max: 127,   waist_max: 113,   hip_max: 125.7 },
  ],
};

export const TSHIRT_DEFAULT_CHART: SizeChart = {
  rows: [
    { size: "XS",  bust_max: 94,    waist_max: 77.5,  hip_max: 92.7  },
    { size: "S",   bust_max: 99,    waist_max: 82.6,  hip_max: 97.8  },
    { size: "M",   bust_max: 104.1, waist_max: 87.6,  hip_max: 102.9 },
    { size: "L",   bust_max: 111.8, waist_max: 95.3,  hip_max: 110.5 },
    { size: "XL",  bust_max: 119.4, waist_max: 105.4, hip_max: 118.1 },
    { size: "XXL", bust_max: 127,   waist_max: 113,   hip_max: 125.7 },
  ],
};

export const DEFAULT_CHARTS: Record<string, SizeChart> = {
  fitted:        FITTED_DEFAULT_CHART,
  long_clothing: FITTED_DEFAULT_CHART,
  dress:         FITTED_DEFAULT_CHART,
  tshirt:        TSHIRT_DEFAULT_CHART,
  t_shirt:       TSHIRT_DEFAULT_CHART,
};

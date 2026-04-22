import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DEFAULT_CHART = {
  columns: [
    { id: "h",  label: "الطول (سم)", quiz_field: "height" },
    { id: "w",  label: "الوزن (كغ)", quiz_field: "weight" },
    { id: "ch", label: "الصدر (سم)", quiz_field: ""       },
    { id: "wa", label: "الخصر (سم)", quiz_field: ""       },
    { id: "hi", label: "الورك (سم)", quiz_field: ""       },
  ],
  rows: [
    { size: "XS / 50", h: { min: 145, max: 155 }, w: { min: 45, max: 55  }, ch: { min: 82,  max: 88  }, wa: { min: 66,  max: 72  }, hi: { min: 90,  max: 96  } },
    { size: "S / 52",  h: { min: 155, max: 163 }, w: { min: 55, max: 67  }, ch: { min: 88,  max: 96  }, wa: { min: 72,  max: 80  }, hi: { min: 96,  max: 104 } },
    { size: "M / 54",  h: { min: 163, max: 170 }, w: { min: 67, max: 78  }, ch: { min: 96,  max: 104 }, wa: { min: 80,  max: 88  }, hi: { min: 104, max: 112 } },
    { size: "L / 56",  h: { min: 170, max: 178 }, w: { min: 78, max: 90  }, ch: { min: 104, max: 112 }, wa: { min: 88,  max: 96  }, hi: { min: 112, max: 120 } },
    { size: "XL / 58", h: { min: 178, max: 185 }, w: { min: 90, max: 102 }, ch: { min: 112, max: 120 }, wa: { min: 96,  max: 104 }, hi: { min: 120, max: 128 } },
    { size: "XXL / 60",h: { min: 185, max: 193 }, w: { min: 102,max: 115 }, ch: { min: 120, max: 128 }, wa: { min: 104, max: 112 }, hi: { min: 128, max: 136 } },
    { size: "3XL / 62",h: { min: 193, max: 200 }, w: { min: 115,max: 125 }, ch: { min: 128, max: 136 }, wa: { min: 112, max: 120 }, hi: { min: 136, max: 144 } },
  ],
};

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, tag } = await req.json();
  if (!name?.trim() || name.trim().length < 2)
    return NextResponse.json({ error: "اسم الفئة قصير جداً" }, { status: 400 });

  const { data: merchant } = await supabase
    .from("merchants")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!merchant) return NextResponse.json({ error: "Merchant not found" }, { status: 404 });

  const cleanTag = (tag || name).trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const { error } = await supabase.from("categories").insert({
    merchant_id: merchant.id,
    name:        name.trim(),
    tag:         cleanTag,
    niche:       "long_clothing",
    size_chart:  DEFAULT_CHART,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

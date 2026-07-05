import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const shop = req.nextUrl.searchParams.get("shop") ?? "";

  if (!shop || !shop.match(/^[a-zA-Z0-9-]+\.myshopify\.com$/)) {
    return new Response("Invalid shop parameter", { status: 400 });
  }

  const apiKey   = process.env.SHOPIFY_API_KEY!;
  const scopes   = process.env.SHOPIFY_SCOPES ?? "read_products";
  const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? "https://qiyasi.net";
  const redirect = `${appUrl}/api/shopify/callback`;

  const authUrl =
    `https://${shop}/admin/oauth/authorize` +
    `?client_id=${apiKey}` +
    `&scope=${scopes}` +
    `&redirect_uri=${encodeURIComponent(redirect)}`;

  return NextResponse.redirect(authUrl);
}

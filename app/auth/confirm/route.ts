import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });
}

/** Render a confirmation page without consuming the token on a GET request. */
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get('token_hash');
  const type = request.nextUrl.searchParams.get('type');

  if (!tokenHash || type !== 'recovery') {
    return NextResponse.redirect(new URL('/forgot-password?recovery=invalid', request.url));
  }

  const safeTokenHash = escapeHtml(tokenHash);
  const html = `<!doctype html>
<html lang="az"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Talora — Şifrəni yenilə</title></head>
<body style="margin:0;background:#f3f5fa;color:#172033;font-family:Arial,Helvetica,sans-serif;min-height:100vh;display:grid;place-items:center;padding:24px;box-sizing:border-box">
<main style="width:100%;max-width:440px;background:#fff;border:1px solid #e4e8f0;border-radius:20px;padding:36px;box-sizing:border-box;box-shadow:0 18px 50px rgba(23,32,51,.08)">
<div style="font-size:24px;font-weight:800;letter-spacing:-1px;color:#10182a;margin-bottom:30px">Talora<span style="color:#4169e1">.</span></div>
<div style="width:48px;height:48px;border-radius:15px;background:#eef3ff;color:#3456c7;display:grid;place-items:center;font-size:24px;margin-bottom:22px">&#128273;</div>
<h1 style="font-family:Georgia,'Times New Roman',serif;font-size:28px;margin:0 0 12px">Şifrənizi yeniləyin</h1>
<p style="font-size:16px;line-height:1.6;color:#46536a;margin:0 0 24px">E-poçt ünvanınız təsdiqləndi. Yeni şifrənizi seçmək üçün davam edin.</p>
<form method="post" action="/auth/confirm">
<input type="hidden" name="token_hash" value="${safeTokenHash}"><input type="hidden" name="type" value="recovery">
<button type="submit" style="width:100%;border:0;border-radius:11px;background:#367cf5;color:#fff;font-size:16px;font-weight:700;padding:15px 18px;cursor:pointer">Şifrəni yeniləməyə davam et</button>
</form>
</main></body></html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

/** Verify only after an explicit user click; this also works cross-device. */
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const tokenHash = formData.get('token_hash');
  const type = formData.get('type');

  if (typeof tokenHash !== 'string' || !tokenHash || type !== 'recovery') {
    return NextResponse.redirect(new URL('/forgot-password?recovery=invalid', request.url), 303);
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.redirect(new URL('/forgot-password?recovery=unavailable', request.url), 303);
  }

  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: 'recovery',
  });

  if (error || !data.session) {
    return NextResponse.redirect(new URL('/forgot-password?recovery=invalid', request.url), 303);
  }

  // The server Supabase client writes the verified session into response cookies.
  return NextResponse.redirect(new URL('/reset-password', request.url), 303);
}

export interface ApplicationStatusInput {
  fullName: string;
  internshipTitle: string;
  status: 'accepted' | 'rejected';
  applicationUrl: string;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]!);
}

export function renderApplicationStatusHtml(input: ApplicationStatusInput): string {
  const url = new URL(input.applicationUrl);
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('INVALID_APPLICATION_URL');
  const href = escapeHtml(url.href);
  const origin = escapeHtml(url.origin);
  const accepted = input.status === 'accepted';
  const title = accepted ? 'Yeni təcrübən başlayır.' : 'Müraciətinizə baxıldı.';
  const status = accepted ? 'Qəbul edildi' : 'Qəbul edilmədi';
  const explanation = accepted
    ? 'Təbrik edirik! Təcrübə proqramına müraciətiniz qəbul edildi. Növbəti addımlar üçün tələbə kabinetinizə keçin.'
    : 'Bu proqram üzrə müraciətiniz qəbul edilmədi. Digər təcrübə proqramlarını nəzərdən keçirib sizə uyğun fürsətlərə müraciət edə bilərsiniz.';
  const preheader = `${input.internshipTitle} — ${status.toLowerCase()}. Ətraflı məlumat tələbə kabinetinizdədir.`;
  return `<!doctype html>
<html lang="az">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${escapeHtml(title)}</title>
  <style>
    body { margin:0; padding:0; }
    table { border-collapse:collapse; }
    a:focus-visible { outline:3px solid #8797ff; outline-offset:4px; }
    @media only screen and (max-width:480px) {
      .outer { padding:16px 8px !important; }
      .content { padding:28px 22px !important; }
      .headline { font-size:29px !important; }
      .button { display:block !important; text-align:center !important; }
    }
    @media (prefers-color-scheme:dark) {
      .background { background-color:#0d1422 !important; }
      .surface { background-color:#182235 !important; }
      .program { background-color:#222e45 !important; }
      .heading { color:#f2f5ff !important; }
      .body-copy { color:#cbd5e5 !important; }
      .muted { color:#a6b4cc !important; }
      .divider { border-color:#344158 !important; }
      .link { color:#aab7ff !important; }
    }
  </style>
</head>
<body class="background" style="background-color:#eef2f8;font-family:Arial,Helvetica,sans-serif;color:#19243b;">
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" class="background" bgcolor="#eef2f8"><tr><td align="center" class="outer" style="padding:40px 16px;">
    <!--[if mso]><table role="presentation" width="600"><tr><td><![endif]-->
    <table role="presentation" width="100%" class="surface" bgcolor="#ffffff" style="max-width:600px;background-color:#ffffff;">
      <tr><td bgcolor="#142039" style="padding:26px 28px;background-color:#142039;border-top:4px solid #465ed3;">
        <a href="${origin}" style="text-decoration:none;color:#ffffff;display:inline-block;">
          <img src="${origin}/icon-192.png" width="42" height="42" alt="" style="vertical-align:middle;border:0;">
          <span style="vertical-align:middle;font-size:28px;font-weight:700;letter-spacing:-1px;color:#ffffff;">&nbsp;talora<span style="color:#9eacff;">.</span></span>
        </a>
        <p style="margin:14px 0 0;font-size:13px;line-height:20px;color:#c3cde0;">Təcrübə ilə böyü. Öz yolunu qur.</p>
      </td></tr>
      <tr><td class="content" style="padding:36px 36px 32px;">
        <p style="margin:0 0 20px;"><span style="display:inline-block;padding:7px 12px;font-size:13px;line-height:20px;font-weight:700;background-color:${accepted ? '#e3f4eb' : '#eef0f6'};color:${accepted ? '#176342' : '#46536b'};border-radius:6px;">${status}</span></p>
        <h1 class="headline heading" style="margin:0 0 24px;font-size:34px;line-height:1.18;letter-spacing:-1px;color:#19243b;">${title}</h1>
        <p class="body-copy" style="margin:0 0 12px;font-size:16px;line-height:26px;color:#46536b;">Salam ${escapeHtml(input.fullName)},</p>
        <p class="body-copy" style="margin:0 0 24px;font-size:16px;line-height:26px;color:#46536b;">${explanation}</p>
        <table role="presentation" width="100%" class="program" bgcolor="#f1f4fa" style="background-color:#f1f4fa;"><tr><td style="padding:20px;border-left:3px solid #465ed3;">
          <p class="muted" style="margin:0 0 8px;font-size:12px;line-height:18px;letter-spacing:1px;color:#64728a;">TƏCRÜBƏ PROQRAMI</p>
          <p class="heading" style="margin:0;font-size:19px;line-height:28px;font-weight:700;color:#19243b;overflow-wrap:anywhere;word-break:break-word;">${escapeHtml(input.internshipTitle)}</p>
        </td></tr></table>
        <table role="presentation" style="margin-top:28px;" width="100%"><tr><td>
          <a href="${href}" class="button" style="display:inline-block;background-color:#465ed3;border:1px solid #465ed3;border-radius:8px;padding:15px 24px;mso-padding-alt:15px 24px;color:#ffffff;text-decoration:none;font-size:16px;line-height:24px;font-weight:700;">Müraciətə bax &rarr;</a>
        </td></tr></table>
        <p class="muted" style="margin:20px 0 0;font-size:13px;line-height:21px;color:#64728a;">Düymə açılmırsa, <a class="link" href="${href}" style="color:#3c50ba;text-decoration:underline;">bu keçiddən istifadə edin</a>.</p>
      </td></tr>
      <tr><td class="content divider" style="padding:24px 36px;border-top:1px solid #e4e9f2;">
        <p class="body-copy" style="margin:0 0 8px;font-size:14px;line-height:22px;color:#46536b;">Sualınız var? <a class="link" href="mailto:internaz.notification@gmail.com" style="color:#3c50ba;text-decoration:underline;">Bizə yazın</a>.</p>
        <p class="muted" style="margin:0;font-size:12px;line-height:20px;color:#64728a;">Bu məktub Talora-dakı müraciətinizin statusu dəyişdiyi üçün göndərilib. Bildiriş seçimlərini <a class="link" href="${origin}/dashboard/settings" style="color:#3c50ba;text-decoration:underline;">hesab parametrlərində</a> dəyişə bilərsiniz.</p>
      </td></tr>
    </table>
    <!--[if mso]></td></tr></table><![endif]-->
    <p class="muted" style="margin:20px 0 0;font-size:12px;line-height:20px;color:#64728a;">Talora · İlk peşəkar təcrübənə başla</p>
  </td></tr></table>
</body></html>`;
}

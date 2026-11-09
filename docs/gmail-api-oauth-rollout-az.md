# Talora — Gmail API + OAuth 2.0 (pulsuz və təhlükəsiz keçid)

## Nə dəyişir?

Hazırkı Talora e-poçtları Gmail SMTP (465 portu, App Password) ilə göndərilir.
Bu yol Vercel-də `Timeout` xətası verib. Yeni mexanizm HTTPS üzərindən
`POST https://gmail.googleapis.com/gmail/v1/users/me/messages/send` istifadə edir.
Bu kod mövcud Gmail ünvanını və e-poçt şablonlarını saxlayır.

**Vacib:** Gmail API-ə keçid Google OAuth icazəsi alınmadan tamamlanmır.
OAuth `client_secret`, `refresh_token` və ya `access_token` heç vaxt
GitHub commit-inə, ekran görüntüsünə, ChatGPT söhbətinə və ya
`NEXT_PUBLIC_*` dəyişənlərinə yerləşdirilməməlidir.

## 1. Google Cloud-da OAuth qur

1. [Google Cloud Console](https://console.cloud.google.com/) aç və özünə
   məxsus yeni və ya mövcud pulsuz Google Cloud layihəsi seç.
2. **APIs & Services → Library** bölməsində **Gmail API** aktivləşdir.
3. **Google Auth Platform** bölməsində tətbiq adını (məs., Talora Notifications),
   dəstək e-poçtunu və istifadəçi növünü konfiqurasiya et.
4. Lazım olan yeganə Gmail scope:
   `https://www.googleapis.com/auth/gmail.send`.
   `gmail.modify`, `mail.google.com` və oxuma/silmə səlahiyyətləri lazım deyil.
5. **Clients → Create client → Web application**: OAuth Client ID və Client Secret
   yaradın. OAuth Playground-dan istifadə ediləcəksə, bu redirect URI-ni
   həmin müştərinin **Authorized redirect URIs** sahəsinə əlavə et:
   `https://developers.google.com/oauthplayground`.
6. Bu addımlar Google Cloud-un rəsmi interfeysində əl ilə edilir.
   Tətbiqin e-poçt göndərən Google hesabı ilə eyni sahibə aid olmasını yoxla.

## 2. Offline refresh token-i əldə et

1. Rəsmi [Google OAuth Playground](https://developers.google.com/oauthplayground/)
   səhifəsini aç. Parametrlər (dişli) bölməsində **Use your own OAuth credentials**
   seçərək öz OAuth Client ID və Secret dəyərlərini daxil et.
2. Scope sahəsinə yalnız
   `https://www.googleapis.com/auth/gmail.send` yaz.
3. **Authorize APIs** seç və **GMAIL_USER** ilə uyğun olan Gmail hesabına
   icazə ver. Offline access/refresh token alındığını təsdiqlə.
4. **Exchange authorization code for tokens** addımı ilə refresh token əldə et.
5. Token-i yalnız təhlükəsiz Vercel environment variable-da saxla.
   Access token qısamüddətlidir; kod refresh token ilə onu özü yeniləyəcək.

**Google-un vacib məhdudiyyəti:** OAuth consent screen `External / Testing`
statusunda qalsa, Gmail scope-u ilə alınmış refresh token adətən **7 gün**
sonra bitir. Uzunmüddətli istifadə üçün Google Auth Platform-da `In production`
publishing statusunu düzgün qurmaq lazımdır. Gmail-in sensitive scope-ları
üçün Google verification və ya təsdiq xəbərdarlığı tələb oluna bilər; tətbiqin
istifadəçi bazası və vəziyyətinə görə rəsmi Google təlimatını izləyin.
Workspace idarəçisi də Gmail API istifadəsini məhdudlaşdıra bilər.

## 3. Vercel Production environment dəyişənləri

Vercel → Project `talora-az` → Settings → Environment Variables.
**Server-only** olan bu dəyişənləri yalnız müvafiq mühit üçün əlavə et:

| Ad | Dəyər | Təhlükəsizlik |
| --- | --- | --- |
| `GMAIL_USER` | Mövcud göndərən Gmail hesabı | OAuth icazəsi verən hesabla eyni |
| `GMAIL_OAUTH_CLIENT_ID` | Google OAuth client ID | Server-only |
| `GMAIL_OAUTH_CLIENT_SECRET` | OAuth client secret | Secret / Sensitive |
| `GMAIL_OAUTH_REFRESH_TOKEN` | Offline refresh token | Secret / Sensitive |
| `GMAIL_DELIVERY_PROVIDER` | `api` | **Yalnız test və icazələr təsdiqləndikdən sonra** |

`GMAIL_APP_PASSWORD` əvvəlki SMTP ilə geri qayıtmaq üçün müvəqqəti qala
bilər, lakin Gmail API onunla işləməyəcək. OAuth uğursuz olarsa kod avtomatik
SMTP-yə keçmir: mümkün dublikat və səhv konfigurasiya problemlərinin qarşısını
almaq üçün **fail closed** davranışı tətbiq olunub.

**Preview mühiti:** digər preview prosesləri production Supabase-ə qoşula bilər.
Preview-də real tələbələrə email göndərmə. Real göndərişlə test aparmaq üçün
özünə məxsus test Gmail hesabı istifadə et; production tələbə məlumatını
və statusunu dəyişmə.

## 4. Sınaq və aktivləşdirmə

- GitHub CI: `node --test scripts/gmail-api-regression.test.mjs` funksional
  testləri saxta HTTP cavablarla işləyir; heç bir real email göndərmir.
- Google OAuth Playground-da **özünə məxsus test ünvanına** bir sınaq məktubu
  göndərərək refresh token-in və `gmail.send` scope-unun işlədiyini yoxla.
- OAuth test uğurlu olduqda, Vercel-də yeni dəyişənləri və
  `GMAIL_DELIVERY_PROVIDER=api` daxil et; sonra yeni deployment və
  login/authorization testləri tələb olunur.
- İlk real bildirişdən sonra Vercel runtime logunda `GMAIL_API_*` xəta
  olub-olmadığını, Gmail **Sent** qovluğunu və alıcının inbox-unu yoxla.
- Google API-dən `id` qaytarılması məktubun Gmail tərəfindən qəbul
  edilməsini göstərir, **alıcının inbox-una çatdırılmasına zəmanət vermir**.

## 5. Xəta, timeout və geri dönüş

- Token problemi: `GMAIL_API_TOKEN_HTTP_400/401` — consent statusu,
  refresh token və OAuth client konfiqurasiyasını yoxla.
- Gmail API `401/403`: scope, icazələr və göndərən Google hesabını yoxla.
- Gmail API `429`: Google-un göndərmə və quota limitlərini yoxla.
- `GMAIL_API_SEND_UNCERTAIN_TIMEOUT`: API cavabı itmiş ola bilər. **Kor-koranə
  təkrar göndərmə.** Gmail Sent qovluğunu və alıcı inbox-unu yoxla.
- Geri dönüş: `GMAIL_DELIVERY_PROVIDER=smtp` və mövcud
  `GMAIL_APP_PASSWORD` işlək olduqda SMTP-yə qayıda bilərsən; yeni
  Vercel deployment lazımdır. Bu, əvvəlki SMTP timeout-unu həll etmir.

Bu dəyişiklik yalnız e-poçt transport qatını dəyişir. Supabase schema/RLS,
tələbə qəbulu, enrollment və daxili bildirişlər dəyişdirilmir.

## Mənbələr

- https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/send
- https://developers.google.com/workspace/gmail/api/guides/sending
- https://developers.google.com/identity/protocols/oauth2/web-server
- https://developers.google.com/identity/protocols/oauth2
- https://vercel.com/kb/guide/serverless-functions-and-smtp

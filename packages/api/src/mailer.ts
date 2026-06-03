/**
 * Outbound mail. One sender per delivery channel; today we ship a
 * single Resend backend. The function falls back to logging the
 * link to the console when `RESEND_API_KEY` is unset, so dev and CI
 * keep working without provisioning a real API key.
 *
 * Env:
 *   RESEND_API_KEY   — when present, mail is delivered via Resend
 *   RESEND_FROM      — `Name <addr@domain>` sender; required in prod
 */

import { Resend } from 'resend';

const TOKEN_TTL_MIN = 15;

let cached: Resend | null = null;
function client(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!cached) cached = new Resend(key);
  return cached;
}

export async function sendMagicLink(input: {
  to: string;
  link: string;
}): Promise<{ delivered: boolean; via: 'resend' | 'console' }> {
  const c = client();
  if (!c) {
    // eslint-disable-next-line no-console
    console.log(`[nandbench-api] (no RESEND_API_KEY) magic link for ${input.to}: ${input.link}`);
    return { delivered: true, via: 'console' };
  }
  const from = process.env.RESEND_FROM ?? 'nandbench <noreply@nandbench.local>';
  const subject = 'Your nandbench sign-in link';
  const text = renderText(input.link);
  const html = renderHtml(input.link);
  const result = await c.emails.send({ from, to: input.to, subject, text, html });
  if (result.error) {
    // eslint-disable-next-line no-console
    console.error('[nandbench-api] resend send failed', result.error);
    throw new Error(`mail send failed: ${result.error.message}`);
  }
  return { delivered: true, via: 'resend' };
}

function renderText(link: string): string {
  return [
    'Sign in to nandbench',
    '',
    `Click the link below to finish signing in. It expires in ${TOKEN_TTL_MIN} minutes.`,
    '',
    link,
    '',
    "If you didn't ask for a sign-in link, you can ignore this email — no account is created until the link is opened.",
  ].join('\n');
}

function renderHtml(link: string): string {
  return `<!doctype html>
<html><body style="font-family: -apple-system, system-ui, sans-serif; background: #f6f7f9; padding: 32px;">
  <div style="max-width: 520px; margin: 0 auto; background: #fff; border-radius: 10px; padding: 28px; border: 1px solid #e5e7eb;">
    <h1 style="font-size: 18px; margin: 0 0 12px; color: #111827;">Sign in to nandbench</h1>
    <p style="font-size: 14px; line-height: 1.55; color: #374151; margin: 0 0 18px;">
      Click the button below to finish signing in. The link expires in ${TOKEN_TTL_MIN} minutes.
    </p>
    <p style="margin: 0 0 18px;">
      <a href="${escape(link)}"
         style="display: inline-block; background: #3a82d6; color: #fff; padding: 10px 18px;
                border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">
        Open nandbench
      </a>
    </p>
    <p style="font-size: 12px; color: #6b7280; margin: 0;">
      If the button doesn't work, paste this URL into your browser:<br/>
      <span style="word-break: break-all;">${escape(link)}</span>
    </p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 22px 0;"/>
    <p style="font-size: 12px; color: #6b7280; margin: 0;">
      You can ignore this message if you didn't request a sign-in link. No account is created until you open the link.
    </p>
  </div>
</body></html>`;
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
  );
}

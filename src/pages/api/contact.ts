export const prerender = false;

import type { APIRoute } from 'astro';

// ── Hardening helpers ────────────────────────────────────────────────────────

const MAX_LENGTHS = { name: 100, email: 254, subject: 150, message: 5000 } as const;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Strip control characters (incl. CR/LF) so user input can't inject headers
// or break out of the subject line.
function sanitizeLine(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\x00-\x1f\x7f]/g, ' ').trim();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Simple in-memory rate limit: max 5 submissions per IP per 10 minutes.
// Good enough for a single standalone Node process.
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const submissions = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (submissions.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    submissions.set(ip, recent);
    return true;
  }
  recent.push(now);
  submissions.set(ip, recent);
  // Opportunistic cleanup so the map doesn't grow unbounded
  if (submissions.size > 1000) {
    for (const [key, times] of submissions) {
      if (times.every((t) => now - t >= RATE_WINDOW_MS)) submissions.delete(key);
    }
  }
  return false;
}

function json(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ── Handler ──────────────────────────────────────────────────────────────────

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    let ip = 'unknown';
    try {
      ip = clientAddress;
    } catch {
      // clientAddress can throw when unavailable (e.g. some proxy setups)
    }
    if (isRateLimited(ip)) {
      return json({ error: 'Too many requests. Please try again later.' }, 429);
    }

    const data = await request.formData();
    const name    = sanitizeLine(data.get('name')?.toString() ?? '').slice(0, MAX_LENGTHS.name);
    const email   = sanitizeLine(data.get('email')?.toString() ?? '').slice(0, MAX_LENGTHS.email);
    const subject = sanitizeLine(data.get('subject')?.toString() ?? '').slice(0, MAX_LENGTHS.subject) || 'New message from portfolio';
    const message = (data.get('message')?.toString() ?? '').trim().slice(0, MAX_LENGTHS.message);
    const honeypot = data.get('website')?.toString() ?? '';

    // Bots fill the hidden field; pretend success so they don't adapt.
    if (honeypot) {
      return json({ success: true }, 200);
    }

    if (!name || !email || !message) {
      return json({ error: 'Missing required fields' }, 400);
    }
    if (!EMAIL_RE.test(email)) {
      return json({ error: 'Invalid email address' }, 400);
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return json({ error: 'Email service not configured' }, 500);
    }

    const safeName    = escapeHtml(name);
    const safeEmail   = escapeHtml(email);
    const safeSubject = escapeHtml(subject);
    const safeMessage = escapeHtml(message);

    // ── Email 1: Notify Marcus ─────────────────────────────────────────────
    const notifyRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Portfolio Contact <noreply@marcuslchong.com>',
        to:   ['marcuslchong@gmail.com'],
        reply_to: email,
        subject: `[Portfolio] ${subject}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a1a;">New message from your portfolio</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; width: 80px;">From:</td>
                <td style="padding: 8px 0;">${safeName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Email:</td>
                <td style="padding: 8px 0;">${safeEmail}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Subject:</td>
                <td style="padding: 8px 0;">${safeSubject}</td>
              </tr>
            </table>
            <hr style="margin: 16px 0; border: none; border-top: 1px solid #eee;" />
            <div style="white-space: pre-wrap; line-height: 1.6;">${safeMessage}</div>
            <hr style="margin: 16px 0; border: none; border-top: 1px solid #eee;" />
            <p style="color: #888; font-size: 12px;">Sent via marcuslchong.com portfolio contact form</p>
          </div>
        `,
      }),
    });

    if (!notifyRes.ok) {
      const err = await notifyRes.json();
      console.error('Resend notify error:', err);
      return json({ error: 'Failed to send email' }, 500);
    }

    // ── Email 2: Confirmation to sender ───────────────────────────────────
    // Deliberately does NOT echo the message or subject: the recipient address
    // is user-supplied, so echoing content would let an attacker deliver
    // arbitrary text to third parties from this domain.
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Marcus Chong <noreply@marcuslchong.com>',
        to:   [email],
        subject: 'Thanks for reaching out!',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a1a;">Thanks for your message!</h2>
            <p>Hi ${safeName},</p>
            <p>I've received your message through my portfolio contact form and will get back to you within 24 hours.</p>
            <p>Talk soon,<br/><strong>Marcus Chong</strong></p>
            <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
            <p style="color: #888; font-size: 12px;">
              You're receiving this because a contact form was submitted with your address at marcuslchong.com.
              If this wasn't you, you can safely ignore this email.
            </p>
          </div>
        `,
      }),
    });

    return json({ success: true }, 200);

  } catch (err) {
    console.error('Contact API error:', err);
    return json({ error: 'Server error' }, 500);
  }
};

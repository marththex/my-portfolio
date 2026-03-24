export const prerender = false;

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.formData();
    const name    = data.get('name')?.toString().trim();
    const email   = data.get('email')?.toString().trim();
    const subject = data.get('subject')?.toString().trim() || 'New message from portfolio';
    const message = data.get('message')?.toString().trim();

    // Basic validation
    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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
                <td style="padding: 8px 0;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Email:</td>
                <td style="padding: 8px 0;"><a href="mailto:${email}">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Subject:</td>
                <td style="padding: 8px 0;">${subject}</td>
              </tr>
            </table>
            <hr style="margin: 16px 0; border: none; border-top: 1px solid #eee;" />
            <div style="white-space: pre-wrap; line-height: 1.6;">${message}</div>
            <hr style="margin: 16px 0; border: none; border-top: 1px solid #eee;" />
            <p style="color: #888; font-size: 12px;">Sent via marcuslchong.com portfolio contact form</p>
          </div>
        `,
      }),
    });

    if (!notifyRes.ok) {
      const err = await notifyRes.json();
      console.error('Resend notify error:', err);
      return new Response(JSON.stringify({ error: 'Failed to send email' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ── Email 2: Confirmation to sender ───────────────────────────────────
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Marcus Chong <noreply@marcuslchong.com>',
        to:   [email],
        subject: `Thanks for reaching out, ${name}!`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a1a;">Thanks for your message!</h2>
            <p>Hi ${name},</p>
            <p>I've received your message and will get back to you within 24 hours.</p>
            <p>Here's a copy of what you sent:</p>
            <div style="background: #f5f5f5; padding: 16px; border-left: 3px solid #60a5fa; margin: 16px 0;">
              <p style="margin: 0 0 8px;"><strong>Subject:</strong> ${subject}</p>
              <p style="margin: 0; white-space: pre-wrap; line-height: 1.6;">${message}</p>
            </div>
            <p>Talk soon,<br/><strong>Marcus Chong</strong></p>
            <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
            <p style="color: #888; font-size: 12px;">
              You're receiving this because you submitted a contact form at marcuslchong.com
            </p>
          </div>
        `,
      }),
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Contact API error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
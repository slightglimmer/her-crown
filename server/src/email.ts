import { Resend } from 'resend';

// No-ops when RESEND_API_KEY isn't set, so local dev and any host that
// skips email setup keep working exactly as before — this is additive,
// not required.
export async function notifyNewApplication(app: {
  name: string;
  area: string;
  specialty: string;
  email: string;
  note: string | null;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_EMAIL;
  if (!apiKey || !to) return;

  const from = process.env.RESEND_FROM ?? 'Her Crown <onboarding@resend.dev>';

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      subject: `New stylist application: ${app.name}`,
      text: [
        `${app.name} applied to list their chair on Her Crown.`,
        '',
        `Area: ${app.area}`,
        `Specialty: ${app.specialty}`,
        `Contact: ${app.email}`,
        app.note ? `Note: ${app.note}` : null,
        '',
        'Review it at /admin.',
      ]
        .filter(Boolean)
        .join('\n'),
    });
    // Email is a notification, not the source of truth — the application is
    // already saved, so a delivery failure shouldn't fail the request. The
    // Resend SDK returns errors here rather than throwing them.
    if (error) console.error('Failed to send application notification email:', error);
  } catch (err) {
    console.error('Failed to send application notification email:', err);
  }
}

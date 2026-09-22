import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Brevo Webhook Endpoint for transactional email events (e.g. delivered, opened, clicked, bounce)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Brevo webhook event received:', body);

    const { event, 'message-id': messageId } = body;

    if (event === 'delivered' && messageId) {
      // Find invoices with matching messageId in email_logs
      const { data: invoices } = await supabaseAdmin
        .from('invoices')
        .select('id, email_logs')
        .contains('email_logs', [{ messageId }]);

      if (invoices && invoices.length > 0) {
        for (const inv of invoices) {
          const updatedLogs = (inv.email_logs || []).map((log: any) => 
            log.messageId === messageId ? { ...log, status: 'delivered' } : log
          );

          await supabaseAdmin
            .from('invoices')
            .update({
              email_logs: updatedLogs,
              email_status: 'delivered',
            })
            .eq('id', inv.id);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing Brevo webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

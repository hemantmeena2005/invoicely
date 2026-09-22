import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/authHelper';
import { supabaseAdmin } from '@/lib/supabase';
import { sendInvoiceEmail, sendInvoiceReminder } from '@/lib/email';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { emailType = 'invoice' } = body;

    // Fetch invoice and associated client from Supabase
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select('*, client:clients(id, name, email)')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const client = (Array.isArray(invoice.client) ? invoice.client[0] : invoice.client) as unknown as { id: string; name: string; email: string } | null;
    if (!client?.email) {
      return NextResponse.json({ error: 'Client email not found' }, { status: 400 });
    }

    // Generate PDF buffer
    const pdfBytes = await generateInvoicePDF({
      ...invoice,
      client,
      items: Array.isArray(invoice.items) ? invoice.items : [],
    });

    // Prepare email payload
    const emailData = {
      to: client.email,
      clientName: client.name,
      invoiceNumber: invoice.invoice_number,
      amount: Number(invoice.total || 0),
      dueDate: invoice.due_date,
      pdfBytes,
      invoiceId: invoice.id,
      senderName: user.name || undefined,
      senderEmail: user.email || undefined,
    };

    // Dispatch via Brevo
    const emailResult = emailType === 'reminder'
      ? await sendInvoiceReminder(emailData)
      : await sendInvoiceEmail(emailData);

    if (!emailResult.success) {
      return NextResponse.json({
        error: 'Failed to send email via Brevo',
        details: emailResult.error
      }, { status: 500 });
    }

    // Append to email_logs and update status in Supabase
    const newLog = {
      sentAt: new Date().toISOString(),
      messageId: emailResult.messageId,
      emailType,
      recipient: client.email,
      status: 'sent',
    };

    const currentLogs = Array.isArray(invoice.email_logs) ? invoice.email_logs : [];
    const updatedLogs = [...currentLogs, newLog];

    const updates: Record<string, any> = {
      email_logs: updatedLogs,
      last_emailed_at: new Date().toISOString(),
      email_status: 'sent',
    };

    if (invoice.status === 'draft' && emailType === 'invoice') {
      updates.status = 'sent';
    }

    await supabaseAdmin
      .from('invoices')
      .update(updates)
      .eq('id', invoice.id);

    return NextResponse.json({
      success: true,
      messageId: emailResult.messageId,
      message: `${emailType === 'reminder' ? 'Reminder' : 'Invoice'} sent successfully via Brevo`,
    });

  } catch (error) {
    console.error('Error sending invoice email:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function generateInvoicePDF(invoice: any) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const { height } = page.getSize();
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontSize = 11;
  const lineHeight = fontSize * 1.3;
  
  let y = height - 50;
  
  // Header
  page.drawText('INVOICE', { x: 50, y, size: 24, font: boldFont, color: rgb(0.31, 0.27, 0.9) });
  y -= 40;
  
  // Invoice details
  page.drawText(`Invoice Number: ${invoice.invoice_number || invoice.invoiceNumber}`, { x: 50, y, size: fontSize, font: boldFont });
  y -= lineHeight;
  page.drawText(`Date: ${new Date(invoice.issue_date || invoice.issueDate || Date.now()).toLocaleDateString()}`, { x: 50, y, size: fontSize, font });
  y -= lineHeight;
  page.drawText(`Due Date: ${new Date(invoice.due_date || invoice.dueDate || Date.now()).toLocaleDateString()}`, { x: 50, y, size: fontSize, font });
  y -= lineHeight;
  
  // Client info
  y -= 20;
  page.drawText('Bill To:', { x: 50, y, size: fontSize, font: boldFont, color: rgb(0.4, 0.4, 0.4) });
  y -= lineHeight;
  page.drawText(invoice.client?.name || 'Valued Client', { x: 50, y, size: fontSize, font });
  y -= lineHeight;
  if (invoice.client?.email) {
    page.drawText(invoice.client.email, { x: 50, y, size: fontSize, font, color: rgb(0.3, 0.3, 0.3) });
    y -= lineHeight;
  }
  
  // Items table header
  y -= 30;
  page.drawRectangle({
    x: 48,
    y: y - 4,
    width: 500,
    height: 22,
    color: rgb(0.95, 0.95, 0.97),
  });
  page.drawText('Description', { x: 55, y: y + 2, size: fontSize, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
  page.drawText('Qty', { x: 300, y: y + 2, size: fontSize, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
  page.drawText('Rate', { x: 370, y: y + 2, size: fontSize, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
  page.drawText('Amount', { x: 460, y: y + 2, size: fontSize, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
  y -= lineHeight + 8;
  
  // Table rows
  const items = Array.isArray(invoice.items) ? invoice.items : [];
  for (const item of items) {
    const desc = String(item.description || 'Item');
    const qty = Number(item.quantity || 1);
    const rate = Number(item.rate || 0);
    const amt = Number(item.amount || qty * rate);

    page.drawText(desc.substring(0, 35), { x: 55, y, size: fontSize, font });
    page.drawText(qty.toString(), { x: 300, y, size: fontSize, font });
    page.drawText(`Rs. ${rate.toFixed(2)}`, { x: 370, y, size: fontSize, font });
    page.drawText(`Rs. ${amt.toFixed(2)}`, { x: 460, y, size: fontSize, font });
    y -= lineHeight + 4;
  }
  
  // Totals
  y -= 20;
  const subtotal = Number(invoice.subtotal || 0);
  const taxRate = Number(invoice.tax_rate || invoice.taxRate || 0);
  const taxAmount = Number(invoice.tax_amount || invoice.taxAmount || 0);
  const total = Number(invoice.total || 0);

  page.drawText(`Subtotal: Rs. ${subtotal.toFixed(2)}`, { x: 370, y, size: fontSize, font });
  y -= lineHeight;
  if (taxRate > 0) {
    page.drawText(`Tax (${taxRate}%): Rs. ${taxAmount.toFixed(2)}`, { x: 370, y, size: fontSize, font });
    y -= lineHeight;
  }
  page.drawText(`Total: Rs. ${total.toFixed(2)}`, { x: 370, y, size: 14, font: boldFont, color: rgb(0.05, 0.6, 0.3) });
  
  return await pdfDoc.save();
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: invoice, error } = await supabaseAdmin
      .from('invoices')
      .select('email_logs, last_emailed_at, email_status, client:clients(email)')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const client = (Array.isArray(invoice.client) ? invoice.client[0] : invoice.client) as unknown as { email: string } | null;

    return NextResponse.json({
      emailLogs: invoice.email_logs || [],
      lastEmailedAt: invoice.last_emailed_at,
      emailStatus: invoice.email_status,
      clientEmail: client?.email || '',
    });

  } catch (error) {
    console.error('Error fetching invoice email logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/authHelper';
import { supabase } from '@/lib/supabase';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { format } from 'date-fns';
import { generateUpiQrPngBuffer } from '@/lib/upiHelper';
import { cleanDisplayTerms } from '@/lib/reminderHelper';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*, clientId:clients(name, email, address, phone, company)')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();
    
    const inv = {
      ...invoice,
      invoiceNumber: invoice.invoice_number || invoice.invoiceNumber || 'INV-0000',
      issueDate: invoice.issue_date || invoice.issueDate || new Date().toISOString(),
      dueDate: invoice.due_date || invoice.dueDate || new Date().toISOString(),
      subtotal: Number(invoice.subtotal || 0),
      taxRate: Number(invoice.tax_rate || invoice.taxRate || 0),
      taxAmount: Number(invoice.tax_amount || invoice.taxAmount || 0),
      total: Number(invoice.total || 0),
      items: Array.isArray(invoice.items) ? invoice.items : [],
      clientId: (Array.isArray(invoice.clientId) ? invoice.clientId[0] : invoice.clientId) || {},
    };

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();

    // Load fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Colors
    const primaryColor = rgb(0.2, 0.2, 0.2);
    const secondaryColor = rgb(0.5, 0.5, 0.5);

    let yPosition = height - 50;

    // Header
    page.drawText('INVOICE', {
      x: 50,
      y: yPosition,
      size: 24,
      font: helveticaBold,
      color: primaryColor,
    });

    yPosition -= 40;

    // Invoice details
    page.drawText(`Invoice #: ${inv.invoiceNumber}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: primaryColor,
    });

    page.drawText(`Date: ${format(new Date(inv.issueDate), 'MMM dd, yyyy')}`, {
      x: 200,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: primaryColor,
    });

    page.drawText(`Due Date: ${format(new Date(inv.dueDate), 'MMM dd, yyyy')}`, {
      x: 350,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: primaryColor,
    });

    yPosition -= 60;

    // From section
    page.drawText('From:', {
      x: 50,
      y: yPosition,
      size: 14,
      font: helveticaBold,
      color: primaryColor,
    });

    yPosition -= 20;
    page.drawText(user.name, {
      x: 50,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: primaryColor,
    });

    yPosition -= 15;
    page.drawText(user.email, {
      x: 50,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: primaryColor,
    });

    yPosition -= 40;

    // To section
    page.drawText('To:', {
      x: 50,
      y: yPosition,
      size: 14,
      font: helveticaBold,
      color: primaryColor,
    });

    yPosition -= 20;
    page.drawText(inv.clientId.name || 'Valued Client', {
      x: 50,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: primaryColor,
    });

    yPosition -= 15;
    if (inv.clientId.email) {
      page.drawText(inv.clientId.email, {
        x: 50,
        y: yPosition,
        size: 12,
        font: helveticaFont,
        color: primaryColor,
      });
    }

    if (inv.clientId.company) {
      yPosition -= 15;
      page.drawText(inv.clientId.company, {
        x: 50,
        y: yPosition,
        size: 12,
        font: helveticaFont,
        color: primaryColor,
      });
    }

    yPosition -= 40;

    // Items table header
    const tableY = yPosition;
    page.drawText('Description', {
      x: 50,
      y: tableY,
      size: 12,
      font: helveticaBold,
      color: primaryColor,
    });

    page.drawText('Qty', {
      x: 300,
      y: tableY,
      size: 12,
      font: helveticaBold,
      color: primaryColor,
    });

    page.drawText('Rate', {
      x: 350,
      y: tableY,
      size: 12,
      font: helveticaBold,
      color: primaryColor,
    });

    page.drawText('Amount', {
      x: 450,
      y: tableY,
      size: 12,
      font: helveticaBold,
      color: primaryColor,
    });

    yPosition -= 30;

    // Items
    inv.items.forEach((item: any) => {
      page.drawText(String(item.description || 'Item'), {
        x: 50,
        y: yPosition,
        size: 10,
        font: helveticaFont,
        color: primaryColor,
      });

      page.drawText(String(item.quantity || 1), {
        x: 300,
        y: yPosition,
        size: 10,
        font: helveticaFont,
        color: primaryColor,
      });

      page.drawText(`Rs. ${Number(item.rate || 0).toFixed(2)}`, {
        x: 350,
        y: yPosition,
        size: 10,
        font: helveticaFont,
        color: primaryColor,
      });

      page.drawText(`Rs. ${Number(item.amount || 0).toFixed(2)}`, {
        x: 450,
        y: yPosition,
        size: 10,
        font: helveticaFont,
        color: primaryColor,
      });

      yPosition -= 20;
    });

    yPosition -= 20;

    // Totals
    page.drawText(`Subtotal: Rs. ${inv.subtotal.toFixed(2)}`, {
      x: 350,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: primaryColor,
    });

    yPosition -= 20;
    page.drawText(`Tax (${inv.taxRate}%): Rs. ${inv.taxAmount.toFixed(2)}`, {
      x: 350,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: primaryColor,
    });

    yPosition -= 20;
    page.drawText(`Total: Rs. ${inv.total.toFixed(2)}`, {
      x: 350,
      y: yPosition,
      size: 14,
      font: helveticaBold,
      color: primaryColor,
    });

    // Notes
    if (inv.notes) {
      yPosition -= 40;
      page.drawText('Notes:', {
        x: 50,
        y: yPosition,
        size: 12,
        font: helveticaBold,
        color: primaryColor,
      });

      yPosition -= 20;
      page.drawText(invoice.notes, {
        x: 50,
        y: yPosition,
        size: 10,
        font: helveticaFont,
        color: secondaryColor,
      });
    }

    // Terms
    const displayTerms = cleanDisplayTerms(invoice.terms);
    if (displayTerms) {
      yPosition -= 40;
      page.drawText('Terms:', {
        x: 50,
        y: yPosition,
        size: 12,
        font: helveticaBold,
        color: primaryColor,
      });

      yPosition -= 20;
      page.drawText(displayTerms, {
        x: 50,
        y: yPosition,
        size: 10,
        font: helveticaFont,
        color: secondaryColor,
      });
    }

    // UPI Payment QR Code Section at the bottom
    try {
      const upiId = user.upi_id || process.env.NEXT_PUBLIC_DEFAULT_UPI_ID || 'demo@upi';
      const payeeName = user.upi_name || user.name || 'John Doe';
      let upiImage: any = null;

      // If user uploaded a custom QR code, embed it
      if (user.upi_qr_code && user.upi_qr_code.startsWith('data:image')) {
        try {
          const isJpg = user.upi_qr_code.includes('image/jpeg') || user.upi_qr_code.includes('image/jpg');
          const base64Data = user.upi_qr_code.replace(/^data:image\/\w+;base64,/, '');
          const imgBuffer = Buffer.from(base64Data, 'base64');
          upiImage = isJpg ? await pdfDoc.embedJpg(imgBuffer) : await pdfDoc.embedPng(imgBuffer);
        } catch (customErr) {
          console.error('Failed to embed custom QR image, falling back to dynamic generator:', customErr);
        }
      }

      // If no custom image or embedding failed, generate dynamic NPCI QR
      if (!upiImage) {
        const upiBuffer = await generateUpiQrPngBuffer({
          upiId,
          payeeName,
          amount: inv.total,
          invoiceNumber: inv.invoiceNumber,
        }, 160);
        upiImage = await pdfDoc.embedPng(upiBuffer);
      }

      page.drawImage(upiImage, {
        x: 50,
        y: 50,
        width: 75,
        height: 75,
      });

      page.drawText('Scan & Pay via UPI (Zero Fees)', {
        x: 135,
        y: 105,
        size: 9,
        font: helveticaBold,
        color: rgb(0.25, 0.2, 0.8),
      });

      page.drawText(`UPI ID: ${upiId}`, {
        x: 135,
        y: 90,
        size: 8,
        font: helveticaFont,
        color: primaryColor,
      });

      page.drawText('Supported Apps: Google Pay, PhonePe, Paytm, BHIM, CRED', {
        x: 135,
        y: 75,
        size: 7.5,
        font: helveticaFont,
        color: secondaryColor,
      });

      page.drawText(`Amount: Rs. ${inv.total.toFixed(2)}`, {
        x: 135,
        y: 60,
        size: 8.5,
        font: helveticaBold,
        color: rgb(0.05, 0.55, 0.25),
      });
    } catch (qrErr) {
      console.error('Error embedding UPI QR in PDF:', qrErr);
    }

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${inv.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
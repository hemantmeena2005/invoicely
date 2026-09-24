import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { generateUpiQrPngBuffer } from '@/lib/upiHelper'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id
    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })
    }

    const { data: invoice, error } = await supabaseAdmin
      .from('invoices')
      .select('*, clientId:clients(name, email, address, phone, company)')
      .eq('id', invoiceId)
      .single()

    if (error || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const { data: userProfile } = await supabaseAdmin
      .from('users')
      .select('name, email, upi_id, upi_name, upi_qr_code, business_name, business_phone, business_address')
      .eq('id', invoice.user_id)
      .single()

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
    }

    // Create PDF
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595.28, 841.89])
    const { width, height } = page.getSize()

    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const primaryColor = rgb(0.2, 0.2, 0.2)
    const secondaryColor = rgb(0.5, 0.5, 0.5)

    let yPosition = height - 50

    // Header
    page.drawText('INVOICE', {
      x: 50,
      y: yPosition,
      size: 24,
      font: helveticaBold,
      color: primaryColor,
    })

    yPosition -= 40

    page.drawText(`Invoice #: ${inv.invoiceNumber}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: primaryColor,
    })

    const issueDateStr = new Date(inv.issueDate).toLocaleDateString()
    const dueDateStr = new Date(inv.dueDate).toLocaleDateString()

    page.drawText(`Issue Date: ${issueDateStr}`, {
      x: 350,
      y: yPosition,
      size: 10,
      font: helveticaFont,
      color: secondaryColor,
    })

    yPosition -= 15

    page.drawText(`Due Date: ${dueDateStr}`, {
      x: 350,
      y: yPosition,
      size: 10,
      font: helveticaFont,
      color: secondaryColor,
    })

    yPosition -= 30

    // Status Badge in PDF
    const isPaid = inv.status === 'paid'
    page.drawText(`Status: ${inv.status.toUpperCase()}`, {
      x: 50,
      y: yPosition,
      size: 11,
      font: helveticaBold,
      color: isPaid ? rgb(0.05, 0.55, 0.25) : rgb(0.8, 0.2, 0.2),
    })

    yPosition -= 25

    // Client details
    page.drawText('Bill To:', {
      x: 50,
      y: yPosition,
      size: 12,
      font: helveticaBold,
      color: primaryColor,
    })

    yPosition -= 15

    if (inv.clientId.name) {
      page.drawText(inv.clientId.name, {
        x: 50,
        y: yPosition,
        size: 10,
        font: helveticaFont,
        color: primaryColor,
      })
      yPosition -= 12
    }

    if (inv.clientId.company) {
      page.drawText(inv.clientId.company, {
        x: 50,
        y: yPosition,
        size: 10,
        font: helveticaFont,
        color: secondaryColor,
      })
      yPosition -= 12
    }

    if (inv.clientId.email) {
      page.drawText(inv.clientId.email, {
        x: 50,
        y: yPosition,
        size: 10,
        font: helveticaFont,
        color: secondaryColor,
      })
      yPosition -= 12
    }

    yPosition -= 20

    // Table headers
    const tableTop = yPosition
    page.drawRectangle({
      x: 50,
      y: tableTop - 5,
      width: width - 100,
      height: 20,
      color: rgb(0.95, 0.95, 0.95),
    })

    page.drawText('Description', { x: 55, y: tableTop, size: 10, font: helveticaBold, color: primaryColor })
    page.drawText('Qty', { x: 300, y: tableTop, size: 10, font: helveticaBold, color: primaryColor })
    page.drawText('Rate (INR)', { x: 370, y: tableTop, size: 10, font: helveticaBold, color: primaryColor })
    page.drawText('Amount (INR)', { x: 470, y: tableTop, size: 10, font: helveticaBold, color: primaryColor })

    yPosition -= 25

    // Items
    for (const item of inv.items) {
      const description = String(item.description || 'Item')
      const quantity = String(item.quantity || 1)
      const rate = Number(item.rate || 0).toFixed(2)
      const amount = Number(item.amount || (Number(item.quantity || 1) * Number(item.rate || 0))).toFixed(2)

      page.drawText(description, { x: 55, y: yPosition, size: 9, font: helveticaFont, color: primaryColor })
      page.drawText(quantity, { x: 300, y: yPosition, size: 9, font: helveticaFont, color: primaryColor })
      page.drawText(`Rs. ${rate}`, { x: 370, y: yPosition, size: 9, font: helveticaFont, color: primaryColor })
      page.drawText(`Rs. ${amount}`, { x: 470, y: yPosition, size: 9, font: helveticaFont, color: primaryColor })

      yPosition -= 18
    }

    yPosition -= 15

    // Totals
    const totalsX = 350
    page.drawText('Subtotal:', { x: totalsX, y: yPosition, size: 10, font: helveticaFont, color: secondaryColor })
    page.drawText(`Rs. ${inv.subtotal.toFixed(2)}`, { x: 470, y: yPosition, size: 10, font: helveticaFont, color: primaryColor })
    yPosition -= 15

    if (inv.taxRate > 0) {
      page.drawText(`Tax (${inv.taxRate}%):`, { x: totalsX, y: yPosition, size: 10, font: helveticaFont, color: secondaryColor })
      page.drawText(`Rs. ${inv.taxAmount.toFixed(2)}`, { x: 470, y: yPosition, size: 10, font: helveticaFont, color: primaryColor })
      yPosition -= 15
    }

    page.drawText('Total (INR):', { x: totalsX, y: yPosition, size: 12, font: helveticaBold, color: primaryColor })
    page.drawText(`Rs. ${inv.total.toFixed(2)}`, { x: 470, y: yPosition, size: 12, font: helveticaBold, color: primaryColor })

    // UPI Payment QR Code Section at the bottom
    try {
      const upiId = userProfile?.upi_id || process.env.NEXT_PUBLIC_DEFAULT_UPI_ID || 'demo@upi'
      const payeeName = userProfile?.upi_name || userProfile?.name || 'Invoicely Merchant'
      let upiImage: any = null

      if (userProfile?.upi_qr_code && userProfile.upi_qr_code.startsWith('data:image')) {
        try {
          const isJpg = userProfile.upi_qr_code.includes('image/jpeg') || userProfile.upi_qr_code.includes('image/jpg')
          const base64Data = userProfile.upi_qr_code.replace(/^data:image\/\w+;base64,/, '')
          const imgBuffer = Buffer.from(base64Data, 'base64')
          upiImage = isJpg ? await pdfDoc.embedJpg(imgBuffer) : await pdfDoc.embedPng(imgBuffer)
        } catch (customErr) {
          console.error('Failed to embed custom QR image in public PDF:', customErr)
        }
      }

      if (!upiImage) {
        const upiBuffer = await generateUpiQrPngBuffer({
          upiId,
          payeeName,
          amount: inv.total,
          invoiceNumber: inv.invoiceNumber,
        }, 160)
        upiImage = await pdfDoc.embedPng(upiBuffer)
      }

      page.drawImage(upiImage, {
        x: 50,
        y: 50,
        width: 75,
        height: 75,
      })

      page.drawText('Scan & Pay via UPI (Zero Fees)', {
        x: 135,
        y: 105,
        size: 9,
        font: helveticaBold,
        color: rgb(0.25, 0.2, 0.8),
      })

      page.drawText(`UPI ID: ${upiId}`, {
        x: 135,
        y: 90,
        size: 8,
        font: helveticaFont,
        color: primaryColor,
      })

      page.drawText('Supported Apps: Google Pay, PhonePe, Paytm, BHIM, CRED', {
        x: 135,
        y: 75,
        size: 7.5,
        font: helveticaFont,
        color: secondaryColor,
      })

      page.drawText(`Amount: Rs. ${inv.total.toFixed(2)}`, {
        x: 135,
        y: 60,
        size: 8.5,
        font: helveticaBold,
        color: rgb(0.05, 0.55, 0.25),
      })
    } catch (qrErr) {
      console.error('Error embedding UPI QR in public PDF:', qrErr)
    }

    const pdfBytes = await pdfDoc.save()

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${inv.invoiceNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generating public PDF:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

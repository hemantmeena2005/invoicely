import { BrevoClient } from '@getbrevo/brevo'
import nodemailer from 'nodemailer'

const brevoKey = process.env.BREVO_API_KEY || process.env.BREVO_SMTP_KEY || 'dummy_key_for_build'

// Initialize Brevo REST client
const brevo = new BrevoClient({
  apiKey: brevoKey,
})

export interface EmailInvoiceData {
  to: string
  clientName: string
  invoiceNumber: string
  amount: number
  dueDate: string
  pdfBytes?: Uint8Array
  invoiceId: string
  senderName?: string
  senderEmail?: string
}

function getEmailHtml(
  invoiceNumber: string, 
  clientName: string, 
  amount: number, 
  dueDate: string, 
  senderName: string,
  senderEmail: string,
  invoiceId: string,
  isReminder = false
) {
  const formattedAmount = `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const paymentUrl = `${baseUrl}/pay/${invoiceId}`

  if (isReminder) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Reminder - Invoice ${invoiceNumber}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 24px auto; padding: 32px; background: #ffffff; border-radius: 16px; box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.08); border: 1px solid #fecdd3; }
            .header { padding-bottom: 20px; border-bottom: 1px solid #ffe4e6; margin-bottom: 24px; }
            .badge { display: inline-block; background: #fee2e2; color: #e11d48; font-weight: 700; font-size: 12px; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 10px; }
            .title { font-size: 24px; font-weight: 800; color: #9f1239; margin: 0; }
            .greeting { color: #64748b; font-size: 15px; margin-top: 8px; }
            .sender-pill { display: inline-flex; align-items: center; background: #f1f5f9; padding: 6px 12px; border-radius: 8px; font-size: 13px; font-weight: 600; color: #334155; margin-top: 12px; }
            .invoice-details { background: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 22px; margin: 24px 0; }
            .amount-row { margin-top: 14px; padding-top: 14px; border-top: 1px dashed #fca5a5; display: flex; justify-content: space-between; align-items: baseline; }
            .amount { font-size: 30px; font-weight: 800; color: #e11d48; }
            .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <span class="badge">Payment Reminder</span>
              <h1 class="title">Invoice ${invoiceNumber} Overdue</h1>
              <p class="greeting">Dear ${clientName},</p>
              <div class="sender-pill">👤 Requested by: ${senderName} (${senderEmail})</div>
            </div>
            
            <p style="font-size: 15px; color: #334155;">This is a friendly reminder from <strong>${senderName}</strong> that payment for the following invoice is pending:</p>
            
            <div class="invoice-details">
              <div style="margin-bottom: 8px;"><strong>Invoice Number:</strong> ${invoiceNumber}</div>
              <div style="margin-bottom: 8px;"><strong>Original Due Date:</strong> ${new Date(dueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</div>
              <div class="amount-row">
                <span style="font-size: 15px; font-weight: 600; color: #881337;">Amount Due:</span>
                <span class="amount">${formattedAmount}</span>
              </div>
            </div>

            <div style="text-align: center; margin: 28px 0 16px 0;">
              <a href="${paymentUrl}" style="background-color: #e11d48; background: linear-gradient(135deg, #e11d48 0%, #be123c 100%); color: #ffffff !important; padding: 14px 28px; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 12px; display: inline-block; box-shadow: 0 4px 14px rgba(225, 29, 72, 0.35);">
                ⚡ Pay ${formattedAmount} via UPI or Card →
              </a>
            </div>
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="font-size: 12px; color: #64748b;">Instant UPI (Google Pay, PhonePe, Paytm) & Card Payment</span>
            </div>
            
            <p style="font-size: 14px; color: #64748b;">The original invoice PDF is also attached for your records. If payment has already been sent, please disregard this notice.</p>
            
            <div class="footer">
              <p>Thank you, <br><strong>${senderName}</strong></p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice ${invoiceNumber}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 24px auto; padding: 32px; background: #ffffff; border-radius: 16px; box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0; }
          .header { padding-bottom: 20px; border-bottom: 1px solid #e2e8f0; margin-bottom: 24px; }
          .brand { font-size: 18px; font-weight: 800; color: #4f46e5; margin: 0 0 6px 0; letter-spacing: -0.5px; }
          .title { font-size: 26px; font-weight: 800; color: #0f172a; margin: 0; }
          .greeting { color: #64748b; font-size: 15px; margin-top: 8px; }
          .sender-pill { display: inline-flex; align-items: center; background: #eef2ff; border: 1px solid #c7d2fe; padding: 6px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; color: #4338ca; margin-top: 12px; }
          .invoice-details { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 22px; margin: 24px 0; }
          .amount-row { margin-top: 14px; padding-top: 14px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; align-items: baseline; }
          .amount { font-size: 30px; font-weight: 800; color: #059669; }
          .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="brand">⚡ INVOICELY</div>
            <h1 class="title">Invoice ${invoiceNumber}</h1>
            <p class="greeting">Dear ${clientName},</p>
            <div class="sender-pill">👤 Sent by: ${senderName} (${senderEmail})</div>
          </div>
          
          <p style="font-size: 15px; color: #334155;"><strong>${senderName}</strong> has sent you an invoice for recent services provided.</p>
          
          <div class="invoice-details">
            <div style="margin-bottom: 8px;"><strong>Invoice Number:</strong> ${invoiceNumber}</div>
            <div style="margin-bottom: 8px;"><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</div>
            <div class="amount-row">
              <span style="font-size: 15px; font-weight: 600; color: #475569;">Amount Due:</span>
              <span class="amount">${formattedAmount}</span>
            </div>
          </div>

          <div style="text-align: center; margin: 28px 0 16px 0;">
            <a href="${paymentUrl}" style="background-color: #4f46e5; background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color: #ffffff !important; padding: 14px 28px; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 12px; display: inline-block; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);">
              ⚡ View & Pay Invoice (${formattedAmount}) →
            </a>
          </div>
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 12px; color: #64748b;">Instant UPI (Google Pay, PhonePe, Paytm) & Card Payment</span>
          </div>
          
          <p style="font-size: 14px; color: #64748b;">The official invoice PDF has been attached to this email for your accounting records.</p>
          
          <div class="footer">
            <p>If you have any questions or require modifications, please reply directly to this email or contact <strong>${senderName}</strong> at <strong>${senderEmail}</strong>.</p>
            <p>Thank you for your business!</p>
          </div>
        </div>
      </body>
    </html>
  `
}

export async function sendInvoiceEmail(data: EmailInvoiceData) {
  return dispatchEmail(data, false)
}

export async function sendInvoiceReminder(data: EmailInvoiceData) {
  return dispatchEmail(data, true)
}

async function dispatchEmail(data: EmailInvoiceData, isReminder = false) {
  try {
    const { to, clientName, invoiceNumber, amount, dueDate, pdfBytes, senderName, senderEmail } = data
    const key = (process.env.BREVO_API_KEY || process.env.BREVO_SMTP_KEY || '').trim()

    const verifiedFromEmail = process.env.BREVO_SENDER_EMAIL || 'golumeenadowal2005@gmail.com'
    const actualSenderName = senderName || process.env.BREVO_SENDER_NAME || 'Invoicely'
    const actualSenderEmail = senderEmail || verifiedFromEmail

    const sender = {
      name: actualSenderName,
      email: verifiedFromEmail,
    }

    const formattedAmount = `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

    const subject = isReminder
      ? `Payment Reminder: Invoice ${invoiceNumber} (${formattedAmount}) from ${actualSenderName}`
      : `Invoice ${invoiceNumber} from ${actualSenderName} (${formattedAmount})`

    const emailHtml = getEmailHtml(invoiceNumber, clientName, amount, dueDate, actualSenderName, actualSenderEmail, data.invoiceId, isReminder)

    // Check if user provided an SMTP key (xsmtpsib-...) or REST API key (xkeysib-...)
    if (key.startsWith('xsmtpsib-')) {
      console.log(`📬 Sending via Brevo SMTP relay from ${sender.email} on behalf of ${actualSenderName}...`)
      
      const smtpUser = process.env.BREVO_SMTP_LOGIN || process.env.BREVO_SMTP_USER || 'ba9960001@smtp-brevo.com'
      const transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        auth: {
          user: smtpUser,
          pass: key,
        },
      })

      const info = await transporter.sendMail({
        from: `"${actualSenderName}" <${sender.email}>`,
        to,
        replyTo: actualSenderEmail,
        subject,
        html: emailHtml,
        attachments: pdfBytes ? [
          {
            filename: `invoice-${invoiceNumber}.pdf`,
            content: Buffer.from(pdfBytes),
          }
        ] : undefined,
      })

      console.log('✅ Email delivered via Brevo SMTP:', info.messageId)
      return {
        success: true,
        messageId: info.messageId,
        data: info,
      }
    } else {
      console.log('📬 Sending via Brevo REST API...')
      
      const attachments = pdfBytes ? [
        {
          name: `invoice-${invoiceNumber}.pdf`,
          content: Buffer.from(pdfBytes).toString('base64'),
        }
      ] : undefined

      const response = await brevo.transactionalEmails.sendTransacEmail({
        sender,
        to: [{ email: to, name: clientName }],
        replyTo: { email: actualSenderEmail, name: actualSenderName },
        subject,
        htmlContent: emailHtml,
        attachment: attachments,
      })

      console.log('✅ Brevo REST API dispatched:', response)
      return {
        success: true,
        messageId: response.messageId || 'sent',
        data: response,
      }
    }
  } catch (error) {
    console.error('❌ Error dispatching email via Brevo:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
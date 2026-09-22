import QRCode from 'qrcode'

export interface UpiPaymentParams {
  upiId: string
  payeeName: string
  amount: number
  invoiceNumber: string
  note?: string
}

/**
 * Builds standard NPCI UPI Intent URI supported by Google Pay, PhonePe, Paytm, BHIM, CRED, Amazon Pay
 */
export function buildUpiUri({ upiId, payeeName, amount, invoiceNumber, note }: UpiPaymentParams): string {
  const cleanUpi = upiId.trim()
  const cleanName = encodeURIComponent(payeeName.trim() || 'Merchant')
  const cleanAmount = Number(amount || 0).toFixed(2)
  const transactionNote = encodeURIComponent((note || `Invoice ${invoiceNumber}`).substring(0, 50))

  // Standard NPCI UPI URI Specification: Keep @ unescaped for UPI apps (GPay, PhonePe, Paytm, BHIM)
  return `upi://pay?pa=${cleanUpi}&pn=${cleanName}&am=${cleanAmount}&cu=INR&tn=${transactionNote}`
}

/**
 * Generates Base64 Data URL for web and email image rendering
 */
export async function generateUpiQrDataUrl(params: UpiPaymentParams, width = 280): Promise<string> {
  const uri = buildUpiUri(params)
  return await QRCode.toDataURL(uri, {
    width,
    margin: 1.5,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'M',
  })
}

/**
 * Generates PNG buffer for direct embedding into pdf-lib
 */
export async function generateUpiQrPngBuffer(params: UpiPaymentParams, width = 200): Promise<Buffer> {
  const uri = buildUpiUri(params)
  return await QRCode.toBuffer(uri, {
    type: 'png',
    width,
    margin: 1,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'M',
  })
}

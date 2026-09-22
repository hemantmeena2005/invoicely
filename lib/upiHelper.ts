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
  
  // Clean payee name (alphanumeric and spaces only, max 25 chars for strict BHIM compatibility)
  const sanitizedName = (payeeName || 'Merchant')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim()
    .substring(0, 25) || 'Merchant'
  const cleanName = encodeURIComponent(sanitizedName)

  const cleanAmount = Number(amount || 0).toFixed(2)

  // Clean note (strictly alphanumeric, max 20 chars, removes all special characters & hyphens to prevent BHIM 'request type not supported' error)
  const sanitizedNote = (note || `INV${invoiceNumber.replace(/[^a-zA-Z0-9]/g, '')}`)
    .replace(/[^a-zA-Z0-9]/g, '')
    .trim()
    .substring(0, 20) || 'Payment'
  const cleanNote = encodeURIComponent(sanitizedNote)

  // Standard NPCI UPI URI Specification: Keep @ unescaped for UPI apps (GPay, PhonePe, Paytm, BHIM)
  return `upi://pay?pa=${cleanUpi}&pn=${cleanName}&am=${cleanAmount}&cu=INR&tn=${cleanNote}`
}

export function buildGPayUri(params: UpiPaymentParams): string {
  const baseUri = buildUpiUri(params).replace('upi://pay?', '')
  return `tez://upi/pay?${baseUri}`
}

export function buildPhonePeUri(params: UpiPaymentParams): string {
  const baseUri = buildUpiUri(params).replace('upi://pay?', '')
  return `phonepe://pay?${baseUri}`
}

export function buildPaytmUri(params: UpiPaymentParams): string {
  const baseUri = buildUpiUri(params).replace('upi://pay?', '')
  return `paytmmp://pay?${baseUri}`
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

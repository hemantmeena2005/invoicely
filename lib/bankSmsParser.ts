/**
 * Invoicely Bank SMS Parser for Indian Banks
 * Handles SMS formats from SBI, HDFC, ICICI, Axis, Kotak, PNB, Bank of Baroda, Paytm Bank, etc.
 */

export interface ParsedBankSms {
  isCredit: boolean
  amount: number | null
  utr: string | null
  invoiceHint: string | null
  sender: string | null
  bank: string | null
  accountLast4: string | null
  raw: string
}

export function parseBankSms(rawText: string): ParsedBankSms {
  const text = (rawText || '').trim()
  const lower = text.toLowerCase()

  // 1. Determine if this is a CREDIT transaction
  // Disqualify if it's explicitly a debit, payment sent, OTP, or balance inquiry
  const hasDebitWord = /\b(debited|debit|withdrawn|spent|paid to|sent rs|transferred to)\b/i.test(lower)
  const hasCreditWord = /\b(credited|credit|received|deposited|added to your a\/c|recvd)\b/i.test(lower)
  
  const isCredit = hasCreditWord && !hasDebitWord

  // 2. Identify Bank (if present in SMS sender or body)
  let bank: string | null = null
  if (/sbi|state bank/i.test(text)) bank = 'SBI'
  else if (/hdfc/i.test(text)) bank = 'HDFC'
  else if (/icici/i.test(text)) bank = 'ICICI'
  else if (/axis/i.test(text)) bank = 'Axis'
  else if (/kotak/i.test(text)) bank = 'Kotak'
  else if (/pnb|punjab national/i.test(text)) bank = 'PNB'
  else if (/paytm/i.test(text)) bank = 'Paytm Payments Bank'
  else if (/baroda|bob/i.test(text)) bank = 'Bank of Baroda'
  else if (/canara/i.test(text)) bank = 'Canara Bank'
  else if (/indusind/i.test(text)) bank = 'IndusInd'
  else if (/idfc/i.test(text)) bank = 'IDFC FIRST'

  // 3. Extract Account number ending
  let accountLast4: string | null = null
  const accMatch = text.match(/(?:ending\s+|a\/c(?:\s+no\.?)?\s*[*xX]+)([0-9]{3,4})\b/i) ||
                   text.match(/(?:a\/c|account|acct)\s+(?:no\.?\s*)?([0-9]{3,4})\b/i)
  if (accMatch && accMatch[1]) {
    accountLast4 = accMatch[1]
  }

  // 4. Extract Amount
  let amount: number | null = null
  // Patterns like:
  // "credited by Rs 5000.00"
  // "credited for INR 5,000"
  // "Rs.5000.00 credited"
  // "received Rs. 5000"
  const amountPatterns = [
    /(?:credited\s+(?:by|with|for)?|received\s+)?(?:rs\.?|inr)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
    /(?:rs\.?|inr)\s*([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:credited|deposited|received)/i,
    /credited\s+(?:by|with|for)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
    /\b([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:credited|deposited|received)\b/i,
  ]

  for (const pat of amountPatterns) {
    const match = text.match(pat)
    if (match && match[1]) {
      const parsedNum = parseFloat(match[1].replace(/,/g, ''))
      if (!isNaN(parsedNum) && parsedNum > 0) {
        amount = parsedNum
        break
      }
    }
  }

  // 5. Extract 12-digit UTR (RRN / UPI Reference Number)
  let utr: string | null = null

  // Specific UPI UTR indicators (standard 12 digits in NPCI UPI)
  const utrPatterns = [
    // UPI/426718902345 or UPI:426718902345
    /(?:upi(?:\/|\s+|:|-))(?:ref(?:\s*no\.?)?\s*)?([0-9]{12})\b/i,
    // UPI Ref no 426718902345 or Ref no 426718902345
    /(?:upi\s+)?(?:ref(?:\s*no\.?|\s*num\.?)?|rrn(?:\s*no\.?)?|utr(?:\s*no\.?)?)\s*[:\-]?\s*([0-9]{12})\b/i,
    // (Ref no 426718902345)
    /\(ref(?:\s*no\.?)?\s*([0-9]{12})\)/i,
    // Any standalone 12-digit number if SMS mentions UPI
    /upi.*?([0-9]{12})\b/i,
  ]

  for (const pat of utrPatterns) {
    const match = text.match(pat)
    if (match && match[1]) {
      utr = match[1]
      break
    }
  }

  // If no 12-digit found via UPI prefix, check for any 12-digit numeric sequence
  if (!utr && isCredit) {
    const any12Digit = text.match(/\b([0-9]{12})\b/)
    if (any12Digit && any12Digit[1]) {
      utr = any12Digit[1]
    }
  }

  // 6. Extract Invoice Number Hint if present (e.g. INV20260008 or INV-2026-0008)
  let invoiceHint: string | null = null
  const invMatch = text.match(/\b(INV-?[0-9]{4}-?[0-9]{3,6}|INV[0-9]{4,10})\b/i)
  if (invMatch && invMatch[1]) {
    invoiceHint = invMatch[1].toUpperCase()
  }

  // 7. Extract Sender name or VPA if available
  let sender: string | null = null
  const vpaMatch = text.match(/\b([a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64})\b/)
  if (vpaMatch && vpaMatch[1]) {
    sender = vpaMatch[1]
  } else {
    // Check format like UPI/426718902345/SenderName/...
    const slashParts = text.match(/upi\/[0-9]{12}\/([a-zA-Z0-9\s]+?)(?:\/|\s|\(|$)/i)
    if (slashParts && slashParts[1] && slashParts[1].length > 1) {
      sender = slashParts[1].trim()
    }
  }

  return {
    isCredit,
    amount,
    utr,
    invoiceHint,
    sender,
    bank,
    accountLast4,
    raw: text,
  }
}

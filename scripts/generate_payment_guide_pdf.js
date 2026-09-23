const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function createPaymentGuide() {
  const doc = await PDFDocument.create();
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await doc.embedFont(StandardFonts.HelveticaOblique);
  const fontMono = await doc.embedFont(StandardFonts.Courier);

  // Palette
  const primary = rgb(0.31, 0.27, 0.90);     // Indigo #4f46e5
  const primaryDark = rgb(0.18, 0.14, 0.55); // Dark Indigo #2e248c
  const textDark = rgb(0.09, 0.11, 0.15);    // Slate 900 #0f172a
  const textMuted = rgb(0.39, 0.45, 0.55);   // Slate 500 #64748b
  const bgLight = rgb(0.96, 0.97, 0.99);     // Slate 50 #f8fafc
  const cardBorder = rgb(0.88, 0.91, 0.94);  // Slate 200 #e2e8f0
  const emerald = rgb(0.06, 0.60, 0.44);     // Emerald #10b981
  const amber = rgb(0.85, 0.55, 0.05);       // Amber #d97706
  const white = rgb(1, 1, 1);

  const pageWidth = 595.28; // A4 portrait
  const pageHeight = 841.89;
  const margin = 46;
  const contentWidth = pageWidth - margin * 2;

  let currentPage = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  function checkPageBreak(neededSpace = 55) {
    if (y - neededSpace < 50) {
      currentPage = doc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
      drawHeaderSmall(currentPage);
    }
  }

  function drawHeaderSmall(page) {
    page.drawText('INVOICELY — PAYMENT ARCHITECTURE & SETTLEMENT SPECIFICATION', {
      x: margin,
      y: pageHeight - 30,
      size: 7.5,
      font: fontBold,
      color: primary,
    });
    page.drawLine({
      start: { x: margin, y: pageHeight - 36 },
      end: { x: pageWidth - margin, y: pageHeight - 36 },
      thickness: 0.5,
      color: cardBorder,
    });
    y = pageHeight - 52;
  }

  function addTitle(text, subtitle) {
    // Brand header badge
    currentPage.drawRectangle({
      x: margin,
      y: y - 20,
      width: 130,
      height: 20,
      color: bgLight,
      borderColor: cardBorder,
      borderWidth: 1,
    });
    currentPage.drawText('SYSTEM ARCHITECTURE', {
      x: margin + 8,
      y: y - 14,
      size: 7.5,
      font: fontBold,
      color: primary,
    });
    y -= 38;

    currentPage.drawText(text, {
      x: margin,
      y: y,
      size: 20,
      font: fontBold,
      color: textDark,
    });
    y -= 20;

    if (subtitle) {
      currentPage.drawText(subtitle, {
        x: margin,
        y: y,
        size: 10,
        font: fontRegular,
        color: textMuted,
      });
      y -= 22;
    }

    currentPage.drawLine({
      start: { x: margin, y: y },
      end: { x: pageWidth - margin, y: y },
      thickness: 1.5,
      color: primary,
    });
    y -= 20;
  }

  function addSectionHeading(title, tag) {
    checkPageBreak(45);
    y -= 8;
    currentPage.drawText(title, {
      x: margin,
      y: y,
      size: 13,
      font: fontBold,
      color: primaryDark,
    });
    if (tag) {
      const tagWidth = fontBold.widthOfTextAtSize(tag, 7.5) + 12;
      currentPage.drawRectangle({
        x: pageWidth - margin - tagWidth,
        y: y - 2,
        width: tagWidth,
        height: 15,
        color: bgLight,
        borderColor: cardBorder,
        borderWidth: 0.8,
      });
      currentPage.drawText(tag, {
        x: pageWidth - margin - tagWidth + 6,
        y: y + 2,
        size: 7.5,
        font: fontBold,
        color: primary,
      });
    }
    y -= 6;
    currentPage.drawLine({
      start: { x: margin, y: y },
      end: { x: pageWidth - margin, y: y },
      thickness: 0.8,
      color: cardBorder,
    });
    y -= 14;
  }

  function addParagraph(text, options = {}) {
    const fontSize = options.size || 9.5;
    const font = options.bold ? fontBold : options.italic ? fontOblique : fontRegular;
    const color = options.color || textDark;
    const lineHeight = options.lineHeight || fontSize * 1.4;

    const words = text.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (testWidth > contentWidth) {
        checkPageBreak(lineHeight + 8);
        currentPage.drawText(currentLine, {
          x: margin,
          y: y,
          size: fontSize,
          font: font,
          color: color,
        });
        y -= lineHeight;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      checkPageBreak(lineHeight + 8);
      currentPage.drawText(currentLine, {
        x: margin,
        y: y,
        size: fontSize,
        font: font,
        color: color,
      });
      y -= lineHeight;
    }
    y -= options.spacingAfter || 6;
  }

  function addCalloutCard(title, bodyLines, type = 'info') {
    checkPageBreak(25 + bodyLines.length * 14 + 10);
    const boxColor = type === 'success' ? rgb(0.94, 0.99, 0.96) : type === 'warning' ? rgb(0.99, 0.98, 0.92) : bgLight;
    const borderColor = type === 'success' ? rgb(0.5, 0.85, 0.65) : type === 'warning' ? rgb(0.9, 0.8, 0.4) : primary;
    const titleColor = type === 'success' ? emerald : type === 'warning' ? amber : primaryDark;

    const cardHeight = 22 + bodyLines.length * 13 + 8;

    currentPage.drawRectangle({
      x: margin,
      y: y - cardHeight,
      width: contentWidth,
      height: cardHeight,
      color: boxColor,
      borderColor: borderColor,
      borderWidth: 1,
    });

    currentPage.drawRectangle({
      x: margin,
      y: y - cardHeight,
      width: 4,
      height: cardHeight,
      color: borderColor,
    });

    currentPage.drawText(title, {
      x: margin + 12,
      y: y - 15,
      size: 9.5,
      font: fontBold,
      color: titleColor,
    });

    let lineY = y - 27;
    for (const line of bodyLines) {
      currentPage.drawText(line, {
        x: margin + 12,
        y: lineY,
        size: 8.5,
        font: fontRegular,
        color: textDark,
      });
      lineY -= 13;
    }

    y -= cardHeight + 10;
  }

  function addStepItem(stepNum, title, desc, techStack) {
    checkPageBreak(45);
    const badgeWidth = 18;
    const badgeHeight = 18;

    currentPage.drawRectangle({
      x: margin,
      y: y - 13,
      width: badgeWidth,
      height: badgeHeight,
      color: primary,
    });
    currentPage.drawText(String(stepNum), {
      x: margin + (stepNum > 9 ? 3 : 6),
      y: y - 9,
      size: 8.5,
      font: fontBold,
      color: white,
    });

    currentPage.drawText(title, {
      x: margin + badgeWidth + 8,
      y: y - 8,
      size: 10,
      font: fontBold,
      color: textDark,
    });

    if (techStack) {
      const techText = `[ ${techStack} ]`;
      const techWidth = fontOblique.widthOfTextAtSize(techText, 8);
      currentPage.drawText(techText, {
        x: pageWidth - margin - techWidth,
        y: y - 8,
        size: 8,
        font: fontOblique,
        color: textMuted,
      });
    }

    y -= 19;
    addParagraph(desc, { size: 9, color: textMuted, spacingAfter: 10 });
  }

  function addTable(headers, rows, colWidths) {
    checkPageBreak(30 + rows.length * 20);
    const tableYStart = y;
    const rowHeight = 18;

    // Header background
    currentPage.drawRectangle({
      x: margin,
      y: y - rowHeight,
      width: contentWidth,
      height: rowHeight,
      color: bgLight,
      borderColor: cardBorder,
      borderWidth: 0.8,
    });

    let curX = margin + 6;
    for (let i = 0; i < headers.length; i++) {
      currentPage.drawText(headers[i], {
        x: curX,
        y: y - 13,
        size: 8,
        font: fontBold,
        color: primaryDark,
      });
      curX += colWidths[i];
    }
    y -= rowHeight;

    // Rows
    for (const row of rows) {
      checkPageBreak(rowHeight + 5);
      currentPage.drawRectangle({
        x: margin,
        y: y - rowHeight,
        width: contentWidth,
        height: rowHeight,
        color: white,
        borderColor: cardBorder,
        borderWidth: 0.5,
      });

      curX = margin + 6;
      for (let i = 0; i < row.length; i++) {
        currentPage.drawText(row[i], {
          x: curX,
          y: y - 13,
          size: 8,
          font: i === 0 ? fontMono : fontRegular,
          color: textDark,
        });
        curX += colWidths[i];
      }
      y -= rowHeight;
    }
    y -= 10;
  }

  // ==========================================
  // PAGE 1: TITLE & CORE ARCHITECTURE
  // ==========================================
  addTitle('Invoicely Payment Architecture', 'Complete Engineering & Settlement Process Documentation');

  addParagraph(
    'This technical document details the end-to-end payment lifecycle in Invoicely, explaining how peer-to-peer (P2P / P2M) Unified Payments Interface (UPI) transactions are generated, verified, and settled with 0% gateway commission and instant funds delivery.',
    { size: 9.5, spacingAfter: 10 }
  );

  addCalloutCard('Why Zero-Commission Direct UPI?', [
    '• Traditional Gateways (Razorpay, Stripe, Cashfree) deduct 2% to 3% + GST on every single invoice.',
    '• They introduce T+2 or T+3 settlement hold periods before money arrives in the freelancer bank account.',
    '• Invoicely eliminates intermediaries: clients pay directly into the merchant bank account with instant settlement.',
  ], 'info');

  addSectionHeading('1. Core Technology Stack & Libraries', 'TECH STACK');

  addParagraph('The payment system is built on modern, resilient cloud-native technologies:');

  const stackItems = [
    { name: 'Next.js 14 (App Router)', role: 'Core Framework: Server actions, dynamic API routes, and edge rendering.' },
    { name: 'Supabase (PostgreSQL)', role: 'Database & Realtime: Stores invoices, clients, profiles, email logs, and UTR audits.' },
    { name: 'NPCI UPI Protocol', role: 'Payment Protocol: Generates standardized upi://pay deep-links with amount locking.' },
    { name: 'qrcode Engine', role: 'Dynamic QR Generator: Converts upi:// URIs into high-resolution scan-to-pay QR codes.' },
    { name: 'pdf-lib', role: 'Native PDF Engine: Builds verifiable digital invoices containing UPI QR codes and bank details.' },
    { name: 'Brevo (Sendinblue API)', role: 'Notification Delivery: Dispatches transactional invoice emails and automated reminders.' },
    { name: '12-Digit Bank UTR Engine', role: 'Settlement Verification: Verifies bank Unique Transaction References preventing duplicate claims.' },
  ];

  for (const item of stackItems) {
    checkPageBreak(18);
    currentPage.drawText(`• ${item.name}:`, {
      x: margin + 8,
      y: y,
      size: 9,
      font: fontBold,
      color: primaryDark,
    });
    const labelWidth = fontBold.widthOfTextAtSize(`• ${item.name}: `, 9);
    currentPage.drawText(item.role, {
      x: margin + 8 + labelWidth,
      y: y,
      size: 8.5,
      font: fontRegular,
      color: textDark,
    });
    y -= 14;
  }

  y -= 6;

  // ==========================================
  // SECTION 2: THE 8-STEP PAYMENT FLOW
  // ==========================================
  addSectionHeading('2. End-to-End Payment Flow (8 Phases)', 'WORKFLOW');

  addStepItem(
    1,
    'Merchant UPI Configuration',
    'The merchant enters their Virtual Payment Address (VPA / UPI ID, e.g. user@oksbi) and Payee Business Name under Settings (/settings). Optionally, they can upload a personalized branded QR code. This configuration is stored encrypted in Supabase public.users.',
    'Settings & Supabase Users'
  );

  addStepItem(
    2,
    'Invoice Creation & Dynamic UPI URL Generation',
    'When a new invoice is created (/invoices/new), Invoicely constructs the standardized NPCI UPI payment URI with exact amount locking: upi://pay?pa={upiId}&pn={payeeName}&am={totalAmount}&cu=INR&tn=Invoice {invoiceNumber}. This enforces payment accuracy down to the exact rupee.',
    'lib/upiHelper.ts'
  );

  addStepItem(
    3,
    'Email Delivery with Dynamic Checkout Link',
    'The client receives a high-deliverability email containing invoice particulars, an attached official PDF with embedded QR code, and a primary CTA: "Pay Invoice Online via UPI". The link points to the secure hosted checkout portal (/pay/[id]).',
    'Brevo API & /api/invoices/[id]/send-email'
  );

  addStepItem(
    4,
    'Hosted Client Payment Portal (/pay/[id])',
    'The client opens the invoice payment screen. The portal provides: 1) Dynamic UPI QR Code, 2) Copyable VPA & Amount, 3) 15-minute checkout countdown timer, and 4) Live background poller checking for payment settlement.',
    'Next.js Client Page & Real-Time Poller'
  );

  addStepItem(
    5,
    'Client Scans & Authorizes in Banking App',
    'The client scans the QR code or copies the UPI ID using Google Pay, PhonePe, Paytm, BHIM, Cred, or any Indian banking app. The funds travel directly from the client bank account to the merchant bank account via NPCI IMPS rails without intermediate gateway holding.',
    'UPI 2.0 / NPCI Banking Rails'
  );

  addStepItem(
    6,
    'Bank Settlement UTR Submission & Fraud Protection',
    'Upon completing payment, the banking app displays a 12-digit Unique Transaction Reference (UTR) or UPI Ref Number. The client inputs this 12-digit reference on the payment portal. The backend validates the numeric syntax (/^[0-9]{12}$/) and checks for collision/duplicate usage across all past invoices.',
    '/api/pay/[id]/verify'
  );

  addStepItem(
    7,
    'Automated Webhook & Reconciliation Fallback',
    'For automated reconciliation, Invoicely provides a dedicated webhook listener (/api/webhooks/upi). External bank transaction SMS parsers or business bank open APIs (e.g. Decentro, Setu) can POST settlement payloads to auto-match and mark invoices as paid without client input.',
    '/api/webhooks/upi & Supabase'
  );

  addStepItem(
    8,
    'Real-time State Transition & Automated Reminder Killswitch',
    'Once verified: 1) Invoice status is updated to "paid" with a timestamp, 2) The merchant sees an instant real-time celebration modal on their dashboard, and 3) All scheduled email reminders are killed instantly (next_reminder_at = null).',
    'lib/reminderHelper.ts & Realtime State'
  );

  // ==========================================
  // SECTION 3: SECURITY & ANTI-FRAUD
  // ==========================================
  addSectionHeading('3. Security, Fraud Prevention & Validation', 'SECURITY');

  addParagraph(
    'Because peer-to-peer UPI does not always provide a synchronous two-way callback to web apps without expensive banking aggregator contracts, Invoicely uses a dual-layer verification protocol:'
  );

  addCalloutCard('Layer 1: 12-Digit Bank UTR Cryptographic Validation', [
    '1. Strict Syntax Enforcement: Must match exactly 12 numeric digits (NPCI standard).',
    '2. Duplicate Prevention: Queries Supabase for any other invoice bearing the same UTR.',
    '3. Audit Trail: The UTR and submission timestamp are logged into invoice terms and email_logs.',
    '4. Transparency: The merchant sees the exact UTR on their dashboard to cross-reference against their bank SMS.',
  ], 'info');

  addCalloutCard('Layer 2: Multi-App Compatibility & Limit Handling', [
    '• GPay / PhonePe / BHIM Limit Protection: Warns clients regarding the daily UPI P2P limit of INR 1,00,000.',
    '• Direct QR Scanning: Avoids UPI Deep-link app sandboxing bugs by displaying clean static & dynamic QR.',
    '• Auto-Sanitization: Internal settlement metadata tags are stripped from PDF downloads and public view.',
  ], 'warning');

  // ==========================================
  // SECTION 4: AUTOMATED REMINDERS & CRON
  // ==========================================
  addSectionHeading('4. Automated Payment Reminders & Cron System', 'AUTOMATION');

  addParagraph(
    'Unpaid invoices can be placed on an automated reminder schedule to recover receivables without manual follow-up:'
  );

  const schedules = [
    { title: 'Everyday (Daily)', desc: 'Sends an email reminder every 24 hours until payment is completed.' },
    { title: 'Every 3 Days', desc: 'Balances urgency with courtesy, sending reminders at 3-day intervals.' },
    { title: 'Once a Week (Weekly)', desc: 'Ideal for ongoing retainers and commercial enterprise invoicing.' },
    { title: 'On Due Date', desc: 'Dispatches on the day payment is due, with follow-ups if overdue.' },
  ];

  for (const s of schedules) {
    checkPageBreak(18);
    currentPage.drawText(`• ${s.title}: `, {
      x: margin + 8,
      y: y,
      size: 9,
      font: fontBold,
      color: primary,
    });
    const w = fontBold.widthOfTextAtSize(`• ${s.title}: `, 9);
    currentPage.drawText(s.desc, {
      x: margin + 8 + w,
      y: y,
      size: 8.5,
      font: fontRegular,
      color: textDark,
    });
    y -= 14;
  }

  y -= 6;

  addCalloutCard('Automated Killswitch Guarantee', [
    '• As soon as an invoice is marked as Paid (via UTR, Webhook, or Manual click), the reminder schedule is terminated.',
    '• next_reminder_at is set to null, guaranteeing clients never receive payment reminders for paid invoices.',
  ], 'success');

  // ==========================================
  // SECTION 5: API ENDPOINTS ARCHITECTURE
  // ==========================================
  addSectionHeading('5. Payment System API Routes Reference', 'API SPECS');

  addParagraph('The payment system is powered by the following REST and webhook endpoints:');

  const apiHeaders = ['Endpoint & Method', 'Payload / Parameters', 'Functionality Description'];
  const apiRows = [
    ['GET /pay/[id]', 'params: { id }', 'Hosted checkout portal with dynamic UPI QR & status poller.'],
    ['GET /api/pay/[id]', 'params: { id }', 'Public JSON state endpoint for poller (status, amount, VPA).'],
    ['POST /api/pay/[id]/verify', '{ utr: "123456789012" }', 'Validates 12-digit numeric UTR & marks invoice paid.'],
    ['POST /api/webhooks/upi', '{ utr, invoiceNumber }', 'Webhook ingestion for automated bank SMS/API parsers.'],
    ['GET /api/cron/reminders', 'Bearer CRON_SECRET', 'Vercel Cron job triggering automated email reminders.'],
    ['GET /api/invoices/[id]/pdf', 'params: { id }', 'Generates official PDF with embedded scan-to-pay QR.'],
  ];

  addTable(apiHeaders, apiRows, [145, 125, 233]);

  // ==========================================
  // SECTION 6: FREQUENTLY ASKED QUESTIONS & EDGE CASES
  // ==========================================
  addSectionHeading('6. Common Banking Edge Cases & Solutions', 'TROUBLESHOOTING');

  const faqItems = [
    {
      q: 'Why did BHIM or Google Pay show "Request type not supported"?',
      a: 'Older UPI deep links attempted to force app package intent schemes. Using standard upi://pay URI protocol and direct QR scanning completely resolves this across all UPI clients.',
    },
    {
      q: 'Why did PhonePe display "You can only pay up to Rs. 2,000 via gallery pay"?',
      a: 'NPCI security regulations cap uploaded gallery image scans at Rs. 2,000 for unverified merchants. Invoicely provides direct screen QR scanning and 1-tap UPI ID copying, bypassing the gallery scan cap.',
    },
    {
      q: 'Can a client fake payment by submitting a random 12-digit number?',
      a: 'The merchant receives the exact UTR on their invoice dashboard and cross-references it against their bank notification. Furthermore, the system blocks duplicate UTR reuse across all invoices.',
    },
  ];

  for (const item of faqItems) {
    checkPageBreak(35);
    currentPage.drawText(`Q: ${item.q}`, {
      x: margin + 6,
      y: y,
      size: 8.5,
      font: fontBold,
      color: primaryDark,
    });
    y -= 13;
    addParagraph(`A: ${item.a}`, { size: 8.5, color: textMuted, spacingAfter: 8 });
  }

  // ==========================================
  // FOOTER NUMBERING (EXACT PAGE COUNT)
  // ==========================================
  const totalPages = doc.getPageCount();
  const allPages = doc.getPages();

  for (let i = 0; i < totalPages; i++) {
    const page = allPages[i];
    const pNum = i + 1;

    page.drawText('Invoicely — Payment Architecture & Settlement Guide', {
      x: margin,
      y: 28,
      size: 8,
      font: fontRegular,
      color: textMuted,
    });

    const pageText = `Page ${pNum} of ${totalPages}`;
    const pageTextWidth = fontRegular.widthOfTextAtSize(pageText, 8);
    page.drawText(pageText, {
      x: pageWidth - margin - pageTextWidth,
      y: 28,
      size: 8,
      font: fontRegular,
      color: textMuted,
    });

    page.drawLine({
      start: { x: margin, y: 38 },
      end: { x: pageWidth - margin, y: 38 },
      thickness: 0.5,
      color: cardBorder,
    });
  }

  const pdfBytes = await doc.save();
  return pdfBytes;
}

async function main() {
  const bytes = await createPaymentGuide();
  
  // Save to public directory
  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  const publicPdfPath = path.join(publicDir, 'Invoicely_Payment_Process_Guide.pdf');
  fs.writeFileSync(publicPdfPath, bytes);

  // Save to project root
  const rootPdfPath = path.join(__dirname, '..', 'Invoicely_Payment_Process_Guide.pdf');
  fs.writeFileSync(rootPdfPath, bytes);

  // Save to brain artifact directory
  const artifactDir = '/Users/hemant/.gemini/antigravity-ide/brain/b4b24683-f71a-4559-b07a-1bcd968fe1b5';
  if (fs.existsSync(artifactDir)) {
    fs.writeFileSync(path.join(artifactDir, 'Invoicely_Payment_Process_Guide.pdf'), bytes);
  }

  console.log('PDF generated successfully at:');
  console.log('1. ' + publicPdfPath);
  console.log('2. ' + rootPdfPath);
  console.log('3. ' + path.join(artifactDir, 'Invoicely_Payment_Process_Guide.pdf'));
}

main().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});

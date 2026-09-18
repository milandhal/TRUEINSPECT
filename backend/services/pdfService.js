const PDFDocument = require('pdfkit');

/**
 * Generates a clean, professional automotive inspection report PDF stream.
 * Branding is strictly TRUEINSPECT (no subtitle).
 * 
 * @param {Object} data - Formatted inspection data
 * @param {stream.Writable} outputStream - Stream to write PDF to
 */
function generateInspectionPDF(data, outputStream) {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    info: {
      Title: `TRUEINSPECT Report - ${data.inspection.registration_number}`,
      Author: 'TRUEINSPECT'
    }
  });

  doc.pipe(outputStream);

  const primaryRed = '#D32F2F';
  const darkCharcoal = '#1E293B';
  const slateGray = '#64748B';
  const lightBorder = '#E2E8F0';
  const tableBg = '#F8FAFC';

  // 1. BRANDING HEADER
  doc
    .fontSize(22)
    .fillColor(primaryRed)
    .font('Helvetica-Bold')
    .text('TRUEINSPECT', 40, 40);

  doc
    .fontSize(11)
    .fillColor(slateGray)
    .font('Helvetica-Bold')
    .text('VEHICLE INSPECTION REPORT', 40, 68);

  doc
    .fontSize(9)
    .font('Helvetica')
    .text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 420, 45, { align: 'right' });

  doc
    .fontSize(9)
    .font('Helvetica')
    .text(`Report ID: TI-${data.inspection.id.toString().padStart(5, '0')}`, 420, 58, { align: 'right' });

  // Divider line
  doc
    .strokeColor(primaryRed)
    .lineWidth(2)
    .moveTo(40, 85)
    .lineTo(555, 85)
    .stroke();

  let currentY = 100;

  // 2. VEHICLE & INSPECTION DETAILS SECTION
  doc
    .fontSize(10)
    .fillColor(darkCharcoal)
    .font('Helvetica-Bold')
    .text('VEHICLE & INSPECTION DETAILS', 40, currentY);

  currentY += 16;

  // Draw background box
  doc
    .rect(40, currentY, 515, 60)
    .fillAndStroke(tableBg, lightBorder);

  doc.fillColor(darkCharcoal).fontSize(9);
  
  // Column 1
  doc.font('Helvetica-Bold').text('Registration No:', 52, currentY + 10);
  doc.font('Helvetica').text(data.inspection.registration_number || 'N/A', 150, currentY + 10);

  doc.font('Helvetica-Bold').text('Vehicle Make:', 52, currentY + 25);
  doc.font('Helvetica').text(data.inspection.vehicle_make || 'N/A', 150, currentY + 25);

  doc.font('Helvetica-Bold').text('Vehicle Model:', 52, currentY + 40);
  doc.font('Helvetica').text(data.inspection.vehicle_model || 'N/A', 150, currentY + 40);

  // Column 2
  doc.font('Helvetica-Bold').text('Inspection Date:', 310, currentY + 10);
  const inspDate = data.inspection.inspection_date
    ? new Date(data.inspection.inspection_date).toLocaleDateString('en-IN')
    : 'N/A';
  doc.font('Helvetica').text(inspDate, 410, currentY + 10);

  doc.font('Helvetica-Bold').text('Inspector:', 310, currentY + 25);
  doc.font('Helvetica').text(data.inspection.inspector_name || 'N/A', 410, currentY + 25);

  doc.font('Helvetica-Bold').text('Status:', 310, currentY + 40);
  doc.font('Helvetica').text(data.inspection.status || 'COMPLETED', 410, currentY + 40);

  currentY += 75;

  // 3. INSPECTION SUMMARY SECTION
  doc
    .fontSize(10)
    .fillColor(darkCharcoal)
    .font('Helvetica-Bold')
    .text('INSPECTION SUMMARY', 40, currentY);

  currentY += 16;

  const totalImages = data.imagesCount || 0;
  const totalDefects = data.defects ? data.defects.length : 0;
  const minor = data.severityCounts?.minor || 0;
  const moderate = data.severityCounts?.moderate || 0;
  const major = data.severityCounts?.major || 0;

  // Summary Cards Row
  const cardWidth = 98;
  const cardHeight = 42;
  const summaryMetrics = [
    { label: 'Images Evaluated', value: totalImages.toString() },
    { label: 'Defects Detected', value: totalDefects.toString() },
    { label: 'Minor Defects', value: minor.toString() },
    { label: 'Moderate Defects', value: moderate.toString() },
    { label: 'Major Defects', value: major.toString() }
  ];

  summaryMetrics.forEach((m, idx) => {
    const x = 40 + idx * (cardWidth + 6);
    doc.rect(x, currentY, cardWidth, cardHeight).fillAndStroke(tableBg, lightBorder);
    doc.fillColor(slateGray).fontSize(7.5).font('Helvetica').text(m.label, x + 6, currentY + 6, { width: cardWidth - 12 });
    doc.fillColor(darkCharcoal).fontSize(13).font('Helvetica-Bold').text(m.value, x + 6, currentY + 20);
  });

  currentY += cardHeight + 20;

  // 4. DETECTED DEFECTS & REFURBISHMENT COST
  doc
    .fontSize(10)
    .fillColor(darkCharcoal)
    .font('Helvetica-Bold')
    .text('DEFECT IDENTIFICATION & REPAIR ESTIMATION', 40, currentY);

  currentY += 16;

  // Table Header
  doc.rect(40, currentY, 515, 22).fillAndStroke(primaryRed, primaryRed);
  doc.fillColor('#FFFFFF').fontSize(8.5).font('Helvetica-Bold');
  doc.text('#', 48, currentY + 6);
  doc.text('Component', 70, currentY + 6);
  doc.text('Defect Type', 180, currentY + 6);
  doc.text('Severity', 270, currentY + 6);
  doc.text('Confidence', 340, currentY + 6);
  doc.text('Estimated Refurbishment (₹)', 410, currentY + 6);

  currentY += 22;

  if (!data.defects || data.defects.length === 0) {
    doc.rect(40, currentY, 515, 26).fillAndStroke(tableBg, lightBorder);
    doc.fillColor(slateGray).fontSize(8.5).font('Helvetica-Oblique')
      .text('No visible defects detected on inspected vehicle panels.', 48, currentY + 8);
    currentY += 26;
  } else {
    data.defects.forEach((d, idx) => {
      const isEven = idx % 2 === 0;
      doc.rect(40, currentY, 515, 24).fillAndStroke(isEven ? '#FFFFFF' : tableBg, lightBorder);

      doc.fillColor(darkCharcoal).fontSize(8.5).font('Helvetica');
      doc.text((idx + 1).toString(), 48, currentY + 7);
      doc.text(d.component || 'N/A', 70, currentY + 7);
      doc.text(d.defect_type || 'N/A', 180, currentY + 7);
      
      // Severity color hint
      const sev = d.severity || 'Minor';
      doc.font('Helvetica-Bold').text(sev, 270, currentY + 7);

      // Confidence
      const conf = d.confidence !== null && d.confidence !== undefined
        ? `${Math.round(Number(d.confidence) * 100)}%`
        : 'N/A';
      doc.font('Helvetica').text(conf, 340, currentY + 7);

      // Cost estimation
      let costStr = 'Cost rule unavailable';
      if (d.min_cost !== null && d.min_cost !== undefined && d.max_cost !== null && d.max_cost !== undefined) {
        costStr = `₹${Number(d.min_cost).toLocaleString('en-IN')} – ₹${Number(d.max_cost).toLocaleString('en-IN')}`;
      }
      doc.text(costStr, 410, currentY + 7);

      currentY += 24;

      // Page overflow check
      if (currentY > 700) {
        doc.addPage();
        currentY = 40;
      }
    });
  }

  currentY += 15;

  // 5. TOTAL ESTIMATED REFURBISHMENT COST
  doc.rect(40, currentY, 515, 45).fillAndStroke('#FEF2F2', '#FCA5A5');
  doc.fillColor(primaryRed).fontSize(9).font('Helvetica-Bold')
    .text('TOTAL ESTIMATED REFURBISHMENT COST RANGE', 52, currentY + 10);
  
  const minTot = Number(data.totalMinCost || 0).toLocaleString('en-IN');
  const maxTot = Number(data.totalMaxCost || 0).toLocaleString('en-IN');
  const totalRangeStr = totalDefects === 0 
    ? '₹0 (No Refurbishment Required)' 
    : `₹${minTot} – ₹${maxTot}`;

  doc.fillColor(darkCharcoal).fontSize(14).font('Helvetica-Bold')
    .text(totalRangeStr, 52, currentY + 24);

  currentY += 60;

  // 6. TRUEINSPECT VISUAL CONDITION ASSESSMENT
  doc
    .fontSize(10)
    .fillColor(darkCharcoal)
    .font('Helvetica-Bold')
    .text('TRUEINSPECT VISUAL CONDITION ASSESSMENT', 40, currentY);

  currentY += 16;

  doc.rect(40, currentY, 515, 48).fillAndStroke(tableBg, lightBorder);
  doc.fillColor(primaryRed).fontSize(11).font('Helvetica-Bold')
    .text(data.conditionAssessment?.grade || 'Good', 52, currentY + 10);
  doc.fillColor(darkCharcoal).fontSize(8.5).font('Helvetica')
    .text(data.conditionAssessment?.description || 'Vehicle evaluated in good visual condition.', 52, currentY + 26, { width: 490 });

  currentY += 62;

  // 7. RECOMMENDED ACTION WORKFLOW
  doc
    .fontSize(10)
    .fillColor(darkCharcoal)
    .font('Helvetica-Bold')
    .text('RECOMMENDED ACTION WORKFLOW', 40, currentY);

  currentY += 16;

  doc.rect(40, currentY, 515, 34).fillAndStroke(tableBg, lightBorder);
  doc.fillColor(darkCharcoal).fontSize(8.5).font('Helvetica-Bold')
    .text('1. Repair Identified Defects   →   2. Reinspection   →   3. Final Physical Verification', 52, currentY + 12);

  currentY += 46;

  // 8. DISCLAIMER & COMPLIANCE FOOTER
  doc
    .strokeColor(lightBorder)
    .lineWidth(1)
    .moveTo(40, 770)
    .lineTo(555, 770)
    .stroke();

  doc
    .fontSize(7)
    .fillColor(slateGray)
    .font('Helvetica')
    .text(
      'TRUEINSPECT is an independent computer vision inspection system. All refurbishment estimates are project reference values derived from the configurable MySQL cost master and do not constitute an official manufacturer quote or industry warranty.',
      40,
      778,
      { width: 515, align: 'center' }
    );

  doc.end();
}

module.exports = {
  generateInspectionPDF
};

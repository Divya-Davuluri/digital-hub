import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PDFReportData {
  title: string;
  clientName: string;
  period: string;
  metrics: {
    totalSpent: number;
    totalRevenue: number;
    totalClicks: number;
    totalImpressions: number;
    totalConversions: number;
    avgROAS: string | number;
  };
  campaigns: any[];
  channels: any[];
  branding?: {
    agencyName?: string;
    primaryColor?: string;
    logoUrl?: string;
  };
}

export const generatePDFReport = async (data: PDFReportData) => {
  const doc = new jsPDF() as any;
  const primaryColor = data.branding?.primaryColor || '#6366f1';
  const agencyName = data.branding?.agencyName || 'Digital Hub';

  // Header Background
  doc.setFillColor(primaryColor);
  doc.rect(0, 0, 210, 40, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(data.title, 15, 25);

  // Agency Name
  doc.setFontSize(10);
  doc.text(`Powered by ${agencyName}`, 160, 25);

  // Client & Date Info
  doc.setTextColor(51, 51, 51);
  doc.setFontSize(12);
  doc.text(`Client: ${data.clientName || 'Global View'}`, 15, 55);
  doc.text(`Period: Last ${data.period} Days`, 15, 62);
  doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 160, 55);

  // KPI Grid
  const kpis = [
    { label: 'Total Spent', value: `$${data.metrics.totalSpent.toLocaleString()}` },
    { label: 'Total Revenue', value: `$${data.metrics.totalRevenue.toLocaleString()}` },
    { label: 'Total Clicks', value: data.metrics.totalClicks.toLocaleString() },
    { label: 'Avg ROAS', value: `${data.metrics.avgROAS}x` }
  ];

  autoTable(doc, {
    startY: 70,
    head: [['Metric', 'Value']],
    body: kpis.map(k => [k.label, k.value]),
    theme: 'grid',
    headStyles: { fillColor: primaryColor as any, textColor: [255, 255, 255] as any },
    styles: { fontSize: 10, cellPadding: 5 }
  });

  // Channel Breakdown
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Channel Performance', 15, (doc as any).lastAutoTable.finalY + 15);

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 20,
    head: [['Channel', 'Spent', 'Conversions']],
    body: data.channels.map(c => [c.channel, `$${c.spent.toLocaleString()}`, c.conversions]),
    theme: 'striped',
    headStyles: { fillColor: [100, 100, 100] as any }
  });

  // Campaign Table
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Campaign Performance', 15, (doc as any).lastAutoTable.finalY + 15);

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 20,
    head: [['Campaign', 'Status', 'Budget', 'Spent', 'ROAS']],
    body: data.campaigns.map(c => [
      c.name, 
      c.status, 
      `$${c.budget?.toLocaleString() || 0}`, 
      `$${c.spent?.toLocaleString() || 0}`, 
      `${c.roas}x`
    ]),
    theme: 'striped',
    headStyles: { fillColor: [100, 100, 100] as any },
    styles: { fontSize: 8 }
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${pageCount} - Confidential Report - ${agencyName}`, 105, 285, { align: 'center' });
  }

  const filename = `analytics-report-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};

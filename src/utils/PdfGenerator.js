import { jsPDF } from 'jspdf';

const createPDFBlob = async (formData, user) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let cursorY = 20;

    // Corporate Colors
    const quoiaGreen = [184, 207, 62];
    const zentrackOrange = [253, 156, 16];
    const darkGray = [40, 40, 40];
    const lightGray = [150, 150, 150];

    // --- Institutional Header ---
    doc.setFillColor(...quoiaGreen);
    doc.rect(0, 0, pageWidth, 45, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18); // 1. Title
    doc.text('REPORTE DIARIO DE OBRA', margin, 20);

    doc.setFontSize(12); // 2. Subtitle
    doc.text('SUNSITE • SOLENIUM', margin, 28);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10); // 3. Category
    const categoryName = formData.categoria || 'Sin Categoría';
    doc.text(`Bitácora: ${categoryName.toUpperCase()}`, margin, 38);

    // Right-aligned Metadata
    doc.setFontSize(9);
    const metaX = pageWidth - margin;
    doc.text(`ID PROYECTO: ${formData.minigranjaId || 'N/A'}`, metaX, 20, { align: 'right' });
    doc.text(`FECHA: ${new Date().toLocaleDateString()}`, metaX, 28, { align: 'right' });
    doc.text(`EMITIDO POR: ${user.nombre.toUpperCase()}`, metaX, 36, { align: 'right' });

    cursorY = 60;

    // --- Section 1: Identification & Location ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...quoiaGreen);
    doc.text('1. IDENTIFICACIÓN Y GEOLOCALIZACIÓN', margin, cursorY);
    doc.setDrawColor(...quoiaGreen);
    doc.setLineWidth(0.5);
    doc.line(margin, cursorY + 2, pageWidth - margin, cursorY + 2);
    cursorY += 12;

    doc.setTextColor(...darkGray);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('ID Minigranja:', margin, cursorY);
    doc.setFont('helvetica', 'normal');
    doc.text(formData.minigranjaId || 'N/A', margin + 30, cursorY);

    doc.setFont('helvetica', 'bold');
    doc.text('Supervisor:', pageWidth / 2, cursorY);
    doc.setFont('helvetica', 'normal');
    doc.text(user.nombre, pageWidth / 2 + 25, cursorY);
    cursorY += 8;

    if (formData.gps_location) {
        doc.setFont('helvetica', 'bold');
        doc.text('GPS:', margin, cursorY);
        doc.setFont('helvetica', 'normal');
        doc.text(`${formData.gps_location.lat.toFixed(6)}, ${formData.gps_location.lng.toFixed(6)}`, margin + 30, cursorY);
        doc.setFontSize(8);
        doc.setTextColor(...lightGray);
        doc.text(`Verificado el ${new Date(formData.gps_location.timestamp).toLocaleString()}`, margin + 30, cursorY + 4);
        cursorY += 12;
    } else {
        cursorY += 4;
    }

    // --- Section 2: Resources ---
    cursorY += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...quoiaGreen);
    doc.text('2. RECURSOS Y GESTIÓN', margin, cursorY);
    doc.line(margin, cursorY + 2, pageWidth - margin, cursorY + 2);
    cursorY += 12;

    // Boxed Resources
    doc.setFillColor(248, 250, 252); // Very light slate
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, cursorY - 5, pageWidth - (margin * 2), 20, 3, 3, 'FD');

    doc.setTextColor(...darkGray);
    doc.setFontSize(9);
    doc.text('PERSONAL SOLENIUM', margin + 10, cursorY);
    doc.text('PERSONAL CONTRATISTA', pageWidth / 2 + 10, cursorY);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(formData.personal_solenium || '0', margin + 10, cursorY + 8);
    doc.text(formData.personal_contratista || '0', pageWidth / 2 + 10, cursorY + 8);
    cursorY += 22;

    // Materials Status
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    const matLabel = formData.materiales_llegaron ? '✓ INGRESO DE MATERIALES' : '○ SIN NOVEDAD EN MATERIALES';
    doc.setTextColor(formData.materiales_llegaron ? quoiaGreen[0] : 100, formData.materiales_llegaron ? quoiaGreen[1] : 100, formData.materiales_llegaron ? quoiaGreen[2] : 100);
    doc.text(matLabel, margin, cursorY);
    cursorY += 6;

    if (formData.materiales_llegaron && formData.materiales_detalle) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...darkGray);
        const matDetail = doc.splitTextToSize(formData.materiales_detalle, pageWidth - (margin * 2) - 10);
        doc.text(matDetail, margin + 5, cursorY);
        cursorY += (matDetail.length * 5) + 6;
    }
    cursorY += 5;

    // --- Section 3: Development Technical ---
    if (cursorY > 200) { doc.addPage(); cursorY = 25; }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...quoiaGreen);
    doc.text('3. DESARROLLO TÉCNICO Y AVANCES', margin, cursorY);
    doc.line(margin, cursorY + 2, pageWidth - margin, cursorY + 2);
    cursorY += 12;

    const sections = [
        { label: 'AVANCE DE OBRA', content: formData.avance_porcentaje, color: quoiaGreen, icon: '●' },
        { label: 'ACTIVIDADES EJECUTADAS', content: formData.actividades, icon: '»' },
        { label: 'RETOS Y SOLUCIONES', content: formData.retos, highlight: zentrackOrange, icon: '!' },
        { label: 'PENDIENTES Y PRÓXIMOS', content: formData.pendientes, icon: '○' },
        { label: 'NOVEDADES / CLIMA', content: formData.novedades, icon: '*' }
    ];

    sections.forEach(section => {
        if (!section.content) return;

        if (cursorY > 260) { doc.addPage(); cursorY = 25; }

        // Section label (Small bold)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...lightGray);
        doc.text(`${section.icon} ${section.label}`, margin, cursorY);
        cursorY += 5;

        // Visual Accent Bar
        doc.setFillColor(...(section.highlight || [230, 230, 230]));
        doc.rect(margin, cursorY - 1, 2, 8, 'F');

        // Body Content
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...darkGray);
        const splitText = doc.splitTextToSize(section.content, pageWidth - (margin * 2) - 5);
        doc.text(splitText, margin + 5, cursorY + 4);
        cursorY += (splitText.length * 5) + 12;
    });

    // --- Section 4: Photo Evidence ---
    if (formData.fotos && formData.fotos.length > 0) {
        doc.addPage();
        cursorY = 25;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(...quoiaGreen);
        doc.text('4. EVIDENCIA FOTOGRÁFICA', margin, cursorY);
        doc.line(margin, cursorY + 2, pageWidth - margin, cursorY + 2);
        cursorY += 15;

        const imgWidth = 80;
        const imgHeight = 60;
        let col = 0;

        for (const foto of formData.fotos) {
            if (cursorY + imgHeight > 270) {
                doc.addPage();
                cursorY = 25;
            }

            const xPos = margin + (col * (imgWidth + 10));
            doc.addImage(foto.base64, 'JPEG', xPos, cursorY, imgWidth, imgHeight);

            // Photo label
            doc.setFontSize(7);
            doc.setTextColor(...lightGray);
            doc.text(`Captura ${formData.fotos.indexOf(foto) + 1}`, xPos, cursorY + imgHeight + 4);

            col++;
            if (col > 1) {
                col = 0;
                cursorY += imgHeight + 15;
            }
        }
    }

    // --- Footer ---
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(...lightGray);
        doc.text('Solenium SunSite Utility - Documento Digital Oficial', pageWidth / 2, 288, { align: 'center' });
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, 288, { align: 'right' });
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const catShort = (formData.categoria || 'Reporte').substring(0, 8).replace(/\s+/g, '');
    const filename = `SUNSITE_${catShort}_${formData.minigranjaId || 'MG'}_${dateStr}.pdf`;

    return { doc, filename };
};

export const generateReportPDF = async (formData, user) => {
    const { doc, filename } = await createPDFBlob(formData, user);
    doc.save(filename);
    return filename;
};

export const generateReportFile = async (formData, user) => {
    const { doc, filename } = await createPDFBlob(formData, user);
    const blob = doc.output('blob');
    return new File([blob], filename, { type: 'application/pdf' });
};

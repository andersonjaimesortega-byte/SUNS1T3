import { jsPDF } from 'jspdf';

const createPDFBlob = async (formData, user) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let cursorY = 20;

    // Colors RGB approximations
    const quoiaGreen = [184, 207, 62];
    const zentrackOrange = [253, 156, 16];

    // Header Institutional
    doc.setFillColor(...quoiaGreen);
    doc.rect(0, 0, pageWidth, 50, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DIARIO DE OBRA', margin, 22);

    doc.setFontSize(14);
    doc.text('SUNSITE • SOLENIUM', margin, 32);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const categoryName = formData.categoria || 'Sin Categoría';
    doc.text(`Bitácora: ${categoryName.toUpperCase()}`, margin, 42);

    doc.setFontSize(9);
    doc.text(`ID: ${formData.minigranjaId}`, pageWidth - margin - 40, 22, { align: 'right' });
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, pageWidth - margin, 22, { align: 'right' });
    doc.text(`Emitido por: ${user.nombre}`, pageWidth - margin, 32, { align: 'right' });

    cursorY = 65;
    doc.setTextColor(40, 40, 40);

    // Section 1: Identification & Location
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...quoiaGreen);
    doc.text('1. IDENTIFICACIÓN Y GEOLOCALIZACIÓN', margin, cursorY);
    doc.line(margin, cursorY + 2, pageWidth - margin, cursorY + 2);
    cursorY += 10;

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`ID Minigranja: ${formData.minigranjaId}`, margin, cursorY);
    doc.text(`Supervisor en Campo: ${user.nombre}`, pageWidth / 2, cursorY);
    cursorY += 6;

    if (formData.gps_location) {
        doc.setFont('helvetica', 'bold');
        doc.text('Coordenadas de Verificación:', margin, cursorY);
        doc.setFont('helvetica', 'normal');
        doc.text(`Lat: ${formData.gps_location.lat.toFixed(6)} | Lng: ${formData.gps_location.lng.toFixed(6)}`, margin + 55, cursorY);
        doc.text(`Timestamp: ${new Date(formData.gps_location.timestamp).toLocaleString()}`, margin, cursorY + 6);
        cursorY += 14;
    }

    // Section 2: Resources
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...quoiaGreen);
    doc.text('2. RECURSOS Y PERSONAL SOLENIUM', margin, cursorY);
    doc.line(margin, cursorY + 2, pageWidth - margin, cursorY + 2);
    cursorY += 10;

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // Create a mini grid for personal
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, cursorY - 5, (pageWidth - margin * 2) / 2 - 5, 12, 'F');
    doc.rect(pageWidth / 2 + 2, cursorY - 5, (pageWidth - margin * 2) / 2 - 5, 12, 'F');

    doc.text(`Personal Solenium: ${formData.personal_solenium || '0'}`, margin + 5, cursorY + 2);
    doc.text(`Personal Contratista: ${formData.personal_contratista || '0'}`, pageWidth / 2 + 7, cursorY + 2);
    cursorY += 15;

    const matStatus = formData.materiales_llegaron ? 'INGRESÓ MATERIAL' : 'SIN NOVEDAD EN MATERIALES';
    doc.setFont('helvetica', 'bold');
    doc.text(matStatus, margin, cursorY);
    cursorY += 6;

    if (formData.materiales_llegaron && formData.materiales_detalle) {
        doc.setFont('helvetica', 'normal');
        const matDetail = doc.splitTextToSize(`Detalle de insumos: ${formData.materiales_detalle}`, pageWidth - (margin * 2));
        doc.text(matDetail, margin, cursorY);
        cursorY += (matDetail.length * 5) + 6;
    }
    cursorY += 10;

    // Section 3: Bitácora Block
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...quoiaGreen);
    doc.text('3. DESARROLLO TÉCNICO Y AVANCES', margin, cursorY);
    doc.line(margin, cursorY + 2, pageWidth - margin, cursorY + 2);
    cursorY += 12;

    const bitacoraSections = [
        { label: 'AVANCE PORCENTUAL', content: formData.avance_porcentaje, color: quoiaGreen },
        { label: 'ACTIVIDADES EJECUTADAS', content: formData.actividades },
        { label: 'RETOS Y SOLUCIONES', content: formData.retos, highlight: zentrackOrange },
        { label: 'PENDIENTES', content: formData.pendientes },
        { label: 'NOVEDADES Y CLIMA', content: formData.novedades }
    ];

    bitacoraSections.forEach(section => {
        if (!section.content) return;

        if (cursorY > 250) {
            doc.addPage();
            cursorY = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.text(section.label, margin, cursorY);
        cursorY += 5;

        if (section.highlight) {
            doc.setFillColor(...section.highlight);
            doc.rect(margin - 2, cursorY - 3, 2, 8, 'F'); // Little indicator bar
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(30, 30, 30);
        const splitText = doc.splitTextToSize(section.content, pageWidth - (margin * 2));
        doc.text(splitText, margin, cursorY);
        cursorY += (splitText.length * 5) + 12;
    });

    if (formData.observaciones_extra) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(150, 150, 150);
        doc.text('OBSERVACIONES ADICIONALES', margin, cursorY);
        cursorY += 5;
        doc.setFont('helvetica', 'normal');
        const extraText = doc.splitTextToSize(formData.observaciones_extra, pageWidth - (margin * 2));
        doc.text(extraText, margin, cursorY);
        cursorY += (extraText.length * 5) + 10;
    }

    // Photos
    if (formData.fotos && formData.fotos.length > 0) {
        doc.addPage();
        cursorY = 25;

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...quoiaGreen);
        doc.text('4. EVIDENCIA FOTOGRÁFICA', margin, cursorY);
        doc.line(margin, cursorY + 3, pageWidth - margin, cursorY + 3);
        cursorY += 20;

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

            col++;
            if (col > 1) {
                col = 0;
                cursorY += imgHeight + 15;
            }
        }
    }

    // Footer with page numbers
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(180, 180, 180);
        doc.text('Este documento es propiedad de Solenium - SUNSITE PROJECT', pageWidth / 2, 285, { align: 'center' });
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, 285, { align: 'right' });
    }

    // Filename logic: Categoria_MG_Fecha.pdf
    const dateStr = new Date().toISOString().split('T')[0];
    const catShort = (formData.categoria || 'Bitacora').substring(0, 10).replace(/\s+/g, '');
    const filename = `${catShort}_${formData.minigranjaId}_${dateStr}.pdf`;

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

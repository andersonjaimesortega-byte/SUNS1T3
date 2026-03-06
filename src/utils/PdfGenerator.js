import { jsPDF } from 'jspdf';

const createPDFBlob = async (formData, user) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let cursorY = 20;

    // Header
    doc.setFillColor(16, 185, 129); // Emerald-500
    doc.rect(0, 0, pageWidth, 45, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('BITÁCORA DIARIA DE OBRA', margin, 20);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const categoryName = formData.categoria || 'Sin Categoría';
    doc.text(`Categoría: ${categoryName.toUpperCase()}`, margin, 32);

    doc.setFontSize(9);
    doc.text(`ID Minigranja: ${formData.minigranjaId}`, margin, 40);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, pageWidth - margin - 40, 40);

    cursorY = 55;
    doc.setTextColor(40, 40, 40);

    // Section 1: Identification & Location
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('1. IDENTIFICACIÓN Y UBICACIÓN', margin, cursorY);
    cursorY += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Supervisor: ${user.nombre} (${user.id})`, margin, cursorY);
    cursorY += 6;

    if (formData.gps_location) {
        doc.text(`GPS: [Lat: ${formData.gps_location.lat.toFixed(6)}, Lng: ${formData.gps_location.lng.toFixed(6)}]`, margin, cursorY);
        doc.text(`Hora GPS: ${new Date(formData.gps_location.timestamp).toLocaleTimeString()}`, pageWidth / 2, cursorY);
        cursorY += 10;
    }

    // Section 2: Resources
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('2. RECURSOS (PERSONAL Y MATERIALES)', margin, cursorY);
    cursorY += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Personal Solenium: ${formData.personal_solenium || '0'}`, margin, cursorY);
    doc.text(`Personal Contratista: ${formData.personal_contratista || '0'}`, pageWidth / 2, cursorY);
    cursorY += 8;

    const matStatus = formData.materiales_llegaron ? 'SÍ LLEGÓ' : 'NO LLEGÓ';
    doc.setFont('helvetica', 'bold');
    doc.text(`Ingreso de Material: ${matStatus}`, margin, cursorY);
    cursorY += 6;

    if (formData.materiales_llegaron && formData.materiales_detalle) {
        doc.setFont('helvetica', 'normal');
        const matDetail = doc.splitTextToSize(`Detalle: ${formData.materiales_detalle}`, pageWidth - (margin * 2));
        doc.text(matDetail, margin, cursorY);
        cursorY += (matDetail.length * 5) + 6;
    }
    cursorY += 6;

    // Section 3: Work Bitácora (Smart Block)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, cursorY - 5, pageWidth - (margin * 2), 8, 'F');
    doc.text('3. DESARROLLO DE ACTIVIDADES', margin + 2, cursorY + 1);
    cursorY += 12;

    const bitacoraSections = [
        { label: 'AVANCE DEL DÍA', content: formData.avance_porcentaje, color: [16, 185, 129] },
        { label: 'ACTIVIDADES EJECUTADAS', content: formData.actividades },
        { label: 'RETOS Y SOLUCIONES', content: formData.retos },
        { label: 'PENDIENTES', content: formData.pendientes },
        { label: 'NOVEDADES Y CLIMA', content: formData.novedades },
        { label: 'OBSERVACIONES EXTRA', content: formData.observaciones_extra }
    ];

    bitacoraSections.forEach(section => {
        if (!section.content) return;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(section.label, margin, cursorY);
        cursorY += 5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(40, 40, 40);
        const splitText = doc.splitTextToSize(section.content, pageWidth - (margin * 2));
        doc.text(splitText, margin, cursorY);
        cursorY += (splitText.length * 5) + 10;

        if (cursorY > 260) {
            doc.addPage();
            cursorY = 20;
        }
    });

    // Photos
    if (formData.fotos && formData.fotos.length > 0) {
        doc.addPage();
        cursorY = 20;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('4. EVIDENCIA FOTOGRÁFICA', margin, cursorY);
        cursorY += 15;

        const imgWidth = 80;
        const imgHeight = 60;
        let col = 0;

        for (const foto of formData.fotos) {
            if (cursorY + imgHeight > 270) {
                doc.addPage();
                cursorY = 20;
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

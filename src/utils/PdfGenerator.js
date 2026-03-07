import { jsPDF } from 'jspdf';

const createPDFBlob = async (formData, user) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let cursorY = 20;

    // Corporate Colors - Solenium Scheme
    const brandGreen = [59, 179, 57]; // #3BB339
    const brandBlue = [29, 153, 204];  // #1D99CC
    const quoiaGreen = brandGreen;
    const zentrackOrange = brandBlue; // Using brand blue for highlights
    const darkGray = [30, 41, 59];    // Slate 800
    const lightGray = [100, 116, 139]; // Slate 500

    // --- Institutional Header ---
    doc.setFillColor(...brandBlue);
    doc.rect(0, 0, pageWidth, 45, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');

    // Main Title Logic
    doc.setFontSize(16);
    const titleText = formData.isConsolidated
        ? 'REPORTE CONSOLIDADO DE ACTIVIDADES'
        : 'REPORTE DIARIO DE ACTIVIDADES';
    doc.text(titleText, margin, 20);

    doc.setFontSize(10);
    doc.text('BITÁCORA TÉCNICA • SOLENIUM', margin, 28);

    doc.setFont('helvetica', 'normal');
    if (formData.isConsolidated) {
        doc.setFontSize(9);
        doc.text(`RESUMEN DE PERÍODO: ${formData.periodRange || 'N/D'}`, margin, 38);
    } else {
        doc.setFontSize(10);
        const categoryName = formData.categoria || 'Sin Categoría';
        doc.text(`CATEGORÍA: ${categoryName.toUpperCase()}`, margin, 38);
    }

    // Right-aligned Metadata (Clean Header)
    doc.setFontSize(8);
    const metaX = pageWidth - margin;
    if (!formData.isConsolidated) {
        doc.text(`ID PROYECTO: ${formData.minigranjaId || 'N/A'}`, metaX, 20, { align: 'right' });
        doc.text(`FECHA: ${formData.date || new Date().toLocaleDateString()}`, metaX, 28, { align: 'right' });
        doc.text(`AUTOR: ${user.nombre.toUpperCase()}`, metaX, 36, { align: 'right' });
    } else {
        doc.text(`AUTOR: ${user.nombre.toUpperCase()}`, metaX, 36, { align: 'right' });
        // Minimal metadata for consolidated
    }

    cursorY = 65; // Increased padding from header

    // --- Helper for Engineering Layout ---
    const checkPageBreak = (neededHeight) => {
        if (cursorY + neededHeight > 280) {
            doc.addPage();
            cursorY = 25;
            return true;
        }
        return false;
    };

    // --- BLOCK 1: IDENTIFICACIÓN Y SEGURIDAD ---
    checkPageBreak(35);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...brandBlue);
    doc.text('IDENTIFICACIÓN Y SEGURIDAD', margin, cursorY);
    doc.setDrawColor(...brandBlue);
    doc.setLineWidth(0.5);
    doc.line(margin, cursorY + 2, pageWidth - margin, cursorY + 2);
    cursorY += 12;

    doc.setTextColor(...darkGray);
    doc.setFontSize(9);

    // Label Row 1: Site/Minigranja
    doc.setFont('helvetica', 'bold');
    const idLabel = formData.isConsolidated ? 'RESUMEN DE SITIOS' : 'ID MINIGRANJA';
    doc.text(`${idLabel}:`, margin, cursorY);
    doc.setFont('helvetica', 'normal');
    const siteText = formData.minigranjaId || 'N/A';
    const splitSiteText = doc.splitTextToSize(siteText, 140);
    doc.text(splitSiteText, margin + 35, cursorY);
    cursorY += (splitSiteText.length * 5) + 2;

    // Label Row 2: Semaphore (Separate line to avoid overlap)
    doc.setFont('helvetica', 'bold');
    doc.text('ESTADO DE SEGURIDAD:', margin, cursorY);
    const semaphoreValue = formData.isConsolidated ? 'ESTABLE' : (formData.materiales_llegaron ? 'ÓPTIMO' : 'ESTÁNDAR');
    doc.setTextColor(...(formData.materiales_llegaron ? brandGreen : brandBlue));
    doc.text(semaphoreValue, margin + 45, cursorY);

    // Label Row 3: Date
    cursorY += 7;
    doc.setTextColor(...darkGray);
    doc.setFont('helvetica', 'bold');
    doc.text('FECHA DE REPORTE:', margin, cursorY);
    doc.setFont('helvetica', 'normal');
    doc.text(formData.date || new Date().toLocaleDateString(), margin + 45, cursorY);
    cursorY += 12;

    // --- BLOCK 2: UBICACIÓN GPS ---
    if (formData.gps_location) {
        checkPageBreak(25);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(...brandBlue);
        doc.text('UBICACIÓN GPS', margin, cursorY);
        doc.line(margin, cursorY + 2, pageWidth - margin, cursorY + 2);
        cursorY += 12;

        doc.setTextColor(...darkGray);
        doc.setFontSize(9);
        doc.text('COORDENADAS:', margin, cursorY);
        doc.setFont('helvetica', 'normal');
        const coords = `${formData.gps_location.lat.toFixed(6)}, ${formData.gps_location.lng.toFixed(6)}`;
        doc.text(coords, margin + 35, cursorY);

        // Link to Google Maps
        doc.setTextColor(...brandBlue);
        doc.setFontSize(8);
        const mapsUrl = `https://www.google.com/maps?q=${formData.gps_location.lat},${formData.gps_location.lng}`;
        doc.textWithLink('[ VER EN GOOGLE MAPS ]', margin + 90, cursorY, { url: mapsUrl });

        cursorY += 8;
        doc.setTextColor(...lightGray);
        doc.text(`Timestamp: ${new Date(formData.gps_location.timestamp).toLocaleString()}`, margin + 35, cursorY);
        cursorY += 15;
    }

    // --- BLOCK 3: DESARROLLO TÉCNICO ---
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...brandBlue);
    doc.text('DESARROLLO TÉCNICO', margin, cursorY);
    doc.line(margin, cursorY + 2, pageWidth - margin, cursorY + 2);
    cursorY += 12;

    const sections = [
        { label: 'AVANCE DE OBRA', content: formData.avance_porcentaje, icon: '○' },
        {
            label: 'ACTIVIDADES EJECUTADAS',
            content: formData.isConsolidated ? formData.actividades : (formData.actividades ? `[${formData.date || new Date().toLocaleDateString()}] ${formData.actividades}` : null),
            icon: '○'
        },
        {
            label: 'RETOS Y SOLUCIONES',
            content: formData.isConsolidated ? formData.retos : (formData.retos ? `[${formData.date || new Date().toLocaleDateString()}] ${formData.retos}` : null),
            highlight: [241, 245, 249],
            icon: '○'
        },
        {
            label: 'NOVEDADES / CLIMA',
            content: formData.isConsolidated ? formData.novedades : (formData.novedades ? `[${formData.date || new Date().toLocaleDateString()}] ${formData.novedades}` : null),
            icon: '○'
        },
        {
            label: 'PENDIENTES Y PRÓXIMOS',
            content: formData.isConsolidated ? formData.pendientes : (formData.pendientes ? `[${formData.date || new Date().toLocaleDateString()}] ${formData.pendientes}` : null),
            icon: '○'
        }
    ];

    sections.forEach(section => {
        if (!section.content) return;

        const splitText = doc.splitTextToSize(section.content, pageWidth - (margin * 2) - 10);
        const sectionHeight = (splitText.length * 5) + 15;

        checkPageBreak(sectionHeight);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...lightGray);
        doc.text(section.label, margin, cursorY);
        cursorY += 5;

        if (section.highlight) {
            doc.setFillColor(...section.highlight);
            doc.rect(margin, cursorY - 1, pageWidth - (margin * 2), (splitText.length * 5) + 6, 'F');
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...darkGray);
        doc.text(splitText, margin + 5, cursorY + 4);
        cursorY += (splitText.length * 5) + 12;
    });

    // --- BLOCK 4: RECURSOS Y MATERIALES ---
    if (!formData.isConsolidated || (formData.personal_solenium || formData.personal_contratista)) {
        checkPageBreak(50);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(...brandBlue);
        doc.text('RECURSOS Y MATERIALES', margin, cursorY);
        doc.line(margin, cursorY + 2, pageWidth - margin, cursorY + 2);
        cursorY += 12;

        // Table Background (rgba(29, 153, 204, 0.1) -> [229, 242, 248])
        doc.setFillColor(229, 242, 248);
        doc.rect(margin, cursorY - 5, pageWidth - (margin * 2), 20, 'F');
        doc.setDrawColor(...brandBlue);
        doc.setLineWidth(0.1);
        doc.rect(margin, cursorY - 5, pageWidth - (margin * 2), 20, 'D');

        doc.setTextColor(...darkGray);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('PERSONAL SOLENIUM', margin + 10, cursorY);
        doc.text('PERSONAL CONTRATISTA', pageWidth / 2 + 10, cursorY);

        doc.setFontSize(11);
        doc.text(formData.personal_solenium || '0', margin + 10, cursorY + 8);
        doc.text(formData.personal_contratista || '0', pageWidth / 2 + 10, cursorY + 8);
        cursorY += 22;

        // Materials
        if (formData.materiales_detalle || formData.materiales_llegaron) {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...brandBlue);
            doc.text(formData.materiales_llegaron ? 'DETALLE DE MATERIALES RECIBIDOS:' : 'ESTADO DE MATERIALES:', margin, cursorY);
            cursorY += 6;

            if (formData.materiales_detalle) {
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(...darkGray);
                const matDetail = doc.splitTextToSize(formData.materiales_detalle, pageWidth - (margin * 2) - 5);
                checkPageBreak(matDetail.length * 5 + 10);
                doc.text(matDetail, margin + 2, cursorY);
                cursorY += (matDetail.length * 5) + 10;
            } else {
                doc.setFont('helvetica', 'italic');
                doc.text('Sin novedades reportadas.', margin + 2, cursorY);
                cursorY += 10;
            }
        }
    }

    // --- BLOCK 5: EVIDENCIA FOTOGRÁFICA ---
    const hasPhotos = (formData.fotos && formData.fotos.length > 0) || (formData.fotosGrouped && formData.fotosGrouped.length > 0);

    if (hasPhotos) {
        checkPageBreak(30);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(...brandBlue);
        doc.text('EVIDENCIA FOTOGRÁFICA', margin, cursorY);
        doc.line(margin, cursorY + 2, pageWidth - margin, cursorY + 2);
        cursorY += 15;

        const photoGroups = formData.fotosGrouped || [
            { minigranja: formData.minigranjaId || 'SITIO GENERAL', fotos: formData.fotos }
        ];

        for (const group of photoGroups) {
            if (!group.fotos || group.fotos.length === 0) continue;

            // KEEP WITH NEXT: Site Header + First row of photos
            const headerHeight = 10;
            const rowHeight = 75; // Image (60) + Spacing (15)
            checkPageBreak(headerHeight + rowHeight);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(...darkGray);
            doc.text(`SITIO: ${group.minigranja.toUpperCase()}`, margin, cursorY);
            doc.setDrawColor(...brandBlue);
            doc.setLineWidth(0.1);
            doc.line(margin, cursorY + 1, margin + 40, cursorY + 1);
            cursorY += 10;

            const imgWidth = 80;
            const imgHeight = 60;
            let col = 0;

            for (let i = 0; i < group.fotos.length; i++) {
                const foto = group.fotos[i];

                // If it's a new row, check for space
                if (col === 0 && i > 0) {
                    checkPageBreak(rowHeight);
                }

                const xPos = margin + (col * (imgWidth + 10));
                try {
                    doc.addImage(foto.base64, 'JPEG', xPos, cursorY, imgWidth, imgHeight);

                    // Tight Caption
                    doc.setFontSize(7);
                    doc.setTextColor(...lightGray);
                    doc.text(`REGISTRO ${i + 1} • ${group.minigranja}`, xPos, cursorY + imgHeight + 4);
                } catch (e) {
                    console.error("Error drawing image:", e);
                }

                col++;
                if (col > 1) { col = 0; cursorY += rowHeight; }
            }
            if (col !== 0) cursorY += rowHeight;
            cursorY += 5;
        }
    }

    // --- Footer ---
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(...lightGray);
        doc.text('Solenium SunSite • Reporte Técnico Generación Fotovoltáica', pageWidth / 2, 288, { align: 'center' });
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, 288, { align: 'right' });
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const prefix = formData.isConsolidated ? 'CONSOLIDADO' : 'DIARIO';
    const siteRef = formData.minigranjaId || 'SUNSITE';
    const filename = `SOLENIUM_${prefix}_${siteRef.substring(0, 15).replace(/\s+/g, '_')}_${dateStr}.pdf`;

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

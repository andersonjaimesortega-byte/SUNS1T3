import { jsPDF } from 'jspdf';

export const generateReportPDF = async (formData, user) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let cursorY = 20;

    // Header
    doc.setFillColor(16, 185, 129); // Emerald-500
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DIARIO DE CAMPO', margin, 25);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`ID Minigranja: ${formData.minigranjaId}`, margin, 35);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, pageWidth - margin - 40, 35);

    cursorY = 55;
    doc.setTextColor(40, 40, 40);

    // User Info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Información del Personal y Ubicación', margin, cursorY);
    cursorY += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Nombre: ${user.nombre}`, margin, cursorY);
    doc.text(`ID Usuario: ${user.id}`, pageWidth / 2, cursorY);
    cursorY += 7;

    if (formData.gps_location) {
        doc.text(`Coordenadas GPS: ${formData.gps_location.lat.toFixed(6)}, ${formData.gps_location.lng.toFixed(6)}`, margin, cursorY);
        doc.text(`Sincronización GPS: ${new Date(formData.gps_location.timestamp).toLocaleTimeString()}`, pageWidth / 2, cursorY);
        cursorY += 7;
    }

    doc.text(`Personal en Obra: ${formData.cantidad_personal || 'No especificado'}`, margin, cursorY);
    cursorY += 15;

    // Form Data
    const sections = [
        { title: 'Materiales Recibidos', content: formData.materiales_recibidos },
        { title: 'Avances del Día', content: formData.avances },
        { title: 'Actividades Realizadas', content: formData.actividades },
        { title: 'Retos / Problemas', content: formData.retos },
        { title: 'Pendientes', content: formData.pendientes },
        { title: 'Observaciones Extra', content: formData.observaciones_extra }
    ];

    sections.forEach(section => {
        if (!section.content) return; // Skip empty optional sections

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(section.title, margin, cursorY);
        cursorY += 7;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const splitText = doc.splitTextToSize(section.content, pageWidth - (margin * 2));
        doc.text(splitText, margin, cursorY);
        cursorY += (splitText.length * 5) + 12;

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
        doc.text('Evidencia Fotográfica', margin, cursorY);
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

    // Filename logic: IDMinigranja_Fecha_IDUsuario.pdf
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `${formData.minigranjaId}_${dateStr}_${user.id}.pdf`;

    doc.save(filename);
    return filename;
};

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
    doc.text('Información del Personal', margin, cursorY);
    cursorY += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Nombre: ${user.nombre}`, margin, cursorY);
    doc.text(`ID Usuario: ${user.id}`, pageWidth / 2, cursorY);
    cursorY += 15;

    // Form Data
    const sections = [
        { title: 'Avances del Día', content: formData.avances },
        { title: 'Actividades Realizadas', content: formData.actividades },
        { title: 'Retos / Problemas', content: formData.retos },
        { title: 'Pendientes', content: formData.pendientes }
    ];

    sections.forEach(section => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(section.title, margin, cursorY);
        cursorY += 7;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const splitText = doc.splitTextToSize(section.content || 'Sin información registrada.', pageWidth - (margin * 2));
        doc.text(splitText, margin, cursorY);
        cursorY += (splitText.length * 5) + 10;

        if (cursorY > 250) {
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

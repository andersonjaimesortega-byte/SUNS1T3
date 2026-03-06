import { generateReportPDF } from './PdfGenerator';

export const generateConsolidatedReport = async (selectedReports, user) => {
    if (!selectedReports || selectedReports.length === 0) return null;

    // 1. Calculate average progress
    const totalAvance = selectedReports.reduce((acc, r) => {
        const num = parseInt(r.data.avance_porcentaje.replace(/[^0-9]/g, '')) || 0;
        return acc + num;
    }, 0);
    const avgAvance = `${Math.round(totalAvance / selectedReports.length)}%`;

    // 2. Concatenate textual data with sources
    const consolidateText = (field) => {
        return selectedReports
            .filter(r => r.data[field])
            .map(r => `• [${r.minigranja}] ${r.data[field]}`)
            .join('\n');
    };

    const combinedData = {
        minigranjaId: 'CONSOLIDADO MULTI-SITIO',
        categoria: 'RESUMEN EJECUTIVO',
        personal_solenium: selectedReports.reduce((acc, r) => acc + (parseInt(r.data.personal_solenium) || 0), 0),
        personal_contratista: selectedReports.reduce((acc, r) => acc + (parseInt(r.data.personal_contratista) || 0), 0),
        avance_porcentaje: avgAvance,
        actividades: consolidateText('actividades'),
        retos: consolidateText('retos'),
        pendientes: consolidateText('pendientes'),
        novedades: consolidateText('novedades'),
        materiales_llegaron: selectedReports.some(r => r.data.materiales_llegaron),
        materiales_detalle: consolidateText('materiales_detalle'),
        fotos: selectedReports.flatMap(r => r.data.fotos).slice(0, 8), // Limit to 8 highlight photos
        gps_location: {
            lat: selectedReports[0].data.gps_location.lat,
            lng: selectedReports[0].data.gps_location.lng,
            timestamp: new Date().toISOString()
        }
    };

    return await generateReportPDF(combinedData, user);
};

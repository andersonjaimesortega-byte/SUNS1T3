import { generateReportPDF } from './PdfGenerator';

export const prepareConsolidatedData = (selectedReports) => {
    if (!selectedReports || selectedReports.length === 0) return null;

    // 1. Progression Logic (Same site = Sum by category | Different sites = Join by ID)
    const uniqueMinigranjas = [...new Set(selectedReports.map(r => (r.minigranja || 'S/N').toUpperCase()))];
    const isSameSite = uniqueMinigranjas.length === 1;
    const displayMinigranjaId = isSameSite
        ? uniqueMinigranjas[0]
        : `CONSOLIDADO (${uniqueMinigranjas.join(', ')})`;

    let avgAvance = "";
    if (isSameSite) {
        const categoryTotals = {};
        selectedReports.forEach(r => {
            const cat = (r.data?.categoria || 'Sin Categoría').toUpperCase();
            const val = String(r.data?.avance_porcentaje || '0');
            const num = parseInt(val.replace(/[^0-9]/g, '')) || 0;
            if (!categoryTotals[cat]) categoryTotals[cat] = 0;
            categoryTotals[cat] += num;
        });
        avgAvance = Object.entries(categoryTotals)
            .map(([cat, total]) => `${cat}: ${total}%`)
            .join(' | ');
    } else {
        avgAvance = selectedReports
            .map(r => `${r.minigranja || 'S/N'}: ${r.data?.avance_porcentaje || '0%'}`)
            .join(' | ');
    }

    // 2. Concatenate textual data with sources
    const consolidateText = (field) => {
        return selectedReports
            .filter(r => r.data && r.data[field])
            .map(r => `• [${r.minigranja || 'S/N'}] [${r.date || 'S/F'}] ${r.data[field]}`)
            .join('\n');
    };

    const firstGPS = selectedReports.find(r => r.data?.gps_location)?.data.gps_location;

    return {
        minigranjaId: displayMinigranjaId,
        categoria: 'RESUMEN EJECUTIVO',
        isConsolidated: true, // Flag to skip resources section in PDF
        personal_solenium: selectedReports.reduce((acc, r) => acc + (parseInt(r.data?.personal_solenium) || 0), 0).toString(),
        personal_contratista: selectedReports.reduce((acc, r) => acc + (parseInt(r.data?.personal_contratista) || 0), 0).toString(),
        avance_porcentaje: avgAvance,
        actividades: consolidateText('actividades'),
        retos: consolidateText('retos'),
        pendientes: consolidateText('pendientes'),
        novedades: consolidateText('novedades'),
        materiales_llegaron: selectedReports.some(r => r.data?.materiales_llegaron),
        materiales_detalle: consolidateText('materiales_detalle'),
        fotosGrouped: selectedReports.map(r => ({
            minigranja: r.minigranja || 'S/N',
            fotos: (r.data?.fotos || []).filter(f => f && f.base64)
        })).filter(g => g.fotos.length > 0),
        gps_location: firstGPS ? {
            lat: Number(firstGPS.lat),
            lng: Number(firstGPS.lng),
            timestamp: new Date().toISOString()
        } : null
    };
};

export const generateConsolidatedReport = async (selectedReports, user) => {
    try {
        const combinedData = prepareConsolidatedData(selectedReports);
        if (!combinedData) return null;

        const safeUser = {
            nombre: user?.nombre || 'Usuario SunSite',
            rol: user?.rol || 'Personal'
        };

        return await generateReportPDF(combinedData, safeUser);
    } catch (error) {
        console.error('Error in consolidation engine:', error);
        throw new Error(`Fallo en motor de consolidación: ${error.message}`);
    }
};

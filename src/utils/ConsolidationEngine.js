import { generateReportPDF } from './PdfGenerator';

export const prepareConsolidatedData = (selectedReports) => {
    if (!selectedReports || selectedReports.length === 0) return null;

    // 1. Progression Logic (Same site = Sum by category | Different sites = Join by ID)
    const uniqueMinigranjas = [...new Set(selectedReports.map(r => (r.minigranja || 'S/N').trim().toUpperCase()))];
    const isSameSite = uniqueMinigranjas.length === 1;
    const displayMinigranjaId = isSameSite
        ? uniqueMinigranjas[0]
        : `CONSOLIDADO (${uniqueMinigranjas.join(', ')})`;

    let avgAvance = "";
    if (isSameSite) {
        const categoryTotals = {};
        selectedReports.forEach(r => {
            const cat = (r.data?.categoria || 'Sin Categoría').trim().toUpperCase();
            const val = String(r.data?.avance_porcentaje || '0');
            const num = parseInt(val.replace(/[^0-9]/g, '')) || 0;
            if (!categoryTotals[cat]) categoryTotals[cat] = 0;
            categoryTotals[cat] += num;
        });
        avgAvance = Object.entries(categoryTotals)
            .map(([cat, total]) => `${cat}: ${total}%`)
            .join(' | ');
    } else {
        // Different Sites: Group and Sum by site name
        const siteTotals = {};
        selectedReports.forEach(r => {
            const site = (r.minigranja || 'S/N').trim().toUpperCase();
            const val = String(r.data?.avance_porcentaje || '0');
            const num = parseInt(val.replace(/[^0-9]/g, '')) || 0;

            if (!siteTotals[site]) siteTotals[site] = 0;
            siteTotals[site] += num;
        });

        avgAvance = Object.entries(siteTotals)
            .map(([site, total]) => `${site}: ${total}%`)
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

    // 3. Date Range and Summary Metrics
    const sortedDates = selectedReports
        .map(r => r.date ? new Date(r.date.split('/').reverse().join('-')) : new Date())
        .sort((a, b) => a - b);

    const startDate = sortedDates[0]?.toLocaleDateString() || 'N/D';
    const endDate = sortedDates[sortedDates.length - 1]?.toLocaleDateString() || 'N/D';
    const periodRange = startDate === endDate ? startDate : `${startDate} - ${endDate}`;

    return {
        minigranjaId: displayMinigranjaId,
        periodRange: periodRange,
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
        fotosGrouped: Object.entries(selectedReports.reduce((acc, r) => {
            const site = (r.minigranja || 'S/N').trim().toUpperCase(); // Standardize site key
            if (!acc[site]) acc[site] = [];
            const validFotos = (r.data?.fotos || []).filter(f => f && f.base64);
            acc[site].push(...validFotos);
            return acc;
        }, {})).map(([site, fotos]) => ({
            minigranja: site,
            fotos: fotos
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

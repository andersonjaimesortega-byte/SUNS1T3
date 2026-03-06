import { generateReportPDF } from './PdfGenerator';

export const generateConsolidatedReport = async (selectedReports, user) => {
    if (!selectedReports || selectedReports.length === 0) return null;

    try {
        // 1. Calculate average progress with strict type checking
        const totalAvance = selectedReports.reduce((acc, r) => {
            const val = String(r.data?.avance_porcentaje || '0');
            const num = parseInt(val.replace(/[^0-9]/g, '')) || 0;
            return acc + num;
        }, 0);
        const avgAvance = `${Math.round(totalAvance / selectedReports.length)}%`;

        // 2. Concatenate textual data with sources
        const consolidateText = (field) => {
            return selectedReports
                .filter(r => r.data && r.data[field])
                .map(r => `• [${r.minigranja || 'S/N'}] ${r.data[field]}`)
                .join('\n');
        };

        const firstGPS = selectedReports.find(r => r.data?.gps_location)?.data.gps_location;

        const combinedData = {
            minigranjaId: 'CONSOLIDADO',
            categoria: 'RESUMEN EJECUTIVO',
            personal_solenium: selectedReports.reduce((acc, r) => acc + (parseInt(r.data?.personal_solenium) || 0), 0).toString(),
            personal_contratista: selectedReports.reduce((acc, r) => acc + (parseInt(r.data?.personal_contratista) || 0), 0).toString(),
            avance_porcentaje: avgAvance,
            actividades: consolidateText('actividades'),
            retos: consolidateText('retos'),
            pendientes: consolidateText('pendientes'),
            novedades: consolidateText('novedades'),
            materiales_llegaron: selectedReports.some(r => r.data?.materiales_llegaron),
            materiales_detalle: consolidateText('materiales_detalle'),
            fotos: selectedReports
                .flatMap(r => r.data?.fotos || [])
                .filter(f => f && f.base64)
                .slice(0, 10),
            gps_location: firstGPS ? {
                lat: Number(firstGPS.lat),
                lng: Number(firstGPS.lng),
                timestamp: new Date().toISOString()
            } : null
        };

        // Ensure user object is valid for PDF generator
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

/**
 * AiProcessor.js
 * Simulated LLM processing for construction reports.
 */

export const optimizeText = async (text, fieldType = 'general') => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (!text || text.length < 5) return text;

    let processed = text.trim();

    // 1. Technical Vocabulary Mapping (Aggressive Professionalization)
    const techMap = {
        'vimos': 'se constató',
        'vimos que': 'se identificó que',
        'pusimos': 'se procedió con la instalación de',
        'puso': 'se instaló',
        'terminamos': 'se concluyó satisfactoriamente',
        'hay': 'se registra presencia de',
        'tenemos': 'se cuenta con',
        'un problema': 'una desviación técnica',
        'problemas': 'limitaciones operativas',
        'lluvia': 'precipitaciones pluviales',
        'llueve': 'presencia de lluvias',
        'barro': 'saturación del terreno',
        'rapido': 'con celeridad técnica',
        'despacio': 'ritmo de avance controlado',
        'gente': 'personal operativo',
        'obreros': 'cuadrilla de trabajo',
        'materiales': 'insumos y suministros técnicos',
        'herramientas': 'equipo y utillaje especializado',
        'dañado': 'con compromiso estructural',
        'roto': 'con pérdida de integridad',
        'falta': 'insuficiencia de',
        'necesitamos': 'se requiere el suministro de',
        'todo bien': 'bajo parámetros de normalidad',
        'listo': 'completado al 100%',
        'hicimos': 'se ejecutó la labor de',
        'hace falta': 'se evidencia carencia de'
    };

    // Apply vocabulary mapping
    Object.keys(techMap).forEach(key => {
        const regex = new RegExp(`\\b${key}\\b`, 'gi');
        processed = processed.replace(regex, techMap[key]);
    });

    // 2. Sentence Normalization
    processed = processed.charAt(0).toUpperCase() + processed.slice(1);
    if (!processed.endsWith('.')) processed += '.';

    // 3. Field-Specific Formatting & Refinement
    switch (fieldType) {
        case 'actividades':
            processed = processed
                .replace(/(?:y |se ejecutó la labor de |se procedió con la instalación de )/gi, '\n• ')
                .replace(/\. /g, '.\n• ')
                .split('\n')
                .filter(line => line.length > 5)
                .map(line => {
                    let clean = line.trim().replace(/^•\s*/, '');
                    if (!clean) return null;
                    // Add "Ejecución de" or similar if missing active verb
                    if (!clean.match(/^[A-Z]/)) clean = clean.charAt(0).toUpperCase() + clean.slice(1);
                    return `• ${clean}`;
                })
                .filter(Boolean)
                .join('\n');
            break;

        case 'retos':
            processed = processed
                .replace(/(?:pero |sin embargo |de todas formas |aunque )/gi, '\n• [LIMITANTE] ')
                .split('\n')
                .filter(line => line.length > 5)
                .map(line => {
                    let clean = line.trim().startsWith('•') ? line : `• [OBSTÁCULO] ${line}`;
                    return clean;
                })
                .join('\n');
            break;

        case 'lecciones_aprendidas':
            processed = processed
                .replace(/(?:entonces |por eso |se concluyó satisfactoriamente |aprendimos )/gi, '\n• [OPTIMIZACIÓN] ')
                .split('\n')
                .filter(line => line.length > 5)
                .map(line => line.trim().startsWith('•') ? line : `• [APRENDIZAJE] ${line}`)
                .join('\n');
            break;

        case 'novedades':
            processed = processed
                .replace(/(?:también |además |por otro lado )/gi, '\n• ')
                .split('\n')
                .filter(line => line.length > 5)
                .map(line => line.trim().startsWith('•') ? line : `• ${line}`)
                .join('\n');
            break;

        default:
            break;
    }

    return processed;
};

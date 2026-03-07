/**
 * AiProcessor.js
 * Simulated LLM processing for construction reports.
 */

export const optimizeText = async (text, fieldType = 'general') => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (!text || text.length < 5) return text;

    let processed = text.trim();

    // 1. Basic Technical Corrections
    processed = processed.charAt(0).toUpperCase() + processed.slice(1);
    if (!processed.endsWith('.')) processed += '.';

    // 2. Field-Specific Formatting
    switch (fieldType) {
        case 'actividades':
            processed = processed
                .replace(/(?:y |se hizo |se realizo )/gi, '\n• ')
                .replace(/\. /g, '.\n• ')
                .split('\n')
                .filter(line => line.length > 3)
                .map(line => line.startsWith('•') ? line : `• ${line}`)
                .join('\n');
            break;

        case 'retos':
            processed = processed
                .replace(/(?:pero |sin embargo |el problema fue )/gi, '\n[RETO] ')
                .replace(/(?:se soluciono |la solucion fue |entonces )/gi, '\n[SOLUCIÓN] ')
                .split('\n')
                .filter(line => line.length > 3)
                .map(line => line.trim())
                .join('\n');
            break;

        case 'novedades':
            if (processed.toLowerCase().includes('clima') || processed.toLowerCase().includes('lluvia')) {
                processed = `[CLIMA] ${processed}`;
            } else {
                processed = `[LOGÍSTICA] ${processed}`;
            }
            break;

        default:
            // Standard formatting for others
            break;
    }

    return processed;
};

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
                .replace(/(?:pero |sin embargo |el problema fue |se presento )/gi, '\n• [OBSTÁCULO] ')
                .split('\n')
                .filter(line => line.length > 3)
                .map(line => line.trim().startsWith('•') ? line : `• ${line}`)
                .join('\n');
            break;

        case 'lecciones_aprendidas':
            processed = processed
                .replace(/(?:se soluciono |la solucion fue |aprendimos |vimos que )/gi, '\n• [APRENDIZAJE] ')
                .split('\n')
                .filter(line => line.length > 3)
                .map(line => line.trim().startsWith('•') ? line : `• ${line}`)
                .join('\n');
            break;

        case 'novedades':
            processed = processed
                .replace(/(?:ademas |tambien |por otro lado )/gi, '\n• ')
                .split('\n')
                .filter(line => line.length > 2)
                .map(line => line.trim().startsWith('•') ? line : `• ${line}`)
                .join('\n');
            break;

        default:
            // Standard formatting for others
            break;
    }

    return processed;
};

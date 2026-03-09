# Skill: History Manager

Logic for persistent storage, retrieval, and consolidation of construction reports.

## Standards
- **Storage**: Use `localStorage` for metadata and `IndexedDB` (via a library or raw) for large data like Base64 photos to avoid quota issues.
- **Naming**: Reports must follow the convention `SUNSITE_CAT_MG_DATE_ID`.
- **Data Integrity**: Each entry must include a checksum or at least a full `timestamp` and `user_id` for traceability.

## Consolidation Logic
When merging `N` reports:
1. **Progress**: Arithmetic mean of `avance_porcentaje` (strip '%' and parse as int).
2. **Concatenation**: Join "Pendientes" and "Novedades" using bullet points and source dates.
3. **Consolidated PDF**: Use a specific "CONSOLIDADO" header in `PdfGenerator.js`.

## UI Requirements
- **Multi-select**: Use checkboxes with `var(--color-brand-quoia-light)` highlighting on selection.
- **Empty State**: Show a technical illustration when no reports are stored.

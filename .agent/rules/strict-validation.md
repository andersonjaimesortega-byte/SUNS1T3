# Strict Validation Rules - PWA Bitácora

To ensure compliance and data integrity in field reports, the following rules MUST be enforced:

## GPS Coordination (Mandatory)
- **Constraint**: No report can be generated without valid GPS coordinates.
- **Failure Case**: If GPS is unavailable or permission is denied, the user must be notified with a clear message: "El permiso de GPS es obligatorio para el cumplimiento del reporte."
- **Verification**: The `gps_location` object must contain `lat`, `lng`, and a `timestamp`.

## Media Requirement
- **Constraint**: Minimum of one (1) photo capture is required.
- **UI Logic**: The "Generar Reporte" button must remain **disabled** until at least one photo is successfully uploaded/compressed.

## Data Completeness
- **Constraint**: ID validation + GPS presence + Min 1 Photo.
- **Workflow**: Auto-save drafts must include current GPS status to avoid data loss on page refresh.

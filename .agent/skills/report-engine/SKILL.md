---
name: report-engine
description: Logic for validating users, generating PDFs, and managing report file structures.
---

# Report Engine Skill

## Logic & Validation
- **Authentication**: Compare User ID against a static list in `src/data/users.json`.
- **PDF Generation**: Use `jsPDF` (or equivalent client-side library) to create reports.
- **Attachments**: PDF must include compressed photos and a simple digital signature/mark.

## Naming Convention
Reports must follow the naming pattern:
`IDMinigranja_Fecha_IDUsuario.pdf`

## Directory Structure
Organize reports logically:
`Minigranja_ID / Fecha_Reporte.pdf`

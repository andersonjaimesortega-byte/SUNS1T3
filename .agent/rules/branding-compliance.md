# Branding & UI Standards - SunSite Solenium

This rule ensures absolute consistency with Solenium's corporate identity across the PWA.

## Visual Identity
- **Primary Color (Actions/Buttons)**: `var(--color-quoia-primary)` (#b8cf3e).
- **Highlight/Alert Color (Issues/Retos)**: `var(--color-zentrack-primary)` (#fd9c10).
- **Typography**: POppins (Sans-serif) must be used for ALL text elements.

## Component Guidelines
1. **Buttons**: Use `var(--color-quoia-primary)` for positive actions (Save, New, Share). Use `var(--color-zentrack-primary)` for fields related to challenges or problems.
2. **Icons**: Use `lucide-react` icons strictly. Consistency is key.
3. **Spacing**: Use standard zinc grid from Tailwind but colored with variables.

## Enforcement
- NEVER use raw hex codes (e.g., #b8cf3e) in style attributes or Tailwind utility overrides.
- ALWAYS use `var(--color-...)` to ensure theme flexibility.

# PWA Field Standards

## UX/UI Principles
- **Mobile First**: All interfaces must be designed for mobile use first.
- **Touch Targets**: Buttons and interactive elements must have a minimum size of **44x44px** to ensure usability in field conditions (e.g., wearing gloves).
- **Offline Reliability**: Implement a robust Service Worker to ensure the application loads and functions without an internet connection.

## Performance & Data
- **Client-Side Processing**: Images must be compressed on the client side before being stored or processed to save memory and storage.
- **Optimistic UI**: Use LocalStorage or IndexedDB for drafts to prevent data loss in areas of low connectivity.

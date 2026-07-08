## 2025-05-14 - [Link Component & Modifier Clicks]
**Learning:** Standard SPA Link components often break native browser behaviors like middle-click or Ctrl/Cmd+click to open in a new tab because they unconditionally call preventDefault().
**Action:** Always check for modifier keys (event.metaKey, event.ctrlKey, etc.) and the button index (event.button === 0) before preventing default in custom Link components.
## 2025-05-14 - [Aria Labels on Icon-Only Buttons]
**Learning:** Icon-only buttons without labels are invisible to screen readers. Even common icons like Trash2 or Info need explicit labels.
**Action:** Consistently apply aria-label to all buttons and links that do not contain visible, descriptive text.

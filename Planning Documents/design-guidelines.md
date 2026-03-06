# Design guidelines

Based on the **Flowbite Admin Dashboard** design system. Theme tokens live in `resources/css/app.css` (`@theme` block). This document describes the visual language and how to apply it consistently.

Reference: [Flowbite Admin Dashboard demo](https://www.tailawesome.com/resources/flowbite-admin-dashboard/demo)

---

## 1. Typography

| Token          | Value                   | Use for                                |
|----------------|-------------------------|----------------------------------------|
| `--font-sans`  | Inter + system fallback | All body text, headings, UI labels     |
| `--font-body`  | Same as `--font-sans`   | Alias for body text                    |
| `--font-mono`  | SFMono / Menlo / Consolas | Code, auth-codes, timestamps, telemetry |

**Google Fonts import** (add to `<head>` in layouts):

```html
<link rel="preconnect" href="https://fonts.bunny.net">
<link href="https://fonts.bunny.net/css?family=inter:400,500,600,700" rel="stylesheet" />
```

**Type scale** (standard Tailwind):

| Class      | Use for                    |
|------------|----------------------------|
| `text-sm`  | Table cells, captions      |
| `text-base`| Body paragraphs            |
| `text-lg`  | Section headings           |
| `text-xl`  | Page sub-headings          |
| `text-2xl` | Page titles, brand name    |

**Weight:** `font-normal` (400) for body, `font-medium` (500) for labels/nav, `font-semibold` (600) for headings/brand.

---

## 2. Colors

### Primary (blue)

| Token              | Hex       | Use for                                    |
|--------------------|-----------|---------------------------------------------|
| `primary-50`       | `#eff6ff` | Subtle highlights, selected row bg          |
| `primary-100`      | `#dbeafe` | Light badges, hover tints                   |
| `primary-300`      | `#93c5fd` | Focus ring (dark mode)                      |
| `primary-500`      | `#3b82f6` | Focus ring (light mode), links              |
| `primary-600`      | `#2563eb` | Link text, timestamp accents                |
| `primary-700`      | `#1d4ed8` | Primary buttons (`bg-primary-700`)          |
| `primary-800`      | `#1e40af` | Button hover (`hover:bg-primary-800`)       |
| `primary-900`      | `#1e3a8a` | Darkest accent (rarely used)                |

### Neutral (Tailwind `gray-*` — default palette, no custom override)

| Class          | Use for                                         |
|----------------|--------------------------------------------------|
| `gray-50`      | Page background (`bg-gray-50`)                   |
| `gray-100`     | Hover state (`hover:bg-gray-100`), sidebar active|
| `gray-200`     | Borders (`border-gray-200`), dividers            |
| `gray-300`     | Input borders (`border-gray-300`)                |
| `gray-400`     | Placeholder text, muted icons (dark mode)        |
| `gray-500`     | Secondary text, icons                            |
| `gray-700`     | Heading text, dropdown text                      |
| `gray-800`     | Dark mode sidebar/navbar bg (`dark:bg-gray-800`) |
| `gray-900`     | Primary text (`text-gray-900`), dark mode page bg|
| `white`        | Cards, navbar, sidebar background                |

### Status (traffic-light)

| Token                | Resolves to          | Meaning                    |
|----------------------|----------------------|----------------------------|
| `status-ok`          | `green-500`          | Green — low risk / pass    |
| `status-ok-muted`    | `green-100`          | Green tinted row/badge bg  |
| `status-warning`     | `amber-500`          | Yellow — review / medium risk |
| `status-warning-muted`| `amber-100`         | Yellow tinted row/badge bg |
| `status-danger`      | `red-500`            | Red — flagged / high risk  |
| `status-danger-muted`| `red-100`            | Red tinted row/badge bg    |

**Rule:** Reserve green/yellow/red for status indicators. Use sparingly for other success/warning/error contexts to avoid overlap.

---

## 3. Layout

Follows the Flowbite sidebar layout:

```
┌─────────────────────────────────────────────────────┐
│  Navbar (fixed top, white, border-b border-gray-200)│
├──────────┬──────────────────────────────────────────┤
│ Sidebar  │  Main content                            │
│ w-64     │  bg-gray-50  lg:ml-64                    │
│ bg-white │                                          │
│ border-r │  ┌─ Card ───────────────────────────┐    │
│ border-  │  │ bg-white  rounded-lg  shadow-sm  │    │
│ gray-200 │  └──────────────────────────────────┘    │
│          │                                          │
└──────────┴──────────────────────────────────────────┘
```

| Element       | Classes                                                         |
|---------------|-----------------------------------------------------------------|
| **Navbar**    | `fixed z-30 w-full bg-white border-b border-gray-200`          |
| **Sidebar**   | `fixed w-64 h-full bg-white border-r border-gray-200 pt-16`   |
| **Main area** | `lg:ml-64 bg-gray-50 pt-16`                                    |
| **Card**      | `bg-white rounded-lg shadow-sm p-4` (or `p-6`)                |
| **Footer**    | `bg-white border-t border-gray-200 p-4`                       |

---

## 4. Components

### Buttons

```html
<!-- Primary -->
<button class="px-5 py-2.5 text-sm font-medium text-white bg-primary-700 rounded-lg
               hover:bg-primary-800 focus:ring-4 focus:ring-primary-300">
    Save
</button>

<!-- Secondary / outline -->
<button class="px-5 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg
               hover:bg-gray-100 focus:ring-4 focus:ring-gray-200">
    Cancel
</button>
```

### Inputs

```html
<input type="text"
       class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg
              focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
       placeholder="Search">
```

### Sidebar nav item

```html
<a href="#" class="flex items-center p-2 text-base text-gray-900 rounded-lg
                   hover:bg-gray-100 group">
    <svg class="w-6 h-6 text-gray-500 group-hover:text-gray-900">...</svg>
    <span class="ml-3">Dashboard</span>
</a>
```

### Status badges

```html
<span class="px-2.5 py-0.5 text-xs font-medium rounded-full
             bg-status-ok-muted text-green-800">Green</span>
<span class="px-2.5 py-0.5 text-xs font-medium rounded-full
             bg-status-warning-muted text-amber-800">Yellow</span>
<span class="px-2.5 py-0.5 text-xs font-medium rounded-full
             bg-status-danger-muted text-red-800">Red</span>
```

### Tables

```html
<table class="w-full text-sm text-left text-gray-500">
    <thead class="text-xs text-gray-700 uppercase bg-gray-50">
        <tr><th class="px-4 py-3">Name</th>...</tr>
    </thead>
    <tbody>
        <tr class="border-b hover:bg-gray-100">
            <td class="px-4 py-3 font-medium text-gray-900">...</td>
        </tr>
    </tbody>
</table>
```

---

## 5. Border radius

Everything uses **`rounded-lg`** (0.5rem / 8px) for consistency:

| Element      | Class           |
|-------------|-----------------|
| Cards        | `rounded-lg`    |
| Buttons      | `rounded-lg`    |
| Inputs       | `rounded-lg`    |
| Sidebar items| `rounded-lg`    |
| Dropdowns    | `rounded-lg`    |
| Badges/pills | `rounded-full`  |
| Avatars      | `rounded-full`  |

---

## 6. Shadows

| Use for     | Class         | CSS value                                                   |
|-------------|---------------|--------------------------------------------------------------|
| Cards       | `shadow-sm`   | `0 1px 2px 0 rgb(0 0 0 / 0.05)`                            |
| Dropdowns   | `shadow-lg`   | `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px ...`   |
| Tooltips    | `shadow-sm`   | Same as cards                                                |

---

## 7. Focus states

All interactive elements use a **4px ring** on focus:

```
focus:ring-4 focus:ring-primary-300   (primary buttons)
focus:ring-4 focus:ring-gray-200      (secondary buttons)
focus:ring-2 focus:ring-gray-100      (sidebar items)
```

---

## 8. Dark mode

Uses **class-based** dark mode (`dark:` variant). Key mappings:

| Light                  | Dark                         |
|------------------------|------------------------------|
| `bg-gray-50` (page)   | `dark:bg-gray-900`           |
| `bg-white` (card/nav) | `dark:bg-gray-800`           |
| `border-gray-200`     | `dark:border-gray-700`       |
| `border-gray-300`     | `dark:border-gray-600`       |
| `text-gray-900`       | `dark:text-white`            |
| `text-gray-500`       | `dark:text-gray-400`         |
| `text-gray-700`       | `dark:text-gray-200`         |
| `hover:bg-gray-100`   | `dark:hover:bg-gray-700`     |
| `bg-gray-50` (input)  | `dark:bg-gray-700`           |
| `focus:ring-primary-300`| `dark:focus:ring-primary-800`|

---

## 9. Spacing

Uses Tailwind default spacing scale (1 unit = 0.25rem / 4px):

| Pattern            | Classes                |
|--------------------|------------------------|
| Card padding       | `p-4` or `p-6`         |
| Section gap        | `space-y-4` or `gap-4` |
| Navbar padding     | `px-3 py-3 lg:px-5`   |
| Sidebar item       | `p-2`                  |
| Button padding     | `px-5 py-2.5`          |
| Input padding      | `p-2.5`                |
| Table cells        | `px-4 py-3`            |

---

## 10. Where the theme lives

| File | Purpose |
|------|---------|
| `resources/css/app.css` | `@theme { ... }` — primary palette, fonts, status colors |
| `Admin/design-guidelines.md` | This file — how to use the tokens |

**Changing the theme:** Edit the `@theme` block in `app.css`. If other apps share the theme, keep its CSS variables in sync (or extract to a shared file and `@import` it).

**Adding Flowbite components:** Install `flowbite` as an npm dependency and add `@plugin "flowbite/plugin"` to `app.css` if you want ready-made dropdowns, modals, tooltips, etc.

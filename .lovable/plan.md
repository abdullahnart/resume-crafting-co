
## Resume Maker App

### Overview
A web-based resume builder where users fill in their details via a structured form, choose from 6+ professionally designed templates, preview their resume in real-time, and download it as a PDF.

### Pages & Layout
- **Single-page app** with a clean, minimal UI (Paper & Ink aesthetic — off-white background, rich blacks, clean typography)
- **Left panel**: Multi-step form for entering resume data
- **Right panel**: Live resume preview showing the selected template

### Form Sections (Step-by-step)
1. **Personal Info** — Name, title, email, phone, location, LinkedIn, website
2. **Summary** — Professional summary / objective
3. **Work Experience** — Add multiple entries (company, role, dates, bullet points)
4. **Education** — Add multiple entries (school, degree, dates, GPA)
5. **Skills** — Add skill tags with optional proficiency level
6. **Additional** — Languages, certifications, projects, awards (optional sections)

### Resume Templates (6+)
1. **Classic** — Traditional single-column, serif font, clean lines
2. **Modern** — Two-column layout, sans-serif, accent color sidebar
3. **Minimal** — Lots of whitespace, simple typography, no color
4. **Creative** — Bold header, color accents, unique section dividers
5. **Professional** — Navy/dark header block, structured sections, icons
6. **Compact** — Dense layout to fit more content, smaller fonts

Each template will have a **color accent picker** so users can customize the accent color.

### Key Features
- **Live preview** updates as the user types
- **Template switcher** with visual thumbnails at the top of the preview
- **PDF export** using browser print / html2canvas + jsPDF
- **Drag-to-reorder** sections and experience entries
- **Auto-save to localStorage** so data persists across page refreshes
- **Responsive** — on mobile, form and preview toggle between tabs

### Tech Approach
- React components for each form section
- Context/state to hold all resume data
- 6 template components that render the same data differently
- `react-to-print` or `html2canvas` + `jsPDF` for PDF generation
- localStorage for data persistence

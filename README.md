# Boolean Practice

Boolean Practice is a professional-grade educational web application designed to help computer science students (specifically AP Computer Science A) master boolean expression evaluation through stepwise reasoning.

The project features a modern, static Vue 3 architecture that supports multiple visual representations:
- **Truth Table Practice**: Stepwise reveal of subexpressions with inline validation.
- **Visual Venn Diagrams**: Interactive SVG regions for 1, 2, and 3-variable expressions.
- **Equivalence & Simplification**: Advanced modes for proving logical equivalence and reducing expression complexity.
- **Classroom Integration**: Optional Google Apps Script (GAS) and Google Sheets integration for assignment tracking.

## 🚀 Quick Start

### 1. Installation
```bash
npm install
```

### 2. Launch the Dev Console
The repository includes a human-facing **Local Dev Console** to manage the dev server, validation, and review workflows without memorizing complex commands.
```bash
npm run dev:console
```

### 3. Core Commands
- `npm run dev`: Start the Vite development server (port 5177).
- `npm run dev:control`: Backward-compatible alias for the local dev console.
- `npm run test`: Run the Vitest unit test suite.
- `npm run test:e2e`: Run Playwright end-to-end tests.
- `npm run build`: Generate the static production build in `dist/`.
- `npm run build:gas`: Generate the Apps Script compatible build in `gas-dist/`.

## 📂 Project Structure

- `src/`: Shared boolean logic (parser, evaluator, Venn logic, catalog).
- `ui/`: Vue 3 application shell and components.
- `docs/`: Comprehensive technical, architectural, and pedagogical documentation.
- `tests/`: Extensive unit and E2E coverage.
- `scripts/`: Local development tools and build utilities.
- `archive/`: Read-only source snapshot of the original Apps Script implementation.

## 📖 Key Documentation

For detailed guides, see the following files in the `docs/` directory:
- [Architecture](docs/architecture.md): Core module boundaries and technical decisions.
- [Project Structure](docs/project-structure.md): Rules for repository organization.
- [Deployment](docs/deployment.md): GitHub Pages and GAS deployment workflows.
- [Local Dev Console](docs/local-dev-console.md): Guide to the `dev:control` menu.
- [UI Tour Capture](docs/ui-tour-capture.md): The blind UI review and synthesis workflow.

## 🛠️ Development Workflow

This project follows a structured, plan-based migration. The canonical index of all implemented and planned features is maintained in:
👉 **[Development Packet Sequence](docs/development/README.md)**

## 📜 License
This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

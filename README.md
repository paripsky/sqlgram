# sqlgram 🗂️

A modern, interactive PostgreSQL schema visualizer that transforms your SQL
CREATE TABLE statements into beautiful, professional database diagrams.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

## ✨ Features

### 🎯 Core Functionality

- **SQL to Diagram**: Instantly convert PostgreSQL CREATE TABLE statements into
  interactive diagrams
- **Real-time Parsing**: Live error detection and syntax validation using
  `sql-parser-cst`
- **Relationship Mapping**: Automatic detection and visualization of foreign key
  relationships
- **Smart Layout**: Auto-arranged diagrams using Dagre layout algorithm

### 🔧 Developer Experience

- **Monaco Editor Integration**: Full-featured SQL editor with syntax
  highlighting and error markers
- **Inline Error Display**: See SQL errors directly in the editor with precise
  line/column positioning
- **Theme Support**: Light/Dark mode with system preference detection
- **Export Functionality**: Download your SQL schemas (disabled for invalid SQL)
- **Import/Export**: Load SQL files or save your work

### 📱 User Interface

- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI**: Built with Tailwind CSS and Radix UI components
- **Touch-Friendly**: Optimized for mobile interactions and touch gestures
- **Accessibility**: Full keyboard navigation and screen reader support

### 🔍 Advanced Features

- **Relationship Types**: Displays One-to-One, One-to-Many, Many-to-One, and
  Many-to-Many relationships
- **Validation Status**: Clear indicators for SQL validity with error counts
- **Table Details**: Complete column information including types, constraints,
  and keys
- **Interactive Diagrams**: Pan, zoom, and explore your database schema

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/paripsky/sqlgram.git
cd sqlgram
```

2. **Install dependencies**

```bash
npm install
# or
pnpm install
```

3. **Start development server**

```bash
npm run dev
# or
pnpm dev
```

4. **Open in browser** Navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
# or
pnpm build
```

## 📖 Usage

### Basic Example

1. **Enter your SQL schema** in the editor:

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

2. **Watch the magic happen** ✨ - Your schema automatically appears as an
   interactive diagram!

3. **Explore relationships** - See how your tables connect with labeled
   relationship lines

### Supported SQL Features

- ✅ CREATE TABLE statements
- ✅ Primary keys (SERIAL, INTEGER PRIMARY KEY)
- ✅ Foreign key relationships (REFERENCES)
- ✅ Column constraints (NOT NULL, UNIQUE)
- ✅ Data types (VARCHAR, INTEGER, TEXT, TIMESTAMP, BOOLEAN, etc.)
- ✅ Default values
- ✅ Composite primary keys
- ✅ Junction tables (many-to-many relationships)

### Error Handling

sqlgram provides comprehensive error detection:

- **Syntax Errors**: Real-time SQL syntax validation
- **Missing References**: Detection of broken foreign key references
- **Type Mismatches**: Validation of data type consistency
- **Inline Markers**: Errors highlighted directly in the editor

## 🛠️ Tech Stack

### Frontend

- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development with full IntelliSense
- **Vite** - Lightning-fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework

### Components & UI

- **Radix UI** - Unstyled, accessible component primitives
- **Lucide React** - Beautiful, customizable icons
- **React Flow** - Interactive node-based diagrams
- **Monaco Editor** - VS Code editor experience in the browser

### Data Processing

- **sql-parser-cst** - Robust PostgreSQL SQL parser
- **Dagre** - Directed graph layout algorithm

## 🎨 Theme Support

sqlgram supports three theme modes:

- **Light Mode** - Clean, bright interface
- **Dark Mode** - Easy on the eyes for extended use
- **System** - Automatically follows your OS preference

The Monaco editor theme automatically syncs with your selected theme preference.

## 📱 Mobile Support

sqlgram is fully responsive and optimized for mobile devices:

- Touch-friendly interface with appropriate touch targets
- Tabbed layout on mobile for better space utilization
- Optimized diagram controls for touch interaction
- Prevents zoom on form inputs for better UX

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm run test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow the existing ESLint configuration
- Write meaningful commit messages
- Add JSDoc comments for complex functions

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.

## 🙏 Acknowledgments

- **sql-parser-cst** - For robust SQL parsing capabilities
- **React Flow** - For the amazing diagram visualization
- **Monaco Editor** - For bringing VS Code editor experience to the web
- **Radix UI** - For accessible, unstyled component primitives
- **Tailwind CSS** - For the utility-first CSS framework

## 🔮 Roadmap

- [ ] Support for additional SQL dialects (MySQL, SQLite)
- [ ] Schema comparison and diff visualization
- [ ] Export to various formats (PNG, SVG, PDF)
- [ ] Collaborative editing features
- [ ] Schema version history
- [ ] Integration with popular databases
- [ ] Advanced relationship editing
- [ ] Custom diagram themes

## 📞 Support

- **Documentation**: Check this README and inline help
- **Issues**: Report bugs on
  [GitHub Issues](https://github.com/paripsky/sqlgram/issues)
- **Discussions**: Join conversations in
  [GitHub Discussions](https://github.com/paripsky/sqlgram/discussions)

## 🌟 Show Your Support

If sqlgram helps you visualize your database schemas, please consider:

- ⭐ Starring the repository
- 🐛 Reporting bugs
- 💡 Suggesting new features
- 🤝 Contributing code
- 📢 Sharing with colleagues

---

<div align="center">
  <p>Built with ❤️ for developers, by developers</p>
  <p><strong>sqlgram</strong> - Making database schemas beautiful, one diagram at a time</p>
</div>

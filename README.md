# Climate Justice Organizations Database

A web-based card view interface for exploring climate justice organizations, particularly those working with Afro-descendant communities globally.

## Features

- 🎴 Interactive card-based layout
- 🔍 Real-time search functionality
- 🎯 Filter by scope, region, and focus areas
- 📱 Fully responsive design
- 🌍 Global coverage of climate justice organizations

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open your browser and navigate to:
```
http://localhost:3000
```

### Development Mode

For auto-reloading during development:
```bash
npm run dev
```

## Project Structure

```
org-db-app/
├── data/
│   └── source.json          # Organizations database
├── index.html               # Main HTML file
├── styles.css               # Stylesheet
├── script.js                # JavaScript functionality
├── server.js                # Express server
├── package.json             # Node.js dependencies
└── README.md               # This file
```

## Data Source

The database contains information about climate justice organizations including:
- Organization name and overview
- Operational domain and scope
- Geographic regions
- Focus areas and key activities
- Contact information and websites

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express
- **Data**: JSON

## Usage

1. **Search**: Use the search bar to find organizations by name, overview, or activities
2. **Filter**: Use dropdown filters to narrow results by scope, region, or focus area
3. **View Details**: Click "View Details" on any card to see complete information
4. **Visit Website**: Click "Visit Website" to go to the organization's site (if available)
5. **Reset**: Click "Reset Filters" to clear all filters and show all organizations

## License

MIT

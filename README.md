```
# NSW Transport Live Departure Board

A real-time public transport departure board application for New South Wales, Australia, allowing users to view live departure information for trains, buses, light rail, ferries, and coaches. The application features a dynamic search for stops/stations, real-time updates, and an intuitive user interface.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Installation](#installation)
  - [Compiling Station Data](#compiling-station-data)
  - [Running the Application](#running-the-application)
- [API Integration](#api-integration)
- [Data Sources](#data-sources)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Features

* **Multi-Mode Departure Boards**: View live departure information for Trains, Buses, Light Rail, Ferries, and Coaches.
* **Real-time Updates**: Departures automatically refresh every 30 seconds for up-to-date information.
* **Stop/Station Search**: Easily find your desired bus stop or train/light rail/ferry/coach station by name or ID.
* **Dynamic Information**: Displays scheduled and estimated departure times, destination, platform, and, for buses, real-time occupancy.
* **User-Friendly Interface**: Clean and intuitive design with mode-specific branding (e.g., orange for trains, blue for light rail/ferries).
* **Pre-compiled Static Data**: Train station data is pre-compiled for faster local searching.

## Technologies Used

**Backend (Node.js/Express):**

* [**Node.js**](https://nodejs.org/): JavaScript runtime environment.
* [**Express.js**](https://expressjs.com/): Fast, unopinionated, minimalist web framework for Node.js.
* [**Axios**](https://axios-http.com/): Promise-based HTTP client for the browser and Node.js.
* [**dotenv**](https://www.npmjs.com/package/dotenv): Loads environment variables from a `.env` file.
* [**cors**](https://www.npmjs.com/package/cors): Node.js package for providing a Connect/Express middleware that can be used to enable CORS.
* [**csv-parser**](https://csv.js.org/csv-parser/): Streaming CSV parser.

**Frontend (React/Vite):**

* [**React**](https://react.dev/): JavaScript library for building user interfaces.
* [**Vite**](https://vitejs.dev/): Next-generation frontend tooling for fast development.
* [**Axios**](https://axios-http.com/): For making HTTP requests to the backend.
* [**React Icons**](https://react-icons.github.io/): Collection of popular icons as React components.
* **CSS3**: For styling and layout.

## Project Structure

```

nswtransport-timetable/
├── backend/
│ ├── .env # Environment variables for API key (not committed)
│ ├── compileStationData.js # Script to fetch and compile static station data
│ ├── package.json # Backend dependencies and scripts
│ └── server.js # Express.js backend server (API proxy)
├── frontend/
│ ├── public/ # Static assets (e.g., vite.svg)
│ ├── src/
│ │ ├── assets/ # SVG icons (bus, ferry, lightrail, train)
│ │ ├── components/ # Reusable React components for departure boards & modals
│ │ │ ├── BusDepartureBoard.jsx
│ │ │ ├── BusDepartureBoard.css
│ │ │ ├── BusDepartures.jsx
│ │ │ ├── BusDepartures.css
│ │ │ ├── LightRailFerryDepartures.jsx
│ │ │ ├── LightRailFerryDepartures.css
│ │ │ ├── SettingsModal.jsx
│ │ │ └── SettingsModal.css
│ │ │ ├── TrainDepartures.jsx
│ │ │ └── TrainDepartures.css
│ │ ├── data/ # Compiled static JSON data for stops/stations
│ │ │ ├── busStops.json
│ │ │ ├── coachStops.json
│ │ │ ├── ferryWharves.json
│ │ │ ├── lightRailStops.json
│ │ │ ├── locationfacilitydata.csv # Raw data source (potentially scraped)
│ │ │ └── trainStations.json
│ │ ├── App.jsx # Main React application component
│ │ ├── App.css # Main application styling
│ │ ├── api.js # Frontend API client for backend communication
│ │ ├── index.css # Global CSS styles
│ │ └── main.jsx # React entry point
│ ├── index.html # Main HTML file
│ ├── package.json # Frontend dependencies and scripts
│ └── vite.config.js # Vite configuration

```

## Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

* Node.js (v18 or higher recommended)
* npm (comes with Node.js) or yarn

### Environment Variables

You need to obtain an API key from Transport for NSW Open Data.
1.  Visit the [Transport for NSW Open Data website](https://opendata.transport.nsw.gov.au/).
2.  Sign up for an account and obtain an API key.

Create a `.env` file in the `backend` directory with your API key:

```

# backend/.env

TFN_API_KEY="your_tfn_api_key_here"
PORT=5001 # Optional: specify a port for the backend, default is 10000 if not set

````

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/atoll101/tfnsw-realtime.git](https://github.com/atoll101/tfnsw-realtime.git)
    cd tfnsw-realtime
    ```
2.  **Install backend dependencies:**
    ```bash
    cd backend
    npm install
    ```
3.  **Install frontend dependencies:**
    ```bash
    cd ../frontend
    npm install
    ```
4.  **Return to the root directory:**
    ```bash
    cd ..
    ```

### Compiling Station Data

The frontend relies on pre-compiled JSON files for station and stop data. These files are generated by fetching data from the TfNSW GTFS feed and verifying against the TfNSW Stop Finder API. This step is crucial for the application to function correctly, especially for the train station search.

From the `backend` directory, run the compilation script:

```bash
cd backend
node compileStationData.js
````

This script will:

- Download the latest GTFS stops data from TfNSW.
- Iterate through the GTFS stops and query your local backend's `/api/stop-finder` endpoint to filter and enrich the data with `productClass` information (e.g., TRAIN, BUS, FERRY).
- Save the filtered and sorted data into `frontend/src/data/*.json` files (e.g., `trainStations.json`, `busStops.json`).
- **Note:** This process makes multiple API requests and includes a 300ms pause between requests to prevent hitting rate limits. Be patient, as it can take some time to complete.

### Running the Application

1.  **Start the backend server:**
    From the `backend` directory:

    ```bash
    npm start # Or: node server.js
    ```

    The backend server will start on `http://localhost:5001` (or the port you specified in `.env` if different).

2.  **Start the frontend development server:**
    Open a **new terminal window**.
    From the `frontend` directory:
    ```bash
    npm run dev
    ```
    The frontend application will typically open in your browser at `http://localhost:5173` (or another available port).

You should now see the application running in your browser, allowing you to select a transport mode and view live departures!

## API Integration

[cite_start]This project interacts with the Transport for NSW Open Data APIs[cite: 16]. The backend acts as a proxy to handle API key authentication and simplify requests from the frontend.

The key APIs used are:

- [cite_start]**Stop Finder API**: Provides capability to return all NSW public transport stop, station, wharf, points of interest and known addresses to be used for auto-suggest/auto-complete. [cite: 11] This is also leveraged by `compileStationData.js` to verify GTFS stop data.
- [cite_start]**Departure API**: Provides capability to provide NSW public transport departure information from a stop, station or wharf including real-time. [cite: 13] This is used by the backend to find upcoming departures at a given stop, forming the core data for the live departure boards.

The application retrieves real-time data for departures where available. [cite_start]Real-time data, including estimated departure/arrival times [cite: 214] and bus occupancy (e.g., `EMPTY`, `FEW_SEATS_AVAILABLE`, `CRUSHED_STANDING_ROOM_ONLY`), is included in the API responses and displayed on the respective departure boards.

## Data Sources

The static station/stop data used for search functionality in the frontend is derived from:

- **TfNSW GTFS Static Schedule Data (stops.txt)**: Downloaded and parsed by `compileStationData.js` to get a base list of stops.
- **TfNSW Open Data Trip Planner API (Stop Finder)**: Used in conjunction with GTFS data by `compileStationData.js` to filter and confirm product classes (e.g., train, bus, ferry) for each stop, ensuring accuracy and relevance for the application's specific needs.

The live departure information is fetched directly from the **Transport for NSW Open Data Trip Planner API** via the backend proxy.

## Contributing

Contributions are welcome! If you find a bug, have a feature request, or want to contribute code, please feel free to:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name` or `fix/bug-fix-name`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'feat: Add new feature'`).
5.  Push to the branch (`git push origin feature/your-feature-name`).
6.  Open a Pull Request.

Please ensure your code adheres to the existing style and conventions.

## License

This project is licensed under the ISC License. See the `LICENSE` file in the root of the repository for details.

## Contact

For any questions or feedback, please open an issue in this GitHub repository.

```

```

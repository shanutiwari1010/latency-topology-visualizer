# Crypto Exchange Latency Visualizer

A Next.js application that displays a 3D world map visualizing exchange server locations and real-time/historical latency data across AWS, GCP, and Azure co-location regions for cryptocurrency trading infrastructure.

## 🌟 Features

### Core Features
- **3D Interactive World Map** - Fully interactive 3D globe built with Three.js
- **Real-time Latency Monitoring** - Live latency data with animated connections
- **Historical Data Visualization** - Time-series charts showing latency trends
- **Multi-Cloud Provider Support** - Visualizes AWS, GCP, and Azure regions
- **Advanced Filtering** - Filter by exchange, cloud provider, latency range
- **Responsive Design** - Optimized for desktop and mobile devices

### Visualization Features
- **Animated Data Streams** - Real-time latency connections with color-coded quality
- **Exchange Server Markers** - 3D markers showing server locations
- **Cloud Region Boundaries** - Visual representation of provider regions
- **Interactive Controls** - Zoom, pan, and rotate the 3D map
- **Dynamic Legends** - Context-aware information panels

### Technical Features
- **TypeScript** - Full type safety and better development experience
- **Modern React Patterns** - Hooks, Context, and functional components
- **Performance Optimized** - Efficient 3D rendering and data management
- **Dark/Light Theme** - Toggle between visual themes
- **Real-time Updates** - Live data refresh every 10 seconds

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd crypto-exchange-latency-visualizer
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

### Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
crypto-exchange-latency-visualizer/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Main page
│   ├── components/            # React components
│   │   ├── ui/               # Reusable UI components
│   │   ├── Map3D.tsx         # 3D map visualization
│   │   ├── ControlPanel.tsx  # Filters and controls
│   │   ├── LatencyChart.tsx  # Historical data chart
│   │   └── ...
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility functions
│   ├── types/                # TypeScript definitions
│   └── constants/            # Application constants
├── public/                   # Static assets
├── package.json
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

## 🏗️ Architecture

### Technology Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **3D Graphics**: Three.js with React Three Fiber
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **State Management**: React Context + Custom Hooks
- **Icons**: Lucide React

### Data Flow
1. **Mock API** - Simulates real-time latency data and historical trends
2. **Custom Hooks** - Manage data fetching and state
3. **3D Visualization** - Renders interactive globe with exchange locations
4. **Real-time Updates** - Refreshes data every 10 seconds
5. **User Interactions** - Click/hover exchanges for detailed information

### Key Components

#### Map3D Component
- Renders 3D earth using Three.js
- Displays exchange markers with provider-specific colors
- Shows animated latency connections
- Handles user interactions (zoom, pan, rotate)

#### ControlPanel Component
- Multi-tab interface for filters and settings
- Real-time filter application
- Theme and visualization controls
- Search functionality for exchanges

#### LatencyChart Component
- Time-series visualization using Recharts
- Multiple time range options (1h, 24h, 7d, 30d)
- Interactive tooltips and statistics
- Responsive design

## 📊 Exchange Data

### Supported Exchanges
- **Binance** - Multiple regions (US, EU, Asia)
- **OKX** - Global presence across all major cloud providers
- **Bybit** - Strategic locations for optimal latency
- **Deribit** - European and US locations
- **Coinbase** - US-focused with high availability

### Cloud Providers
- **AWS** - Virginia, Ireland, Singapore, Frankfurt
- **GCP** - Central US, Europe West, Asia Northeast  
- **Azure** - West US, West Europe, Southeast Asia

### Latency Quality Indicators
- **Excellent** (Green): ≤20ms - Optimal for high-frequency trading
- **Good** (Yellow): 21-50ms - Acceptable for most trading strategies
- **Fair** (Orange): 51-100ms - May impact sensitive operations
- **Poor** (Red): >100ms - Requires attention or optimization

## 🎛️ User Interface

### Control Panel Tabs

#### Filters Tab
- **Exchange Selection** - Multi-select with search functionality
- **Cloud Provider Filter** - AWS, GCP, Azure toggles
- **Latency Range** - Dual-range slider for min/max values
- **Display Options** - Toggle real-time, historical, and region views

#### Visualization Tab
- **Animation Speed** - Control connection animation rate
- **Particle Count** - Adjust visual complexity
- **Advanced Features** - Heatmap, topology, data flow toggles

#### Theme Tab
- **Mode Selection** - Dark/Light theme toggle
- **Map Style** - Realistic, Minimal, Neon options

### Interactive Features
- **Click Exchanges** - View detailed server information
- **Hover Effects** - Quick information tooltips
- **Chart Integration** - Click to view historical latency trends
- **Live Status** - Real-time connection status indicators

## 🔧 Development

### Mock Data System
The application uses a sophisticated mock data system that simulates realistic latency patterns:

- **Geographic Distance** - Latency calculated based on real-world distances
- **Provider Penalties** - Additional latency for cross-cloud connections
- **Random Variation** - Realistic network jitter and fluctuations
- **Time-based Patterns** - Daily and weekly latency patterns

### Performance Optimizations
- **React.memo** - Prevents unnecessary re-renders
- **useMemo/useCallback** - Expensive computation caching
- **Three.js Optimization** - Efficient geometry and material reuse
- **Data Filtering** - Client-side filtering for responsive interactions

### Responsive Design
- **Mobile-First** - Tailored for touch interfaces
- **Adaptive Layout** - Dynamic component positioning
- **Touch Controls** - Mobile-optimized 3D interactions
- **Performance Scaling** - Reduced complexity on mobile devices

## 🚀 Deployment

### Build Optimization
```bash
npm run build
```

### Environment Variables
Create a `.env.local` file for any environment-specific configurations:
```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
# Add any additional environment variables here
```

### Deployment Platforms
- **Vercel** (Recommended) - Seamless Next.js deployment
- **Netlify** - Static site generation support
- **Docker** - Containerized deployment option

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use meaningful component and variable names
- Add comments for complex logic
- Ensure responsive design compatibility
- Test on multiple browsers and devices

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Three.js Community** - For the amazing 3D graphics library
- **React Three Fiber** - For the React integration
- **Recharts** - For the charting capabilities
- **Tailwind CSS** - For the utility-first CSS framework
- **Lucide Icons** - For the beautiful icon set

## 📞 Support

For support, please open an issue on the GitHub repository or contact the development team.

---

**Built with ❤️ for the cryptocurrency trading community**
# Hybrid High-Performance Crypto Dashboard

A professional-grade crypto trading dashboard built with a **Zero-Copy Shared Memory** architecture. It leverages **C# WPF** for the system shell and **Angular 19 + uPlot** for high-frequency data rendering.

## Architecture
- **Backend**: .NET 8 WPF (C#)
- **Frontend**: Angular 19 (Standalone Components)
- **Transport**: `CoreWebView2SharedBuffer` (Direct RAM access between C# and JS)
- **Serialization**: FlatBuffers (Binary)
- **Visualization**: uPlot (WebGL-accelerated)

---

## Prerequisites
- **.NET 8 SDK**
- **Node.js (v18+)** & npm
- **WebView2 Runtime** (installed by default on Windows 10/11)

---

## Build Instructions

### 1. Build the Frontend (Angular)
The WPF application hosts the Angular app via a Virtual Host Mapping. You must build the Angular project first so the assets exist in the `dist` folder.

```powershell
# Navigate to the web project
cd HybridApp.Web

# Install dependencies (first time only)
npm install

# Build the production assets
npm run build
```
*Note: This will output the files to `HybridApp.Web/dist/HybridApp.Web`.*

### 2. Build and Run the Backend (WPF)
The WPF app is configured to look for the Angular assets using a relative path from its executable.

```powershell
# Navigate back to the solution root (if you are in HybridApp.Web)
cd ..

# Run the WPF application
dotnet run --project HybridApp.Wpf/HybridApp.Wpf.csproj
```

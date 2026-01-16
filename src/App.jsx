import { useState } from 'react'
import ObjectDetector from './ObjectDetector.jsx'
import InventoryList from './components/InventoryList'
import { useVisionModel } from './hooks/useVisionModel'

function App() {
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [history, setHistory] = useState([])
  const { isReady } = useVisionModel() // Connects to the AI engine

  // Handler to clear the list if needed
  const clearHistory = () => setHistory([]);

  return (
    <div className="h-screen max-h-svh bg-slate-950 text-slate-200 p-4 md:p-6 overflow-hidden flex flex-col font-sans">
      <div className="max-w-6xl mx-auto w-full flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        
        {/* Left Column: Header + Active Scanner Area */}
        <div className="lg:col-span-2 flex flex-col min-h-0">
          <header className="bg-slate-900 p-5 rounded-2xl border border-slate-800 mb-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tighter uppercase">Food-Cycle </h1>
              <p className="text-slate-500 text-xs mt-1">Live AI Inventory System v1.0</p>
            </div>
            {isScannerOpen && (
              <button 
                onClick={() => setIsScannerOpen(false)}
                className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
              >
                Close Camera
              </button>
            )}
          </header>

          <div className="flex-1 bg-slate-900 rounded-3xl border border-slate-800 relative overflow-hidden min-h-0 shadow-2xl">
            {!isScannerOpen ? (
              <div className="flex flex-col items-center justify-center h-full space-y-6 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-slate-800/20 via-transparent to-transparent">
                 <div className="text-6xl grayscale opacity-50">📷</div>
                 <div className="text-center space-y-2">
                   <h2 className="text-xl font-bold">Ready to Scan?</h2>
                   <p className="text-slate-500 text-sm max-w-xs">Point your camera at fruits or vegetables to analyze shelf-life in real-time.</p>
                 </div>
                 <button 
                    disabled={!isReady}
                    onClick={() => setIsScannerOpen(true)}
                    className="px-10 py-4 bg-green-500 text-slate-950 font-black rounded-2xl hover:bg-green-400 transition-all active:scale-95 shadow-[0_0_25px_rgba(34,197,94,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isReady ? "Launch Scanner" : "INITIALIZING AI..."}
                 </button>
              </div>
            ) : (
              /* Passes history update logic to the Detector */
              <ObjectDetector onDetect={(data) => setHistory(prev => [data, ...prev])} />
            )}
          </div>
        </div>

        {/* Right Column: Persistent Inventory List */}
        <div className="lg:col-span-1 min-h-0 flex flex-col">
           <InventoryList items={history} onClear={clearHistory} />
        </div>
      </div>
    </div>
  )
}

export default App
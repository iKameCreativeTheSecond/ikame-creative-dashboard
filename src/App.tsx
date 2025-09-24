import './App.css'
import Charts, { type ChartObjectData } from './components/Charts'

// Dữ liệu mẫu cho component Charts thống nhất
const chartsData: ChartObjectData[] = [
  { name: 'Team Alpha', time: '2025-09-01', performacePoint: 85, basePoint: 92, creativePoint: 78 },
  { name: 'Team Beta', time: '2025-09-01', performacePoint: 78, basePoint: 81, creativePoint: 89 },
  { name: 'Team Gamma', time: '2025-09-01', performacePoint: 90, basePoint: 88, creativePoint: 84 },
  
  { name: 'Team Alpha', time: '2025-09-10', performacePoint: 88, basePoint: 95, creativePoint: 82 },
  { name: 'Team Beta', time: '2025-09-10', performacePoint: 82, basePoint: 79, creativePoint: 91 },
  { name: 'Team Gamma', time: '2025-09-10', performacePoint: 87, basePoint: 91, creativePoint: 86 },
  
  { name: 'Team Alpha', time: '2025-09-20', performacePoint: 91, basePoint: 89, creativePoint: 85 },
  { name: 'Team Beta', time: '2025-09-20', performacePoint: 85, basePoint: 88, creativePoint: 93 },
  { name: 'Team Gamma', time: '2025-09-20', performacePoint: 93, basePoint: 96, creativePoint: 90 },
]

export default function App() {
  return (
    <div style={{ padding: '20px' }}>
      <Charts 
        data={chartsData} 
        title="Team Performance Dashboard" 
        height={500}
      />
    </div>
  )
}

import './App.css'
import Charts, { type ChartObjectData } from './components/Charts'

// Dữ liệu mẫu cho component Charts thống nhất
const chartsData: ChartObjectData[] = [
  { name: 'Team Alpha', time: '2025-09-01', score1: 85, score2: 92, score3: 78 },
  { name: 'Team Beta', time: '2025-09-01', score1: 78, score2: 81, score3: 89 },
  { name: 'Team Gamma', time: '2025-09-01', score1: 90, score2: 88, score3: 84 },
  
  { name: 'Team Alpha', time: '2025-09-10', score1: 88, score2: 95, score3: 82 },
  { name: 'Team Beta', time: '2025-09-10', score1: 82, score2: 79, score3: 91 },
  { name: 'Team Gamma', time: '2025-09-10', score1: 87, score2: 91, score3: 86 },
  
  { name: 'Team Alpha', time: '2025-09-20', score1: 91, score2: 89, score3: 85 },
  { name: 'Team Beta', time: '2025-09-20', score1: 85, score2: 88, score3: 93 },
  { name: 'Team Gamma', time: '2025-09-20', score1: 93, score2: 96, score3: 90 },
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

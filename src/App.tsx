import './App.css'
import LineChart, { type MultiObjectData } from './components/LineChart'
import ColumnChart, { type ColumnObjectData } from './components/ColumnChart'

const datasets: MultiObjectData[] = [
  {
    name: 'Đối tượng A',
    data: [
      { name: 'Đối tượng A', time: '2025-09-01', score: 72 },
      { name: 'Đối tượng A', time: '2025-09-05', score: 7},
      { name: 'Đối tượng A', time: '2025-09-10', score: 81},
      { name: 'Đối tượng A', time: '2025-09-15', score: 73},
      { name: 'Đối tượng A', time: '2025-09-20', score: 88},
      { name: 'Đối tượng A', time: '2025-09-24', score: 92},
    ],
  },
  {
    name: 'Đối tượng B',
    data: [
      { name: 'Đối tượng B', time: '2025-09-01', score: 65 },
      { name: 'Đối tượng B', time: '2025-09-05', score: 70},
      { name: 'Đối tượng B', time: '2025-09-10', score: 15},
      { name: 'Đối tượng B', time: '2025-09-15', score: 78},
      { name: 'Đối tượng B', time: '2025-09-20', score: 10},
      { name: 'Đối tượng B', time: '2025-09-24', score: 85},
    ],
  },
]

// Dữ liệu mẫu cho ColumnChart
const columnData: ColumnObjectData[] = [
  { name: 'Team Alpha', time: '2025-09-01', score1: 85, score2: 92 },
  { name: 'Team Beta', time: '2025-09-01', score1: 78, score2: 81 },
  { name: 'Team Gamma', time: '2025-09-01', score1: 90, score2: 88 },
  
  { name: 'Team Alpha', time: '2025-09-10', score1: 88, score2: 95 },
  { name: 'Team Beta', time: '2025-09-10', score1: 82, score2: 79 },
  { name: 'Team Gamma', time: '2025-09-10', score1: 87, score2: 91 },
  
  { name: 'Team Alpha', time: '2025-09-20', score1: 91, score2: 89 },
  { name: 'Team Beta', time: '2025-09-20', score1: 85, score2: 88 },
  { name: 'Team Gamma', time: '2025-09-20', score1: 93, score2: 96 },
]

export default function App() {
  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <LineChart datasets={datasets} title="Performance Points Chart" />
      <ColumnChart data={columnData} title="Team Performance Comparison" />
    </div>
  )
}

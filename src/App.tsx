import './App.css'
import LineChart, { type MultiObjectData } from './components/LineChart'

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

export default function App() {
  return (
    <LineChart datasets={datasets} title="Performance Points Chart" />
  )
}

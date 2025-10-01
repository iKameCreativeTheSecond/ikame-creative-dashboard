import { useState } from 'react'
import LineChart, { type MultiObjectData } from './LineChart'
import ColumnChart, { type ColumnObjectData } from './ColumnChart'
import './Chart.css'

export type ChartObjectData = { 
    name: string;
    time: string;
    performacePoint: number;
    basePoint: number;
    creativePoint: number;
}

export type ChartsProps = {
    data: ChartObjectData[]
    issues?: import('./ProjectIssueTable').ProjectIssue[]
    title?: string
    height?: number
}

type ChartType = 'line' | 'column'

export default function Charts({ data, issues = [], title = 'Performance Dashboard', height = 440 }: ChartsProps) {
    const [chartType, setChartType] = useState<ChartType>('line')

    // Chuyển đổi dữ liệu cho LineChart
    const lineChartData: MultiObjectData[] = (() => {
        const grouped = data.reduce((acc, item) => {
            if (!acc[item.name]) {
                acc[item.name] = {
                    name: item.name,
                    data: []
                }
            }
            // Sử dụng score1 làm điểm chính cho LineChart
            acc[item.name].data.push({
                name: item.name,
                time: item.time,
                score: item.performacePoint,
                score2: item.basePoint,
            })

            return acc
        }, {} as Record<string, MultiObjectData>)
        
        return Object.values(grouped)
    })()

    // Chuyển đổi dữ liệu cho ColumnChart
    const columnChartData: ColumnObjectData[] = data.map(item => ({
        name: item.name,
        time: item.time,
        score1: item.performacePoint,
        score2: item.basePoint,
        score3: item.creativePoint
    }))

    const toggleChartType = () => {
        setChartType(prev => prev === 'line' ? 'column' : 'line')
    }

    return (
        <div className="chart-card" style={{ height }}>
            <div className="chart-header">
                <div className="chart-header-left">
                    <svg 
                        className="chart-header-icon" 
                        width="18" 
                        height="18" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        aria-hidden
                    >
                        {chartType === 'line' ? (
                            <path 
                                d="M4 20V10M10 20V4M16 20v-6M3 20h18" 
                                stroke="#5F6D7A" 
                                strokeWidth="2" 
                                strokeLinecap="round"
                            />
                        ) : (
                            <path 
                                d="M3 13h4v7H3zM10 9h4v11h-4zM17 5h4v15h-4z" 
                                fill="#5F6D7A"
                            />
                        )}
                    </svg>
                    <span className="chart-header-title">{title}</span>
                </div>
                <div className="chart-actions">
                    <button 
                        className="icon-button" 
                        title="Đổi kiểu biểu đồ" 
                        aria-label="Đổi kiểu biểu đồ"
                        onClick={toggleChartType}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                            {chartType === 'line' ? (
                                <path 
                                    d="M3 13h4v7H3zM10 9h4v11h-4zM17 5h4v15h-4z" 
                                    fill="#5F6D7A"
                                />
                            ) : (
                                <path 
                                    d="M4 20V10M10 20V4M16 20v-6M3 20h18" 
                                    stroke="#5F6D7A" 
                                    strokeWidth="2" 
                                    strokeLinecap="round"
                                />
                            )}
                        </svg>
                    </button>
                </div>
            </div>
            
            <div style={{ height: 'calc(100% - 60px)' }}>
                {chartType === 'line' ? (
                    <div style={{ height: '100%', paddingTop: '0' }}>
                        <LineChart 
                            datasets={lineChartData} 
                            issues={issues}
                            title=""  // Bỏ title vì đã có ở header chung
                            height={height - 60} // Trừ đi chiều cao của header
                        />
                    </div>
                ) : (
                    <div style={{ height: '100%', paddingTop: '0' }}>
                        <ColumnChart 
                            data={ columnChartData } 
                            issues={issues}    
                            title=""  // Bỏ title vì đã có ở header chung
                            height={height - 60} // Trừ đi chiều cao của header
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
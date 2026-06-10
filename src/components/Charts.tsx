import { useState } from 'react'
import { Button, Typography } from 'antd'
import { FaChartBar, FaChartLine } from 'react-icons/fa'
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
    assigneeNameByEmail?: Record<string, string>
    title?: string
    height?: number
}

type ChartType = 'line' | 'column'

export default function Charts({ data, issues = [], assigneeNameByEmail, title = 'Performance Dashboard', height = 440 }: ChartsProps) {
    const [chartType, setChartType] = useState<ChartType>('line')

    const assigneeLookup = assigneeNameByEmail ?? {}

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
                score3: item.creativePoint
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
                    {chartType === 'line'
                        ? <FaChartLine className="section-icon" />
                        : <FaChartBar className="section-icon" />
                    }
                    <Typography.Text strong className="chart-header-title">{title}</Typography.Text>
                </div>
                <div className="chart-actions">
                    <Button
                        type="text"
                        size="small"
                        title="Đổi kiểu biểu đồ"
                        icon={chartType === 'line' ? <FaChartBar style={{ color: '#5F6D7A' }} /> : <FaChartLine style={{ color: '#5F6D7A' }} />}
                        onClick={toggleChartType}
                    />
                </div>
            </div>
            
            <div style={{ height: 'calc(100% - 60px)' }}>
                {chartType === 'line' ? (
                    <div style={{ height: '100%', paddingTop: '0' }}>
                        <LineChart 
                            datasets={lineChartData} 
                            issues={issues}
                            assigneeNameByEmail={assigneeLookup}
                            title=""  // Bỏ title vì đã có ở header chung
                            height={height - 60} // Trừ đi chiều cao của header
                        />
                    </div>
                ) : (
                    <div style={{ height: '100%', paddingTop: '0' }}>
                        <ColumnChart 
                            data={ columnChartData } 
                            issues={issues}    
                            assigneeNameByEmail={assigneeLookup}
                            title=""  // Bỏ title vì đã có ở header chung
                            height={height - 60} // Trừ đi chiều cao của header
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
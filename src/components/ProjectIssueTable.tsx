import { useState, useMemo, useCallback, useEffect } from 'react';
import { Button, Select, Typography } from 'antd';
import { FaTable } from 'react-icons/fa';
import './ProjectIssueTable.css';
import type { ProjectIssue } from '../common/GlobalData';

export type { ProjectIssue };

interface ProjectIssueTableProps {
    data: ProjectIssue[];
    title?: string;
    dateRange?: { startDate: string | null; endDate: string | null } | null;
    selectedTeams?: string[];
    selectedStaff?: string[];
    onFilteredDataChange?: (filtered: ProjectIssue[]) => void;
    assigneeNameByEmail?: Record<string, string>;
}

interface FilterState {
    projectName: string[];
    status: string[];
}

export default function ProjectIssueTable({
    data,
    title = "Project Issues",
    dateRange,
    selectedTeams = [],
    selectedStaff = [],
    onFilteredDataChange,
    assigneeNameByEmail = {},
}: ProjectIssueTableProps) {
    // Filter states
    const [filters, setFilters] = useState<FilterState>({
        projectName: [],
        status: []
    });

    // Get unique values for filter options
    const uniqueProjects = useMemo(() => {
        return Array.from(new Set(data.map(item => item.Project).filter(Boolean))).sort();
    }, [data]);

    // Filter data based on current filters
    const filteredData = useMemo(() => {
        const selectedStaffNormalized = new Set(selectedStaff.map(s => String(s ?? '').trim().toLowerCase()).filter(Boolean));
        const selectedStaffNamesNormalized = new Set(
            selectedStaff
                .map(s => assigneeNameByEmail[String(s ?? '').trim().toLowerCase()])
                .filter(Boolean)
                .map(n => String(n).trim().toLowerCase())
        );

        return data.filter(item => {
            // Date range filter
            if (dateRange && dateRange.startDate && dateRange.endDate) {
                const itemDate = new Date(item.StartWeek);
                const startDate = new Date(dateRange.startDate);
                const endDate = new Date(dateRange.endDate);
                if (itemDate < startDate || itemDate > endDate) {
                    return false;
                }
            }

            // Team filter (from main Filter component)
            if (selectedTeams.length > 0 && !selectedTeams.includes(item.Team)) {
                return false;
            }

            // Staff/Assignee filter (from main Filter component)
            if (selectedStaff.length > 0) {
                const matchesStaff = item.Assignees.some(assignee => {
                    const normalized = String(assignee ?? '').trim().toLowerCase();
                    if (!normalized) return false;
                    return selectedStaffNormalized.has(normalized) || selectedStaffNamesNormalized.has(normalized);
                });
                if (!matchesStaff) return false;
            }

            // Project name filter
            if (filters.projectName.length > 0 && !filters.projectName.includes(item.Project)) {
                return false;
            }

            // Status filter based on Difference value
            if (filters.status.length > 0) {
                const matchesStatus = filters.status.some(status => {
                    if (status === 'positive' && item.Difference > 0) return true;
                    if (status === 'negative' && item.Difference < 0) return true;
                    if (status === 'zero' && item.Difference === 0) return true;
                    return false;
                });
                if (!matchesStatus) return false;
            }

            return true;
        });
    }, [data, dateRange, filters.projectName, filters.status, selectedStaff, selectedTeams, assigneeNameByEmail]);

    useEffect(() => {
        onFilteredDataChange?.(filteredData);
    }, [filteredData, onFilteredDataChange]);

    const handleFilterChange = useCallback((key: keyof FilterState, values: string[]) => {
        setFilters(prev => ({ ...prev, [key]: values }));
    }, []);

    // Clear all filters
    const clearFilters = useCallback(() => {
        setFilters({
            projectName: [],
            status: []
        });
    }, []);

    // Check if any filters are active
    const hasActiveFilters = filters.projectName.length > 0 || filters.status.length > 0;

    // Format date for display
    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString();
        } catch {
            return dateString;
        }
    };

    // Format assignees list for display
    const formatAssignees = (assignees: string[]) => {
        if (assignees.length === 0) return 'No assignees';
        const displayAssignees = assignees.map(a => {
            const key = String(a ?? '').trim().toLowerCase();
            return assigneeNameByEmail[key] ?? a;
        });
        if (displayAssignees.length <= 2) return displayAssignees.join(', ');
        return `${displayAssignees.slice(0, 2).join(', ')} +${displayAssignees.length - 2} more`;
    };

    // Get status based on difference
    const getStatusClass = (difference: number) => {
        if (difference > 0) return 'status-positive';
        if (difference < 0) return 'status-negative';
        return 'status-neutral';
    };

    const getStatusText = (difference: number) => {
        if (difference > 0) return `+${difference}`;
        if (difference < 0) return `${difference}`;
        return '0';
    };

    return (
        <div className="project-issue-table-container">
            <div className="project-issue-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FaTable className="section-icon" />
                    <h3 style={{ margin: 0 }}>{title}</h3>
                </div>
                <span className="project-count">{filteredData.length} of {data.length}</span>
            </div>
            
            {/* Filter Controls */}
            <div className="filter-controls">
                <div className="filter-row">
                    <div className="filter-group">
                        <Typography.Text style={{ display: 'block', marginBottom: 6, color: '#d0e8f5', fontSize: 13, fontWeight: 500 }}>Project Name</Typography.Text>
                        <Select
                            mode="multiple"
                            allowClear
                            placeholder="All Projects"
                            style={{ width: '100%' }}
                            value={filters.projectName}
                            onChange={(values) => handleFilterChange('projectName', values)}
                            options={uniqueProjects.map(p => ({ value: p, label: p }))}
                        />
                    </div>

                    <div className="filter-group">
                        <Typography.Text style={{ display: 'block', marginBottom: 6, color: '#d0e8f5', fontSize: 13, fontWeight: 500 }}>Difference</Typography.Text>
                        <Select
                            mode="multiple"
                            allowClear
                            placeholder="All Differences"
                            style={{ width: '100%' }}
                            value={filters.status}
                            onChange={(values) => handleFilterChange('status', values)}
                            options={[
                                { value: 'positive', label: 'Positive (+)' },
                                { value: 'negative', label: 'Negative (-)' },
                                { value: 'zero',     label: 'Zero (0)'     },
                            ]}
                        />
                    </div>

                    <Button
                        onClick={clearFilters}
                        disabled={!hasActiveFilters}
                        danger={hasActiveFilters}
                        style={{ alignSelf: 'flex-end' }}
                    >
                        Clear Filters
                    </Button>
                </div>
            </div>
            
            <div className="table-wrapper">
                <table className="team-table">
                    <thead>
                        <tr>
                            <th>Project</th>
                            <th>Team</th>
                            <th>Task Type</th>
                            <th>Start Week</th>
                            <th>Completed</th>
                            <th>Total Orders</th>
                            <th>Difference</th>
                            <th>Assignees</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="no-data">
                                    {data.length === 0 ? 'No project issues found' : 'No projects match the current filters'}
                                </td>
                            </tr>
                        ) : (
                            filteredData.map((issue, index) => (
                                <tr key={issue.ID || index}>
                                    <td className="project-name">{issue.Project}</td>
                                    <td className="team-name">{issue.Team}</td>
                                    <td className="task-type">{issue.TaskType || 'N/A'}</td>
                                    <td>{formatDate(issue.StartWeek)}</td>
                                    <td className="completed-count">{issue.CompletedCount}</td>
                                    <td className="order-count">{issue.OrderCount}</td>
                                    <td className={`difference ${getStatusClass(issue.Difference)}`}>
                                        {getStatusText(issue.Difference)}
                                    </td>
                                    <td
                                        className="assignees"
                                        title={issue.Assignees
                                            .map(a => {
                                                const key = String(a ?? '').trim().toLowerCase();
                                                return assigneeNameByEmail[key] ?? a;
                                            })
                                            .join(', ')}
                                    >
                                        {formatAssignees(issue.Assignees)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
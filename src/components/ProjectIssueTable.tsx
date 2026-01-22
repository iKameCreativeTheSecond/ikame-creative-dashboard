import { useState, useMemo, useCallback, useEffect } from 'react';
import './ProjectIssueTable.css';

export type ProjectIssue = {
    Id?: string;
    Project: string;
    StartWeek: string;
    CompletedCount: number;
    Assignees: string[];
    Difference: number;
    Team: string;
    OrderCount: number;
    TaskType : string;
}

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

    // Handle filter changes for multi-select
    const handleFilterChange = useCallback((key: keyof FilterState, value: string) => {
        setFilters(prev => {
            const currentValues = prev[key] as string[];
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];
            return { ...prev, [key]: newValues };
        });
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
                <h3>{title}</h3>
                <span className="project-count">{filteredData.length} of {data.length}</span>
            </div>
            
            {/* Filter Controls */}
            <div className="filter-controls">
                <div className="filter-row">
                    <div className="filter-group">
                        <label>Project Name:</label>
                        <div className="multi-select-container">
                            <div className="multi-select-display">
                                {filters.projectName.length === 0 ? 'All Projects' : `${filters.projectName.length} selected`}
                            </div>
                            <div className="multi-select-options">
                                {uniqueProjects.map(project => (
                                    <label key={project} className="multi-select-option">
                                        <input
                                            type="checkbox"
                                            checked={filters.projectName.includes(project)}
                                            onChange={() => handleFilterChange('projectName', project)}
                                        />
                                        <span>{project}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="filter-group">
                        <label>Difference:</label>
                        <div className="multi-select-container">
                            <div className="multi-select-display">
                                {filters.status.length === 0 ? 'All Differences' : `${filters.status.length} selected`}
                            </div>
                            <div className="multi-select-options">
                                <label className="multi-select-option">
                                    <input
                                        type="checkbox"
                                        checked={filters.status.includes('positive')}
                                        onChange={() => handleFilterChange('status', 'positive')}
                                    />
                                    <span>Positive (+)</span>
                                </label>
                                <label className="multi-select-option">
                                    <input
                                        type="checkbox"
                                        checked={filters.status.includes('negative')}
                                        onChange={() => handleFilterChange('status', 'negative')}
                                    />
                                    <span>Negative (-)</span>
                                </label>
                                <label className="multi-select-option">
                                    <input
                                        type="checkbox"
                                        checked={filters.status.includes('zero')}
                                        onChange={() => handleFilterChange('status', 'zero')}
                                    />
                                    <span>Zero (0)</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={clearFilters}
                        className={`clear-filters-btn ${hasActiveFilters ? 'active' : ''}`}
                        title="Clear all filters"
                        disabled={!hasActiveFilters}
                    >
                        Clear Filters {hasActiveFilters && '✕'}
                    </button>
                </div>
            </div>
            
            <div className="table-wrapper">
                <table className="project-issue-table">
                    <thead>
                        <tr>
                            <th>Project</th>
                            <th>Team</th>
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
                                <td colSpan={7} className="no-data">
                                    {data.length === 0 ? 'No project issues found' : 'No projects match the current filters'}
                                </td>
                            </tr>
                        ) : (
                            filteredData.map((issue, index) => (
                                <tr key={issue.Id || index}>
                                    <td className="project-name">{issue.Project}</td>
                                    <td className="team-name">{issue.Team}</td>
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
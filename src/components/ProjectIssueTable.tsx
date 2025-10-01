import './ProjectIssueTable.css';

export type ProjectIssue = {
    id?: string;
    project: string;
    startWeek: string;
    completedCount: number;
    assignees: string[];
    difference: number;
    team: string;
    orderCount: number;
}

interface ProjectIssueTableProps {
    data: ProjectIssue[];
    title?: string;
}

export default function ProjectIssueTable({ data, title = "Project Issues" }: ProjectIssueTableProps) {
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
        if (assignees.length <= 2) return assignees.join(', ');
        return `${assignees.slice(0, 2).join(', ')} +${assignees.length - 2} more`;
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
                <span className="project-count">{data.length} projects</span>
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
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="no-data">
                                    No project issues found
                                </td>
                            </tr>
                        ) : (
                            data.map((issue, index) => (
                                <tr key={issue.id || index}>
                                    <td className="project-name">{issue.project}</td>
                                    <td className="team-name">{issue.team}</td>
                                    <td>{formatDate(issue.startWeek)}</td>
                                    <td className="completed-count">{issue.completedCount}</td>
                                    <td className="order-count">{issue.orderCount}</td>
                                    <td className={`difference ${getStatusClass(issue.difference)}`}>
                                        {getStatusText(issue.difference)}
                                    </td>
                                    <td className="assignees" title={issue.assignees.join(', ')}>
                                        {formatAssignees(issue.assignees)}
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
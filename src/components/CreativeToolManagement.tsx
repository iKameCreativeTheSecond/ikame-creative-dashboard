import { useEffect, useState } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import './AdminContent.css';
import AdminData, { CreativeTool } from '../common/AdministratorData';


export default function CreativeToolManagement()
{
    const serverUrl = import.meta.env.VITE_REACT_APP_SERVER_URL ?? "http://localhost:8888";
    async function fetchCreativeTools(): Promise<CreativeTool[]>
    {
        try {
            const response = await fetch(serverUrl + "/get/creative-tools", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error fetching team members:", error);
            throw error;
        }
    }


    const [ creativeTools, setCreativeTools ] = useState<CreativeTool[]>([]);
    const [ filter, setFilter ] = useState("");
    const [ currentPage, setCurrentPage ] = useState(1);
    const [ rowsPerPage, setRowsPerPage ] = useState(10);
    const [ showModal, setShowModal ] = useState(false);
    const [ editingTool, setEditingTool ] = useState<CreativeTool | null>(null);
    const [ formData, setFormData ] = useState<CreativeTool>({
        Team     : '',
        ToolName : '',
        Type     : '',
        Point    : []
    });

    useEffect(() =>
    {
        if (AdminData.CretiveTools.length > 0)
        {
            setCreativeTools(AdminData.CretiveTools);
        }
        else
        {
            fetchCreativeTools().then(data =>
            {
                setCreativeTools(data);
                AdminData.CretiveTools = data;
            });
        }
    }, []);


    const handleEdit = (toolName: string, team: string) => {
        const tool = creativeTools.find(m => m.ToolName === toolName && m.Team === team);
        if (tool) {
            setEditingTool(tool);
            setFormData(tool);
            setShowModal(true);
        }
    };

    const handleDelete = (team: string, toolName: string) =>
    {
        // show popup to confirm deletion
        if (window.confirm("Are you sure you want to delete this creative tool?")) 
        {
            fetch(`${serverUrl}/post/delete-creative-tool`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ToolName: toolName, Team: team })
            }).then(() => {
                // console.log("Deleted creative tool with Name:", toolName);
                const data = creativeTools.filter(tool => tool.ToolName !== toolName);
                AdminData.CretiveTools = data;
                setCreativeTools(data);
            }).catch((error) => {
                console.error("Error deleting creative tool:", error);
                alert("Failed to delete creative tool. Please try again.");
            });
        }
    };

    const handleAdd = () => {
        setEditingTool(null);
        setFormData({
            Team     : '',
            ToolName : '',
            Type     : '',
            Point    : []
        });
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
    };

    const handleFormChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingTool) 
        {
            // Edit existing creative tool
            fetch(`${serverUrl}/post/update-creative-tool`, { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            }).then(() =>
            {
                const data = creativeTools.map(tool => tool.ToolName === editingTool.ToolName ? formData : tool);
                AdminData.CretiveTools = data;
                setCreativeTools(data);
            }).catch((error) => {
                console.error("Error updating creative tool:", error);
                alert("Failed to update creative tool. Please try again.");
            });
        } else 
        {
            // console.log("Adding new creative tool:", formData);
            fetch(`${serverUrl}/post/add-new-creative-tool`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            }).then(() =>
            {
                const data = [...creativeTools, formData];
                setCreativeTools(data);
                AdminData.CretiveTools = data;
            }).catch((error) => {
                console.error("Error adding new creative tool:", error);
                alert("Failed to add new creative tool. Please try again.");
            });
        }
        setShowModal(false);
    };

    // Helper function to get type display name
    const getTypeDisplayName = (type: string) => {
        switch (type) {
            case 't': return 'Task';
            case 'q': return 'Process';
            default: return type;
        }
    };

    // Filter creative tools by tool name, team, or type
    const filteredTools = creativeTools.filter(tool => {
        const filterLower = filter.toLowerCase();
        const typeDisplayName = getTypeDisplayName(tool.Type).toLowerCase();
        return (
            tool.ToolName.toLowerCase().includes(filterLower) ||
            tool.Team.toLowerCase().includes(filterLower) ||
            tool.Type.toLowerCase().includes(filterLower) ||
            typeDisplayName.includes(filterLower)
        );
    });

    // Reset to first page when filter changes
    useEffect(() => { setCurrentPage(1); }, [filter]);

    // Ensure current page is valid when data size or rowsPerPage changes
    useEffect(() => {
        const totalPages = Math.max(1, Math.ceil(filteredTools.length / rowsPerPage));
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [filteredTools.length, rowsPerPage]);

    const totalItems = filteredTools.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
    const startIndex = (currentPage - 1) * rowsPerPage;
    const currentItems = filteredTools.slice(startIndex, startIndex + rowsPerPage);

    return (
        <div className="team-management">
            <p className="admin-description">Add, edit, or remove creative tools from the system.</p>
            <div className="content-header">
            <div className="header-left">
                <input
                    type="text"
                    className="filter-input"
                    placeholder="Filter by tool name, team, or type..."
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                />
            </div>
                <div className="header-right">
                    <button className="btn-add-policy" onClick={handleAdd}>
                        + Add Creative Tool
                    </button>
                </div>
            </div>

                        {/* Table footer with pagination */}
            <div className="table-footer">
                <div className="rows-per-page">
                    <label>
                        Rows per page:
                        <select value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))}>
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </label>
                </div>
                <div className="pagination-info">
                    {totalItems === 0 ? 'No tools' : `${startIndex + 1}-${Math.min(startIndex + rowsPerPage, totalItems)} of ${totalItems}`}
                </div>
                <div className="pagination-controls">
                    <button
                        className="page-button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(1)}
                        aria-label="First page"
                    >«</button>
                    <button
                        className="page-button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        aria-label="Previous page"
                    >‹</button>
                    <span className="page-indicator">Page {currentPage} of {totalPages}</span>
                    <button
                        className="page-button"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        aria-label="Next page"
                    >›</button>
                    <button
                        className="page-button"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(totalPages)}
                        aria-label="Last page"
                    >»</button>
                </div>
            </div>

            <div className="table-container">
                <table className="team-table">
                <thead>
                    <tr>
                        <th>Tool Name</th>
                        <th>Team</th>
                        <th>Type</th>
                        <th>Points</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {currentItems.map(tool => (
                        <tr key={tool.ToolName}>
                            <td>{tool.ToolName}</td>
                            <td>{tool.Team}</td>
                            <td>
                                <span className={`badge badge-${tool.Type === 't' ? 'task' : 'process'}`}>
                                    {getTypeDisplayName(tool.Type)}
                                </span>
                            </td>
                            <td>{Array.isArray(tool.Point) ? tool.Point.join(', ') : tool.Point}</td>
                            <td>
                                <div className="action-buttons">
                                    <button className="icon-button edit-button" onClick={() => handleEdit(tool.ToolName, tool.Team)} title="Edit">
                                        <FaEdit  />
                                    </button>
                                    <button className="icon-button delete-button" onClick={() => handleDelete(tool.Team, tool.ToolName)} title="Delete">
                                        <FaTrash />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>{editingTool ? 'Edit Creative Tool' : 'Add Creative Tool'}</h2>
                        <form onSubmit={handleFormSubmit} className="modal-form">
                            <label>
                                Team:
                                <select name="Team" value={formData.Team} onChange={handleFormChange} required>
                                    <option value="">Select Team</option>
                                    <option value="PLA Creative">PLA Creative</option>
                                    <option value="Art Creative">Art Creative</option>
                                    <option value="Video Creative">Video Creative</option>
                                    <option value="Research Creative">Research Creative</option>
                                    <option value="Concept Creative">Concept Creative</option>
                                </select>
                            </label>
                            <label>
                                Tool Name:
                                <input name="ToolName" value={formData.ToolName} onChange={handleFormChange} required />
                            </label>
                            <label>
                                Type:
                                <select name="Type" value={formData.Type} onChange={handleFormChange} required>
                                    <option value="">Select Type</option>
                                    <option value="t">Task</option>
                                    <option value="q">Process</option>
                                </select>
                            </label>
                            <label>
                                Points:
                                <div className="points-display" style={{ marginTop: '8px', marginBottom: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                    {formData.Point.map((point, index) => (
                                        <span key={index} className="point-tag" style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            backgroundColor: '#e3f2fd',
                                            color: '#1976d2',
                                            padding: '4px 8px',
                                            borderRadius: '16px',
                                            fontSize: '12px',
                                            fontWeight: '500'
                                        }}>
                                            {point}
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    const newPoints = formData.Point.filter((_, i) => i !== index);
                                                    setFormData(prev => ({ ...prev, Point: newPoints }));
                                                }}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    marginLeft: '6px',
                                                    cursor: 'pointer',
                                                    color: '#1976d2',
                                                    fontSize: '14px',
                                                    fontWeight: 'bold'
                                                }}
                                            >×</button>
                                        </span>
                                    ))}
                                </div>
                                <input
                                    type="number"
                                    placeholder="Add new point (press Enter)"
                                    onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const target = e.target as HTMLInputElement;
                                            const value = Number(target.value);
                                            if (!isNaN(value) && value !== 0) {
                                                setFormData(prev => ({ ...prev, Point: [...prev.Point, value] }));
                                                target.value = '';
                                            }
                                        }
                                    }}
                                />
                            </label>
                            <div className="modal-actions">
                                <button type="submit" className="save-button">Save</button>
                                <button type="button" className="cancel-button" onClick={handleModalClose}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

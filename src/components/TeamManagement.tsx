import { useEffect, useState } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import './AdminContent.css';
import type { TeamMember } from '../common/AdministratorData';
import AdminData from '../common/AdministratorData';


export default function TeamManagement()
{
    const serverUrl = import.meta.env.VITE_REACT_APP_SERVER_URL ?? "http://localhost:8888";
    async function fetchTeamMembers(): Promise<TeamMember[]>
    {
        try {
            const response = await fetch(serverUrl + "/get/team-members", {
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


    const [ teamMembers, setTeamMembers ] = useState<TeamMember[]>([]);
    const [ filter, setFilter ] = useState("");
    const [ currentPage, setCurrentPage ] = useState(1);
    const [ rowsPerPage, setRowsPerPage ] = useState(10);
    const [ showModal, setShowModal ] = useState(false);
    const [ editingMember, setEditingMember ] = useState<TeamMember | null>(null);
    const [ formData, setFormData ] = useState<TeamMember>({
        ID: '',
        MemberID: '',
        Name: '',
        YOB: new Date().getFullYear(),
        Email: '',
        Role: '',
        Team: ''
    });

    useEffect(() =>
    {
        if (AdminData.TeamMembers.length > 0)
        {
            setTeamMembers(AdminData.TeamMembers);
        }
        else
        {
            fetchTeamMembers().then(data =>
            {
                setTeamMembers(data);
                AdminData.TeamMembers = data;
            });
        }
    }, []);


    const handleEdit = (id: string) => {
        const member = teamMembers.find(m => m.ID === id);
        if (member) {
            setEditingMember(member);
            setFormData(member);
            setShowModal(true);
        }
    };

    const handleDelete = (id: string) =>
    {
        // show popup to confirm deletion
        if (window.confirm("Are you sure you want to delete this team member?")) 
        {
            fetch(`${serverUrl}/post/delete-team-member`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ MemberID: id })
            }).then(() => {
                // console.log("Deleted team member with ID:", id);
                const data = teamMembers.filter(member => member.MemberID !== id);
                AdminData.TeamMembers = data;
                setTeamMembers(data);
            }).catch((error) => {
                console.error("Error deleting team member:", error);
                alert("Failed to delete team member. Please try again.");
            });
        }
    };

    const handleAdd = () => {
        setEditingMember(null);
        setFormData({
            ID: '',
            MemberID: '',
            Name: '',
            YOB: new Date().getFullYear(),
            Email: '',
            Role: '',
            Team: ''
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
        setFormData(prev => ({ ...prev, [name]: name === 'YOB' ? Number(value) : value }));
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingMember) 
        {
            // Edit existing member
            fetch(`${serverUrl}/post/update-team-member`, { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            }).then(() =>
            {
                const data = teamMembers.map(m => m.ID === editingMember.ID ? formData : m);
                AdminData.TeamMembers = data;
                setTeamMembers(data);
            }).catch((error) => {
                console.error("Error updating team member:", error);
                alert("Failed to update team member. Please try again.");
            });
        } else 
        {
            // console.log("Adding new team member:", formData);
            fetch(`${serverUrl}/post/add-new-team-member`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            }).then(() =>
            {
                const data = [...teamMembers, { ...formData, ID: (Math.random()*1000000).toFixed(0) }];
                setTeamMembers(data);
                AdminData.TeamMembers = data;
            }).catch((error) => {
                console.error("Error adding new team member:", error);
                alert("Failed to add new team member. Please try again.");
            });
        }
        setShowModal(false);
    };

    // Filter team members by name, email, or team
    const filteredMembers = teamMembers.filter(member => {
        const filterLower = filter.toLowerCase();
        return (
            member.Name.toLowerCase().includes(filterLower) ||
            member.Email.toLowerCase().includes(filterLower) ||
            member.Team.toLowerCase().includes(filterLower)
        );
    });

    // Reset to first page when filter changes
    useEffect(() => { setCurrentPage(1); }, [filter]);

    // Ensure current page is valid when data size or rowsPerPage changes
    useEffect(() => {
        const totalPages = Math.max(1, Math.ceil(filteredMembers.length / rowsPerPage));
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [filteredMembers.length, rowsPerPage]);

    const totalItems = filteredMembers.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
    const startIndex = (currentPage - 1) * rowsPerPage;
    const currentItems = filteredMembers.slice(startIndex, startIndex + rowsPerPage);

    return (
        <div className="team-management">
            <p className="admin-description">Add, edit, or remove team members from the system.</p>
            <div className="content-header">
            <div className="header-left">
                <input
                    type="text"
                    className="filter-input"
                    placeholder="Filter by name, email, or team..."
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                />
            </div>
                <div className="header-right">
                    <button className="btn-add-policy" onClick={handleAdd}>
                        + Add Member
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
                    {totalItems === 0 ? 'No members' : `${startIndex + 1}-${Math.min(startIndex + rowsPerPage, totalItems)} of ${totalItems}`}
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
                            <th>MemberID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Team</th>
                            <th>Role</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map(member => (
                            <tr key={member.ID}>
                                <td>{member.MemberID}</td>
                                <td>
                                    <div className="member-cell">
                                        <span className="member-avatar">{member.Name.charAt(0)}</span>
                                        <span>{member.Name}</span>
                                    </div>
                                </td>
                                <td>{ member.Email }</td>
                                <td>{member.Team}</td>
                                <td>
                                    <span className={`badge badge-${member.Role.toLowerCase()}`}>
                                        {member.Role}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="icon-button edit-button" onClick={() => handleEdit(member.ID)} title="Edit">
                                            <FaEdit  />
                                        </button>
                                        <button className="icon-button delete-button" onClick={() => handleDelete(member.MemberID)} title="Delete">
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
                        <h2>{editingMember ? 'Edit Member' : 'Add Member'}</h2>
                        <form onSubmit={handleFormSubmit} className="modal-form">
                            <label>
                                MemberID:
                                <input name="MemberID" value={formData.MemberID} onChange={handleFormChange} required />
                            </label>
                            <label>
                                Name:
                                <input name="Name" value={formData.Name} onChange={handleFormChange} required />
                            </label>
                            <label>
                                YOB:
                                <input name="YOB" type="number" value={formData.YOB} onChange={handleFormChange} required />
                            </label>
                            <label>
                                Email:
                                <input name="Email" value={formData.Email} onChange={handleFormChange} required />
                            </label>
                            <label>
                                Role:
                                <select name="Role" value={formData.Role} onChange={handleFormChange} required>
                                    <option value="">Select Role</option>
                                    <option value="Member">member</option>
                                    <option value="Admin">admin</option>
                                    <option value="Manager">manager</option>
                                </select>
                            </label>
                            <label>
                                Team:
                                <select name="Team" value={formData.Team} onChange={handleFormChange} required>
                                    <option value="">Select Team</option>
                                    <option value="PLA Creative">PLA</option>
                                    <option value="Art Creative">Art</option>
                                    <option value="Video Creative">Video</option>
                                    <option value="Research Creative">Research</option>
                                    <option value="Concept Creative">Concept</option>
                                </select>
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
import { useEffect, useState } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import './TeamManagement.css';
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
                console.log("Deleted team member with ID:", id);
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
            console.log("Adding new team member:", formData);
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

    return (
        <div className="team-management">
            <div className="content-header">
                <div className="header-left">
                    <h2 className="content-title">Sick Leave Policy</h2>
                    <p className="content-subtitle">Employees can be enrolled in one sick policy. Make sure that your policy is compliant with your state rules.</p>
                </div>
                <div className="header-right">
                    <button className="btn-add-policy" onClick={handleAdd}>
                        + Add policy
                    </button>
                </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
                <input
                    type="text"
                    className="filter-input"
                    placeholder="Filter by name, email, or team..."
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                />
            </div>

            <div className="table-container">
                <table className="team-table">
                    <thead>
                        <tr>
                            <th>MemberID</th>
                            <th>Name</th>
                            <th>Date Created</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Employees Enrolled</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredMembers.map(member => (
                            <tr key={member.ID}>
                                <td>{member.MemberID}</td>
                                <td>
                                    <div className="member-cell">
                                        <span className="member-avatar">{member.Name.charAt(0)}</span>
                                        <span>{member.Name}</span>
                                    </div>
                                </td>
                                <td>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                <td>{member.Email}</td>
                                <td>
                                    <span className={`badge badge-${member.Role.toLowerCase()}`}>
                                        {member.Role}
                                    </span>
                                </td>
                                <td>
                                    <span className="enrolled-count">0 Employees Enrolled</span>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="icon-button edit-button" onClick={() => handleEdit(member.ID)} title="Edit">
                                            <FaEdit  />
                                        </button>
                                        <button className="icon-button delete-button" onClick={() => handleDelete(member.MemberID)} title="Delete">
                                            <FaTrash />
                                        </button>
                                        <button className="icon-button more-button" title="More">
                                            ⋮
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
                                    <option value="Member">Member</option>
                                    <option value="Admin">Admin</option>
                                    <option value="Manager">Manager</option>
                                </select>
                            </label>
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
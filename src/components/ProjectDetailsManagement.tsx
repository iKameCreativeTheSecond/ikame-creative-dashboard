import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import "./AdminContent.css";
import "./Filter.css";
import "./WeeklyOrderManagement.grid.css";
import "./ProjectDetailsManagement.css";
import type { ProjectDetail } from "../common/AdministratorData";
import AdminData from "../common/AdministratorData";

const ProjectDetailsManagement: React.FC = () => {
  const serverUrl = import.meta.env.VITE_REACT_APP_SERVER_URL ?? "http://localhost:8888";
  
  async function fetchProjectDetails(): Promise<ProjectDetail[]> {
    try {
      const response = await fetch(serverUrl + "/get/project-details", {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching project details:", error);
      throw error;
    }
  }

  const [projects, setProjects] = useState<ProjectDetail[]>([]);
  const [filter, setFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectDetail | null>(null);
  const [formData, setFormData] = useState<ProjectDetail>({
    ProjectID: 0,
    Project: "",
    Research: "",
    Art: "",
    Concept: "",
    Video: "",
    Pla: "",
    UA: "",
  });

  useEffect(() => {
    if (AdminData.ProjectDetails && AdminData.ProjectDetails.length > 0) {
      setProjects(AdminData.ProjectDetails);
    } else {
      fetchProjectDetails().then(data => {
        setProjects(data);
        AdminData.ProjectDetails = data;
      }).catch((err) => {
        console.error("ERROR.", err);
      });
    }
  }, []);

  const handleEdit = (id: number) => {
    const project = projects.find((p) => p.ProjectID === id);
    if (project) {
      setEditingProject(project);
      setFormData(project);
      setShowModal(true);
    }
  };

  const handleDelete = (project: string) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      fetch(`${serverUrl}/post/delete-project-detail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ Project: project })
      }).then(() => {
        const data = projects.filter(p => p.Project !== project);
        AdminData.ProjectDetails = data;
        setProjects(data);
      }).catch((error) => {
        console.error("Error deleting project:", error);
        alert("Failed to delete project. Please try again.");
      });
    }
  };

  const handleAdd = () => {
    setEditingProject(null);
    setFormData({
      ProjectID: 0,
      Project: "",
      Research: "",
      Art: "",
      Concept: "",
      Video: "",
      Pla: "",
      UA: "",
    });
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: name === "ProjectID" ? Number(value) : value,
    }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProject) {
      // Edit existing project
      const updatedProject = { ...formData, ProjectID: editingProject.ProjectID };
      fetch(`${serverUrl}/post/update-project-detail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedProject)
      }).then(() => {
        const data = projects.map(p => p.ProjectID === editingProject.ProjectID ? updatedProject : p);
        AdminData.ProjectDetails = data;
        setProjects(data);
      }).catch((error) => {
        console.error("Error updating project:", error);
        alert("Failed to update project. Please try again.");
      });
    } else {
      // Add new project
      const newProject = { ...formData };
      fetch(`${serverUrl}/post/add-new-project-detail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newProject)
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = [...(projects ?? []), newProject];
        setProjects(data);
        AdminData.ProjectDetails = data;
      }).catch((error) => {
        console.error("Error adding new project:", error);
        alert("Failed to add new project. Please try again.");
      });
    }
    setShowModal(false);
  };

  // Filter projects by project name and team members
  const filteredProjects = (projects ?? []).filter(project => {
    const filterLower = filter.toLowerCase();
    return (
      project.Project.toLowerCase().includes(filterLower) ||
      project.Research.toLowerCase().includes(filterLower) ||
      project.Art.toLowerCase().includes(filterLower) ||
      project.Concept.toLowerCase().includes(filterLower) ||
      project.Video.toLowerCase().includes(filterLower) ||
      project.Pla.toLowerCase().includes(filterLower) ||
      project.UA.toLowerCase().includes(filterLower)
    );
  });

  // Reset to first page when filter changes
  useEffect(() => { setCurrentPage(1); }, [filter]);

  // Ensure current page is valid when data size or rowsPerPage changes
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredProjects.length / rowsPerPage));
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [filteredProjects.length, rowsPerPage, currentPage]);

  const totalItems = filteredProjects.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentItems = filteredProjects.slice(startIndex, startIndex + rowsPerPage);

  return (
    <div className="team-management">
      <p className="admin-description">Add, edit, or remove project details from the system.</p>
      <div className="content-header">
        <div className="header-left">
          <input
            type="text"
            className="filter-input"
            placeholder="Filter by project or team member..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>
        <div className="header-right">
          <button className="btn-add-policy" onClick={handleAdd}>
            + Add Project
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
          {totalItems === 0 ? 'No projects' : `${startIndex + 1}-${Math.min(startIndex + rowsPerPage, totalItems)} of ${totalItems}`}
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
              <th>Project ID</th>
              <th>Project</th>
              <th>Research</th>
              <th>Art</th>
              <th>Concept</th>
              <th>Video</th>
              <th>PLA</th>
              <th>UA</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((project) => (
              <tr key={project.ProjectID}>
                <td>{project.ProjectID}</td>
                <td>{project.Project}</td>
                <td>{project.Research}</td>
                <td>{project.Art}</td>
                <td>{project.Concept}</td>
                <td>{project.Video}</td>
                <td>{project.Pla}</td>
                <td>{project.UA}</td>
                <td>
                  <div className="action-buttons">
                    <button className="icon-button edit-button" onClick={() => handleEdit(project.ProjectID)} title="Edit">
                      <FaEdit />
                    </button>
                    <button className="icon-button delete-button" onClick={() => handleDelete(project.Project)} title="Delete">
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
            <h2>{editingProject ? "Edit Project" : "Add Project"}</h2>
            <form onSubmit={handleFormSubmit} className="modal-form project-details-form">
              <div className="form-main-fields">
                <div className="form-group">
                  <label htmlFor="ProjectID">Project ID:</label>
                  <input 
                    id="ProjectID" 
                    name="ProjectID" 
                    type="number"
                    value={formData.ProjectID || ''} 
                    onChange={handleFormChange} 
                    required 
                    placeholder="Enter project ID"
                    disabled={!!editingProject}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="Project">Project Name:</label>
                  <input 
                    id="Project" 
                    name="Project" 
                    value={formData.Project} 
                    onChange={handleFormChange} 
                    required 
                    placeholder="e.g., Dino Car Race Master"
                  />
                </div>
              </div>
              <div className="form-side-fields">
                <div className="form-group">
                  <label htmlFor="Research">Research:</label>
                  <input 
                    id="Research" 
                    name="Research" 
                    value={formData.Research} 
                    onChange={handleFormChange} 
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="Art">Art:</label>
                  <input 
                    id="Art" 
                    name="Art" 
                    value={formData.Art} 
                    onChange={handleFormChange} 
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="Concept">Concept:</label>
                  <input 
                    id="Concept" 
                    name="Concept" 
                    value={formData.Concept} 
                    onChange={handleFormChange} 
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="Video">Video:</label>
                  <input 
                    id="Video" 
                    name="Video" 
                    value={formData.Video} 
                    onChange={handleFormChange} 
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="Pla">PLA:</label>
                  <input 
                    id="Pla" 
                    name="Pla" 
                    value={formData.Pla} 
                    onChange={handleFormChange} 
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="UA">UA:</label>
                  <input 
                    id="UA" 
                    name="UA" 
                    value={formData.UA} 
                    onChange={handleFormChange} 
                    required
                  />
                </div>
              </div>
              <div className="modal-actions modal-actions-bottom">
                <button type="submit" className="save-button">Save</button>
                <button type="button" className="cancel-button" onClick={handleModalClose}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailsManagement;

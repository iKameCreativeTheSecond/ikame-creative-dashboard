import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import "./AdminContent.css";
import "./Filter.css";
import "./WeeklyOrderManagement.grid.css";
import "./TaskLevelManagement.css";
import type { Level } from "../common/AdministratorData";
import AdminData from "../common/AdministratorData";

const TaskLevelManagement: React.FC = () => {
  const serverUrl = import.meta.env.VITE_REACT_APP_SERVER_URL ?? "http://localhost:8888";
  
  async function fetchLevels(): Promise<Level[]> {
    try {
      const response = await fetch(serverUrl + "/get/levels", {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching levels:", error);
      throw error;
    }
  }

  const [levels, setLevels] = useState<Level[]>([]);
  const [filter, setFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editingLevel, setEditingLevel] = useState<Level | null>(null);
  const [levelPointsPage, setLevelPointsPage] = useState(1);
  const [formData, setFormData] = useState<Level>({
    Team: "",
    LevelPoint: [0, 0, 0, 0, 0],
  });

  const levelPointsPerPage = 12;

  useEffect(() => {
    if (AdminData.Levels && AdminData.Levels.length > 0) {
      setLevels(AdminData.Levels);
    } else {
      fetchLevels().then(data => {
        setLevels(data);
        AdminData.Levels = data;
      }).catch((err) => {
        console.error("ERROR.", err);
      });
    }
  }, []);

  const handleEdit = (team: string) => {
    const level = levels.find((l) => l.Team === team);
    if (level) {
      setEditingLevel(level);
      setFormData(level);
      setLevelPointsPage(1);
      setShowModal(true);
    }
  };

  const handleDelete = (team: string) => {
    if (window.confirm("Are you sure you want to delete this level?")) {
      fetch(`${serverUrl}/post/delete-level`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ Team: team })
      }).then(() => {
        const data = levels.filter(level => level.Team !== team);
        AdminData.Levels = data;
        setLevels(data);
      }).catch((error) => {
        console.error("Error deleting level:", error);
        alert("Failed to delete level. Please try again.");
      });
    }
  };

  const handleAdd = () => {
    setEditingLevel(null);
    setFormData({
      Team: "",
      LevelPoint: [],
    });
    setLevelPointsPage(1);
    setShowModal(true);
  };

  const handleAddLevelPoint = () => {
    setFormData((prev) => {
      const nextLevelPoints = [...prev.LevelPoint, 0];
      const nextTotalPages = Math.max(1, Math.ceil(nextLevelPoints.length / levelPointsPerPage));
      setLevelPointsPage(nextTotalPages);
      return {
        ...prev,
        LevelPoint: nextLevelPoints,
      };
    });
  };

  const handleRemoveLevelPoint = (index: number) => {
    setFormData((prev) => {
      const nextLevelPoints = prev.LevelPoint.filter((_, i) => i !== index);
      const nextTotalPages = Math.max(1, Math.ceil(nextLevelPoints.length / levelPointsPerPage));
      setLevelPointsPage((p) => Math.min(p, nextTotalPages));
      return {
        ...prev,
        LevelPoint: nextLevelPoints,
      };
    });
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  // Keep level-points page in range while the modal is open
  useEffect(() => {
    if (!showModal) return;
    const totalPages = Math.max(1, Math.ceil(formData.LevelPoint.length / levelPointsPerPage));
    if (levelPointsPage > totalPages) setLevelPointsPage(totalPages);
    if (levelPointsPage < 1) setLevelPointsPage(1);
  }, [showModal, formData.LevelPoint.length, levelPointsPage]);

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLevelPointChange = (index: number, value: string) => {
    const newLevelPoint = [...formData.LevelPoint];
    newLevelPoint[index] = Number(value) || 0;
    setFormData((prev) => ({
      ...prev,
      LevelPoint: newLevelPoint,
    }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLevel) {
      // Edit existing level
        const updatedLevel = { ...formData };
        if (!updatedLevel.LevelPoint.length)
        {
            updatedLevel.LevelPoint = [];
        }            
      fetch(`${serverUrl}/post/update-level`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedLevel)
      }).then(() => {
        const data = levels.map(l => l.Team === editingLevel.Team ? updatedLevel : l);
        AdminData.Levels = data;
        setLevels(data);
      }).catch((error) => {
        console.error("Error updating level:", error);
        alert("Failed to update level. Please try again.");
      });
    } else {
      // Add new level
        const newLevel = { ...formData };
        if (!newLevel.LevelPoint.length)
        {
            newLevel.LevelPoint = [];
        } 
      fetch(`${serverUrl}/post/add-new-level`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newLevel)
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = [...(levels ?? []), newLevel];
        setLevels(data);
        AdminData.Levels = data;
      }).catch((error) => {
        console.error("Error adding new level:", error);
        alert("Failed to add new level. Please try again.");
      });
    }
    setShowModal(false);
  };

  // Filter levels by team
  const filteredLevels = (levels ?? []).filter(level => {
    const filterLower = filter.toLowerCase();
    return level.Team.toLowerCase().includes(filterLower);
  });

  // Reset to first page when filter changes
  useEffect(() => { setCurrentPage(1); }, [filter]);

  // Ensure current page is valid when data size or rowsPerPage changes
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredLevels.length / rowsPerPage));
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [filteredLevels.length, rowsPerPage, currentPage]);

  const totalItems = filteredLevels.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentItems = filteredLevels.slice(startIndex, startIndex + rowsPerPage);

  const levelPointsTotalItems = formData.LevelPoint.length;
  const levelPointsTotalPages = Math.max(1, Math.ceil(levelPointsTotalItems / levelPointsPerPage));
  const levelPointsStartIndex = (levelPointsPage - 1) * levelPointsPerPage;
  const levelPointsCurrentItems = formData.LevelPoint.slice(
    levelPointsStartIndex,
    levelPointsStartIndex + levelPointsPerPage
  );

  return (
    <div className="team-management">
      <p className="admin-description">Add, edit, or remove task level points from the system.</p>
      <div className="content-header">
        <div className="header-left">
          <input
            type="text"
            className="filter-input"
            placeholder="Filter by team..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>
        <div className="header-right">
          <button className="btn-add-policy" onClick={handleAdd}>
            + Add Level
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
          {totalItems === 0 ? 'No levels' : `${startIndex + 1}-${Math.min(startIndex + rowsPerPage, totalItems)} of ${totalItems}`}
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
              <th>Team</th>
              <th>Level Points</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((level) => (
              <tr key={level.Team}>
                <td>{level.Team}</td>
                <td>
                  <div className="level-points-display">
                    {level.LevelPoint.map((point, index) => (
                      <span key={index} className="level-point-badge">
                        <span className="level-label">L{index + 1}:</span>
                        <span className="level-value">{point}</span>
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="icon-button edit-button" onClick={() => handleEdit(level.Team)} title="Edit">
                      <FaEdit />
                    </button>
                    <button className="icon-button delete-button" onClick={() => handleDelete(level.Team)} title="Delete">
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
          <div className="modal task-level-modal">
            <h2>{editingLevel ? "Edit Level" : "Add Level"}</h2>
            <form onSubmit={handleFormSubmit} className="modal-form task-level-form">
              <div className="form-group">
                <label htmlFor="Team">Team:</label>
                <input 
                  id="Team" 
                  name="Team" 
                  value={formData.Team} 
                  onChange={handleFormChange} 
                  required 
                  placeholder="e.g., Concept"
                  disabled={!!editingLevel}
                />
              </div>

              <div className="level-points-section">
                <div className="level-points-header">
                  <h3>Level Points</h3>
                  <button 
                    type="button" 
                    className="add-level-button"
                    onClick={handleAddLevelPoint}
                  >
                    + Add Level
                  </button>
                </div>
                {formData.LevelPoint.length === 0 ? (
                  <p style={{ color: '#6b7280', fontSize: '14px', margin: '10px 0' }}>
                    No levels added yet. Click "+ Add Level" to add level points.
                  </p>
                ) : (
                  <div className="level-points-list">
                    {levelPointsCurrentItems.map((point, index) => {
                      const absoluteIndex = levelPointsStartIndex + index;
                      return (
                      <div key={absoluteIndex} className="level-point-item">
                        <label>Level {absoluteIndex + 1}:</label>
                        <input 
                          type="number"
                          value={point} 
                          onChange={(e) => handleLevelPointChange(absoluteIndex, e.target.value)} 
                          required
                          min="0"
                          placeholder="Enter point value"
                        />
                        <button 
                          type="button" 
                          className="remove-level-button"
                          onClick={() => handleRemoveLevelPoint(absoluteIndex)}
                        >
                          Remove
                        </button>
                      </div>
                      );
                    })}
                  </div>
                )}

                {formData.LevelPoint.length > levelPointsPerPage && (
                  <div className="level-points-pagination">
                    <div className="pagination-info">
                      {`${levelPointsStartIndex + 1}-${Math.min(levelPointsStartIndex + levelPointsPerPage, levelPointsTotalItems)} of ${levelPointsTotalItems}`}
                    </div>
                    <div className="pagination-controls">
                      <button
                        type="button"
                        className="page-button"
                        disabled={levelPointsPage === 1}
                        onClick={() => setLevelPointsPage(1)}
                        aria-label="First level points page"
                      >«</button>
                      <button
                        type="button"
                        className="page-button"
                        disabled={levelPointsPage === 1}
                        onClick={() => setLevelPointsPage((p) => Math.max(1, p - 1))}
                        aria-label="Previous level points page"
                      >‹</button>
                      <span className="page-indicator">Page {levelPointsPage} of {levelPointsTotalPages}</span>
                      <button
                        type="button"
                        className="page-button"
                        disabled={levelPointsPage === levelPointsTotalPages}
                        onClick={() => setLevelPointsPage((p) => Math.min(levelPointsTotalPages, p + 1))}
                        aria-label="Next level points page"
                      >›</button>
                      <button
                        type="button"
                        className="page-button"
                        disabled={levelPointsPage === levelPointsTotalPages}
                        onClick={() => setLevelPointsPage(levelPointsTotalPages)}
                        aria-label="Last level points page"
                      >»</button>
                    </div>
                  </div>
                )}
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

export default TaskLevelManagement;

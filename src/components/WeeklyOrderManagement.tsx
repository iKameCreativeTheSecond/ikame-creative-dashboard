
import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import "./AdminContent.css";
import "./Filter.css";
import "./WeeklyOrderManagement.grid.css";
import type { WeeklyOrder } from "../common/AdministratorData";
import AdminData from "../common/AdministratorData";

const WeeklyOrderManagement: React.FC = () => {
  const serverUrl = import.meta.env.VITE_REACT_APP_SERVER_URL ?? "http://localhost:8888";
  
  // Helper function to format date to dd-mm-yyyy
  const formatDateToDDMMYYYY = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return original if invalid date
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  };

  // Helper function to get Monday of current week
  const getMondayOfWeek = (date: Date): Date => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };

  // Helper function to format date for input (YYYY-MM-DD)
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Quick filter options - filter from current time backwards
  const handleQuickFilter = (weeks: number) => {
    const today = new Date();
    const currentMonday = getMondayOfWeek(new Date(today));
    const toDate = formatDateForInput(currentMonday);
    
    // Calculate the from date by going backwards from current Monday
    const fromDate = new Date(currentMonday);
    fromDate.setDate(fromDate.getDate() - (weeks * 7) + 7); // +7 to include current week
    const fromDateStr = formatDateForInput(fromDate);
    
    setDateFrom(fromDateStr);
    setDateTo(toDate);
  };

  // Clear date filters
  const clearDateFilters = () => {
    setDateFrom("");
    setDateTo("");
  };
  
  async function fetchWeeklyOrders(): Promise<WeeklyOrder[]> {
    try {
      const response = await fetch(serverUrl + "/get/weekly-order", {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching weekly orders:", error);
      throw error;
    }
  }

  const [orders, setOrders] = useState<WeeklyOrder[]>([]);
  const [filter, setFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<WeeklyOrder | null>(null);
  const [formData, setFormData] = useState<WeeklyOrder>({
    ID: "",
    StartWeek: "",
    Goal: "",
    Strategy: "",
    Project: "",
    CPP: 0,
    Icon: 0,
    Banner: 0,
    PLA: 0,
    Video: 0,
  });

  useEffect(() => {
    if (AdminData.WeeklyOrders && AdminData.WeeklyOrders.length > 0) {
      setOrders(AdminData.WeeklyOrders);
    } else {
      fetchWeeklyOrders().then(data => {
        setOrders(data);
        AdminData.WeeklyOrders = data;
      }).catch((err) => {
        console.error("ERROR.", err);
      });
    }
  }, []);

  const handleEdit = (id: string) => {
    const order = orders.find((o) => o.ID === id);
    if (order) {
      setEditingOrder(order);
      // Format StartWeek properly for date input
      const formattedOrder = {
        ...order,
        StartWeek: order.StartWeek ? formatDateForInput(new Date(order.StartWeek)) : ""
      };
      setFormData(formattedOrder);
      setShowModal(true);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this weekly order?")) {
      fetch(`${serverUrl}/post/delete-weekly-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ID: id })
      }).then(() => {
        // console.log("Deleted weekly order with ID:", id);
        const data = orders.filter(order => order.ID !== id);
        AdminData.WeeklyOrders = data;
        setOrders(data);
      }).catch((error) => {
        console.error("Error deleting weekly order:", error);
        alert("Failed to delete weekly order. Please try again.");
      });
    }
  };

  const handleAdd = () => {
    setEditingOrder(null);
    // Set default StartWeek to current Monday
    const today = new Date();
    const currentMonday = getMondayOfWeek(new Date(today));
    const defaultStartWeek = formatDateForInput(currentMonday);
    
    setFormData({
      ID: "",
      StartWeek: defaultStartWeek,
      Goal: "",
      Strategy: "",
      Project: "",
      CPP: 0,
      Icon: 0,
      Banner: 0,
      PLA: 0,
      Video: 0,
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
    
    // If StartWeek is being changed, automatically set it to Monday of that week
    if (name === "StartWeek" && value) {
      const selectedDate = new Date(value);
      if (!isNaN(selectedDate.getTime())) {
        // Get the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
        const dayOfWeek = selectedDate.getDay();
        // Calculate how many days to subtract to get to Monday
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        // Set the date to Monday of that week
        selectedDate.setDate(selectedDate.getDate() - daysToSubtract);
        // Format back to YYYY-MM-DD for the input field
        const mondayDate = selectedDate.toISOString().split('T')[0];
        
        setFormData((prev) => ({
          ...prev,
          [name]: mondayDate,
        }));
        return;
      }
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: ["CPP", "Icon", "Banner", "PLA", "Video"].includes(name)
        ? Number(value)
        : value,
    }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingOrder) {
      // Edit existing order
      const updatedOrder = { ...formData, ID: editingOrder.ID };
      updatedOrder.StartWeek = new Date(formData.StartWeek).toISOString();
      // console.log("Updating weekly order:", JSON.stringify(updatedOrder));
      var bodyJs = JSON.stringify(updatedOrder);
      // console.log("Updating weekly order:", bodyJs);
      fetch(`${serverUrl}/post/update-weekly-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: bodyJs
      }).then(() => {
        const data = orders.map(o => o.ID === editingOrder.ID ? { ...formData, ID: editingOrder.ID } : o);
        AdminData.WeeklyOrders = data;
        setOrders(data);
      }).catch((error) => {
        console.error("Error updating weekly order:", error);
        alert("Failed to update weekly order. Please try again.");
      });
    } else {
      // Add new order
      // console.log("Adding new weekly order:", formData);
      const newOrder = { ...formData, ID: (Math.random() * 1000000).toFixed(0) };
      newOrder.StartWeek = new Date(formData.StartWeek).toISOString();
      fetch(`${serverUrl}/post/add-new-weekly-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newOrder)
      }).then(async (response) =>
      {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const responseData = await response.json();
        newOrder.ID = responseData.id;
        const data = [...(orders ?? []), newOrder];
        setOrders(data);
        AdminData.WeeklyOrders = data;
      }).catch((error) => {
        console.error("Error adding new weekly order:", error);
        alert("Failed to add new weekly order. Please try again.");
      });
    }
    setShowModal(false);
  };

  // Filter weekly orders by project, goal, strategy, start week, and date range
  const filteredOrders = (orders ?? []).filter(order => {
    const filterLower = filter.toLowerCase();
    const textMatch = (
      order.Project.toLowerCase().includes(filterLower) ||
      order.Goal.toLowerCase().includes(filterLower) ||
      order.Strategy.toLowerCase().includes(filterLower) ||
      order.StartWeek.toLowerCase().includes(filterLower)
    );

    // Date range filter
    let dateMatch = true;
    if (dateFrom || dateTo) {
      const orderDate = new Date(order.StartWeek);
      if (dateFrom && dateTo) {
        const fromDate = new Date(dateFrom);
        const toDate = new Date(dateTo);
        dateMatch = orderDate >= fromDate && orderDate <= toDate;
      } else if (dateFrom) {
        const fromDate = new Date(dateFrom);
        dateMatch = orderDate >= fromDate;
      } else if (dateTo) {
        const toDate = new Date(dateTo);
        dateMatch = orderDate <= toDate;
      }
    }

    return textMatch && dateMatch;
  });

  // Reset to first page when filter changes
  useEffect(() => { setCurrentPage(1); }, [filter, dateFrom, dateTo]);

  // Ensure current page is valid when data size or rowsPerPage changes
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredOrders.length / rowsPerPage));
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [filteredOrders.length, rowsPerPage, currentPage]);

  const totalItems = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentItems = filteredOrders.slice(startIndex, startIndex + rowsPerPage);

  return (
    <div className="team-management">
      <p className="admin-description">Add, edit, or remove weekly orders from the system.</p>
      <div className="content-header">
        <div className="header-left">
          <input
            type="text"
            className="filter-input"
            placeholder="Filter by project, goal, strategy, or start week..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>
        <div className="header-right">
          <button className="btn-add-policy" onClick={handleAdd}>
            + Add Weekly Order
          </button>
        </div>
      </div>

      <div className="date-filter" style={{ marginBottom: '20px' }}>
        <div className="filter-header">
          <div className="filter-header-left">
            <svg
              className="filter-header-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"
                fill="#5F6D7A"
              />
            </svg>
            <span className="filter-header-title">Date Range Filter</span>
          </div>
        </div>
        <div className="date-filter-row">
          <label>
            From
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </label>
          <label>
            To
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </label>
        </div>
        <div className="date-filter-quick">
          <span>Quick Options:</span>
          <div className="quick-buttons">
            <button type="button" onClick={() => handleQuickFilter(1)}>1 Week</button>
            <button type="button" onClick={() => handleQuickFilter(2)}>2 Weeks</button>
            <button type="button" onClick={() => handleQuickFilter(4)}>4 Weeks</button>
            <button type="button" onClick={() => handleQuickFilter(6)}>6 Weeks</button>
            <button
              type="button"
              className="clear"
              onClick={clearDateFilters}
            >
              Clear
            </button>
          </div>
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
          {totalItems === 0 ? 'No orders' : `${startIndex + 1}-${Math.min(startIndex + rowsPerPage, totalItems)} of ${totalItems}`}
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
            <th>Start Week</th>
            <th>Goal</th>
            <th>Strategy</th>
            <th>Project</th>
            <th>CPP</th>
            <th>Icon</th>
            <th>Banner</th>
            <th>PLA</th>
            <th>Video</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.map((order) => (
            <tr key={order.ID}>
              <td>{formatDateToDDMMYYYY(order.StartWeek)}</td>
              <td>{order.Goal}</td>
              <td>{order.Strategy}</td>
              <td>{order.Project}</td>
              <td>{order.CPP}</td>
              <td>{order.Icon}</td>
              <td>{order.Banner}</td>
              <td>{order.PLA}</td>
              <td>{order.Video}</td>
              <td>
                <div className="action-buttons">
                  <button className="icon-button edit-button" onClick={() => handleEdit(order.ID)} title="Edit">
                    <FaEdit />
                  </button>
                  <button className="icon-button delete-button" onClick={() => handleDelete(order.ID)} title="Delete">
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
            <h2>{editingOrder ? "Edit Weekly Order" : "Add Weekly Order"}</h2>
            <form onSubmit={handleFormSubmit} className="modal-form grid-form">
              <div className="form-main-fields">
                <div className="form-group">
                  <label htmlFor="StartWeek">Start Week:</label>
                  <input id="StartWeek" name="StartWeek" type="date" value={formData.StartWeek} onChange={handleFormChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="Goal">Goal:</label>
                  <textarea id="Goal" name="Goal" value={formData.Goal} onChange={handleFormChange} required rows={2} style={{ minHeight: '200px', resize: 'vertical' }} />
                </div>
                <div className="form-group">
                  <label htmlFor="Strategy">Strategy:</label>
                  <textarea id="Strategy" name="Strategy" value={formData.Strategy} onChange={handleFormChange} required rows={2} style={{ minHeight: '200px', resize: 'vertical' }} />
                </div>
              </div>
              <div className="form-side-fields">
                <div className="form-group">
                  <label htmlFor="Project">Project:</label>
                  <input id="Project" name="Project" value={formData.Project} onChange={handleFormChange} required style={{ width: '120px' }} />
                </div>
                <div className="form-group">
                  <label htmlFor="CPP">CPP:</label>
                  <input id="CPP" name="CPP" type="number" value={formData.CPP} onChange={handleFormChange} required style={{ width: '80px' }} />
                </div>
                <div className="form-group">
                  <label htmlFor="Banner">Banner:</label>
                  <input id="Banner" name="Banner" type="number" value={formData.Banner} onChange={handleFormChange} required style={{ width: '80px' }} />
                </div>
                <div className="form-group">
                  <label htmlFor="PLA">PLA:</label>
                  <input id="PLA" name="PLA" type="number" value={formData.PLA} onChange={handleFormChange} required style={{ width: '80px' }} />
                </div>
                <div className="form-group">
                  <label htmlFor="Video">Video:</label>
                  <input id="Video" name="Video" type="number" value={formData.Video} onChange={handleFormChange} required style={{ width: '80px' }} />
                </div>
                <div className="form-group">
                  <label htmlFor="Icon">Icon:</label>
                  <input id="Icon" name="Icon" type="number" value={formData.Icon} onChange={handleFormChange} required style={{ width: '80px' }} />
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

export default WeeklyOrderManagement;

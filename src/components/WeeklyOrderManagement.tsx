
import React, { useState } from "react";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import "./WeeklyOrderManagement.css";
import "./WeeklyOrderManagement.grid.css";
import type { WeeklyOrder } from "../common/AdministratorData";

const initialData: WeeklyOrder[] = [
  {
    ID: "652e1a...",
    StartWeek: "2025-09-29",
    Goal: "Increase sales",
    Strategy: "Social media ads",
    Project: "Project A",
    CPP: 10,
    Icon: 5,
    Banner: 3,
    PLA: 2,
    Video: 1,
  },
];

const WeeklyOrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<WeeklyOrder[]>(initialData);
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

  const handleEdit = (id: string) => {
    const order = orders.find((o) => o.ID === id);
    if (order) {
      setEditingOrder(order);
      setFormData(order);
      setShowModal(true);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Bạn có chắc muốn xóa mục này?")) {
      setOrders(orders.filter((o) => o.ID !== id));
    }
  };

  const handleAdd = () => {
    setEditingOrder(null);
    setFormData({
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
      [name]: ["CPP", "Icon", "Banner", "PLA", "Video"].includes(name)
        ? Number(value)
        : value,
    }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingOrder) {
      setOrders(
        orders.map((o) => (o.ID === editingOrder.ID ? { ...formData, ID: editingOrder.ID } : o))
      );
    } else {
      setOrders([
        ...orders,
        { ...formData, ID: (Math.random() * 1000000).toFixed(0) },
      ]);
    }
    setShowModal(false);
  };

  return (
    <div className="weekly-order-management">
      <h2>Weekly Order Management</h2>
      <table>
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
          {orders.map((order) => (
            <tr key={order.ID}>
              <td>{order.StartWeek}</td>
              <td>{order.Goal}</td>
              <td>{order.Strategy}</td>
              <td>{order.Project}</td>
              <td>{order.CPP}</td>
              <td>{order.Icon}</td>
              <td>{order.Banner}</td>
              <td>{order.PLA}</td>
              <td>{order.Video}</td>
              <td>
                <button className="icon-button edit-button" onClick={() => handleEdit(order.ID)}>
                  <FaEdit />
                </button>
                <button className="icon-button delete-button" onClick={() => handleDelete(order.ID)}>
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button className="floating-button" onClick={handleAdd}>
        <FaPlus /> Thêm mới
      </button>

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
                  <textarea id="Goal" name="Goal" value={formData.Goal} onChange={handleFormChange} required rows={2} style={{ minHeight: '48px', resize: 'vertical' }} />
                </div>
                <div className="form-group">
                  <label htmlFor="Strategy">Strategy:</label>
                  <textarea id="Strategy" name="Strategy" value={formData.Strategy} onChange={handleFormChange} required rows={2} style={{ minHeight: '48px', resize: 'vertical' }} />
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

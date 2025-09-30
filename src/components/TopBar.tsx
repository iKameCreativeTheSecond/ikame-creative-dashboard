import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import './TopBar.css';
import { FaUserCircle, FaChevronDown, FaCog, FaSignOutAlt, FaEdit } from 'react-icons/fa';

interface TopBarProps {
    userName: string;
    imageUrl?: string;
}


const TopBar: React.FC<TopBarProps> = ({ userName, imageUrl }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();


  const handleSettings = () => {
    //TODO Chuyển hướng hoặc mở modal cài đặt
    alert('Chuyển đến trang cài đặt!');
    setOpen(false);
  };

  const handleLogout = () => {
    //TODO Xóa token, chuyển về trang đăng nhập
    alert('Đăng xuất!');
    setOpen(false);
  };

    const handleEdit = () => {
      // TODO : VERUFY IF USER IS ADMIN

      navigate('/admin');
    };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="topbar">
      <div className="topbar-left">
        <span className="site-name">Performance Dashboard</span>
      </div>
      <div className="topbar-right" ref={dropdownRef}>
        <button className="edit-button" onClick={handleEdit} title="Edit (Admin)">
          <FaEdit />
        </button>
        { imageUrl ? (
          <img src={imageUrl} alt={userName} className="user-icon" />
        ) : (
          <FaUserCircle className="user-icon" />
        )}
        <div className="user-dropdown" onClick={() => setOpen(!open)}>
          <span className="user-name">{userName}</span>
          <FaChevronDown className="dropdown-icon" />
          {open && (
            <div className="dropdown-menu">
              <div className="dropdown-item" onClick={handleSettings}>
                <FaCog className="dropdown-item-icon" /> Cài đặt
              </div>
              <div className="dropdown-item" onClick={handleLogout}>
                <FaSignOutAlt className="dropdown-item-icon" /> Đăng xuất
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopBar;

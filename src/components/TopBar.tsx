import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import './TopBar.css';
import { FaUserCircle, FaChevronDown, FaCog, FaSignOutAlt, FaEdit, FaCalendarAlt } from 'react-icons/fa';

interface TopBarProps {
    userName: string;
    imageUrl?: string;
    siteName?: string;
    showHomeButton?: boolean;
}


const TopBar: React.FC<TopBarProps> = ({ userName, imageUrl, siteName = 'Performance Dashboard', showHomeButton = false }) => {
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

    const handleWeeklyPlan = () => {
      navigate('/weekly-plan');
      setOpen(false);
    };

    const handleHome = () => {
      navigate('/home');
      setOpen(false);
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
        <span className="site-name">{siteName}</span>
      </div>
      <div className="topbar-right" ref={dropdownRef}>
        {showHomeButton ? (
          <button className="weekly-plan-button" onClick={handleHome} title="Back to Home">
            <FaCalendarAlt />
            <span>Home</span>
          </button>
        ) : (
          <button className="weekly-plan-button" onClick={handleWeeklyPlan} title="Weekly Plan">
            <FaCalendarAlt />
            <span>Weekly Plan</span>
          </button>
        )}
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

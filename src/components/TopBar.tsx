import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { Avatar, Dropdown, Space, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { FaUserCircle, FaCog, FaSignOutAlt, FaChevronDown } from 'react-icons/fa';
import { GlobalData } from '../common/GlobalData';
import './TopBar.css';

interface TopBarProps {
    userName: string;
    imageUrl?: string;
    siteName?: string;
}

const TopBar: React.FC<TopBarProps> = ({ userName, imageUrl, siteName = 'Performance Dashboard' }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        let isMounted = true;
        (async () => {
            try {
                if (isMounted) setIsAdmin(GlobalData.getUser().role.toLowerCase() === 'admin');
            } catch {
                if (isMounted) setIsAdmin(false);
            }
        })();
        return () => { isMounted = false; };
    }, []);

    const handleLogout = () => {
        GlobalData.logout();
        navigate('/');
    };

    const dropdownItems: MenuProps['items'] = [
        { key: 'settings', icon: <FaCog />, label: 'Cài đặt' },
        { type: 'divider' },
        { key: 'logout', icon: <FaSignOutAlt />, label: 'Đăng xuất', danger: true },
    ];

    const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
        if (key === 'settings') alert('Chuyển đến trang cài đặt!');
        else if (key === 'logout') handleLogout();
    };

    const navLinks = [
        { key: 'home', label: 'Home', path: '/home' },
        { key: 'weekly-plan', label: 'Weekly Plan', path: '/weekly-plan' },
        { key: 'completed-tasks', label: 'Completed Tasks', path: '/completed-tasks' },
        ...(isAdmin ? [{ key: 'admin', label: 'Admin', path: '/admin' }] : []),
    ];

    return (
        <header className="topbar">
            <Typography.Text strong style={{ fontSize: '1.15rem', color: '#ffffff', letterSpacing: -0.2, minWidth: 180 }}>
                {siteName}
            </Typography.Text>

            <nav className="topbar-nav">
                {navLinks.map(link => {
                    const isActive = location.pathname.startsWith(link.path);
                    return (
                        <button
                            key={link.key}
                            className={`topbar-nav-item${isActive ? ' active' : ''}`}
                            onClick={() => navigate(link.path)}
                        >
                            {link.label}
                        </button>
                    );
                })}
            </nav>

            <Space size={8} style={{ minWidth: 180, justifyContent: 'flex-end', display: 'flex' }}>
                {imageUrl
                    ? <Avatar src={imageUrl} size={32} />
                    : <Avatar icon={<FaUserCircle />} size={32} />
                }
                <Dropdown menu={{ items: dropdownItems, onClick: handleMenuClick }} trigger={['click']}>
                    <Space size={4} style={{ cursor: 'pointer' }}>
                        <Typography.Text style={{ color: '#d0e8f5', fontSize: '0.9rem', fontWeight: 500 }}>
                            {userName}
                        </Typography.Text>
                        <FaChevronDown style={{ color: '#c0d8ec', fontSize: '0.8rem' }} />
                    </Space>
                </Dropdown>
            </Space>
        </header>
    );
};

export default TopBar;

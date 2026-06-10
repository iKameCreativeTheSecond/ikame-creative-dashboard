import React from 'react';
import { useNavigate } from "react-router-dom";
import { Avatar, Button, Dropdown, Space, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { FaUserCircle, FaCog, FaSignOutAlt, FaEdit, FaCalendarAlt, FaChevronDown } from 'react-icons/fa';
import { GlobalData } from '../common/GlobalData';
import './TopBar.css';

interface TopBarProps {
    userName: string;
    imageUrl?: string;
    siteName?: string;
    showHomeButton?: boolean;
}

const TopBar: React.FC<TopBarProps> = ({ userName, imageUrl, siteName = 'Performance Dashboard', showHomeButton = false }) => {
    const navigate = useNavigate();

    const handleSettings = () => {
        alert('Chuyển đến trang cài đặt!');
    };

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
        if (key === 'settings') handleSettings();
        else if (key === 'logout') handleLogout();
    };

    return (
        <header className="topbar">
            <Typography.Text strong style={{ fontSize: '1.15rem', color: '#ffffff', letterSpacing: -0.2 }}>
                {siteName}
            </Typography.Text>
            <Space size={8}>
                <Button
                    icon={<FaCalendarAlt />}
                    onClick={() => navigate(showHomeButton ? '/home' : '/weekly-plan')}
                    ghost
                >
                    {showHomeButton ? 'Home' : 'Weekly Plan'}
                </Button>
                <Button icon={<FaEdit />} ghost onClick={() => navigate('/admin')} />
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

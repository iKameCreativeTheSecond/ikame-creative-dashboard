import './Admin.css';
import { useState } from 'react';
import TeamManagement from '../components/TeamManagement';
import WeeklyOrderManagement from '../components/WeeklyOrderManagement';
import CreativeToolManagement from '../components/CreativeToolManagement';

// Replace old sidebar with the four sections that used to be tabs
const sidebarItems = [
    { key: 'team', label: 'Team Management', icon: '👥' },
    { key: 'creative-tool', label: 'Creative Tool', icon: '🎨' },
    { key: 'weekly-orders', label: 'Weekly Orders', icon: '🗓️' },
    { key: 'contacts', label: 'Contacts', icon: '📇' }
];

export default function Admin() {
    const [activeTab, setActiveTab] = useState('team');
    const [activeSidebarItem, setActiveSidebarItem] = useState('team');

    const renderContent = () => {
        switch (activeTab) {
            case 'team':
                return <TeamManagement />;
            case 'creative-tool':
                return <CreativeToolManagement />;
            case 'weekly-orders':
                return <WeeklyOrderManagement />;
            case 'contacts':
                return <div style={{ color: '#333', fontSize: '1.5rem', marginTop: '40px' }}>Contacts content goes here.</div>;
            default:
                return null;
        }
    };

    // Derive a page title from the active section
    const pageTitle = sidebarItems.find(i => i.key === activeTab)?.label ?? 'Admin';

    return (
        <div className="admin-layout">
            {/* Sidebar */}
            <aside className="admin-sidebar">
                <div className="admin-logo">
                    <div className="logo-icon">M</div>
                    <span className="logo-text">MarcoHR</span>
                </div>
                <nav className="admin-nav">
                    {sidebarItems.map(item => (
                        <div 
                            key={item.key} 
                            className={`nav-item ${activeSidebarItem === item.key ? 'active' : ''}`}
                            onClick={() => { setActiveSidebarItem(item.key); setActiveTab(item.key); }}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </div>
                    ))}
                </nav>
                <div className="admin-sidebar-footer">
                    <div className="nav-item">
                        <span className="nav-icon">⚙️</span>
                        <span className="nav-label">Setting</span>
                    </div>
                    <div className="nav-item">
                        <span className="nav-icon">❓</span>
                        <span className="nav-label">Support</span>
                    </div>
                    <div className="admin-user-profile">
                        <img src="https://via.placeholder.com/40" alt="User" className="user-avatar" />
                        <div className="user-info">
                            <div className="user-name">Shahid Miah</div>
                            <div className="user-email">hello@workspace.agency</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="admin-main">
                <div className="admin-header">
                    <h1 className="admin-page-title">{pageTitle}</h1>
                </div>

                <div className="admin-content">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
}
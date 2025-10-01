import './Admin.css';
import { useState } from 'react';
import TeamManagement from '../components/TeamManagement';
import WeeklyOrderManagement from '../components/WeeklyOrderManagement';
import CreativeToolManagement from '../components/CreativeToolManagement';

const tabs = [
    { key: 'team', label: 'Team Management' },
    { key: 'creative-tool', label: 'Creative Tool' },
    { key: 'videos', label: 'Videos' },
    { key: 'contacts', label: 'Contacts' }
];

export default function Admin() {
    const [activeTab, setActiveTab] = useState('team');

    const renderContent = () => {
        switch (activeTab) {
            case 'team':
                return <TeamManagement />;
            case 'creative-tool':
                return <CreativeToolManagement />;
            case 'videos':
                return <div style={{ color: '#333', fontSize: '1.5rem', marginTop: '40px' }}>Videos content goes here.</div>;
            case 'contacts':
                return <div style={{ color: '#333', fontSize: '1.5rem', marginTop: '40px' }}>Contacts content goes here.</div>;
            default:
                return null;
        }
    };

    return (
        <div className="admin-bg">
            <div className="admin-radio-tabs-group">
                {tabs.map(tab => (
                    <label key={tab.key} className={`admin-radio-tab${activeTab === tab.key ? ' selected' : ''}`}>
                        <input
                            type="radio"
                            name="admin-tabs"
                            value={tab.key}
                            checked={activeTab === tab.key}
                            onChange={() => setActiveTab(tab.key)}
                        />
                        <span className="admin-radio-label">{tab.label}</span>
                    </label>
                ))}
            </div>
            <div className="admin-content-modern">
                {renderContent()}
            </div>
        </div>
    );
}
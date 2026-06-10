import { useEffect, useState } from 'react';
import { Layout, Menu, Result, Spin, Typography } from 'antd';
import type { MenuProps } from 'antd';
import TeamManagement from '../components/TeamManagement';
import WeeklyOrderManagement from '../components/WeeklyOrderManagement';
import CreativeToolManagement from '../components/CreativeToolManagement';
import ProjectDetailsManagement from '../components/ProjectDetailsManagement';
import TaskLevelManagement from '../components/TaskLevelManagement';
import { GlobalData } from '../common/GlobalData';

const { Sider, Content, Header } = Layout;

const menuItems: MenuProps['items'] = [
    { key: 'team',            icon: <span>👥</span>, label: 'Team Management'  },
    { key: 'creative-tool',   icon: <span>🎨</span>, label: 'Creative Tool'    },
    { key: 'weekly-orders',   icon: <span>🗓️</span>, label: 'Weekly Orders'    },
    { key: 'project-details', icon: <span>📋</span>, label: 'Project Details'  },
    { key: 'task-level',      icon: <span>📊</span>, label: 'Task Level'       },
    { key: 'contacts',        icon: <span>📇</span>, label: 'Contacts'         },
];

const serverUrl = import.meta.env.VITE_REACT_APP_SERVER_URL ?? "http://localhost:8888";

async function IsAdminCheckAsync() {
    const response = await fetch(`${serverUrl}/get/admin-role`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': GlobalData.getUserToken() || ''
        }
    });
    return response.ok;
}

export default function Admin() {
    const [activeTab, setActiveTab] = useState('team');
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

    useEffect(() => {
        let isMounted = true;
        (async () => {
            try {
                const ok = await IsAdminCheckAsync();
                if (isMounted) setIsAdmin(ok);
            } catch {
                if (isMounted) setIsAdmin(false);
            }
        })();
        return () => { isMounted = false; };
    }, []);

    const renderContent = () => {
        switch (activeTab) {
            case 'team':            return <TeamManagement />;
            case 'creative-tool':   return <CreativeToolManagement />;
            case 'weekly-orders':   return <WeeklyOrderManagement />;
            case 'project-details': return <ProjectDetailsManagement />;
            case 'task-level':      return <TaskLevelManagement />;
            case 'contacts':        return <Typography.Text style={{ display: 'block', padding: '40px 24px', fontSize: '1.1rem' }}>Contacts content goes here.</Typography.Text>;
            default:                return null;
        }
    };

    const pageTitle = (menuItems.find(i => i?.key === activeTab)?.label ?? 'Admin') as string;

    if (isAdmin === null) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!isAdmin) {
        return <Result status="403" title="403" subTitle="Bạn không có quyền truy cập trang Admin." />;
    }

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider
                width={240}
                style={{ position: 'fixed', height: '100vh', overflow: 'auto', left: 0, top: 0 }}
            >
                <div style={{ padding: '20px', borderBottom: '1px solid rgba(91, 196, 255, 0.12)' }}>
                    <Typography.Text strong style={{ color: '#fff', fontSize: 15 }}>
                        Creative Administration
                    </Typography.Text>
                </div>
                <Menu
                    mode="inline"
                    selectedKeys={[activeTab]}
                    items={menuItems}
                    onClick={({ key }) => setActiveTab(key)}
                    style={{ border: 'none', marginTop: 8 }}
                />
            </Sider>
            <Layout style={{ marginLeft: 240 }}>
                <Header style={{
                    padding: '0 24px',
                    display: 'flex',
                    alignItems: 'center',
                    borderBottom: '1px solid rgba(91, 196, 255, 0.12)',
                }}>
                    <Typography.Title level={5} style={{ margin: 0, color: '#fff' }}>
                        {pageTitle}
                    </Typography.Title>
                </Header>
                <Content style={{ padding: 10 }}>
                    {renderContent()}
                </Content>
            </Layout>
        </Layout>
    );
}

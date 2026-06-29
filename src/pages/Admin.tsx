import { useEffect, useState } from 'react';
import { Layout, Menu, Result, Spin, Typography } from 'antd';
import type { MenuProps } from 'antd';
import TeamManagement from '../components/TeamManagement';
import CreativeToolManagement from '../components/CreativeToolManagement';
import ProjectDetailsManagement from '../components/ProjectDetailsManagement';
import TaskLevelManagement from '../components/TaskLevelManagement';
import { GlobalData } from '../common/GlobalData';
import TopBar from '../components/TopBar';
import './Admin.css';

const { Sider, Content } = Layout;

const menuItems: MenuProps['items'] = [
    { key: 'team',            icon: <span>👥</span>, label: 'Team Management'  },
    { key: 'creative-tool',   icon: <span>🎨</span>, label: 'Creative Tool'    },
    { key: 'project-details', icon: <span>📋</span>, label: 'Project Details'  },
    { key: 'task-level',      icon: <span>📊</span>, label: 'Task Level'       },
    { key: 'contacts',        icon: <span>📇</span>, label: 'Contacts'         },
];


async function IsAdminCheckAsync() {
    return GlobalData.getUser().role.toLowerCase() === 'admin';
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
            case 'project-details': return <ProjectDetailsManagement />;
            case 'task-level':      return <TaskLevelManagement />;
            case 'contacts': return (
                <div style={{ padding: '40px 24px', maxWidth: 600 }}>
                    <Typography.Title level={4} style={{ marginBottom: 24 }}>Contacts</Typography.Title>

                    <Typography.Title level={5} style={{ marginBottom: 12 }}>Developer</Typography.Title>
                    <div style={{ marginBottom: 24, lineHeight: 2 }}>
                        <div><strong>Name:</strong> Phạm Tiến Chượng</div>
                        <div><strong>Email:</strong> chuongpt@ikameglobal.com</div>
                        <div><strong>Role:</strong> Developer</div>
                    </div>

                </div>
            );
            default:                return null;
        }
    };


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
        <>
            <TopBar
                userName={GlobalData.getUser().name || GlobalData.getUser().email || 'User'}
                imageUrl={GlobalData.getUser().picture}
                siteName="Creative Administration"
            />
            <Layout style={{ minHeight: '100vh', paddingTop: 60 }}>
                <Sider
                    width={240}
                    className="admin-sider"
                    style={{ position: 'fixed', height: 'calc(100vh - 60px)', overflow: 'auto', left: 0, top: 60 }}
                >
                    <Menu
                        mode="inline"
                        selectedKeys={[activeTab]}
                        items={menuItems}
                        onClick={({ key }) => setActiveTab(key)}
                        style={{ border: 'none', marginTop: 8 }}
                    />
                </Sider>
                <Layout style={{ marginLeft: 240 }}>
                    <Content style={{ padding: 10 }}>
                        {renderContent()}
                    </Content>
                </Layout>
            </Layout>
        </>
    );
}

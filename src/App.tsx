import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import Home from './pages/Home';
import Landing from './pages/Landing';
import Admin from './pages/Admin';
import WeeklyPlan from './pages/WeeklyPlan';
import CompletedTasks from './pages/CompletedTasks';
import { GlobalData } from './common/GlobalData';
import { ThemeProvider, useTheme } from './context/ThemeContext';

const darkAntdTheme = {
    algorithm: theme.darkAlgorithm,
    token: {
        colorPrimary:         '#5bc4ff',
        colorBgBase:          '#0f1e2e',
        colorBgContainer:     '#162d43',
        colorBgElevated:      '#132a3e',
        colorBgSpotlight:     '#1b3a5c',
        colorBorder:          'rgba(91, 196, 255, 0.25)',
        colorBorderSecondary: 'rgba(91, 196, 255, 0.15)',
        colorText:            '#e2ecf4',
        colorTextSecondary:   '#b0c8dc',
        colorTextTertiary:    '#7a9bb8',
        colorTextPlaceholder: '#7a9bb8',
        colorTextDisabled:    '#4a6a80',
        colorSplit:           'rgba(91, 196, 255, 0.1)',
        borderRadius:         6,
        fontSize:             14,
        fontFamily:           "'Inter', 'Segoe UI', Arial, sans-serif",
        controlHeight:        36,
        lineWidth:            1,
        colorLink:            '#5bc4ff',
        colorLinkHover:       '#87d6ff',
    },
    components: {
        Select: {
            optionSelectedBg:        'rgba(91, 196, 255, 0.15)',
            optionActiveBg:          'rgba(91, 196, 255, 0.08)',
            multipleItemBg:          'rgba(91, 196, 255, 0.12)',
            multipleItemBorderColor: 'rgba(91, 196, 255, 0.3)',
        },
        DatePicker: {
            cellHoverBg:             'rgba(91, 196, 255, 0.1)',
            cellActiveWithRangeBg:   'rgba(91, 196, 255, 0.08)',
        },
        Modal: {
            contentBg: '#132a3e',
            headerBg:  '#132a3e',
            footerBg:  '#132a3e',
        },
    },
};

const lightAntdTheme = {
    algorithm: theme.defaultAlgorithm,
    token: {
        colorPrimary:         '#2D9470',
        colorBgBase:          '#ffffff',
        colorBgContainer:     '#f0faf6',
        colorBgElevated:      '#e5f5ef',
        colorBgSpotlight:     '#cae9df',
        colorBorder:          'rgba(45, 148, 112, 0.3)',
        colorBorderSecondary: 'rgba(45, 148, 112, 0.18)',
        colorText:            '#0d2016',
        colorTextSecondary:   '#1a3d2c',
        colorTextTertiary:    '#4a8a70',
        colorTextPlaceholder: '#6ba08a',
        colorTextDisabled:    '#95c4b4',
        colorSplit:           'rgba(45, 148, 112, 0.12)',
        borderRadius:         6,
        fontSize:             14,
        fontFamily:           "'Inter', 'Segoe UI', Arial, sans-serif",
        controlHeight:        36,
        lineWidth:            1,
        colorLink:            '#2D9470',
        colorLinkHover:       '#1E6B52',
    },
    components: {
        Select: {
            optionSelectedBg:        'rgba(45, 148, 112, 0.12)',
            optionActiveBg:          'rgba(45, 148, 112, 0.06)',
            multipleItemBg:          'rgba(45, 148, 112, 0.1)',
            multipleItemBorderColor: 'rgba(45, 148, 112, 0.3)',
        },
        DatePicker: {
            cellHoverBg:             'rgba(45, 148, 112, 0.08)',
            cellActiveWithRangeBg:   'rgba(45, 148, 112, 0.06)',
        },
        Modal: {
            contentBg: '#f0faf6',
            headerBg:  '#f0faf6',
            footerBg:  '#f0faf6',
        },
    },
};

function ProtectedRoute({ element }: { element: React.ReactElement }) {
    const token = GlobalData.getUserToken();
    if (token == null || token === undefined || token === '') {
        return <Navigate to="/" replace />;
    }
    return element;
}

function ThemedApp() {
    const { theme: themeMode } = useTheme();
    const antdTheme = themeMode === 'dark' ? darkAntdTheme : lightAntdTheme;

    return (
        <ConfigProvider theme={antdTheme}>
            <HashRouter>
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/home" element={<ProtectedRoute element={<Home />} />} />
                    <Route path="/admin" element={<ProtectedRoute element={<Admin />} />} />
                    <Route path="/weekly-plan" element={<ProtectedRoute element={<WeeklyPlan />} />} />
                    <Route path="/completed-tasks" element={<ProtectedRoute element={<CompletedTasks />} />} />
                </Routes>
            </HashRouter>
        </ConfigProvider>
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <ThemedApp />
        </ThemeProvider>
    );
}

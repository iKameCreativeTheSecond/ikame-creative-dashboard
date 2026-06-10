import { useGoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { Button, Card, Space, Typography } from 'antd';
import './Landing.css';
import { GlobalData } from "../common/GlobalData";
import logoImg from '../assets/logo.png';

const { Title, Text, Paragraph } = Typography;

const features = [
    'Báo cáo hiệu suất hàng tuần',
    'Quản lý kế hoạch dự án',
    'Phân tích chỉ số theo nhóm',
];

function GoogleIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
    );
}

export default function Landing() {
    const navigate = useNavigate();

    async function getUserToken(email: string): Promise<string> {
        const serverUrl = import.meta.env.VITE_REACT_APP_SERVER_URL ?? "http://localhost:8888";
        const response = await fetch(`${serverUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        return data.token;
    }

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const user: { email: string; name: string; picture: string } = await res.json();
                const token = await getUserToken(user.email);
                GlobalData.setUserToken(token);
                GlobalData.setUser({ email: user.email, name: user.name, picture: user.picture });
                navigate('/home');
            } catch (error) {
                console.error('Error during login:', error);
            }
        },
        onError: () => console.warn('Login Failed'),
    });

    return (
        <div className="landing-container">
            <div className="landing-left">
                <img src={logoImg} alt="iKame Logo" className="landing-brand-logo" />

                <Title level={2} style={{ color: '#fff', margin: 0, fontWeight: 800, lineHeight: 1.15, letterSpacing: -0.5 }}>
                    Creative<br />
                    <span style={{ color: '#2dd4bf' }}>Performance</span><br />
                    Dashboard
                </Title>

                <div className="landing-short-divider" />

                <Paragraph style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: 300, margin: 0 }}>
                    Theo dõi hiệu suất sáng tạo của đội nhóm theo thời gian thực, mọi lúc mọi nơi.
                </Paragraph>

                <Space direction="vertical" size={10}>
                    {features.map(f => (
                        <Space key={f} size={10} align="center">
                            <span className="landing-feature-dot" />
                            <Text style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{f}</Text>
                        </Space>
                    ))}
                </Space>

                <Card
                    variant="borderless"
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', borderRadius: 14, marginTop: 8 }}
                    styles={{ body: { padding: '1.75rem 1.5rem' } }}
                >
                    <Title level={5} style={{ color: '#fff', margin: '0 0 6px' }}>Chào mừng trở lại!</Title>
                    <Text style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: 1.5, display: 'block', marginBottom: 20 }}>
                        Đăng nhập bằng tài khoản Google để truy cập dashboard
                    </Text>
                    <Button
                        size="large"
                        block
                        onClick={() => handleGoogleLogin()}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 10,
                            background: '#fff',
                            color: '#1a1a1a',
                            border: 'none',
                            borderRadius: 8,
                            fontWeight: 600,
                            height: 44,
                            fontSize: '0.95rem',
                        }}
                    >
                        <GoogleIcon />
                        Đăng nhập với Google
                    </Button>
                </Card>
            </div>

            <div className="landing-right">
                <svg className="landing-waves" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0,100 C10,55 28,15 62,32 C78,40 90,52 100,46 L100,100 Z" fill="rgba(255,255,255,0.10)" />
                    <path d="M0,100 C8,68 22,38 54,52 C70,59 86,67 100,62 L100,100 Z" fill="rgba(255,255,255,0.14)" />
                    <path d="M0,100 C6,80 18,62 44,70 C62,76 80,81 100,76 L100,100 Z" fill="rgba(255,255,255,0.18)" />
                </svg>
            </div>
        </div>
    );
}

import { useGoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import './Landing.css';
import { GlobalData } from "../common/GlobalData";
import logoImg from '../assets/logo.png';

export default function Landing()
{
    const navigate = useNavigate();

    async function getUserToken(email: string): Promise<string>
    {
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
            {/* Left panel: branding + login */}
            <div className="landing-left">
                <img src={logoImg} alt="iKame Logo" className="landing-brand-logo" />
                <div className="landing-brand-name">
                    Creative<br /><span>Performance</span><br />Dashboard
                </div>
                <div className="landing-divider" />
                <div className="landing-tagline">
                    Theo dõi hiệu suất sáng tạo của đội nhóm theo thời gian thực, mọi lúc mọi nơi.
                </div>
                <div className="landing-features">
                    <div className="landing-feature-item">
                        <span className="landing-feature-dot" />
                        Báo cáo hiệu suất hàng tuần
                    </div>
                    <div className="landing-feature-item">
                        <span className="landing-feature-dot" />
                        Quản lý kế hoạch dự án
                    </div>
                    <div className="landing-feature-item">
                        <span className="landing-feature-dot" />
                        Phân tích chỉ số theo nhóm
                    </div>
                </div>

                {/* Login card embedded in left panel */}
                <div className="landing-card">
                    <div className="landing-welcome">Chào mừng trở lại!</div>
                    <div className="landing-desc">
                        Đăng nhập bằng tài khoản Google để truy cập dashboard
                    </div>
                    <button className="landing-google-btn" onClick={() => handleGoogleLogin()}>
                        <svg className="landing-google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        <span>Đăng nhập với Google</span>
                    </button>
                </div>
            </div>

            {/* Right panel: background image only */}
            <div className="landing-right" />
        </div>
    );
    
}
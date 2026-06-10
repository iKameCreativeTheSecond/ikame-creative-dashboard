import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
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
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data.token;
    }

    function handleLoginSuccess(credentialResponse: any)
    {
        if (credentialResponse.credential) 
        {
            const decoded: { email: string, name: string, picture: string } = jwtDecode(credentialResponse.credential);
            try 
            {
                getUserToken(decoded.email).then(token => 
                {
                    GlobalData.setUserToken(token);
                    GlobalData.setUser({
                        email: decoded.email,
                        name: decoded.name,
                        picture: decoded.picture
                    });
                    navigate('/home');
                });
            } catch (error) {
                console.error('Error during login:', error);
            }

        } else
        {
            console.warn("No credential received");
        }
    }

        
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
                    <div className="landing-google-btn">
                        <GoogleLogin
                            onSuccess={handleLoginSuccess}
                            onError={() => console.warn('Login Failed')}
                            auto_select={true}
                            size="large"
                            type="standard"
                            text="signin_with"
                            shape="rectangular"
                            theme="filled_black"
                            width={300}
                        />
                    </div>
                </div>
            </div>

            {/* Right panel: background image only */}
            <div className="landing-right" />
        </div>
    );
    
}
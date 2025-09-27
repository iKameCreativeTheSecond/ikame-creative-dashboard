import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import './Landing.css';

export default function Landing()
{
    const navigate = useNavigate();

    function handleLoginSuccess(credentialResponse: any)
    {
        if (credentialResponse.credential) 
        {
            const decoded: { email: string, name: string, picture: string } = jwtDecode(credentialResponse.credential);
            navigate('/home', { state: { user: decoded } });
        } else
        {
            console.log("No credential received");
        }
    }

        
    return (
        <div className="landing-container">
            <div className="landing-card">
                <img src="/vite.svg" alt="Logo" className="landing-logo" />
                <div className="landing-title">Staff Performance Dashboard</div>
                <div className="landing-subtitle">iKame Global</div>
                <div className="landing-welcome">Chào mừng trở lại!</div>
                <div style={{ color: '#6b7a90', marginBottom: '1.2rem' }}>
                    Đăng nhập bằng tài khoản Google để truy cập dashboard
                </div>
                <div className="landing-google-btn">
                    <GoogleLogin
                        onSuccess={handleLoginSuccess}
                        onError={() => console.log('Login Failed')}
                        auto_select={ true }
                        size="medium"
                        type="standard"
                        text="signin_with"
                        shape="rectangular"
                        theme="outline"
                        width={ 300 }
                    />
                </div>
                {/* <div className="landing-or">hoặc</div>
                <button className="landing-demo-btn">
                    <span role="img" aria-label="Demo">🧑‍💻</span>
                    Demo Mode (Không cần Google)
                </button>
                <div className="landing-demo-desc">
                    Dùng tài khoản demo để test ứng dụng
                </div> */}
            </div>
        </div>
    );
    
}
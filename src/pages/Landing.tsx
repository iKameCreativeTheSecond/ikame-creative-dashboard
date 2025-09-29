import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import './Landing.css';
import { GlobalData } from "../common/GlobalData";

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
                    GlobalData.UserToken = token;
                    GlobalData.User = {
                        email: decoded.email,
                        name: decoded.name,
                        picture: decoded.picture
                    };
                    navigate('/home');
                });
            } catch (error) {
                console.error('Error during login:', error);
            }

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
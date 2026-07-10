import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function GoogleCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuthSession } = useAuth();

  useEffect(() => {
    const login = async () => {
      const token = searchParams.get("token");
      const isNewUser = searchParams.get("isNewUser");

      if (!token) {
        toast.error("Google authentication failed. Please try again.");
        navigate("/login", { replace: true });
        return;
      }

      setAuthSession(token, null, isNewUser === "true");

      console.debug('[auth-debug] google callback received', { hasToken: Boolean(token), isNewUser });

      setAuthSession(token, null, isNewUser === "true");

      try {
        const res = await api.get("/api/auth/me");
        const user = res.data?.data?.user;

        if (!user) {
          throw new Error("No user returned from the server");
        }

        console.debug('[auth-debug] google callback user resolved', { email: user.email, role: user.role });
        setAuthSession(token, user, isNewUser === "true");
        const redirectPath = user.role === "admin" ? "/admin/dashboard" : "/dashboard";
        console.debug('[auth-debug] google callback redirecting to', { redirectPath });
        window.location.replace(redirectPath);
      } catch (err) {
        console.error(err);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        toast.error("Unable to complete Google sign-in. Please try again.");
        navigate("/login", { replace: true });
      }
    };

    login();
  }, [navigate, searchParams, setAuthSession]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      Finishing sign in...
    </div>
  );
}
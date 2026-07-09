import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";

export default function GoogleCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const login = async () => {
      const token = searchParams.get("token");
      const isNewUser = searchParams.get("isNewUser");

      if (!token) {
        toast.error("Google authentication failed");
        navigate("/login", { replace: true });
        return;
      }

      localStorage.setItem("token", token);

      try {
        const res = await api.get("/api/auth/me");

        localStorage.setItem(
          "user",
          JSON.stringify(res.data.data.user)
        );

        if (isNewUser === "true") {
          localStorage.setItem("showWelcomeMessage", "true");
        }

        navigate("/", { replace: true });
      } catch (err) {
        console.error(err);
        localStorage.removeItem("token");
        toast.error("Unable to complete login");
        navigate("/login", { replace: true });
      }
    };

    login();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      Finishing sign in...
    </div>
  );
}
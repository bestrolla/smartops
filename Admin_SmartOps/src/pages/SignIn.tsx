import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "../lib/AuthContext";
import { toast } from "react-toastify";
import { PasswordInput } from "@/components/ui/passwordInput";

export default function SignIn() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantId, setTenantId] = useState("");
  const { login, loading, error, auth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.token && auth.user) {
      navigate("/dashboard");
    }
  }, [auth.token, auth.user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(usernameOrEmail, password, tenantId);
      toast.success("¡Inicio de sesión exitoso!");
      navigate("/dashboard");
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message || "Error en el inicio de sesión");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-smartops-blue to-smartops-blue-hover flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Back to Dashboard Link */}
      <Link
        to="/dashboard"
        className="absolute top-6 left-6 flex items-center space-x-2 text-white hover:text-smartops-blue-hover transition-colors z-10"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-medium">Back to Dashboard</span>
      </Link>

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Logo y título corporativo */}
        <div className="text-center mb-8">
          <img
            src="/images/logo.png"
            alt="SmartOps Logo"
            className="mx-auto mb-4 w-40 h-14 object-contain"
          />
          <h1 className="text-3xl font-bold text-white mb-2 font-montserrat">
            Bienvenido de nuevo
          </h1>
          <p className="text-white/80 font-montserrat">
            Ingresa tu email y contraseña para acceder
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl border border-smartops-gray bg-white/90">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-center text-smartops-dark font-montserrat">
              Iniciar sesión
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Demo Credentials Box */}
            <div className="mb-6 p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-sm font-montserrat flex flex-col gap-1.5 shadow-sm">
              <div className="flex items-center justify-between font-semibold">
                <span className="flex items-center gap-1.5 text-blue-900 font-bold">
                  💡 Credenciales de Prueba
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setUsernameOrEmail("admin@smartops.com");
                    setPassword("Admin123!");
                  }}
                  className="text-xs bg-smartops-blue hover:bg-smartops-blue-hover text-white px-2.5 py-1 rounded font-medium transition-colors shadow-sm cursor-pointer"
                >
                  Auto-completar
                </button>
              </div>
              <div className="text-xs text-blue-800 space-y-0.5 pt-1 border-t border-blue-200/60">
                <p><strong>Email / Usuario:</strong> <code className="bg-white/80 px-1 py-0.5 rounded text-blue-900 font-mono">admin@smartops.com</code></p>
                <p><strong>Contraseña:</strong> <code className="bg-white/80 px-1 py-0.5 rounded text-blue-900 font-mono">Admin123!</code></p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div className="space-y-2">
                <label
                  htmlFor="usernameOrEmail"
                  className="text-sm font-semibold text-smartops-dark font-montserrat"
                >
                  Email or Username
                </label>
                <Input
                  id="usernameOrEmail"
                  type="text"
                  placeholder="Your email or username"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  className="h-12 border-smartops-gray focus:border-smartops-blue focus:ring-smartops-blue font-montserrat bg-white"
                  required
                />
              </div>

              {/* Password Input (Reutilizable) */}
              <PasswordInput value={password} onChange={setPassword} />

              {/* Tenant Input */}
              <div className="space-y-2">
                <label
                  htmlFor="tenantId"
                  className="text-sm font-semibold text-smartops-dark font-montserrat"
                >
                  Tenant (nombre de empresa, organización, etc.)
                </label>
                <Input
                  id="tenantId"
                  type="text"
                  placeholder="Nombre de tu empresa u organización (opcional)"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  className="h-12 border-smartops-gray focus:border-smartops-blue focus:ring-smartops-blue font-montserrat bg-white"
                />
              </div>

              {/* Remember Me and Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 font-montserrat">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-smartops-dark/70 border-smartops-gray rounded focus:ring-smartops-blue"
                  />
                  <span className="text-sm text-white/80">Recordarme</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-smartops-blue hover:text-smartops-blue-hover font-semibold font-montserrat"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-smartops-blue to-smartops-blue-hover hover:from-smartops-blue-hover hover:to-smartops-blue text-white font-semibold text-base font-montserrat shadow"
                disabled={loading}
              >
                {loading ? "Ingresando..." : "Iniciar sesión"}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-smartops-gray" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-smartops-dark/50 font-montserrat">
                    O continúa con
                  </span>
                </div>
              </div>

              {/* Social Login Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 border-smartops-gray hover:bg-smartops-gray font-montserrat"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 border-smartops-gray hover:bg-smartops-gray font-montserrat"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </Button>
              </div>

              {/* Sign Up Link */}
              <div className="text-center">
                <span className="text-sm text-black">
                  Don't have an account?{" "}
                  <Link
                    to="/sign-up"
                    className="text-black hover:text-smartops-blue-hover font-semibold"
                  >
                    Sign up
                  </Link>
                </span>
              </div>

              {error && (
                <div className="text-red-500 text-sm text-center">{error}</div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-white/80">
            © 2025, made with ❤️ by{" "}
            <a
              href="https://www.creative-tim.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-smartops-blue font-semibold"
            >
              Creative Tim
            </a>{" "}
            for a better web.
          </p>
        </div>
      </div>
    </div>
  );
}

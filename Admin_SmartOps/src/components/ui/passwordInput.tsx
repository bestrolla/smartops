import { useState, useMemo } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";

interface PasswordInputProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  showStrength?: boolean; // 👈 para activar/desactivar la barra de fuerza
}

export function PasswordInput({
  id = "password",
  label = "Password",
  value,
  onChange,
  placeholder = "Your password",
  required = true,
  autoComplete = "current-password",
  showStrength = false,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  // 🔹 Calcular fuerza de la contraseña
  const passwordStrength = useMemo(() => {
    let score = 0;
    if (value.length >= 8) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;

    if (score === 0) return { label: "", color: "bg-transparent", width: "w-0" };
    if (score === 1) return { label: "Muy débil", color: "bg-red-500", width: "w-1/4" };
    if (score === 2) return { label: "Débil", color: "bg-orange-500", width: "w-1/2" };
    if (score === 3) return { label: "Fuerte", color: "bg-yellow-500", width: "w-3/4" };
    if (score === 4) return { label: "Muy fuerte", color: "bg-green-500", width: "w-full" };
    return { label: "", color: "bg-transparent", width: "w-0" };
  }, [value]);

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="text-sm font-semibold text-smartops-dark font-montserrat"
      >
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 border-smartops-gray focus:border-smartops-blue focus:ring-smartops-blue pr-12 font-montserrat bg-white"
          required={required}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-smartops-dark/40 hover:text-smartops-blue"
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* 🔹 Barra de fuerza de contraseña */}
      {showStrength && value && (
        <div className="space-y-1">
          <div className="h-2 w-full bg-gray-200 rounded">
            <div
              className={`h-2 rounded ${passwordStrength.color} ${passwordStrength.width} transition-all`}
            ></div>
          </div>
          <p className="text-xs font-medium text-gray-600">
            {passwordStrength.label}
          </p>
        </div>
      )}
    </div>
  );
}

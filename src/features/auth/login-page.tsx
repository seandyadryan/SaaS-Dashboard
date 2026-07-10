import { FormEvent, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AlertTriangle, Eye, EyeOff, LogIn, Mail } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ToastViewport } from "@/components/ui/toast";
import { useAuthStore } from "@/store/auth-store";
import { useUiStore } from "@/store/ui-store";

type LocationState = {
  from?: {
    pathname?: string;
  };
};

export function LoginPage() {
  const location = useLocation();
  const { session, login } = useAuthStore();
  const { addToast } = useUiStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const redirectTo = (location.state as LocationState | null)?.from?.pathname ?? "/";

  if (session) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setWarning(null);

    window.setTimeout(() => {
      void login(username.trim(), password).then((result) => {
        setLoading(false);

        if (!result.success) {
          const retryText = result.retryAfterSeconds
            ? ` Coba lagi dalam ${Math.ceil(result.retryAfterSeconds / 60)} menit.`
            : "";
          const attemptsText =
            typeof result.attemptsRemaining === "number"
              ? ` Sisa percobaan sebelum user diblokir: ${result.attemptsRemaining}.`
              : "";
          const message = `${result.message ?? "Email atau password salah."}${attemptsText}${retryText}`;
          setWarning(message);
          addToast({
            title: "Login gagal",
            description: message,
            variant: "danger",
          });
          return;
        }

        addToast({
          title: "Login berhasil",
          description: "Selamat datang.",
          variant: "success",
        });
      });
    }, 360);
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10 text-white grid-surface">
      <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.34),transparent_36rem)]" />
      <div className="relative z-10 w-full max-w-md">
        <Card className="mx-auto w-full max-w-md border-slate-700/70 bg-slate-900/86">
          <CardContent className="p-7 sm:p-8">
            <div className="mb-8 flex items-center justify-center">
              <BrandLogo showText={false} markClassName="h-12 w-12" />
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {warning ? (
                <div className="flex gap-3 rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-100">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{warning}</p>
                </div>
              ) : null}

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">Email</span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    className="pl-9"
                    type="email"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="nama@email.com"
                    autoComplete="email"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">Password</span>
                <div className="relative">
                  <Input
                    className="pr-11"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Masukkan password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-white"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              <Button className="h-11 w-full" type="submit" disabled={loading}>
                <LogIn className="h-4 w-4" />
                {loading ? "Memverifikasi..." : "Login"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <ToastViewport />
    </main>
  );
}

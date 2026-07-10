import { FormEvent, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, LogIn, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const redirectTo = (location.state as LocationState | null)?.from?.pathname ?? "/";

  if (session) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    window.setTimeout(() => {
      void login(username.trim(), password).then((success) => {
        setLoading(false);

        if (!success) {
          addToast({
            title: "Login gagal",
            description: "Username atau password superuser tidak sesuai.",
            variant: "danger",
          });
          return;
        }

        addToast({
          title: "Login berhasil",
          description: "Selamat datang di NeuraX AI Admin Console.",
          variant: "success",
        });
      });
    }, 360);
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10 text-white grid-surface">
      <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.34),transparent_36rem)]" />
      <div className="relative z-10 grid w-full max-w-6xl gap-8 lg:grid-cols-[1fr_440px] lg:items-center">
        <section className="hidden lg:block">
          <div className="mb-8 inline-flex items-center gap-3 rounded-xl border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
            <ShieldCheck className="h-4 w-4" />
            Secure Admin Gateway
          </div>
          <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-normal text-white">
            NeuraX AI Admin Console
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-400">
            Masuk sebagai superuser untuk mengelola pengguna, monitor AI, subscription, analytics, server, storage, API, dan audit log.
          </p>
          <div className="mt-10 grid max-w-2xl gap-4 sm:grid-cols-3">
            {["Realtime AI Ops", "PostgreSQL Ready", "Enterprise Control"].map((item) => (
              <div key={item} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300 shadow-soft">
                {item}
              </div>
            ))}
          </div>
        </section>

        <Card className="mx-auto w-full max-w-md border-slate-700/70 bg-slate-900/86">
          <CardContent className="p-7 sm:p-8">
            <div className="mb-8 flex items-center gap-3">
              <BrandLogo markClassName="h-12 w-12" />
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">Username</span>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input className="pl-9" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
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
    </main>
  );
}

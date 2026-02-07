import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

const Header: React.FC = () => {
  const { user, signOut, signInWithGoogle } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, isAdmin } = useProfile(Boolean(user));
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    try {
      setIsGuest(localStorage.getItem("guest-access") === "true");
    } catch {
      setIsGuest(false);
    }
  }, []);

  const isAdminPage = location.pathname === "/admin";
  const isCalculatorPage = location.pathname === "/";
  const isHealthMetricsPage = location.pathname === "/health-metrics";
  const isSplitViewPage = location.pathname === "/kalkulator-bmi";
  const showAdminButton = Boolean(user) && isAdmin && !isAdminPage;
  const showCalculatorButton = Boolean(user) && !isCalculatorPage;
  const showBmiButton = isCalculatorPage || isAdminPage;
  const showSplitOption = Boolean(user) || isGuest;

  const handleSignOut = async () => {
    const confirmed = window.confirm("Keluar dari akun?");
    if (!confirmed) return;
    try {
      await signOut();
    } finally {
      try {
        localStorage.removeItem("guest-access");
      } catch (error) {
        console.warn("Guest access cleanup failed:", error);
      }
      window.location.assign("/");
    }
  };

  const handleBmiClick: React.MouseEventHandler<HTMLButtonElement> = async (event) => {
    if (user) return;
    if (!isGuest) return;
    event.preventDefault();
    const confirmed = window.confirm("BMI Index memerlukan login. Lanjutkan login?");
    if (!confirmed) return;
    const { error } = await signInWithGoogle();
    if (!error) {
      window.location.assign("/health-metrics");
      return;
    }
    window.alert("Gagal masuk dengan Google. Coba lagi.");
  };

  const handleSplitViewClick = async () => {
    if (user) {
      navigate(isSplitViewPage ? "/" : "/kalkulator-bmi");
      return;
    }
    if (!isGuest) return;
    const confirmed = window.confirm("BMI Index memerlukan login. Lanjutkan login?");
    if (!confirmed) return;
    const { error } = await signInWithGoogle();
    if (!error) {
      navigate("/kalkulator-bmi");
      return;
    }
    window.alert("Gagal masuk dengan Google. Coba lagi.");
  };

  const avatarSrc = profile?.photoUrl || "/kaloriico.png";
  const displayLabel =
    profile?.username ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "";
  const initials = (() => {
    const trimmed = displayLabel.trim();
    if (!trimmed) return "U";
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return trimmed.slice(0, 2).toUpperCase();
  })();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
      <div className="container mx-auto px-4 h-16 md:h-20 lg:h-24 flex items-center justify-between">
        {/* Logo and App Name */}
        <div className="flex items-center gap-3 md:gap-4">
          <img 
            src="/santo-yusup.png" 
            alt="Logo" 
            className="h-10 w-10 md:h-14 md:w-14 lg:h-16 lg:w-16 rounded-lg object-cover"
          />
          <h1 className="text-tv-title text-foreground font-bold">
            Kalkulator Kalori
          </h1>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-3">
          {showAdminButton && (
            <Button asChild variant="secondary" className="touch-target">
              <Link to="/admin">Admin Page</Link>
            </Button>
          )}
          {showCalculatorButton && (
            <Button asChild variant="secondary" className="touch-target">
              <Link to="/">Kalkulator</Link>
            </Button>
          )}
          {showBmiButton && (user || isGuest) && (
            user ? (
              <Button asChild variant="secondary" className="touch-target">
                <Link to="/health-metrics">BMI Index</Link>
              </Button>
            ) : (
              <Button variant="secondary" className="touch-target" onClick={handleBmiClick}>
                BMI Index
              </Button>
            )
          )}
          <div className="flex items-center gap-2">
            <span className="text-tv-small text-muted-foreground hidden md:inline-block">
              {initials}
            </span>
            <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className="h-10 w-10 md:h-11 md:w-11 rounded-full overflow-hidden border border-border bg-muted flex items-center justify-center hover:ring-2 hover:ring-primary/40 transition"
                title="Profil"
              >
                <img
                  src={avatarSrc}
                  alt="Profile"
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    const target = event.currentTarget;
                    if (target.dataset.fallback === "1") return;
                    target.dataset.fallback = "1";
                    target.src = "/noimage1.jpg";
                  }}
                />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-[70] min-w-[180px] rounded-lg border border-border bg-card shadow-lg p-2"
            >
              <div className="px-3 py-2 text-sm text-foreground">
                {displayLabel || "User"}
              </div>
              {showSplitOption && (
                <DropdownMenu.Item
                  className="cursor-pointer select-none rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted"
                  onSelect={(event) => {
                    event.preventDefault();
                    handleSplitViewClick();
                  }}
                >
                  {isSplitViewPage ? "Tampilan Normal" : "Tampilan Split"}
                </DropdownMenu.Item>
              )}
              <div className="px-3 py-2 text-xs text-muted-foreground">Theme</div>
              <DropdownMenu.Item
                className="cursor-pointer select-none rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted"
              >
                Dark
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="cursor-pointer select-none rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted"
              >
                Light
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="my-2 h-px bg-border" />
              <DropdownMenu.Item
                className="cursor-pointer select-none rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                onSelect={(event) => {
                  event.preventDefault();
                  handleSignOut();
                }}
              >
                Sign Out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

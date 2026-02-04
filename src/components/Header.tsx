import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

const Header: React.FC = () => {
  const { user, signOut, signInWithGoogle } = useAuth();
  const location = useLocation();
  const { isAdmin } = useProfile(Boolean(user));
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
  const showAdminButton = Boolean(user) && isAdmin && !isAdminPage;
  const showCalculatorButton = Boolean(user) && isAdmin && isAdminPage;
  const showBmiButton = isCalculatorPage || isAdminPage;

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
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="touch-target text-muted-foreground hover:text-foreground"
            title="Keluar"
          >
            <LogOut className="h-5 w-5 md:h-6 md:w-6" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;

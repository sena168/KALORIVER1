import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const Landing: React.FC = () => {
  const { signInWithGoogle } = useAuth();

  const handleGoogleLogin = async () => {
    const { error } = await signInWithGoogle();
    if (!error) {
      window.location.assign("/");
      return;
    }

    console.error("Google sign-in failed:", error);
    window.alert("Gagal masuk dengan Google. Coba lagi.");
  };

  const handleOpenApp = () => {
    try {
      localStorage.setItem("guest-access", "true");
    } catch (error) {
      console.warn("Guest access storage failed:", error);
    }
    window.location.assign("/?guest=1");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Logo and Branding */}
      <div className="text-center mb-12">
        <img
          src="/santo-yusup.png"
          alt="Logo Sekolah Santo Yusup"
          className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 mx-auto rounded-2xl shadow-xl mb-8"
        />
        <h1 className="text-tv-title text-foreground mb-4">
          Kalkulator Kalori
        </h1>
        <p className="text-tv-body text-muted-foreground max-w-md mx-auto">
          Hitung kalori makanan dan minuman dengan mudah dan cepat
        </p>
      </div>

      {/* Guest Button */}
      <div className="flex flex-col items-center gap-4 w-full max-w-sm">
        <Button
          size="lg"
          onClick={handleOpenApp}
          className="w-full touch-target text-tv-body font-medium px-8 md:px-12 py-6 md:py-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
        >
          Buka Aplikasi
        </Button>
      </div>

      {/* Footer */}
      <div className="mt-12 flex flex-col items-center gap-3 w-full max-w-sm">
        <p className="text-tv-small text-muted-foreground">
          Sekolah Santo Yusup
        </p>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleGoogleLogin}
          className="w-full touch-target text-tv-small font-medium px-6 md:px-10 py-4 md:py-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
        >
          Login Dengan Google
        </Button>
      </div>
    </div>
  );
};

export default Landing;

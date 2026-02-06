import React, { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { HealthMetricsProvider, useHealthMetrics } from "@/contexts/HealthMetricsContext";

const MAX_IMAGE_SIZE = 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/jpg"]);

type TabKey = "bmi" | "body-fat" | "tdee" | "burned" | "heart";

const activityOptions = [
  { label: "Sedentary", value: 1.2 },
  { label: "Light", value: 1.375 },
  { label: "Moderate", value: 1.55 },
  { label: "Active", value: 1.725 },
  { label: "Extra Active", value: 1.9 },
];

const metActivities = [
  { label: "Walking (slow)", met: 2.5 },
  { label: "Walking (brisk)", met: 3.8 },
  { label: "Jogging", met: 7.0 },
  { label: "Cycling (moderate)", met: 6.8 },
  { label: "Swimming", met: 6.0 },
  { label: "Strength training", met: 5.0 },
  { label: "Yoga", met: 3.0 },
  { label: "Basketball", met: 8.0 },
];

const numberOrZero = (value: unknown) => (Number.isFinite(Number(value)) ? Number(value) : 0);

const HealthMetricsContent: React.FC = () => {
  const { user, loading, signInWithGoogle } = useAuth();
  const { profile, isLoading: profileLoading, error: profileError, saveProfile } = useProfile(Boolean(user));
  const { age, weight, height, gender, setAge, setWeight, setHeight, setGender } = useHealthMetrics();

  const [activeTab, setActiveTab] = useState<TabKey>("bmi");
  const [activityLevel, setActivityLevel] = useState(activityOptions[1].value);
  const [username, setUsername] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string>("/noimage1.jpg");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [burnDuration, setBurnDuration] = useState("30");
  const [burnActivity, setBurnActivity] = useState(metActivities[0]);
  const [burnList, setBurnList] = useState<Array<{ label: string; met: number; minutes: number }>>([]);
  const [forceReady, setForceReady] = useState(false);

  useEffect(() => {
    if (!profile || hasHydrated) return;
    if (profile.age) setAge(profile.age);
    if (profile.weight) setWeight(profile.weight);
    if (profile.height) setHeight(profile.height);
    if (profile.gender === "female" || profile.gender === "male") setGender(profile.gender);
    if (profile.username) setUsername(profile.username);
    if (profile.photoUrl) setPhotoPreview(profile.photoUrl);
    setHasHydrated(true);
  }, [profile, hasHydrated, setAge, setWeight, setHeight, setGender]);

  useEffect(() => {
    if (!profileLoading && !hasHydrated) {
      setHasHydrated(true);
    }
  }, [profileLoading, hasHydrated]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setForceReady(true);
    }, 4000);
    return () => clearTimeout(timeoutId);
  }, []);

  const profileSnapshot = useMemo(
    () => ({
      age: profile?.age ?? 18,
      weight: profile?.weight ?? 60,
      height: profile?.height ?? 165,
      gender: profile?.gender ?? "male",
      username: profile?.username ?? "",
      photoUrl: profile?.photoUrl ?? "",
    }),
    [profile],
  );

  const isDirty = useMemo(() => {
    if (!hasHydrated) return false;
    if (photoDataUrl) return true;
    return (
      age !== profileSnapshot.age ||
      weight !== profileSnapshot.weight ||
      height !== profileSnapshot.height ||
      gender !== profileSnapshot.gender ||
      username !== profileSnapshot.username
    );
  }, [age, weight, height, gender, username, photoDataUrl, profileSnapshot, hasHydrated]);

  const handlePhotoChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      window.alert("Foto harus PNG atau JPG.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      window.alert("Ukuran foto maksimal 1MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      setPhotoPreview(result);
      setPhotoDataUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!user || isSaving || !isDirty) return;
    setIsSaving(true);
    try {
      await saveProfile({
        age,
        weight,
        height,
        gender,
        username,
        photoUrl: photoDataUrl ?? undefined,
      });
      setPhotoDataUrl(null);
      toast.success("Profil berhasil disimpan.");
    } catch (error) {
      console.error("Profile save failed:", error);
      toast.error("Gagal menyimpan profil.");
    } finally {
      setIsSaving(false);
    }
  };

  const bmi = useMemo(() => {
    if (!height || !weight) return 0;
    const h = height / 100;
    return weight / (h * h);
  }, [height, weight]);

  const bmiCategory = useMemo(() => {
    if (bmi === 0) return "—";
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal";
    if (bmi < 30) return "Overweight";
    return "Obese";
  }, [bmi]);

  const idealRange = useMemo(() => {
    if (!height) return { min: 0, max: 0 };
    const h = height / 100;
    return { min: 18.5 * h * h, max: 24.9 * h * h };
  }, [height]);

  const bodyFat = useMemo(() => {
    if (!age || !bmi) return 0;
    const genderValue = gender === "male" ? 1 : 0;
    return 1.2 * bmi + 0.23 * age - 10.8 * genderValue - 5.4;
  }, [age, bmi, gender]);

  const bodyFatCategory = useMemo(() => {
    if (!bodyFat) return "—";
    if (bodyFat < 18) return "Low";
    if (bodyFat < 25) return "Normal";
    return "High";
  }, [bodyFat]);

  const bmr = useMemo(() => {
    if (!age || !weight || !height) return 0;
    if (gender === "male") {
      return 10 * weight + 6.25 * height - 5 * age + 5;
    }
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }, [age, weight, height, gender]);

  const maintenanceCalories = bmr * activityLevel;

  const addBurnActivity = () => {
    const minutes = numberOrZero(burnDuration);
    if (minutes <= 0) return;
    setBurnList((prev) => [...prev, { label: burnActivity.label, met: burnActivity.met, minutes }]);
  };

  const totalBurned = useMemo(() => {
    return burnList.reduce((sum, entry) => {
      const calories = (entry.met * 3.5 * weight) / 200 * entry.minutes;
      return sum + calories;
    }, 0);
  }, [burnList, weight]);

  const heartZones = useMemo(() => {
    const max = 220 - age;
    const ranges = [
      { label: "Recovery", min: 0.5, max: 0.6 },
      { label: "Fat Burn", min: 0.6, max: 0.7 },
      { label: "Aerobic", min: 0.7, max: 0.8 },
      { label: "Threshold", min: 0.8, max: 0.9 },
      { label: "Maximum", min: 0.9, max: 1.0 },
    ];
    return ranges.map((zone) => ({
      label: zone.label,
      min: Math.round(max * zone.min),
      max: Math.round(max * zone.max),
    }));
  }, [age]);

  if (loading && !forceReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <img
            src="/santo-yusup.png"
            alt="Loading"
            className="w-20 h-20 mx-auto rounded-xl animate-pulse mb-4"
          />
          <p className="text-muted-foreground text-tv-body">Memuat... (Health Metrics)</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full text-center">
          <h2 className="text-tv-subtitle text-foreground mb-2">BMI Index membutuhkan login</h2>
          <p className="text-tv-body text-muted-foreground mb-6">
            Silakan login dengan Google untuk melanjutkan.
          </p>
          <Button
            size="lg"
            onClick={async () => {
              const { error } = await signInWithGoogle();
              if (!error) {
                window.location.assign("/health-metrics");
              } else {
                window.alert("Gagal masuk dengan Google. Coba lagi.");
              }
            }}
            className="w-full"
          >
            Login Dengan Google
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 md:pt-28 lg:pt-32 pb-10">
        <div className="container mx-auto px-4 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
            {profileLoading && (
              <div className="space-y-4">
                <div className="h-6 w-56 rounded-md bg-muted animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-12 rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
                <div className="h-20 rounded-lg bg-muted animate-pulse" />
              </div>
            )}
            {!profileLoading && (
              <>
                {profileError ? (
                  <div className="mb-4 rounded-lg border border-border/60 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                    Profil tersimpan tidak bisa dimuat. Silakan isi ulang datanya.
                  </div>
                ) : !profile ? (
                  <div className="mb-4 rounded-lg border border-border/60 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                    Harap lengkapi data untuk menggunakan kalkulator.
                  </div>
                ) : null}
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <label className="block">
                      <span className="text-tv-small text-muted-foreground">Usia</span>
                      <input
                        type="number"
                        min={1}
                        value={age}
                        onChange={(event) => setAge(Number(event.target.value))}
                        className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground"
                      />
                    </label>
                    <label className="block">
                      <span className="text-tv-small text-muted-foreground">Berat (kg)</span>
                      <input
                        type="number"
                        min={1}
                        value={weight}
                        onChange={(event) => setWeight(Number(event.target.value))}
                        className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground"
                      />
                    </label>
                    <label className="block">
                      <span className="text-tv-small text-muted-foreground">Tinggi (cm)</span>
                      <input
                        type="number"
                        min={1}
                        value={height}
                        onChange={(event) => setHeight(Number(event.target.value))}
                        className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground"
                      />
                    </label>
                    <label className="block">
                      <span className="text-tv-small text-muted-foreground">Gender</span>
                      <div className="mt-2 flex gap-2">
                        <Button
                          type="button"
                          variant={gender === "male" ? "default" : "secondary"}
                          onClick={() => setGender("male")}
                          className="flex-1"
                        >
                          Male
                        </Button>
                        <Button
                          type="button"
                          variant={gender === "female" ? "default" : "secondary"}
                          onClick={() => setGender("female")}
                          className="flex-1"
                        >
                          Female
                        </Button>
                      </div>
                    </label>
                  </div>

                  <div className="w-full lg:w-64 flex flex-col gap-4">
                    <label className="block">
                      <span className="text-tv-small text-muted-foreground">Username (opsional)</span>
                      <input
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground"
                      />
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                        <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-tv-small text-muted-foreground">
                          Foto (PNG/JPG, max 1MB)
                        </label>
                        <input
                          type="file"
                          accept="image/png,image/jpeg"
                          onChange={handlePhotoChange}
                          className="mt-2 w-full text-sm text-muted-foreground"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleSaveProfile}
                      disabled={!isDirty || isSaving}
                      variant={isDirty ? "default" : "secondary"}
                    >
                      {isSaving ? "Menyimpan..." : "Simpan Profil"}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>

          {isSaving && (
            <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center">
              <div className="bg-card border border-border rounded-xl px-6 py-4 shadow-xl flex items-center gap-3">
                <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <span className="text-tv-body text-foreground">Menyimpan profil...</span>
              </div>
            </div>
          )}

          <div className="bg-card border border-border rounded-2xl p-4 shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { key: "bmi", label: "BMI" },
                { key: "body-fat", label: "Body Fat %" },
                { key: "tdee", label: "Daily Calorie Intake" },
                { key: "burned", label: "Calories Burned" },
                { key: "heart", label: "Heart Rate Zones" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as TabKey)}
                  className={`flex-1 py-3 md:py-4 px-4 md:px-6 rounded-lg text-tv-body font-medium transition-all duration-200 touch-target focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background ${
                    activeTab === tab.key
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === "bmi" && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-tv-small text-muted-foreground">BMI</p>
                  <p className="text-tv-title font-bold text-primary">{bmi ? bmi.toFixed(1) : "—"}</p>
                </div>
                <div>
                  <p className="text-tv-small text-muted-foreground">Kategori</p>
                  <p className="text-tv-subtitle text-foreground">{bmiCategory}</p>
                </div>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${Math.min((bmi / 40) * 100, 100)}%` }}
                />
              </div>
              <div>
                <p className="text-tv-small text-muted-foreground">Ideal Weight Range</p>
                <p className="text-tv-body text-foreground">
                  {idealRange.min.toFixed(1)} kg - {idealRange.max.toFixed(1)} kg
                </p>
              </div>
            </div>
          )}

          {activeTab === "body-fat" && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-tv-small text-muted-foreground">Body Fat %</p>
                  <p className="text-tv-title font-bold text-primary">
                    {bodyFat ? bodyFat.toFixed(1) : "—"}%
                  </p>
                </div>
                <div>
                  <p className="text-tv-small text-muted-foreground">Kategori</p>
                  <p className="text-tv-subtitle text-foreground">{bodyFatCategory}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-tv-small text-muted-foreground">Lean Mass</p>
                  <p className="text-tv-body font-semibold">
                    {weight ? (weight * (1 - bodyFat / 100)).toFixed(1) : "—"} kg
                  </p>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-tv-small text-muted-foreground">Fat Mass</p>
                  <p className="text-tv-body font-semibold">
                    {weight ? (weight * (bodyFat / 100)).toFixed(1) : "—"} kg
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "tdee" && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-md space-y-4">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <p className="text-tv-small text-muted-foreground">Activity Level</p>
                  <select
                    value={activityLevel}
                    onChange={(event) => setActivityLevel(Number(event.target.value))}
                    className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground"
                  >
                    {activityOptions.map((option) => (
                      <option key={option.label} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="text-tv-small text-muted-foreground">BMR</p>
                  <p className="text-tv-title font-bold text-primary">{Math.round(bmr)}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-tv-small text-muted-foreground">Maintenance</p>
                  <p className="text-tv-body font-semibold">{Math.round(maintenanceCalories)}</p>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-tv-small text-muted-foreground">Smooth Loss</p>
                  <p className="text-tv-body font-semibold">
                    {Math.round(maintenanceCalories - 250)}
                  </p>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-tv-small text-muted-foreground">Fast Loss</p>
                  <p className="text-tv-body font-semibold">
                    {Math.round(maintenanceCalories - 500)}
                  </p>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-tv-small text-muted-foreground">Smooth Gain</p>
                  <p className="text-tv-body font-semibold">
                    {Math.round(maintenanceCalories + 250)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "burned" && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-md space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="block">
                  <span className="text-tv-small text-muted-foreground">Activity</span>
                  <select
                    value={burnActivity.label}
                    onChange={(event) => {
                      const next = metActivities.find((item) => item.label === event.target.value);
                      if (next) setBurnActivity(next);
                    }}
                    className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground"
                  >
                    {metActivities.map((item) => (
                      <option key={item.label} value={item.label}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-tv-small text-muted-foreground">Duration (minutes)</span>
                  <input
                    type="number"
                    min={1}
                    value={burnDuration}
                    onChange={(event) => setBurnDuration(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground"
                  />
                </label>
                <div className="flex items-end">
                  <Button onClick={addBurnActivity} className="w-full">
                    Tambah Aktivitas
                  </Button>
                </div>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-tv-small text-muted-foreground">Total Calories Burned</p>
                <p className="text-tv-title font-bold text-primary">{Math.round(totalBurned)}</p>
              </div>
              <div className="space-y-2">
                {burnList.map((entry, index) => (
                  <div key={`${entry.label}-${index}`} className="flex justify-between bg-muted/50 p-3 rounded-lg">
                    <span>{entry.label} ({entry.minutes} min)</span>
                    <span>
                      {Math.round((entry.met * 3.5 * weight) / 200 * entry.minutes)} kcal
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "heart" && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-md space-y-4">
              <p className="text-tv-small text-muted-foreground">Maximum Heart Rate</p>
              <p className="text-tv-title font-bold text-primary">{220 - age} BPM</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {heartZones.map((zone) => (
                  <div key={zone.label} className="bg-muted rounded-lg p-4">
                    <p className="text-tv-small text-muted-foreground">{zone.label}</p>
                    <p className="text-tv-body font-semibold">
                      {zone.min} - {zone.max} BPM
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const HealthMetrics: React.FC = () => (
  <HealthMetricsProvider>
    <HealthMetricsContent />
  </HealthMetricsProvider>
);

export default HealthMetrics;

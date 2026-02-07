import React from "react";
import Header from "@/components/Header";
import { CalculatorContent } from "@/pages/Calculator";
import { HealthMetricsEmbedded } from "@/pages/HealthMetrics";

const SplitView: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 md:pt-28 lg:pt-32 pb-6">
        <div className="container mx-auto px-4">
          <div className="hidden xl:grid xl:grid-cols-2 gap-6 h-[calc(100vh-10rem)]">
            <div className="bg-card border border-border rounded-2xl shadow-md overflow-hidden flex flex-col">
              <CalculatorContent embedded />
            </div>
            <div className="bg-card border border-border rounded-2xl shadow-md overflow-hidden flex flex-col">
              <HealthMetricsEmbedded />
            </div>
          </div>
          <div className="xl:hidden bg-card border border-border rounded-2xl p-6 text-center">
            <p className="text-tv-body text-muted-foreground">
              Tampilan split hanya tersedia di layar besar.
            </p>
            <p className="text-tv-small text-muted-foreground mt-2">
              Gunakan Kalkulator atau BMI Index secara terpisah.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SplitView;

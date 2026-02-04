import React, { createContext, useContext, useMemo, useState } from "react";

type Gender = "male" | "female";

type HealthMetricsState = {
  age: number;
  weight: number;
  height: number;
  gender: Gender;
  setAge: (value: number) => void;
  setWeight: (value: number) => void;
  setHeight: (value: number) => void;
  setGender: (value: Gender) => void;
};

const HealthMetricsContext = createContext<HealthMetricsState | null>(null);

export const HealthMetricsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [age, setAge] = useState(18);
  const [weight, setWeight] = useState(60);
  const [height, setHeight] = useState(165);
  const [gender, setGender] = useState<Gender>("male");

  const value = useMemo(
    () => ({
      age,
      weight,
      height,
      gender,
      setAge,
      setWeight,
      setHeight,
      setGender,
    }),
    [age, weight, height, gender],
  );

  return <HealthMetricsContext.Provider value={value}>{children}</HealthMetricsContext.Provider>;
};

export const useHealthMetrics = () => {
  const context = useContext(HealthMetricsContext);
  if (!context) {
    throw new Error("useHealthMetrics must be used within HealthMetricsProvider");
  }
  return context;
};

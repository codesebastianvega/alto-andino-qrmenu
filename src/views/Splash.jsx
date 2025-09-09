// src/views/Splash.jsx
import { useEffect } from "react";
import { useAppState } from "../state/appState";

export default function Splash({ onFinish }) {
  const { setMode, setArea, setTableId } = useAppState();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mesa = params.get("mesa");
    const modeParam = params.get("mode");

    if (mesa) {
      setMode("mesa");
      setTableId(mesa);
      setArea("menu");
      const t = setTimeout(() => onFinish("menu"), 1200);
      return () => clearTimeout(t);
    }

    if (modeParam) {
      setMode(modeParam);
      const t = setTimeout(() => onFinish("menu"), 1200);
      return () => clearTimeout(t);
    }

    const storedArea = window.localStorage.getItem("area");
    if (storedArea) setArea(storedArea);

    const t = setTimeout(() => {
      if (storedArea) {
        onFinish(storedArea);
      } else {
        onFinish("hub");
      }
    }, 1200);

    return () => clearTimeout(t);
  }, [onFinish, setMode, setArea, setTableId]);

  return (
    <div className="flex h-screen items-center justify-center bg-white">
      <img src="/logo.svg" alt="Alto Andino" className="h-32 w-32 animate-pulse" />
    </div>
  );
}


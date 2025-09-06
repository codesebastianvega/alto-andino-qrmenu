// src/views/Splash.jsx
import { useEffect } from "react";
import { useAppState } from "../state/appState";

export default function Splash({ onFinish }) {
  const { setMode, setArea } = useAppState();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mesa = params.get("mesa");
    const modeParam = params.get("mode");

    const storedMode = window.localStorage.getItem("mode");
    const storedArea = window.localStorage.getItem("area");

    if (storedMode) setMode(storedMode);
    if (storedArea) setArea(storedArea);

    if (modeParam) setMode(modeParam);
    if (mesa) {
      setMode("mesa");
      setArea("menu");
    }

    const timer = setTimeout(() => {
      if (mesa && modeParam === "mesa") {
        onFinish("menu");
      } else if (!mesa && storedMode && storedArea && !modeParam) {
        onFinish(storedArea);
      } else {
        onFinish("hub");
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [onFinish, setMode, setArea]);

  return (
    <div className="flex h-screen items-center justify-center bg-white">
      <img src="/logo.svg" alt="Alto Andino" className="h-32 w-32 animate-pulse" />
    </div>
  );
}


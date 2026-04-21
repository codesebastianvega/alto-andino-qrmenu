import { useEffect } from "react";
import AlunaNavbar from "../components/aluna/AlunaNavbar";
import AlunaHero from "../components/aluna/AlunaHero";
import AlunaAbout from "../components/aluna/AlunaAbout";
import AlunaFeatures from "../components/aluna/AlunaFeatures";
import AlunaHowItWorks from "../components/aluna/AlunaHowItWorks";
import AlunaPortfolio from "../components/aluna/AlunaPortfolio";
import AlunaPricing from "../components/aluna/AlunaPricing";
import AlunaFAQ from "../components/aluna/AlunaFAQ";
import AlunaContact from "../components/aluna/AlunaContact";
import AlunaFooter from "../components/aluna/AlunaFooter";

export default function AlunaLanding() {
  useEffect(() => {
    // Guardar los valores originales
    const originalTitle = document.title;
    const link = document.querySelector("link[rel~='icon']");
    const originalHref = link ? link.href : null;

    // Actualizar para Aluna
    document.title = "Aluna | Menús Digitales Premium";
    if (link) {
      link.href = "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>✨</text></svg>";
    }

    // Restaurar al desmontar (si el usuario navega a otra ruta)
    return () => {
      document.title = originalTitle;
      if (link && originalHref) {
        link.href = originalHref;
      }
    };
  }, []);

  return (
    <div className="bg-white font-sans antialiased relative">
      <AlunaNavbar />
      <AlunaHero />
      <AlunaAbout />
      <AlunaHowItWorks />
      <AlunaFeatures />
      <AlunaPortfolio />
      <AlunaPricing />
      <AlunaFAQ />
      <AlunaContact />
      <AlunaFooter />
    </div>
  );
}

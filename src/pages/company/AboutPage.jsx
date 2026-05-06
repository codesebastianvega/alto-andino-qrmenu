import { useEffect } from "react";
import AlunaNavbar from "../../components/aluna/AlunaNavbar";
import AlunaAbout from "../../components/aluna/AlunaAbout";
import AlunaFooter from "../../components/aluna/AlunaFooter";
import CookieConsent from "../../components/aluna/CookieConsent";

export default function AboutPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-white font-sans antialiased relative min-h-screen flex flex-col">
      <AlunaNavbar />
      <div className="flex-grow pt-24 bg-[#F7F7F5] flex flex-col justify-center">
        <AlunaAbout />
      </div>
      <AlunaFooter />
      <CookieConsent />
    </div>
  );
}

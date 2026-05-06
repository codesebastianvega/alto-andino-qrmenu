import { useEffect } from "react";
import AlunaNavbar from "../../components/aluna/AlunaNavbar";
import AlunaContact from "../../components/aluna/AlunaContact";
import AlunaFooter from "../../components/aluna/AlunaFooter";
import CookieConsent from "../../components/aluna/CookieConsent";

export default function ContactPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-white font-sans antialiased relative min-h-screen flex flex-col">
      <AlunaNavbar />
      <div className="flex-grow pt-24 bg-white flex flex-col justify-center">
        <AlunaContact />
      </div>
      <AlunaFooter />
      <CookieConsent />
    </div>
  );
}

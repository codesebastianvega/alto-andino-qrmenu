import AlunaNavbar from "../components/aluna/AlunaNavbar";
import AlunaHero from "../components/aluna/AlunaHero";
import AlunaAbout from "../components/aluna/AlunaAbout";
import AlunaFeatures from "../components/aluna/AlunaFeatures";
import AlunaHowItWorks from "../components/aluna/AlunaHowItWorks";
import AlunaPortfolio from "../components/aluna/AlunaPortfolio";
import AlunaPricing from "../components/aluna/AlunaPricing";
import AlunaContact from "../components/aluna/AlunaContact";
import AlunaFooter from "../components/aluna/AlunaFooter";

export default function AlunaLanding() {
  return (
    <div className="bg-white font-sans antialiased">
      <AlunaNavbar />
      <AlunaHero />
      <AlunaAbout />
      <AlunaHowItWorks />
      <AlunaFeatures />
      <AlunaPortfolio />
      <AlunaPricing />
      <AlunaContact />
      <AlunaFooter />
    </div>
  );
}

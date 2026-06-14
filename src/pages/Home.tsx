import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import AboutSection from "../components/AboutSection";
import DomainsSection from "@/components/DomainsSection";
import EventsSection from "../components/EventsSection";
import TeamSection from "../components/TeamSection";
import ContactSection from "../components/ContactSection";
import Footer from "../components/Footer";
import BackToTop from "../components/BackToTop";

const Home = () => {
  return (
    <>
      <Navbar />
      <HeroSection />
      <AboutSection />
      <DomainsSection />
      <EventsSection />
      <TeamSection />
      <ContactSection />
      <Footer />
      <BackToTop />
    </>
  );
};

export default Home;

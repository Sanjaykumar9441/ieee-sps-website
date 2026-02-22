import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import StatsSection from "../components/StatsSection";
import AboutSection from "../components/AboutSection";
import EventsSection from "../components/EventsSection";
import TeamSection from "../components/TeamSection";
import ContactSection from "../components/ContactSection";
import Footer from "../components/Footer";

const Home = () => {
  return (
    <>
      <Navbar />
      <HeroSection />
      <StatsSection />
      <AboutSection />
      <EventsSection />
      <TeamSection />
      <ContactSection />
      <Footer />
    </>
  );
};

export default Home;

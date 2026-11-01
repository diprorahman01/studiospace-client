
import HeroSlider from "@/components/home/HeroSlider";
import FeaturedStudios from "@/components/home/FeaturedStudios";
import StudioCategories from "@/components/home/StudioCategories";
import BookingSteps from "@/components/home/BookingSteps";
import HostSupport from "@/components/home/HostSupport";

export default function Home() {
  return (
    <main>
      <HeroSlider />

      <FeaturedStudios />

      <StudioCategories />

      <BookingSteps />

      <HostSupport />
    </main>
  );
}

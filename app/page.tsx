
import HeroSlider from "@/components/home/HeroSlider";
import FeaturedStudios from "@/components/home/FeaturedStudios";
import StudioCategories from "@/components/home/StudioCategories";
import BookingSteps from "@/components/home/BookingSteps";

export default function Home() {
  return (
    <main>
      <HeroSlider />
      <FeaturedStudios />
      <StudioCategories />
      <BookingSteps />
    </main>
  );
}

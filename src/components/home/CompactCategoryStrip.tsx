import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import SectionHeading from './SectionHeading';

const categories = [
  { name: 'Planters & Decor', label: 'A little life for your space', image: 'planter-obsidian-black.jpg' },
  { name: 'Desk Accessories', label: 'Make work feel better', image: 'hexagrid-desk-organizer.jpg' },
  { name: 'Miniatures & Collectibles', label: 'For the collector in you', image: 'cyber-gryphon-figure.jpg' },
  { name: 'Architectural Models', label: 'Big ideas, small scale', image: 'trimbakeshwar-temple-model.jpg' },
  { name: 'Kitchen Miniatures', label: 'Small things. So much charm.', image: 'mini-brass-cookware.jpg' },
];

export default function CompactCategoryStrip() {
  return (
    <section className="home-container home-section" id="shop-by-category" aria-label="Shop by category">
      <SectionHeading eyebrow="Find your next print" title="Shop by category" href="/catalog" linkText="View all products" />
      <div className="home-categories">
        {categories.map((category, index) => (
          <Link href={`/catalog?category=${encodeURIComponent(category.name)}`} className="home-category" key={category.name}>
            <div className="home-category-image"><Image src={`/products/${category.image}`} alt={category.name} fill priority={index === 0} sizes="(max-width: 640px) 42vw, (max-width: 900px) 30vw, 18vw" /><span className="home-category-number">0{index + 1}</span><span className="home-category-arrow"><ArrowUpRight size={19} aria-hidden="true" /></span></div>
            <h3>{category.name}</h3><p>{category.label}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

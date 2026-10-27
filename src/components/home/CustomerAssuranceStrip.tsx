import Link from 'next/link';
import { ArrowUpRight, Plus, MessageCircle } from 'lucide-react';

const questions = [
  { question: 'What is the difference between ready to ship and made to order?', answer: <>Ready-to-ship pieces are already printed. Made-to-order pieces are printed after you order. Each product lists its availability and production lead time. Delivery time is additional; see our <Link href="/policies/shipping">shipping policy</Link> for details.</> },
  { question: 'Can I choose a different colour, size, or design?', answer: <>Available colours and materials are listed on each product page. For a different size or an original design, <Link href="/quote">request a custom quote</Link>. If you do not have a 3D file, <Link href="/contact">contact the studio</Link> to discuss your idea.</> },
  { question: 'Do you deliver outside Nashik?', answer: <>Yes, we ship across India. Shipping costs are shown at checkout. You can also contact us to arrange pickup from our Nashik studio. Read our <Link href="/policies/shipping">delivery information</Link> before ordering.</> },
  { question: 'How should I care for my 3D printed piece?', answer: <>Check the material and care instructions on the product page. Gently wipe decorative pieces with a soft cloth and keep them away from excessive heat. Kitchen miniatures are decorative; check the product specifications before any food or water contact.</> },
  { question: 'What if my order arrives damaged?', answer: <>Keep the packaging and contact us with photos of the item and packaging. Our team will help you with the next steps under our <Link href="/policies/returns">returns policy</Link>.</> },
];

export default function CustomerAssuranceStrip() {
  return (
    <section className="home-faq-section" aria-labelledby="home-faq-title"><div className="home-container home-section home-faq-grid">
      <div className="home-faq-intro"><span className="home-eyebrow">Shopping made simple</span><h2 id="home-faq-title">Questions?<br />We have answers.</h2><p>Everything you need to know before your next print.</p><Link className="home-text-link" href="/contact"><MessageCircle size={17} /> Talk to our team <ArrowUpRight size={17} /></Link></div>
      <div className="home-faq-list">{questions.map((item, index) => <details key={item.question} className="home-faq"><summary><span className="home-faq-number">0{index + 1}</span><span>{item.question}</span><Plus size={18} aria-hidden="true" /></summary><div className="home-faq-answer">{item.answer}</div></details>)}</div>
    </div></section>
  );
}

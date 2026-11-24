import Link from "next/link";
import { Logo } from "./SiteHeader";

export default function SiteFooter() {
  return (
    <footer id="contact" className="bg-nf-navy text-white/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-3">
        <div className="space-y-4 text-sm leading-relaxed">
          <Logo className="h-6" />
          <p>NextFab is a membership-based makerspace that provides access to tools, technology, education, events, and services for professional makers.</p>
          <p className="flex gap-4 text-nf-sky"><Link href="#">FAQs</Link><span className="text-white/30">|</span><Link href="#">Careers</Link></p>
          <p className="text-xs text-white/50">Copyright © {new Date().getFullYear()} NextFab. All Rights Reserved.</p>
        </div>
        <div className="space-y-3 text-sm">
          <h3 className="text-lg text-nf-sky">Location</h3>
          <p className="font-medium text-white">Pennsylvania</p>
          <p>1800 North American Street in Philadelphia<br />Saturday - Thursday: 10:00 am - 8:00 pm<br />Fridays: Closed</p>
          <p>(215) 921-3649</p>
        </div>
        <div className="space-y-3 text-sm">
          <h3 className="text-lg text-nf-sky">Contact Us</h3>
          <form className="space-y-2" action="/api/contact" method="post">
            <input className="w-full rounded-sm border-0 bg-white/10 px-3 py-2 placeholder:text-white/40" placeholder="Name" name="name" />
            <input className="w-full rounded-sm border-0 bg-white/10 px-3 py-2 placeholder:text-white/40" placeholder="Email" name="email" type="email" />
            <textarea className="w-full rounded-sm border-0 bg-white/10 px-3 py-2 placeholder:text-white/40" placeholder="Message" name="message" rows={3} />
            <button className="w-full rounded-full bg-nf-tile py-2 font-medium text-white hover:bg-nf-sky">Submit</button>
          </form>
        </div>
      </div>
    </footer>
  );
}

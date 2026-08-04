import { Icons } from "@/components/ui/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react"
import kittaLogo from '@/images/kitta-logo.png'

function StackedCircularFooter() {
  return (
    <footer className="bg-black py-16 border-t border-zinc-900">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center">
          <div className="mb-8">
            <img src={kittaLogo} alt="Kitta Logo" className="h-12" />
          </div>
          <nav className="mb-8 flex flex-wrap justify-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#" className="hover:text-white transition-colors">Terminal</a>
            <a href="#" className="hover:text-white transition-colors">Documentation</a>
            <a href="#" className="hover:text-white transition-colors">API Pricing</a>
            <a href="#" className="hover:text-white transition-colors">Company</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </nav>
          <div className="mb-10 flex space-x-4">
            <Button variant="outline" size="icon" className="rounded-full bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800">
              <Twitter className="h-4 w-4" />
              <span className="sr-only">Twitter</span>
            </Button>
            <Button variant="outline" size="icon" className="rounded-full bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800">
              <Linkedin className="h-4 w-4" />
              <span className="sr-only">LinkedIn</span>
            </Button>
          </div>
          <div className="mb-12 w-full max-w-md">
            <form className="flex space-x-2">
              <div className="flex-grow">
                <Label htmlFor="email" className="sr-only">Email</Label>
                <Input 
                  id="email" 
                  placeholder="Enter your email for NEPSE updates" 
                  type="email" 
                  className="rounded-full bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus-visible:ring-[#10B981]" 
                />
              </div>
              <Button type="submit" className="rounded-full bg-[#10B981] text-black font-bold hover:bg-[#10B981]/80">Subscribe</Button>
            </form>
          </div>
          <div className="text-center">
            <p className="text-sm text-zinc-600">
              © 2026 Kitta Inc. All rights reserved. Not financial advice.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export { StackedCircularFooter }

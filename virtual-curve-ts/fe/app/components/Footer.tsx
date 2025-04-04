import { CircleDot, Twitter, Github, Youtube } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="container mx-auto px-4 py-10 border-t border-white/20 mt-20">
      <div className="flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center gap-1.5 mb-6 md:mb-0">
          <CircleDot className="w-4 h-4 text-white" strokeWidth={1.5} />
          <span className="text-base font-bold">Virtual Curve</span>
        </div>

        <div className="flex gap-4">
          <a
            href="https://twitter.com"
            className="text-gray-400 hover:text-white transition"
          >
            <Twitter className="w-4 h-4" />
          </a>
          <a
            href="https://github.com"
            className="text-gray-400 hover:text-white transition"
          >
            <Github className="w-4 h-4" />
          </a>
          <a
            href="https://youtube.com"
            className="text-gray-400 hover:text-white transition"
          >
            <Youtube className="w-4 h-4" />
          </a>
        </div>
      </div>
      <div className="text-center mt-8 text-gray-400">
        <p>© {new Date().getFullYear()} Virtual Curve. All rights reserved.</p>
      </div>
    </footer>
  )
}

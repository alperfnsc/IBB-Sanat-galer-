import { Link } from 'react-router-dom';
import { Map, Palette, MapPin } from 'lucide-react';
import { motion } from 'motion/react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans flex flex-col">
      {/* Navbar */}
      <header className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between z-10 w-full bg-white/80 backdrop-blur-md">
        <div className="flex items-center gap-2 text-xl font-medium tracking-tight">
          <Palette className="w-6 h-6 text-neutral-900" />
          <span>Istanbul Art Galleries</span>
        </div>
        <nav>
          <Link
            to="/map"
            className="text-sm font-medium hover:text-neutral-500 transition-colors"
          >
            Harita Yayını
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center text-center px-6 relative overflow-hidden">
        {/* Background Decorative Blur */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neutral-100 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-600 text-sm font-medium mb-6 border border-neutral-200">
            <MapPin className="w-4 h-4" />
            <span>İstanbul'un Kültür Hazinelerini Keşfet</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-neutral-900 mb-6 leading-tight">
            Sanatın Merkezine <br className="hidden md:block"/> Yolculuk
          </h1>
          
          <p className="text-lg md:text-xl text-neutral-600 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
            İstanbul'daki tüm güncel sanat galerilerini, müzeleri ve kültür merkezlerini tek bir harita üzerinden keşfedin. Güncel etkinlik adreslerine hemen ulaşın.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              to="/map"
              className="group flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-8 py-4 rounded-full font-medium transition-all duration-300 shadow-xl shadow-neutral-900/10 transform hover:-translate-y-1"
            >
              <Map className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Haritayı Görüntüle</span>
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-neutral-400 text-sm border-t border-neutral-100">
        &copy; {new Date().getFullYear()} Istanbul Art Galleries. Tüm hakları saklıdır.
      </footer>
    </div>
  );
}
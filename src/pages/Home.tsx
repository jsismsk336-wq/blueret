import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { jerseys, teams } from '../data/mockData';
import { InteractiveLogo } from '../components/shared/InteractiveLogo';

export function Home() {
  const featuredJersey = jerseys[0];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-dark-bg/80 z-10" />
          <img 
            src="https://images.unsplash.com/photo-1518605368461-1ee7c5320c78?q=80&w=2000&auto=format&fit=crop" 
            alt="Stadium" 
            className="w-full h-full object-cover animate-slow-zoom"
          />
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase mb-6 leading-none text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-500">
                Beyond<br/>The Pitch.
              </h1>
              <p className="text-xl text-gray-400 mb-8 max-w-md font-light">
                Discover the art of football kits. High-resolution galleries of the world's most beautiful jerseys.
              </p>
              <Link 
                to="/jerseys" 
                className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-gray-200 transition-colors"
              >
                Explore Collection
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>

            <motion.div 
              className="hidden md:block relative"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden glass-panel group">
                <img 
                  src={featuredJersey.image} 
                  alt={featuredJersey.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 to-transparent">
                  <p className="text-sm font-medium text-gray-300 uppercase tracking-widest mb-2">Featured</p>
                  <h3 className="text-2xl font-bold text-white">{featuredJersey.name}</h3>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Teams Section */}
      <section className="py-24 bg-dark-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-bold tracking-tight mb-4">Elite Clubs</h2>
              <p className="text-gray-400">Discover collections from the world's top teams.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {teams.map((team, idx) => (
              <motion.div 
                key={team.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex flex-col items-center gap-6"
              >
                <Link to={`/team/${team.id}`} className="w-full">
                  <InteractiveLogo src={team.logo} alt={team.name} color={team.color} />
                </Link>
                <h3 className="text-xl font-medium tracking-wide">{team.name}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

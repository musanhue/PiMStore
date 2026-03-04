import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Star, Zap, Pause, Play } from 'lucide-react';

export default function Home({ loading, products }) {
    const featuredProducts = products.filter(p => p.isFeatured);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);

    useEffect(() => {
        if (featuredProducts.length <= 1 || !isPlaying) return;
        const timer = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % featuredProducts.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [featuredProducts.length, isPlaying]);

    const nextSlide = () => setCurrentSlide(prev => (prev + 1) % featuredProducts.length);
    const prevSlide = () => setCurrentSlide(prev => (prev === 0 ? featuredProducts.length - 1 : prev - 1));
    const togglePlay = () => setIsPlaying(prev => !prev);

    return (
        <>
            <header className="pt-32 pb-12 px-6 max-w-6xl mx-auto text-center">
                <h1 className="text-[48px] md:text-[80px] font-bold tracking-tight leading-[1.05] mb-6 animate-in slide-in-from-top-4 duration-1000">
                    Lo inusual, <br /> <span className="text-gray-400">bien pensado.</span>
                </h1>
                <p className="text-[19px] md:text-[24px] text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
                    Descubre gadgets que transforman lo cotidiano.
                </p>
            </header>

            {!loading && featuredProducts.length > 0 && (
                <section className="max-w-6xl mx-auto px-6 mb-20 relative">
                    <div className="relative bg-[#f5f5f7] rounded-[40px] md:rounded-[64px] overflow-hidden shadow-sm h-[400px] md:h-[500px]">
                        {featuredProducts.map((fp, index) => (
                            <div
                                key={fp.id}
                                className={`absolute inset-0 transition-opacity duration-1000 flex flex-col md:flex-row ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                            >
                                <div className="absolute top-6 left-6 md:top-10 md:left-10 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-indigo-600 flex items-center gap-2 shadow-lg z-20">
                                    <Star size={14} className="text-yellow-500 fill-yellow-500" /> Destacado
                                </div>
                                <div className="w-full md:w-1/2 h-1/2 md:h-full overflow-hidden relative">
                                    <img src={fp.image} alt={fp.title} className="w-full h-full object-cover" />
                                </div>
                                <div className="w-full md:w-1/2 h-1/2 md:h-full p-8 md:p-16 flex flex-col justify-center bg-white md:bg-transparent z-10">
                                    <span className="text-indigo-600 font-bold text-[10px] md:text-xs uppercase tracking-[0.2em] mb-3">{fp.category}</span>
                                    <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight leading-tight">{fp.title}</h2>
                                    <div className="flex items-center gap-3 mb-6">
                                        <p className="text-2xl md:text-3xl font-bold text-black">${Number(fp.price).toLocaleString('es-CL')}</p>
                                        {fp.precioNormal && Number(fp.precioNormal) > Number(fp.price) && (
                                            <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-[10px] md:text-xs font-bold tracking-widest shadow-sm">
                                                -{Math.round(((Number(fp.precioNormal) - Number(fp.price)) / Number(fp.precioNormal)) * 100)}%
                                            </span>
                                        )}
                                    </div>
                                    <Link to={`/producto/${fp.dropiSku || fp.id}`} className="inline-flex w-fit items-center gap-2 bg-black text-white px-8 py-4 rounded-2xl font-bold hover:bg-gray-800 transition-colors shadow-lg">
                                        <Zap size={18} /> Ver Oferta
                                    </Link>
                                </div>
                            </div>
                        ))}

                        {featuredProducts.length > 1 && (
                            <>
                                <button onClick={prevSlide} className="absolute left-6 top-1/2 -translate-y-1/2 z-30 p-3 bg-white/80 hover:bg-white backdrop-blur-md rounded-full shadow-lg text-gray-800 transition-colors">
                                    <ChevronLeft size={24} />
                                </button>
                                <button onClick={nextSlide} className="absolute right-6 top-1/2 -translate-y-1/2 z-30 p-3 bg-white/80 hover:bg-white backdrop-blur-md rounded-full shadow-lg text-gray-800 transition-colors">
                                    <ChevronRight size={24} />
                                </button>
                                <div className="absolute bottom-6 left-1/2 -translate-y-0 -translate-x-1/2 z-30 flex items-center justify-center gap-4 bg-white/50 backdrop-blur-md px-4 py-2 rounded-full shadow-sm">
                                    <button onClick={togglePlay} className="text-gray-800 hover:text-black transition-colors" title={isPlaying ? "Pausar" : "Reproducir"}>
                                        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                                    </button>
                                    <div className="flex gap-2 items-center">
                                        {featuredProducts.map((_, i) => (
                                            <button key={i} onClick={() => setCurrentSlide(i)} className={`w-2 h-2 rounded-full transition-all ${i === currentSlide ? 'bg-indigo-600 w-6' : 'bg-gray-400 hover:bg-gray-600'}`} />
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </section>
            )}

            <main className="max-w-6xl mx-auto px-6 pb-40">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {loading ? [1, 2, 3].map(i => <div key={i} className="h-[450px] bg-white rounded-[32px] animate-pulse" />) :
                        products.map((p, i) => (
                            <Link
                                to={`/producto/${p.dropiSku || p.id}`}
                                key={p.id}
                                className="block bg-white rounded-[40px] p-6 shadow-sm border border-gray-100 group cursor-pointer hover:shadow-2xl hover:border-transparent transition-all duration-500 hover:-translate-y-2 animate-in slide-in-from-bottom"
                                style={{ animationDelay: `${i * 100}ms` }}
                            >
                                <div className="h-64 bg-[#f5f5f7] rounded-[32px] mb-6 overflow-hidden relative">
                                    <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-indigo-600 z-10">{p.category}</span>
                                    {p.precioNormal && Number(p.precioNormal) > Number(p.price) && (
                                        <span className="absolute top-4 right-4 bg-indigo-600 text-white px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider z-10 shadow-lg">
                                            -{Math.round(((Number(p.precioNormal) - Number(p.price)) / Number(p.precioNormal)) * 100)}%
                                        </span>
                                    )}
                                    <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                                </div>
                                <div className="px-2">
                                    <h3 className="text-2xl font-bold mb-2 tracking-tight">{p.title}</h3>
                                    <div className="flex items-center gap-3 mt-4">
                                        <p className="text-[22px] font-bold tracking-tight">${Number(p.price).toLocaleString('es-CL')}</p>
                                        {p.precioNormal && Number(p.precioNormal) > Number(p.price) && (
                                            <p className="text-sm text-gray-400 line-through font-bold">${Number(p.precioNormal).toLocaleString('es-CL')}</p>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                </div>
            </main>
        </>
    );
}

import React from 'react';
import { Link } from 'react-router-dom';

export default function Home({ loading, products }) {
    return (
        <>
            <header className="pt-40 pb-20 px-6 max-w-6xl mx-auto text-center">
                <h1 className="text-[48px] md:text-[80px] font-bold tracking-tight leading-[1.05] mb-6 animate-in slide-in-from-top-4 duration-1000">
                    Lo inusual, <br /> <span className="text-gray-400">bien pensado.</span>
                </h1>
                <p className="text-[19px] md:text-[24px] text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
                    Descubre gadgets que transforman lo cotidiano.
                </p>
            </header>

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
                                    <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                                </div>
                                <div className="px-2">
                                    <h3 className="text-2xl font-bold mb-2 tracking-tight">{p.title}</h3>
                                    <p className="text-[22px] font-bold tracking-tight mt-4">${p.price.toLocaleString('es-CL')}</p>
                                </div>
                            </Link>
                        ))}
                </div>
            </main>
        </>
    );
}

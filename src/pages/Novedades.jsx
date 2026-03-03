import React from 'react';
import { Zap, ArrowRight } from 'lucide-react';
import PageWrapper from '../components/PageWrapper';

export default function Novedades({ products, onSelectProduct }) {
    return (
        <PageWrapper title="Novedades">
            <div className="grid gap-8">
                {products.length === 0 ? <p className="text-center text-gray-400 py-10">Cargando novedades...</p> : products.slice(0, 3).map((p, i) => (
                    <div key={p.id} className="bg-white p-10 rounded-[40px] flex flex-col md:flex-row gap-8 items-center shadow-sm border border-gray-100 group hover:shadow-xl transition-shadow cursor-pointer" onClick={() => onSelectProduct(p)}>
                        <div className="h-64 w-full md:w-1/3 bg-[#f5f5f7] rounded-3xl overflow-hidden relative shrink-0">
                            {i === 0 && <div className="absolute top-4 left-4 bg-indigo-600 text-white text-[10px] uppercase font-bold px-4 py-1.5 rounded-full z-10 tracking-widest shadow-lg">El Más Reciente</div>}
                            <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                        </div>
                        <div className="flex-1">
                            <span className="text-indigo-600 font-bold text-[11px] uppercase tracking-[0.2em]">{p.category}</span>
                            <h3 className="text-3xl font-bold mt-3 mb-4 tracking-tight leading-tight">{p.title}</h3>
                            <p className="text-gray-500 mb-8 max-w-lg leading-relaxed">{p.description}</p>
                            <button className="text-black font-bold flex items-center gap-2 group-hover:gap-4 transition-all uppercase text-xs tracking-widest"><Zap size={14} className="text-indigo-600" /> Ver Detalles <ArrowRight size={14} /></button>
                        </div>
                    </div>
                ))}
            </div>
        </PageWrapper>
    );
}

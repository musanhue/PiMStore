import React, { useState } from 'react';
import { Package, Truck, ArrowRight } from 'lucide-react';
import PageWrapper from '../components/PageWrapper';

export default function Seguimiento({ onSearch }) {
    const [trackId, setTrackId] = useState('');
    const [trackResult, setTrackResult] = useState(null);

    const handleSearch = async () => {
        if (!trackId) return;
        setTrackResult('loading');
        const result = await onSearch(trackId);
        setTrackResult(result);
    };

    return (
        <PageWrapper title="Sigue tu orden">
            <div className="bg-white p-12 rounded-[40px] shadow-sm border border-gray-100 max-w-2xl mx-auto text-center">
                <p className="text-gray-500 mb-8 font-medium">Ingresa el ID de orden que recibiste en tu correo de confirmación de compra.</p>
                <div className="flex gap-4">
                    <input
                        className="w-full bg-[#f5f5f7] p-4 rounded-2xl outline-none focus:ring-2 focus:ring-black font-mono text-center tracking-widest text-lg"
                        placeholder="Ej: 20240218-4829"
                        value={trackId}
                        onChange={e => setTrackId(e.target.value)}
                    />
                    <button
                        onClick={handleSearch}
                        className="bg-black text-white px-8 rounded-2xl font-bold hover:bg-gray-800 transition-colors"
                    >
                        Buscar
                    </button>
                </div>

                {trackResult === 'not_found' && <div className="mt-8 p-4 bg-red-50 text-red-600 rounded-xl font-bold">Orden no encontrada</div>}

                {typeof trackResult === 'object' && trackResult !== null && (
                    <div className="mt-8 p-8 bg-indigo-50 rounded-[32px] text-left flex justify-between items-center animate-in zoom-in-95 border border-indigo-100 shadow-sm">
                        <div>
                            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Estado PiMStore</p>
                            <h3 className="text-3xl font-black text-indigo-600 capitalize mb-2">{trackResult.status}</h3>
                            <p className="text-sm font-medium text-indigo-900/70">Monto: ${trackResult.total?.toLocaleString('es-CL')} / Artículos: {trackResult.items?.length}</p>
                        </div>
                        <Package size={48} className="text-indigo-200" />
                    </div>
                )}

                <div className="mt-12 pt-10 border-t border-gray-100">
                    <p className="text-gray-400 mb-6 text-sm">Si tu pedido ya fue procesado y despachado por nuestra bodega, puedes hacerle un seguimiento al milímetro directamente en el sistema de nuestro operador logístico asociado.</p>
                    <a href="https://dropi.cl/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 bg-indigo-600 text-white px-10 py-5 rounded-2xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                        <Truck size={20} />
                        Rastrear Logística en Dropi.cl
                        <ArrowRight size={16} className="ml-2 opacity-70" />
                    </a>
                </div>
            </div>
        </PageWrapper>
    );
}

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, ShieldCheck, Zap } from 'lucide-react';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

export default function ProductoDetalle({ addToCart, appId }) {
    const { sku } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const db = getFirestore();

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                // First try to find by dropiSku
                const prodRef = collection(db, 'artifacts', appId, 'public', 'data', 'products');
                const q = query(prodRef, where('dropiSku', '==', sku));
                const snap = await getDocs(q);

                if (!snap.empty) {
                    setProduct({ id: snap.docs[0].id, ...snap.docs[0].data() });
                } else {
                    // Fallback to fetch by document ID if sku is actually the doc ID (for products created without SKU)
                    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'products', sku);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setProduct({ id: docSnap.id, ...docSnap.data() });
                    } else {
                        setError('Producto no encontrado.');
                    }
                }
            } catch (err) {
                console.error(err);
                setError('Error al cargar el producto.');
            } finally {
                setLoading(false);
            }
        };

        if (sku) fetchProduct();
    }, [sku, appId, db]);

    if (loading) return (
        <div className="min-h-[80vh] flex items-center justify-center pt-20">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
    );

    if (error || !product) return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 pt-20">
            <h2 className="text-3xl font-black mb-4">Ups, algo salió mal</h2>
            <p className="text-gray-500 mb-8">{error || 'El producto que buscas no existe o fue retirado.'}</p>
            <button onClick={() => navigate('/')} className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors">Volver a la tienda</button>
        </div>
    );

    // Calculate smart stock (80%)
    const stockMostrado = Math.max(0, Math.round((product.stock || 0) * 0.8));
    const agotado = stockMostrado <= 0;

    return (
        <div className="pt-24 pb-20 px-6 max-w-6xl mx-auto animate-in fade-in duration-500">
            <button onClick={() => navigate(-1)} className="mb-8 flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-black transition-colors uppercase tracking-widest">
                <ArrowLeft size={16} /> Volver
            </button>

            <div className="bg-white rounded-[40px] md:rounded-[64px] shadow-sm border border-gray-100 flex flex-col md:flex-row overflow-hidden">
                <div className="md:w-1/2 bg-[#f5f5f7] p-12 md:p-20 flex items-center justify-center relative">
                    <span className="absolute top-8 left-8 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest text-indigo-600 z-10">{product.category}</span>
                    <img src={product.image} alt={product.title} className="w-full mix-blend-multiply transition-transform duration-700 hover:scale-105" />
                </div>
                <div className="md:w-1/2 p-10 md:p-16 flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        SKU: {product.dropiSku || product.id} {product.dropiSku && <Zap size={10} className="text-indigo-500 inline" />}
                    </span>
                    <h1 className="text-[40px] font-black leading-tight mb-6 tracking-tight">{product.title}</h1>
                    <div className="flex items-center gap-4 mb-8">
                        <p className="text-[32px] font-bold text-indigo-600">${Number(product.price).toLocaleString('es-CL')}</p>
                        {product.precioNormal && Number(product.precioNormal) > Number(product.price) && (
                            <>
                                <p className="text-xl text-gray-400 line-through font-bold">${Number(product.precioNormal).toLocaleString('es-CL')}</p>
                                <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold tracking-widest shadow-sm">
                                    -{Math.round(((Number(product.precioNormal) - Number(product.price)) / Number(product.precioNormal)) * 100)}%
                                </span>
                            </>
                        )}
                    </div>

                    <div className="flex-grow space-y-6 mb-10">
                        <p className="text-[17px] text-gray-600 leading-relaxed max-w-lg">{product.description}</p>

                        <div className="bg-gray-50 p-6 rounded-2xl flex items-center gap-4 border border-gray-100 mt-6">
                            <ShieldCheck className="text-indigo-500 w-8 h-8 shrink-0" />
                            <div className="text-sm text-gray-600">
                                <span className="font-bold text-black block mb-1">Garantía PiMStore</span>
                                Compra protegida. 10 días de retracto y 6 meses de garantía por fallas.
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className={`text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 ${agotado ? 'text-red-500' : 'text-green-500'}`}>
                            {agotado ? (
                                <><span className="w-2 h-2 rounded-full bg-red-500"></span> Totalmente agotado</>
                            ) : (
                                <><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Stock disponible: {stockMostrado} unidades</>
                            )}
                        </div>
                        <button
                            onClick={() => addToCart(product, stockMostrado)}
                            disabled={agotado}
                            className={`w-full py-5 rounded-[20px] font-bold text-lg transition-all shadow-xl flex justify-center items-center gap-2 ${agotado ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' : 'bg-black text-white hover:bg-gray-800'}`}
                        >
                            <ShoppingCart size={20} />
                            {agotado ? 'Agotado' : 'Añadir a la bolsa'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

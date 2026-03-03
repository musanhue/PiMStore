import React, { useState, useEffect } from 'react';
import { Package, Truck, ArrowRight, ExternalLink } from 'lucide-react';
import { getFirestore, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import PageWrapper from '../components/PageWrapper';
import { Link } from 'react-router-dom';

export default function PerfilPedidos({ user, appId }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const db = getFirestore();

    useEffect(() => {
        if (!user || user.isAnonymous) return;
        const loadOrders = async () => {
            try {
                const q = query(
                    collection(db, 'artifacts', appId, 'public', 'data', 'orders'),
                    where('userId', '==', user.uid)
                );
                // Firestore requires a composite index for where + orderBy. 
                // We fetch client-side and sort to avoid index creation requirements for the user out of the box.
                const snap = await getDocs(q);
                let loaded = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                loaded.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
                setOrders(loaded);
            } catch (e) {
                console.error("Error loading orders", e);
            } finally {
                setLoading(false);
            }
        };
        loadOrders();
    }, [user, appId, db]);

    if (!user || user.isAnonymous) {
        return <PageWrapper title="Mis Pedidos"><div className="text-center py-20 text-gray-500">Debes iniciar sesión para ver tus pedidos.</div></PageWrapper>;
    }

    return (
        <PageWrapper title="Mis Pedidos">
            <div className="max-w-4xl mx-auto space-y-6">
                {loading ? (
                    <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div></div>
                ) : orders.length === 0 ? (
                    <div className="bg-white p-20 rounded-[40px] text-center border border-gray-100">
                        <Package size={64} className="mx-auto text-gray-200 mb-6" />
                        <h3 className="text-2xl font-bold mb-4">No tienes pedidos aún</h3>
                        <p className="text-gray-500 mb-8">Tus futuras compras aparecerán aquí.</p>
                        <Link to="/" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition">
                            Explorar Tienda <ArrowRight size={18} />
                        </Link>
                    </div>
                ) : (
                    orders.map(o => (
                        <div key={o.id} className="bg-white p-8 md:p-10 rounded-[40px] border border-gray-100 flex flex-col md:flex-row justify-between md:items-center gap-8 shadow-sm hover:shadow-md transition-shadow">
                            <div>
                                <div className="flex items-center gap-4 mb-3">
                                    <span className="bg-green-50 text-green-600 text-[10px] font-bold px-3 py-1.5 rounded-md uppercase tracking-widest">{o.status || 'Pagado'}</span>
                                    <span className="font-mono text-xl font-bold">#{o.orderNumber}</span>
                                </div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-4">
                                    {o.createdAt?.toDate().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Truck size={16} />
                                    Enviado a: <span className="font-medium text-black truncate max-w-[200px]">{o.customer?.calle} {o.customer?.numero}</span>
                                </div>
                            </div>

                            <div className="flex flex-col md:items-end border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-8">
                                <span className="text-3xl font-black">${o.total?.toLocaleString('es-CL')}</span>
                                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-1 mb-6">{o.items?.length} artículos</p>

                                <Link to={`/seguimiento`} className="text-indigo-600 font-bold text-sm bg-indigo-50 px-6 py-3 rounded-xl hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2">
                                    Seguimiento de envío <ExternalLink size={14} />
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </PageWrapper>
    );
}

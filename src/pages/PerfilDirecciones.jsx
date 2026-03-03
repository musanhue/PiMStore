import React, { useState, useEffect } from 'react';
import { MapPin, ChevronRight, AlertCircle } from 'lucide-react';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import PageWrapper from '../components/PageWrapper';
import { regionesYComunas } from '../App';

export default function PerfilDirecciones({ user, appId }) {
    const [formData, setFormData] = useState({ calle: '', numero: '', depto: '', region: '', comuna: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const db = getFirestore();

    useEffect(() => {
        if (!user || user.isAnonymous) return;
        const loadProfile = async () => {
            try {
                const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
                const snap = await getDoc(docRef);
                if (snap.exists() && snap.data().savedAddress) {
                    const addr = snap.data().savedAddress;
                    setFormData({
                        calle: addr.calle || '',
                        numero: addr.numero || '',
                        depto: addr.depto || '',
                        region: addr.region || '',
                        comuna: addr.comuna || ''
                    });
                }
            } catch (e) {
                console.error("Error loading address", e);
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, [user, appId, db]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        try {
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid), {
                savedAddress: {
                    ...formData
                }
            }, { merge: true });
            setMessage('Dirección predeterminada guardada.');
        } catch (error) {
            setMessage('Error al guardar la dirección.');
        } finally {
            setSaving(false);
        }
    };

    if (!user || user.isAnonymous) {
        return <PageWrapper title="Mis Direcciones"><div className="text-center py-20 text-gray-500">Debes iniciar sesión para ver esta página.</div></PageWrapper>;
    }

    const comunasDisponibles = regionesYComunas.find(r => r.region === formData.region)?.comunas || [];

    return (
        <PageWrapper title="Dirección de Envío">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white p-10 md:p-14 rounded-[40px] shadow-sm border border-gray-100">

                    <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl mb-10 flex items-start gap-4">
                        <MapPin className="text-indigo-500 shrink-0 mt-1" />
                        <div>
                            <h3 className="font-bold text-indigo-900">Dirección Predeterminada</h3>
                            <p className="text-sm text-indigo-700 mt-1">Esta dirección se usará autómaticamente para acelerar tus próximas compras.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid grid-cols-[2fr_1fr_1fr] gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Calle</label>
                                <input className="w-full bg-[#f5f5f7] p-4 rounded-xl outline-none focus:ring-2 focus:ring-black" value={formData.calle} onChange={e => setFormData({ ...formData, calle: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Número</label>
                                <input className="w-full bg-[#f5f5f7] p-4 rounded-xl outline-none focus:ring-2 focus:ring-black" value={formData.numero} onChange={e => setFormData({ ...formData, numero: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Depto</label>
                                <input className="w-full bg-[#f5f5f7] p-4 rounded-xl outline-none focus:ring-2 focus:ring-black" value={formData.depto} onChange={e => setFormData({ ...formData, depto: e.target.value })} />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="relative w-full">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Región</label>
                                <select className="w-full bg-[#f5f5f7] rounded-xl p-4 outline-none appearance-none cursor-pointer" value={formData.region} onChange={e => setFormData({ ...formData, region: e.target.value, comuna: '' })}>
                                    <option value="" disabled>Selecciona tu Región</option>
                                    {regionesYComunas.map(r => <option key={r.region} value={r.region}>{r.region}</option>)}
                                </select>
                                <div className="pointer-events-none absolute bottom-4 right-4 flex items-center text-gray-400"><ChevronRight className="w-4 h-4 rotate-90" /></div>
                            </div>
                            <div className="relative w-full">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Comuna</label>
                                <select className="w-full bg-[#f5f5f7] rounded-xl p-4 outline-none appearance-none cursor-pointer disabled:opacity-50" value={formData.comuna} onChange={e => setFormData({ ...formData, comuna: e.target.value })} disabled={!formData.region}>
                                    <option value="" disabled>Selecciona tu Comuna</option>
                                    {comunasDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <div className="pointer-events-none absolute bottom-4 right-4 flex items-center text-gray-400"><ChevronRight className="w-4 h-4 rotate-90" /></div>
                            </div>
                        </div>

                        {message && (
                            <div className={`p-4 rounded-xl text-sm font-medium ${message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                {message}
                            </div>
                        )}

                        <div className="pt-6 border-t border-gray-100 flex justify-end">
                            <button type="submit" disabled={saving} className="bg-black text-white px-10 py-4 rounded-2xl font-bold hover:bg-gray-800 transition-colors disabled:opacity-50">
                                {saving ? 'Guardando...' : 'Guardar Dirección'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </PageWrapper>
    );
}

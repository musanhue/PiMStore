import React, { useState, useEffect } from 'react';
import { User, ShieldCheck, AlertCircle } from 'lucide-react';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import PageWrapper from '../components/PageWrapper';

export default function PerfilDatos({ user, appId }) {
    const [formData, setFormData] = useState({ nombre: '', rut: '', telefono: '' });
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
                        nombre: addr.nombre || '',
                        rut: addr.rut || '',
                        telefono: addr.telefono || ''
                    });
                }
            } catch (e) {
                console.error("Error loading profile", e);
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
            setMessage('Datos guardados correctamente.');
        } catch (error) {
            setMessage('Error al guardar los datos.');
        } finally {
            setSaving(false);
        }
    };

    if (!user || user.isAnonymous) {
        return <PageWrapper title="Mis Datos"><div className="text-center py-20 text-gray-500">Debes iniciar sesión para ver esta página.</div></PageWrapper>;
    }

    return (
        <PageWrapper title="Mis Datos">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white p-10 md:p-14 rounded-[40px] shadow-sm border border-gray-100">
                    <div className="flex items-center gap-6 mb-10">
                        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-2xl text-indigo-600">
                            {user.email[0].toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{user.email}</h2>
                            <p className="text-sm text-gray-500 font-medium">Cuenta verificada</p>
                        </div>
                    </div>

                    <form onSubmit={handleSave} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Nombre Completo</label>
                            <input
                                className="w-full bg-[#f5f5f7] p-4 rounded-xl outline-none focus:ring-2 focus:ring-black transition-shadow"
                                value={formData.nombre}
                                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                placeholder="Nombre para tus envíos"
                            />
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">RUT</label>
                                <input
                                    className="w-full bg-[#f5f5f7] p-4 rounded-xl outline-none focus:ring-2 focus:ring-black transition-shadow"
                                    value={formData.rut}
                                    onChange={e => setFormData({ ...formData, rut: e.target.value })}
                                    placeholder="Ej: 12.345.678-9"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Teléfono</label>
                                <input
                                    className="w-full bg-[#f5f5f7] p-4 rounded-xl outline-none focus:ring-2 focus:ring-black transition-shadow"
                                    value={formData.telefono}
                                    onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                                    placeholder="+569 "
                                />
                            </div>
                        </div>

                        {message && (
                            <div className={`p-4 rounded-xl text-sm font-medium ${message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                {message}
                            </div>
                        )}

                        <div className="pt-6 border-t border-gray-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-black text-white px-10 py-4 rounded-2xl font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
                            >
                                {saving ? 'Guardando...' : 'Actualizar Datos'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </PageWrapper>
    );
}

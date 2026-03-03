import React from 'react';
import { Mail, Phone, Clock } from 'lucide-react';
import PageWrapper from '../components/PageWrapper';

export default function Soporte() {
    return (
        <PageWrapper title="Soporte">
            <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[100px] -z-10 transition-transform group-hover:scale-110"></div>
                    <h3 className="text-2xl font-bold mb-8">Contacto Directo</h3>
                    <div className="space-y-8 text-black">
                        <div className="flex items-center gap-5">
                            <div className="bg-indigo-50 p-4 rounded-2xl transition-colors group-hover:bg-indigo-100">
                                <Mail className="text-indigo-600 w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Correo Electrónico</p>
                                <a href="mailto:soporte@pimstore.cl" className="font-black text-lg hover:text-indigo-600 transition-colors">soporte@pimstore.cl</a>
                            </div>
                        </div>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-5">
                                <div className="bg-[#25D366]/10 p-4 rounded-2xl">
                                    <Phone className="text-[#25D366] w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Línea WhatsApp</p>
                                    <p className="font-black text-lg">+56 9 7523 2353</p>
                                </div>
                            </div>
                            <a href="https://wa.me/56975232353?text=Hola%20PiMStore%2C%20necesito%20ayuda%20con..." target="_blank" rel="noopener noreferrer" className="mt-2 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center gap-3 py-4 rounded-2xl font-bold transition-colors shadow-lg shadow-[#25D366]/20">
                                Chat Directo (Respuesta Rápida)
                            </a>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 flex flex-col justify-center text-center">
                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Clock size={32} className="text-gray-400" />
                    </div>
                    <h4 className="text-xl font-bold mb-2">Horario de Atención</h4>
                    <p className="text-gray-500">Lunes a Viernes<br />09:00 - 18:00 hrs</p>
                </div>
            </div>
        </PageWrapper>
    );
}

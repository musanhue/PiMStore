import React from 'react';
import { Globe, ShieldCheck, Star } from 'lucide-react';
import PageWrapper from '../components/PageWrapper';

export default function SobreNosotros() {
    return (
        <PageWrapper title="Sobre Nosotros">
            <div className="max-w-4xl mx-auto">
                {/* Hero Section */}
                <div className="bg-white p-12 md:p-16 rounded-[40px] shadow-sm border border-gray-100 mb-8 relative overflow-hidden text-center">
                    <div className="mb-8 flex justify-center">
                        <img src="/pimstore-extended-logo.svg" alt="PiMStore Logo" className="h-12 w-auto" />
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6 leading-tight">
                        Redefiniendo el Comercio <br /><span className="text-indigo-600">Tecnológico en Chile</span>
                    </h2>
                    <p className="text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto">
                        Bienvenidos a PiMStore. Nacimos de la premisa de que acceder a tecnología de punta, accesorios innovadores y gadgets disruptivos no debería ser complicado, ni lento.
                    </p>
                </div>

                {/* Grid de Valores */}
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                    <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100">
                        <div className="bg-indigo-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                            <Globe className="text-indigo-600 w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4 tracking-tight">Vanguardia Global</h3>
                        <p className="text-gray-500 leading-relaxed">
                            Buscamos por todo el globo las tendencias tecnológicas más calientes. A través de nuestro robusto modelo logístico, acortamos las distancias del mundo para poner directo en tus manos lo último del mercado.
                        </p>
                    </div>

                    <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100">
                        <div className="bg-indigo-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                            <ShieldCheck className="text-indigo-600 w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4 tracking-tight">Confianza Radical</h3>
                        <p className="text-gray-500 leading-relaxed">
                            Operamos con la transparencia de las transacciones protegidas de MercadoPago y un sistema en la nube inquebrantable conectado directamente con nuestra red de proveedores Premium de Dropi.cl. Tu compra siempre está segura.
                        </p>
                    </div>
                </div>

                {/* Quote final */}
                <div className="bg-indigo-600 text-white p-12 rounded-[40px] text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Star className="w-48 h-48" />
                    </div>
                    <p className="text-2xl md:text-3xl font-bold mb-6 italic min-w-[280px]">"No solo vendemos tecnología. Acercamos el futuro a tu rutina diaria."</p>
                    <div className="flex items-center justify-center gap-4">
                        <div className="h-[1px] w-12 bg-indigo-300"></div>
                        <p className="font-bold uppercase tracking-widest text-indigo-200 text-xs">Equipo Fundador</p>
                        <div className="h-[1px] w-12 bg-indigo-300"></div>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
}

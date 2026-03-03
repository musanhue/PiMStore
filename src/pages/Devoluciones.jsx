import React from 'react';
import { CheckCircle2, ShieldCheck, Truck } from 'lucide-react';
import PageWrapper from '../components/PageWrapper';

export default function Devoluciones() {
    return (
        <PageWrapper title="Política de Devoluciones (SERNAC)">
            <div className="bg-white p-12 rounded-[40px] shadow-sm border border-gray-100 prose prose-lg max-w-none text-gray-600 leading-relaxed">
                <h3 className="text-3xl font-black mb-6 text-black tracking-tight">Tu Satisfacción Garantizada</h3>
                <p className="mb-6">En <strong>PiMStore</strong> nuestro compromiso es entregarte tecnología y productos excepcionales. Operamos orgullosamente bajo un modelo de Dropshipping optimizado, lo que significa que gestionamos la logística directamente desde las bodegas de nuestros proveedores tecnológicos hacia la puerta de tu casa.</p>

                <h4 className="text-xl font-bold mb-4 text-black mt-10">Derecho a Retracto (10 Días)</h4>
                <p className="mb-6">De acuerdo a lo estipulado por la <strong>Ley Pro Consumidor (Art. 3 bis, Ley 19.496)</strong> de Chile liderada por el SERNAC, tienes el derecho a retractarte de tu compra dentro de los primeros <strong>10 días</strong> desde la recepción del producto. Para que este derecho sea válido, el producto debe estar sin uso, con todos sus sellos originales intactos y en perfecto estado.</p>

                <h4 className="text-xl font-bold mb-4 text-black mt-10">Garantía Legal por Fallas</h4>
                <p className="mb-8">Si tu producto presenta alguna falla de fábrica u origen, cuentas con <strong>6 meses de Garantía Legal</strong>. Como funcionamos vía Dropshipping internacional / nacional a través de la plataforma Dropi.cl, nosotros gestionaremos íntegramente el reclamo con el proveedor de manera transparente. Podrás elegir entre el cambio del producto o la devolución del dinero una vez el proveedor acredite la falla técnica.</p>

                <div className="grid md:grid-cols-3 gap-6 my-12 text-black">
                    <div className="p-8 bg-[#f5f5f7] rounded-3xl border border-gray-100 hover:border-indigo-200 transition-colors">
                        <CheckCircle2 className="mb-4 text-green-500 w-8 h-8" />
                        <h4 className="text-lg font-bold">10 Días Retracto</h4>
                        <p className="text-sm text-gray-500 mt-2">Para devoluciones por arrepentimiento (producto sellado).</p>
                    </div>
                    <div className="p-8 bg-[#f5f5f7] rounded-3xl border border-gray-100 hover:border-indigo-200 transition-colors">
                        <ShieldCheck className="mb-4 text-indigo-500 w-8 h-8" />
                        <h4 className="text-lg font-bold">6 Meses Garantía</h4>
                        <p className="text-sm text-gray-500 mt-2">Frente a fallas de fábrica corroboradas por el servicio técnico.</p>
                    </div>
                    <div className="p-8 bg-[#f5f5f7] rounded-3xl border border-gray-100 hover:border-indigo-200 transition-colors">
                        <Truck className="mb-4 text-blue-500 w-8 h-8" />
                        <h4 className="text-lg font-bold">Gestión Logística</h4>
                        <p className="text-sm text-gray-500 mt-2">Acompañamiento 100% en el proceso ante proveedores.</p>
                    </div>
                </div>

                <div className="bg-indigo-50 p-8 rounded-3xl border border-indigo-100 mt-10">
                    <p className="text-indigo-900 font-medium">Para iniciar una solicitud de cambio o devolución, por favor contáctanos inmediatamente a:</p>
                    <a href="mailto:soporte@pimstore.cl" className="text-indigo-600 font-black text-lg hover:underline mt-2 inline-block">soporte@pimstore.cl</a>
                    <p className="text-sm text-indigo-700/70 mt-2">Asegúrate de incluir tu Número de Orden y fotografías del estado del producto.</p>
                </div>
            </div>
        </PageWrapper>
    );
}

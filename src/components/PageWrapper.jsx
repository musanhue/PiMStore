import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PageWrapper({ title, children, showBack = true }) {
    const navigate = useNavigate();
    return (
        <div className="pt-32 pb-20 px-6 max-w-6xl mx-auto min-h-[70vh] animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-10">
                {showBack && (
                    <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-full shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                )}
                <h1 className="text-4xl md:text-5xl font-black tracking-tight">{title}</h1>
            </div>
            {children}
        </div>
    );
}

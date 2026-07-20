"use client";

import dynamic from 'next/dynamic';
import LoadingEye from '@/src/components/LoadingEye';

const CascadeaPage = dynamic(() => import('@/src/views/CascadeaPage'), {
    loading: () => <div className="flex justify-center py-20"><LoadingEye /></div>,
    ssr: false
});

export default function Cascadea() {
    return <CascadeaPage />;
}

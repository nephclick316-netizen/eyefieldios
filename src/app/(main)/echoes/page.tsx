"use client";

import dynamic from 'next/dynamic';
import LoadingEye from '@/src/components/LoadingEye';

const EchoPage = dynamic(() => import('@/src/views/EchoPage'), {
    loading: () => <div className="flex justify-center py-20"><LoadingEye /></div>,
    ssr: false
});

export default function Echoes() {
    return <EchoPage />;
}

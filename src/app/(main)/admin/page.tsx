"use client";

import dynamic from 'next/dynamic';
import LoadingEye from '@/src/components/LoadingEye';
import { useAuth } from '@/src/contexts/AuthContext';

const AdminDashboard = dynamic(() => import('@/src/views/AdminDashboard'), {
    loading: () => <div className="flex justify-center py-20"><LoadingEye /></div>,
    ssr: false
});

export default function Admin() {
    const { currentUser } = useAuth();
    if (!currentUser || currentUser.email !== 'edocardadmin@eyefield.pro') {
        return <div className="p-10 text-center font-bold">Unauthorized</div>;
    }
    return <AdminDashboard />;
}

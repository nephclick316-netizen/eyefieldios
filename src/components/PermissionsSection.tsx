import React, { useState, useContext } from 'react';
import { Camera, MicOff, MapPin, Bell } from 'lucide-react';
import { SettingsContext } from '../App';
import { toast } from 'react-hot-toast';

export const PermissionsSection: React.FC<{ onBack: () => void }> = () => {
  const [perms, setPerms] = useState({ camera: true, mic: false, location: true, notifications: Notification.permission === 'granted' });
  const settings = useContext(SettingsContext);

  const togglePermission = async (key: keyof typeof perms) => {
    if (!perms[key]) {
      try {
        if (key === 'camera' || key === 'mic') {
          await navigator.mediaDevices.getUserMedia({ [key === 'camera' ? 'video' : 'audio']: true });
        } else if (key === 'location') {
          await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject));
        } else if (key === 'notifications') {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') throw new Error('Permission denied');
        }
        setPerms({...perms, [key]: true});
      } catch (e) {
        toast.error("Permission denied by system.");
      }
    } else {
      setPerms({...perms, [key]: false});
      if (key === 'notifications') {
        toast.error("To fully disable notifications, please change your browser/device settings.");
      }
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="bg-navy-50/30 dark:bg-navy-950/20 p-6 rounded-3xl mb-4 border border-navy-100 dark:border-navy-900">
         <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
           EyeField permissions ensure seamless AR and spatial interactions. Restricted modes will disable specific biometric and spatial feeds.
         </p>
      </div>
      {[
        { id: 'camera', label: 'Optic Sensor (Camera)', icon: Camera, desc: perms.camera ? 'Enabled' : 'Restricted' },
        { id: 'mic', label: 'Audio Intake (Mic)', icon: MicOff, desc: perms.mic ? 'Enabled' : 'Restricted' },
        { id: 'location', label: 'Spatial Field (GPS)', icon: MapPin, desc: perms.location ? 'Enabled' : 'Restricted' },
        { id: 'notifications', label: 'Neural Alerts (Push)', icon: Bell, desc: perms.notifications ? 'Enabled' : 'Restricted' },
      ].map(p => (
        <div key={p.id} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-900/50 rounded-3xl">
          <div className="flex items-center gap-4">
            <div className={`p-3 bg-white dark:bg-black rounded-2xl shadow-sm ${perms[p.id as keyof typeof perms] ? 'text-purple-500' : 'text-slate-300'}`}>
              <p.icon size={20} />
            </div>
            <div>
              <p className="text-sm font-black">{p.label}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{p.desc}</p>
            </div>
          </div>
          <button 
            onClick={() => togglePermission(p.id as any)}
            className={`w-14 h-8 rounded-full relative transition-all shadow-inner ${perms[p.id as keyof typeof perms] ? 'bg-navy-950' : 'bg-slate-200'}`}
          >
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all ${perms[p.id as keyof typeof perms] ? 'right-1' : 'left-1'}`} />
          </button>
        </div>
      ))}
    </div>
  );
};
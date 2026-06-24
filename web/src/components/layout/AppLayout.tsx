import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppLayout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8 relative">
        {/* Ambient premium lights */}
        <div className="absolute top-[-10%] right-[10%] w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[20%] w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 max-w-6xl mx-auto h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

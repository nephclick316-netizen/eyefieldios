import React from "react";
import { Link } from "react-router-dom";
import {
  Smile,
  MessageCircle,
  Phone,
  User,
  Settings,
  Briefcase
} from "lucide-react";
import CascadeaRunningIcon from "./CascadeaRunningIcon";

const Navigation = () => {
  return (
    <nav className="bg-background/80 backdrop-blur-sm border-b border-white/10 px-4 py-3 md:px-6 md:py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center space-x-2">
            <CascadeaRunningIcon size={24} />
            <span className="font-bold text-xl">Cascadea</span>
          </Link>
        </div>
        <div className="hidden md:flex items-center space-x-6">
          <Link to="/echo" className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent/10">
            <Smile size={20} />
            <span>Echoes</span>
          </Link>
          <Link to="/chat" className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent/10">
            <MessageCircle size={20} />
            <span>Chats</span>
          </Link>
          <Link to="/calls" className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent/10">
            <Phone size={20} />
            <span>Calls</span>
          </Link>
          <Link to="/business" className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent/10">
            <Briefcase size={20} />
            <span>Business</span>
          </Link>
          <Link to="/profile" className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent/10">
            <User size={20} />
            <span>Profile</span>
          </Link>
          <Link to="/settings" className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent/10">
            <Settings size={20} />
            <span>Settings</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;

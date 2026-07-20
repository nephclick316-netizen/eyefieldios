"use client";

import React from "react";
import { ExternalLink, ShoppingBag } from "lucide-react";

interface EchoContentProps {
  content: string;
  linkUrl?: string;
  links?: { type: 'product' | 'external', url: string, label: string }[];
}

const EchoContent: React.FC<EchoContentProps> = ({ content, linkUrl, links }) => {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-foreground/90 px-1">
        {content}
      </p>

      {linkUrl && (
        <div className="px-1">
          <a 
            href={linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-bold text-accent hover:underline bg-accent/5 px-3 py-1.5 rounded-xl transition-colors"
          >
            <ExternalLink size={14} />
            {linkUrl.replace(/^https?:\/\//, '').split('/')[0]}
          </a>
        </div>
      )}

      {links && links.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1">
          {links.map((link, idx) => (
            <a
              key={idx}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-[10px] font-black hover:bg-accent/20 transition-colors"
            >
              {link.type === 'product' ? <ShoppingBag size={12} /> : <ExternalLink size={12} />}
              {link.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default EchoContent;
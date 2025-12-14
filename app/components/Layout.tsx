'use client'

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Shield } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

interface LayoutProps {
  children: ReactNode;
  currentPageName?: string;
}

export default function Layout({ children, currentPageName }: LayoutProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin') || currentPageName === 'Admin';

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        :root {
          --color-primary: #105090;
          --color-primary-dark: #0d3d6f;
          --color-accent: #1976d2;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        ::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }

        /* Smooth transitions */
        * {
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Map popup styling */
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        .leaflet-popup-content {
          margin: 12px;
        }
        .leaflet-popup-tip {
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
      `}</style>

      {/* Admin Navigation */}
      {isAdmin && (
        <nav className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/home">
                  <Button variant="ghost" size="sm" style={{ color: '#105090' }}>
                    <Home className="w-4 h-4 mr-2" />
                    Public View
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" style={{ color: '#105090' }} />
                <span className="font-semibold text-gray-900">Admin Panel</span>
              </div>
            </div>
          </div>
        </nav>
      )}

      {children}
    </div>
  );
}


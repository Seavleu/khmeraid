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

      {/* Admin Navigation */}
      {isAdmin && (
        <nav className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/home">
                  <Button variant="ghost" size="sm" className="text-[#105090]">
                    <Home className="w-4 h-4 mr-2" />
                    ទិដ្ឋភាពសាធារណៈ
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#105090]" />
                <span className="font-semibold text-gray-900">បន្ទះគ្រប់គ្រង</span>
              </div>
            </div>
          </div>
        </nav>
      )}

      {children}
    </div>
  );
}


import React from 'react';
import { Package, Shield } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-green-600 to-green-700 p-2 rounded-lg shadow-lg">
              <Package className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Turmeric Supply Chain
              </h1>
              <p className="text-sm text-gray-500">
                Blockchain-Powered Transparency
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
              <Shield className="text-green-600" size={20} />
              <div className="text-left">
                <p className="text-xs text-gray-500">Status</p>
                <p className="text-sm font-semibold text-green-700">
                  Blockchain Verified
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
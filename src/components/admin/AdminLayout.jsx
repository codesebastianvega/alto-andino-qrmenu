import { useState } from 'react';
import AdminProducts from '../../pages/AdminProducts';
import AdminCategories from '../../pages/AdminCategories';

export default function AdminLayout() {
  const [currentPage, setCurrentPage] = useState('products');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold text-gray-900">Alto Andino Admin</h1>
              <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
                <button
                  onClick={() => setCurrentPage('products')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    currentPage === 'products'
                      ? 'bg-white text-green-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  Productos
                </button>
                <button
                  onClick={() => setCurrentPage('categories')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    currentPage === 'categories'
                      ? 'bg-white text-green-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  Categorías
                </button>
              </div>
            </div>
            <a
              href="/"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Volver al Menú
            </a>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <div>
        {currentPage === 'products' && <AdminProducts />}
        {currentPage === 'categories' && <AdminCategories />}
      </div>
    </div>
  );
}

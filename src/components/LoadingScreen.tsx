import { Loader2, Clock, Wifi } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="relative inline-block mb-6">
          <Loader2 className="w-16 h-16 text-[#075E54] animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Wifi className="w-8 h-8 text-[#075E54] opacity-30" />
          </div>
        </div>
        
        <h2 className="mb-3 text-xl text-gray-800">Conectando à API n8n</h2>
        <p className="text-gray-600 mb-2">Buscando conversas diretamente (client-side)...</p>
        <p className="text-sm text-gray-500 mb-1">
          Esta operação pode levar até 30 segundos
        </p>
        <p className="text-xs text-gray-400">
          Verifique o console do navegador para logs detalhados
        </p>
        
        <div className="mt-6 bg-white/50 rounded-lg p-4 text-sm text-gray-600">
          <p className="mb-1">📅 <strong>Período:</strong> 20/10/2025 - 21/10/2025</p>
          <p className="mb-1">🏢 <strong>Tenant:</strong> pucrs</p>
          <p className="text-xs text-gray-500 mt-2">
            🌐 Chamada direta ao webhook n8n
          </p>
        </div>
        
        <div className="mt-4 text-xs text-gray-500 bg-blue-50 rounded p-3">
          <Clock className="w-4 h-4 inline mr-1" />
          Se demorar muito, tente o upload manual
        </div>
      </div>
    </div>
  );
}

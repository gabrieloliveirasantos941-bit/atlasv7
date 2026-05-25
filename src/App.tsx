/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import FocoFlowDashboard from './components/FocoFlowDashboard';
import { Shield, Key, Terminal, Wifi, ChevronRight, LogIn, Loader2 } from 'lucide-react';
import { useAuth } from './components/FirebaseProvider';

export default function App() {
  const { user, loading, login } = useAuth();
  const [stationActive, setStationActive] = useState(false);
  const [bootLog, setBootLog] = useState<string[]>([
    'INIT ATLAS_OS v4.3 BOOTLOADER...',
    'CARREGANDO MÓDULOS DE SEGURANÇA...',
    'SEÇÃO DE TRABALHO DIGITAL CONECTADA',
  ]);

  useEffect(() => {
    if (user && !stationActive) {
      setBootLog(prev => [
        ...prev,
        `SISTEMA RECONHECEU OPERADOR: ${user.displayName || user.email}`,
        'NEGOCIANDO CHAVES DE CRIPTOGRAFIA...',
        'AUTORIZANDO ACESSO DO OPERADOR...',
        'ESTAÇÃO EM ROTA DE OPERAÇÃO - SUCESSO.'
      ]);
      setTimeout(() => {
        setStationActive(true);
      }, 1500);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#050505] text-[#E3B448] selection:bg-[#E3B448]/35 selection:text-white font-mono flex items-center justify-center relative">
      
      {/* Background Matrix-like dust particles */}
      <div className="absolute inset-0 pointer-events-none opacity-40 z-0">
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundImage: 'radial-gradient(ellipse at center, rgba(5, 5, 5, 0) 0%, rgba(5, 5, 5, 0.9) 100%)',
          zIndex: 2,
        }} />
        <div className="absolute inset-0 z-1 border border-dashed border-[#E3B448]/5 flex justify-around">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-[1px] h-full bg-gradient-to-b from-transparent via-[#E3B448]/10 to-transparent" />
          ))}
        </div>
      </div>

      {!stationActive ? (
        <div className="z-10 max-w-md w-full mx-4 p-8 border border-[#E3B448]/20 bg-[#050505]/85 backdrop-blur-2xl rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8),_0_0_30px_rgba(227,180,72,0.05)] relative overflow-hidden">
          {/* Neon borders decorative corner blocks */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-[#E3B448]" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-[#E3B448]" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-[#E3B448]" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-[#E3B448]" />

          <div className="flex flex-col items-center text-center">
            <div className="mb-4 p-3.5 border border-[#E3B448]/40 rounded-full bg-[#E3B448]/10 animate-pulse relative shadow-[0_0_15px_rgba(227,180,72,0.15)]">
              <Shield className="w-8 h-8 text-[#E3B448]" />
            </div>

            <h1 className="text-sm font-extrabold tracking-[0.25em] text-[#E3B448] uppercase">CORE MEMORY v5.2</h1>
            <p className="text-[9px] text-[#E3B448]/60 tracking-[0.15em] uppercase font-bold mt-1">NÚCLEO DE INTELIGÊNCIA OPERACIONAL</p>

            {/* Simulated Live logs inside decryption card */}
            <div className="w-full bg-black/40 border border-[#E3B448]/15 p-4 rounded-lg my-6 h-32 text-left text-[9px] leading-relaxed select-none overflow-y-auto custom-scrollbar">
              {bootLog.map((log, i) => (
                <div key={i} className="flex gap-2 text-[#E3B448]/75">
                  <span className="text-[#E3B448]/30">›</span>
                  <span>{log}</span>
                </div>
              ))}
              {!user && (
                <div className="flex gap-2 text-rose-500 mt-2">
                  <span className="text-rose-500/30">›</span>
                  <span>AGUARDANDO AUTENTICAÇÃO BIOMÉTRICA (GOOGLE)...</span>
                </div>
              )}
              <div className="animate-pulse w-1.5 h-3 bg-[#E3B448] inline-block ml-1 mt-1" />
            </div>

            <div className="w-full flex flex-col gap-2.5">
              {!user ? (
                <button
                  onClick={login}
                  className="w-full py-4 bg-gradient-to-r from-indigo-900/40 via-indigo-500/10 to-indigo-950/40 border border-indigo-500/40 hover:border-indigo-500/80 text-indigo-400 hover:text-white hover:shadow-[0_0_20px_rgba(99,102,241,0.2)] font-extrabold text-[10px] tracking-[0.25em] uppercase rounded-lg transition-all cursor-pointer flex items-center justify-center gap-3 group"
                >
                  <LogIn className="w-4 h-4" />
                  ENTRAR COM ACESSO GOOGLE
                </button>
              ) : (
                <div className="w-full py-4 border border-emerald-500/40 bg-emerald-500/5 text-emerald-500 font-extrabold text-[10px] tracking-[0.25em] uppercase rounded-lg flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  ACESSO CONCEDIDO: SINCRONIZANDO...
                </div>
              )}
            </div>
            
            <div className="mt-6 flex items-center justify-between gap-6 w-full text-[8px] text-[#E3B448]/40 font-bold uppercase tracking-[0.15em]">
              <div className="flex items-center gap-1.5">
                <Wifi className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>LINK_SEGURO</span>
              </div>
              <span>DESVIO_AES256</span>
            </div>
          </div>
        </div>
      ) : (
        <FocoFlowDashboard 
          isOpen={stationActive} 
          onClose={() => setStationActive(false)} 
          userId={user?.uid || 'operador_inválido'} 
        />
      )}
    </div>
  );
}

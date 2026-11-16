import React, { useState } from 'react';
import { analyzeTicketMath, PRECO_APOSTA_SIMPLES_BRL } from '../math/megasena';
import { X, Trash2, Copy, Check, Bookmark } from 'lucide-react';

export interface SavedTicketItem {
  id: string;
  label: string;
  dezenas: number[];
  createdAt: string;
}

interface SavedTicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedTickets: SavedTicketItem[];
  onRemoveTicket: (id: string) => void;
  onClearAll: () => void;
}

export const SavedTicketsModal: React.FC<SavedTicketsModalProps> = ({
  isOpen,
  onClose,
  savedTickets,
  onRemoveTicket,
  onClearAll,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const totalCost = savedTickets.length * PRECO_APOSTA_SIMPLES_BRL;

  const handleCopyAll = () => {
    const text = savedTickets
      .map(
        (t, idx) =>
          `Jogo ${String(idx + 1).padStart(2, '0')} (${t.label}): ${t.dezenas
            .map((d) => String(d).padStart(2, '0'))
            .join(' - ')}`
      )
      .join('\n');

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-volantes-title"
    >
      <div className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-xl">
        {/* Mobile Grab Handle Affordance */}
        <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto mt-3 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-emerald-700 shrink-0" />
            <h2 id="modal-volantes-title" className="text-sm sm:text-base font-bold text-slate-900">
              Caderno de Volantes da Semana ({savedTickets.length} Jogos)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar caderno de volantes"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {savedTickets.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <div className="text-sm font-semibold text-slate-800">
                Nenhum volante salvo ainda
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Utilize o Desdobramento Combinatório ou o Auditor Gaussiano para gerar e salvar seus jogos calibrados para a semana.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono tabular-nums">
                <div>
                  Total de Cartelas:{' '}
                  <span className="font-bold text-slate-900">{savedTickets.length}</span> ·
                  Investimento:{' '}
                  <span className="font-bold text-emerald-700">
                    {totalCost.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-sans">
                  <button
                    type="button"
                    onClick={handleCopyAll}
                    className="flex-1 sm:flex-initial min-h-[38px] px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-700" /> Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copiar Lista
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={onClearAll}
                    className="min-h-[38px] px-3 py-1.5 text-rose-700 hover:bg-rose-50 font-medium rounded-lg flex items-center justify-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Limpar Tudo
                  </button>
                </div>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl">
                {savedTickets.map((item, idx) => {
                  const diag = analyzeTicketMath(item.dezenas);
                  return (
                    <div
                      key={item.id}
                      className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="text-xs text-slate-500 truncate">
                          <span className="font-mono font-semibold text-slate-700">
                            #{String(idx + 1).padStart(2, '0')}
                          </span>{' '}
                          · {item.label} · Soma {diag.soma} · {diag.pares}P/{diag.impares}I
                        </div>
                        <div className="flex items-center gap-1.5 font-mono tabular-nums flex-wrap">
                          {item.dezenas.map((d) => (
                            <span
                              key={d}
                              className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-emerald-700 text-white text-xs font-bold"
                            >
                              {String(d).padStart(2, '0')}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveTicket(item.id)}
                        aria-label={`Remover jogo ${idx + 1}`}
                        className="min-h-[38px] px-2.5 text-xs text-slate-500 hover:text-rose-600 shrink-0"
                      >
                        Remover
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-4 py-2.5 sm:py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl sm:rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

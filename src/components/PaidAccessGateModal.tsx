import React, { useState } from 'react';
import { Lock, ShieldCheck, Check, FileText, ArrowRight, AlertCircle } from 'lucide-react';

interface PaidAccessGateModalProps {
  isOpen: boolean;
  onUnlockAccess: () => void;
}

export const PaidAccessGateModal: React.FC<PaidAccessGateModalProps> = ({
  isOpen,
  onUnlockAccess,
}) => {
  const [accessCode, setAccessCode] = useState<string>('MEMBRO-VIP-2026');
  const [email, setEmail] = useState<string>('assinante@megaquant.com.br');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Informe o e-mail utilizado na confirmação do pagamento.');
      return;
    }
    if (!accessCode.trim() || accessCode.trim().length < 4) {
      setError('Informe seu código ou chave de liberação de assinante.');
      return;
    }
    setError(null);
    onUnlockAccess();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="paywall-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <Lock className="w-3.5 h-3.5" /> Acesso Restrito a Membros Pagantes
            </div>
            <h2 id="paywall-modal-title" className="text-xl font-bold text-slate-900">
              Liberação Exclusiva MegaQuant
            </h2>
            <p className="text-xs text-slate-500">
              Este aplicativo e o Download de Conteúdo em PDF só são liberados para usuários com pagamento confirmado.
            </p>
          </div>
        </div>

        {/* Benefits Included */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs text-slate-700">
          <div className="font-semibold text-slate-900">
            O que está incluído no seu acesso pago:
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                <strong>Download de Conteúdo (PDFs):</strong> A questão da probabilidade, Questão de jogos, Consciência e Como jogar (<code>mega-sena-analise.pdf</code> e <code>mega-sena-matematica-e-estrategias.pdf</code>)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                <strong>Matriz Semanal 01–60:</strong> Dezenas com maior probabilidade na semana em uma única linha organizada
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                <strong>Gerador de Fechamentos & Curva de Gauss:</strong> Desdobramentos com até 98% de economia sobre apostas múltiplas
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="paywall-email"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              E-mail do Assinante Pagante
            </label>
            <input
              id="paywall-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full min-h-[42px] px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label
              htmlFor="paywall-code"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Chave de Liberação de Pagamento
            </label>
            <input
              id="paywall-code"
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              className="w-full min-h-[42px] px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
              placeholder="MEMBRO-VIP-2026"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full min-h-[46px] py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" /> Validar Pagamento e Liberar Aplicativo
          </button>
        </form>
      </div>
    </div>
  );
};

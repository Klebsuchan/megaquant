import React, { useState, useMemo } from 'react';
import {
  ContestResult,
  analyzeCurrentCycle,
  DezenaStats,
  analyzeTicketMath,
} from '../math/megasena';
import { PlusCircle, Check, AlertCircle, RotateCcw } from 'lucide-react';

interface CycleAndHistoryViewProps {
  contests: ContestResult[];
  stats: DezenaStats[];
  selectedPool: number[];
  onSetPool: (dezenas: number[]) => void;
  onAddContest: (contest: ContestResult) => void;
  onResetContests: () => void;
}

export const CycleAndHistoryView: React.FC<CycleAndHistoryViewProps> = ({
  contests,
  stats,
  selectedPool,
  onSetPool,
  onAddContest,
  onResetContests,
}) => {
  const nextConcursoNumber = useMemo(
    () =>
      contests.length > 0
        ? Math.max(...contests.map((c) => c.concurso)) + 1
        : 2827,
    [contests]
  );

  const [concursoInput, setConcursoInput] = useState<string>(String(nextConcursoNumber));
  const [dataInput, setDataInput] = useState<string>('2026-11-18');
  const [dezenasInput, setDezenasInput] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const cycleInfo = useMemo(() => analyzeCurrentCycle(contests), [contests]);
  const missingSet = useMemo(
    () => new Set(cycleInfo.dezenasFaltantesNoCiclo),
    [cycleInfo]
  );

  const handleAddContestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const concNum = Number(concursoInput.trim());
    if (!concursoInput.trim() || !Number.isInteger(concNum) || concNum <= 0) {
      setFormError('Informe um número de concurso válido.');
      return;
    }

    if (!dataInput.trim()) {
      setFormError('Informe a data do sorteio.');
      return;
    }

    const parts = dezenasInput
      .trim()
      .split(/[\s,;.-]+/)
      .filter(Boolean)
      .map(Number);

    if (parts.length !== 6) {
      setFormError('Digite exatamente 6 dezenas separadas por espaço ou vírgula (ex: 10 17 27 34 37 53).');
      return;
    }

    const unique = new Set(parts);
    if (unique.size !== 6) {
      setFormError('As 6 dezenas sorteadas não podem conter números repetidos.');
      return;
    }

    for (const n of parts) {
      if (!Number.isInteger(n) || n < 1 || n > 60) {
        setFormError('Todas as dezenas devem ser números inteiros entre 01 e 60.');
        return;
      }
    }

    const sortedDezenas = [...parts].sort((a, b) => a - b);
    onAddContest({
      concurso: concNum,
      data: dataInput.trim(),
      dezenas: sortedDezenas,
    });

    setConcursoInput(String(concNum + 1));
    setDezenasInput('');
    setFormSuccess(
      `Concurso #${concNum} registrado! Atrasos, Z-Scores e Ciclo das Dezenas recalculados.`
    );
  };

  const sortedContestsDesc = useMemo(
    () => [...contests].sort((a, b) => b.concurso - a.concurso),
    [contests]
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left 7 Columns: Ciclo das Dezenas Visual Matrix */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl sm:rounded-xl p-4 sm:p-6 space-y-4 sm:space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Teoria do Ciclo das Dezenas (Concurso #{cycleInfo.cicloInicioConcurso} até Hoje)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Um ciclo se fecha quando todas as 60 dezenas são sorteadas ao menos uma vez. Dezenas faltantes no final do ciclo possuem forte convergência estatística.
              </p>
            </div>

            {cycleInfo.dezenasFaltantesNoCiclo.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const merged = Array.from(
                    new Set([...selectedPool, ...cycleInfo.dezenasFaltantesNoCiclo])
                  ).sort((a, b) => a - b);
                  onSetPool(merged);
                }}
                className="w-full sm:w-auto min-h-[42px] px-3.5 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold rounded-xl sm:rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Carregar {cycleInfo.dezenasFaltantesNoCiclo.length} Faltantes no Pool
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 font-mono tabular-nums">
            <div className="p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-lg">
              <div className="text-[11px] sm:text-xs font-sans text-slate-500">Já Sorteadas</div>
              <div className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                {cycleInfo.dezenasSorteadasNoCiclo.length} / 60
              </div>
            </div>
            <div className="p-3 sm:p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl sm:rounded-lg">
              <div className="text-[11px] sm:text-xs font-sans text-amber-900">Faltam Sair</div>
              <div className="text-lg sm:text-xl font-bold text-amber-800 mt-0.5">
                {cycleInfo.dezenasFaltantesNoCiclo.length} dez.
              </div>
            </div>
            <div className="p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-lg">
              <div className="text-[11px] sm:text-xs font-sans text-slate-500">Duração</div>
              <div className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                {cycleInfo.concursosNoCiclo} conc.
              </div>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2">
            <div className="text-xs font-semibold text-amber-950">
              Dezenas Críticas Faltantes para Fechar o Ciclo Atual:
            </div>
            {cycleInfo.dezenasFaltantesNoCiclo.length > 0 ? (
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 font-mono tabular-nums">
                {cycleInfo.dezenasFaltantesNoCiclo.map((d) => {
                  const st = stats[d - 1];
                  return (
                    <div
                      key={d}
                      className="px-3 py-2 bg-white border border-amber-300 rounded-lg flex items-center justify-between sm:justify-start gap-2"
                    >
                      <span className="text-sm sm:text-base font-bold text-amber-900">
                        {String(d).padStart(2, '0')}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {st?.atrasoAtual}c · {st?.frequenciaTotal}x
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-emerald-800 font-medium">
                Todas as 60 dezenas saíram! O próximo concurso iniciará um novo ciclo.
              </div>
            )}
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5 font-mono tabular-nums">
            {stats.map((s) => {
              const isMissing = missingSet.has(s.dezena);
              return (
                <div
                  key={s.dezena}
                  className={`py-2 text-center rounded-md text-xs font-bold border ${
                    isMissing
                      ? 'bg-amber-600 text-white border-amber-700'
                      : 'bg-slate-100 text-slate-400 border-slate-200'
                  }`}
                  title={
                    isMissing
                      ? `Dezena ${s.dezena}: FALTA SAIR no ciclo atual`
                      : `Dezena ${s.dezena}: Já sorteada no ciclo atual`
                  }
                >
                  {String(s.dezena).padStart(2, '0')}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 5 Columns: Form to Register New Official Contest Result */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl sm:rounded-xl p-4 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Registrar Novo Resultado da Mega-Sena
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Insira um novo sorteio para atualizar toda a matriz de probabilidades da semana.
              </p>
            </div>
            <button
              type="button"
              onClick={onResetContests}
              className="min-h-[36px] px-2 text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3 h-3" /> Restaurar
            </button>
          </div>

          <form onSubmit={handleAddContestSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="input-concurso"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Número do Concurso
                </label>
                <input
                  id="input-concurso"
                  type="number"
                  value={concursoInput}
                  onChange={(e) => setConcursoInput(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  placeholder="2827"
                />
              </div>
              <div>
                <label
                  htmlFor="input-data"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Data do Sorteio
                </label>
                <input
                  id="input-data"
                  type="date"
                  value={dataInput}
                  onChange={(e) => setDataInput(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="input-dezenas"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                6 Dezenas Sorteadas (01 a 60)
              </label>
              <input
                id="input-dezenas"
                type="text"
                value={dezenasInput}
                onChange={(e) => setDezenasInput(e.target.value)}
                placeholder="Ex: 10 17 27 34 37 53"
                className="w-full min-h-[42px] px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                <span>Separe por espaço ou vírgula.</span>
                <button
                  type="button"
                  onClick={() => setDezenasInput('10 17 27 34 37 53')}
                  className="min-h-[32px] text-emerald-700 font-medium hover:underline"
                >
                  Preencher Faltantes do Ciclo
                </button>
              </div>
            </div>

            {formError && (
              <div
                role="alert"
                className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div
                role="status"
                className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-start gap-2"
              >
                <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>{formSuccess}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full min-h-[46px] py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl sm:rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" /> Incorporar Concurso e Recalcular
            </button>
          </form>
        </div>
      </div>

      {/* Historical Draws Section */}
      <section className="bg-white border border-slate-200 rounded-2xl sm:rounded-xl p-4 sm:p-6 space-y-4">
        <div className="border-b border-slate-200 pb-3">
          <h3 className="text-sm sm:text-base font-bold text-slate-900">
            Histórico Recente de Concursos Auditados ({sortedContestsDesc.length} Sorteios)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Observe como a soma real dos sorteios gravita consistentemente em torno da média teórica de Gauss (183) e paridades 3P/3I, 4P/2I ou 2P/4I.
          </p>
        </div>

        {/* Mobile Historical Cards (<768px) */}
        <div className="md:hidden divide-y divide-slate-100">
          {sortedContestsDesc.map((c) => {
            const diag = analyzeTicketMath(c.dezenas);
            return (
              <div key={c.concurso} className="py-3 space-y-2 font-mono tabular-nums">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">
                    Concurso #{c.concurso} · <span className="font-normal text-slate-500">{c.data}</span>
                  </span>
                  <span className="text-slate-600">
                    Soma {diag.soma} · {diag.pares}P/{diag.impares}I
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {c.dezenas.map((d) => (
                    <span
                      key={d}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-900 text-xs font-bold border border-slate-200"
                    >
                      {String(d).padStart(2, '0')}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table (>=768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                <th className="py-2.5 px-3">Concurso</th>
                <th className="py-2.5 px-3">Data</th>
                <th className="py-2.5 px-3">Dezenas Sorteadas</th>
                <th className="py-2.5 px-3 text-right">Soma (Gauss)</th>
                <th className="py-2.5 px-3 text-center">Par / Ímpar</th>
                <th className="py-2.5 px-3 text-center">Quadrantes</th>
                <th className="py-2.5 px-3">Diagnóstico da Curva</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-mono tabular-nums">
              {sortedContestsDesc.map((c) => {
                const diag = analyzeTicketMath(c.dezenas);
                return (
                  <tr key={c.concurso} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-900">#{c.concurso}</td>
                    <td className="py-2.5 px-3 text-xs text-slate-500">{c.data}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        {c.dezenas.map((d) => (
                          <span
                            key={d}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-slate-100 text-slate-900 text-xs font-bold border border-slate-200"
                          >
                            {String(d).padStart(2, '0')}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                      {diag.soma}
                    </td>
                    <td className="py-2.5 px-3 text-center text-xs text-slate-700">
                      {diag.pares}P / {diag.impares}I
                    </td>
                    <td className="py-2.5 px-3 text-center text-xs text-slate-700">
                      {diag.quadrantesAtivos}Q
                    </td>
                    <td className="py-2.5 px-3 font-sans text-xs text-slate-600">
                      {diag.faixaSomaStatus}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

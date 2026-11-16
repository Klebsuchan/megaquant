import React, { useState, useMemo } from 'react';
import {
  DezenaStats,
  ModelWeights,
  analyzeCurrentCycle,
  ContestResult,
} from '../math/megasena';
import {
  Sliders,
  Check,
  Plus,
  ArrowUpDown,
  RotateCcw,
} from 'lucide-react';

interface VolanteMatrixViewProps {
  stats: DezenaStats[];
  contests: ContestResult[];
  weights: ModelWeights;
  onChangeWeights: (w: ModelWeights) => void;
  selectedPool: number[];
  onTogglePoolNumber: (dezena: number) => void;
  onSetPool: (dezenas: number[]) => void;
  onNavigateToClosing: () => void;
}

type FilterMode =
  | 'todas'
  | 'top15'
  | 'ciclo'
  | 'atraso'
  | 'pares'
  | 'impares'
  | 'primos';

type SortField =
  | 'scoreSemanal'
  | 'dezena'
  | 'frequenciaTotal'
  | 'atrasoAtual'
  | 'zScoreAtraso'
  | 'probPoissonSemanal';

export const VolanteMatrixView: React.FC<VolanteMatrixViewProps> = ({
  stats,
  contests,
  weights,
  onChangeWeights,
  selectedPool,
  onTogglePoolNumber,
  onSetPool,
  onNavigateToClosing,
}) => {
  const [focusedDezena, setFocusedDezena] = useState<number>(10);
  const [filterMode, setFilterMode] = useState<FilterMode>('todas');
  const [sortField, setSortField] = useState<SortField>('scoreSemanal');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [heatmapMetric, setHeatmapMetric] = useState<'score' | 'zscore' | 'frequencia'>('score');

  const cycleInfo = useMemo(() => analyzeCurrentCycle(contests), [contests]);
  const poolSet = useMemo(() => new Set(selectedPool), [selectedPool]);

  const rankedStats = useMemo(() => {
    return [...stats].sort((a, b) => b.scoreSemanal - a.scoreSemanal);
  }, [stats]);

  const top12Numbers = useMemo(
    () => rankedStats.slice(0, 12).map((s) => s.dezena),
    [rankedStats]
  );

  const focusedStat = useMemo(
    () => stats.find((s) => s.dezena === focusedDezena) || stats[9],
    [stats, focusedDezena]
  );

  const filteredTableStats = useMemo(() => {
    let list = [...stats];
    if (filterMode === 'top15') {
      const topSet = new Set(rankedStats.slice(0, 15).map((s) => s.dezena));
      list = list.filter((s) => topSet.has(s.dezena));
    } else if (filterMode === 'ciclo') {
      list = list.filter((s) => s.faltaNoCicloAtual);
    } else if (filterMode === 'atraso') {
      list = list.filter((s) => s.zScoreAtraso >= 0.4);
    } else if (filterMode === 'pares') {
      list = list.filter((s) => s.par);
    } else if (filterMode === 'impares') {
      list = list.filter((s) => !s.par);
    } else if (filterMode === 'primos') {
      list = list.filter((s) => s.primo);
    }

    list.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      return sortAsc ? valA - valB : valB - valA;
    });
    return list;
  }, [stats, rankedStats, filterMode, sortField, sortAsc]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'dezena');
    }
  };

  const applyPreset = (preset: 'equilibrado' | 'atraso_ciclo' | 'frequencia_pura') => {
    if (preset === 'equilibrado') {
      onChangeWeights({ frequencia: 35, atrasoZ: 35, cicloAtual: 20, tendenciaRecente: 10 });
    } else if (preset === 'atraso_ciclo') {
      onChangeWeights({ frequencia: 15, atrasoZ: 45, cicloAtual: 35, tendenciaRecente: 5 });
    } else {
      onChangeWeights({ frequencia: 65, atrasoZ: 15, cicloAtual: 10, tendenciaRecente: 10 });
    }
  };

  const getCellColorClasses = (s: DezenaStats, isSelected: boolean) => {
    if (isSelected) {
      return 'bg-emerald-700 text-white border-emerald-800 font-semibold';
    }
    if (heatmapMetric === 'score') {
      if (s.scoreSemanal >= 78) {
        return 'bg-emerald-100/90 text-emerald-950 border-emerald-300 hover:bg-emerald-200/80';
      }
      if (s.scoreSemanal >= 62) {
        return 'bg-emerald-50/70 text-slate-900 border-emerald-200/80 hover:bg-emerald-100/60';
      }
      if (s.scoreSemanal <= 38) {
        return 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200/60';
      }
      return 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100';
    }
    if (heatmapMetric === 'zscore') {
      if (s.zScoreAtraso >= 0.6) {
        return 'bg-amber-100/90 text-amber-950 border-amber-300 hover:bg-amber-200/70';
      }
      if (s.zScoreAtraso >= 0.1) {
        return 'bg-amber-50/70 text-slate-900 border-amber-200 hover:bg-amber-100/60';
      }
      return 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100';
    }
    if (s.desvioFrequenciaPct >= 5) {
      return 'bg-emerald-100/90 text-emerald-950 border-emerald-300 hover:bg-emerald-200/80';
    }
    if (s.desvioFrequenciaPct >= 1) {
      return 'bg-emerald-50/60 text-slate-900 border-emerald-200 hover:bg-emerald-100/60';
    }
    return 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100';
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Quantitative KPI Strip: Organised Single-Line Number Strips */}
      <section
        aria-label="Indicadores Matemáticos da Semana"
        className="space-y-4"
      >
        {/* Primary Row: Top 6 Weekly Numbers & Missing Cycle Numbers — strictly 1 single line each */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Card 1: Top 6 Maior Probabilidade Semanal (10, 53, 34, 37, 17, 27 in a single line) */}
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-xl p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-semibold text-slate-900">
                  Top 6 Maior Probabilidade na Semana
                </div>
                <div className="text-[11px] text-slate-500">
                  Índice médio:{' '}
                  <span className="font-mono font-semibold text-emerald-700 tabular-nums">
                    {(
                      rankedStats.slice(0, 6).reduce((a, b) => a + b.scoreSemanal, 0) / 6
                    ).toFixed(1)}{' '}
                    pts
                  </span>{' '}
                  · Poisson + Z-Score
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  onSetPool(
                    Array.from(
                      new Set([...selectedPool, ...rankedStats.slice(0, 6).map((s) => s.dezena)])
                    ).sort((a, b) => a - b)
                  )
                }
                className="min-h-[34px] px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                + Usar Top 6
              </button>
            </div>

            {/* Single-Line Strip of 6 Numbers (never wraps to a second row) */}
            <div
              className="grid grid-cols-6 gap-1.5 sm:gap-2.5 font-mono tabular-nums"
              aria-label="Faixa linear com as 6 dezenas de maior probabilidade da semana"
            >
              {rankedStats.slice(0, 6).map((s, idx) => (
                <button
                  key={s.dezena}
                  type="button"
                  onClick={() => {
                    setFocusedDezena(s.dezena);
                    onTogglePoolNumber(s.dezena);
                  }}
                  className="flex flex-col items-center justify-center py-2.5 px-1 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white border border-emerald-800 transition-colors shadow-2xs"
                >
                  <span className="text-[10px] text-emerald-200 leading-none">
                    #{idx + 1}
                  </span>
                  <span className="text-base sm:text-xl font-bold leading-tight mt-0.5">
                    {String(s.dezena).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] text-emerald-100 leading-none mt-0.5">
                    {s.scoreSemanal.toFixed(0)}p
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Card 2: Faltantes para Fechar o Ciclo Atual (10, 17, 27, 34, 37, 53 in a single line) */}
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-xl p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-semibold text-slate-900">
                  Faltantes para Fechar o Ciclo Atual
                </div>
                <div className="text-[11px] text-slate-500">
                  {cycleInfo.concursosNoCiclo} concursos no ciclo · Restam{' '}
                  <span className="font-mono font-semibold text-amber-700 tabular-nums">
                    {cycleInfo.dezenasFaltantesNoCiclo.length} dezenas
                  </span>
                </div>
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
                  className="min-h-[34px] px-2.5 py-1 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  + Incluir no Pool
                </button>
              )}
            </div>

            {cycleInfo.dezenasFaltantesNoCiclo.length > 0 ? (
              <div
                className="grid grid-cols-6 gap-1.5 sm:gap-2.5 font-mono tabular-nums"
                aria-label="Faixa linear com as dezenas faltantes no ciclo atual"
              >
                {cycleInfo.dezenasFaltantesNoCiclo.slice(0, 6).map((d) => {
                  const st = stats[d - 1];
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        setFocusedDezena(d);
                        onTogglePoolNumber(d);
                      }}
                      className="flex flex-col items-center justify-center py-2.5 px-1 rounded-xl bg-amber-50/90 hover:bg-amber-100 text-amber-950 border border-amber-300 transition-colors"
                    >
                      <span className="text-[10px] text-amber-700 leading-none">
                        Ciclo
                      </span>
                      <span className="text-base sm:text-xl font-bold leading-tight mt-0.5">
                        {String(d).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] text-amber-800 leading-none mt-0.5">
                        {st?.atrasoAtual ?? 16}c
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="py-4 text-center text-xs font-medium text-emerald-800 bg-emerald-50 rounded-xl">
                Ciclo Fechado! Todas as 60 dezenas foram sorteadas.
              </div>
            )}
          </div>
        </div>

        {/* Secondary Row: Dezena Líder & Pool Ativo Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-xl p-4 sm:p-5 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-medium text-slate-500">
                Dezena Líder em Pressão Estatística na Semana
              </div>
              <div className="mt-1 flex items-baseline gap-2.5">
                <span className="text-xl sm:text-2xl font-mono font-bold text-slate-900 tabular-nums">
                  Dezena {String(rankedStats[0].dezena).padStart(2, '0')}
                </span>
                <span className="text-xs font-mono text-emerald-700 font-semibold tabular-nums">
                  Score {rankedStats[0].scoreSemanal.toFixed(1)} / 100
                </span>
              </div>
              <div className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
                Frequência: {rankedStats[0].frequenciaTotal}x · Atraso: {rankedStats[0].atrasoAtual} conc. · Z:{' '}
                {rankedStats[0].zScoreAtraso >= 0 ? '+' : ''}
                {rankedStats[0].zScoreAtraso}σ
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white font-mono font-bold text-lg flex items-center justify-center shrink-0 tabular-nums">
              {String(rankedStats[0].dezena).padStart(2, '0')}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            <div>
              <div className="text-xs font-medium text-slate-500">
                Pool Selecionado para Fechamento Combinatório
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-mono font-bold text-slate-900 tabular-nums">
                  {selectedPool.length} dezenas
                </span>
                <span className="text-xs text-slate-500">ativas no seu modelo</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onSetPool(top12Numbers)}
                className="flex-1 sm:flex-initial min-h-[42px] px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
              >
                Usar Top 12
              </button>
              <button
                type="button"
                onClick={onNavigateToClosing}
                className="flex-1 sm:flex-initial min-h-[42px] px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap"
              >
                Gerar Jogos
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Split Workspace: Left 6x10 Volante Heatmap + Right Inspector & Model Calibration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left 7 Columns: Interactive 60-Dezena Volante Matrix */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl sm:rounded-xl p-4 sm:p-6 space-y-4 sm:space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Matriz Combinatória 01–60 (Mapa de Probabilidade)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Toque em uma dezena para inspecionar seu Z-Score e incluí-la ou removê-la do seu Pool de Estratégia.
              </p>
            </div>

            {/* Segmented Mode Control (full width on mobile with 40px touch height) */}
            <div className="grid grid-cols-3 sm:flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-full sm:w-auto sm:self-start">
              <button
                type="button"
                onClick={() => setHeatmapMetric('score')}
                className={`min-h-[38px] sm:min-h-0 px-2.5 py-1.5 sm:py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  heatmapMetric === 'score'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Índice Semanal
              </button>
              <button
                type="button"
                onClick={() => setHeatmapMetric('zscore')}
                className={`min-h-[38px] sm:min-h-0 px-2.5 py-1.5 sm:py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  heatmapMetric === 'zscore'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Atraso (Z)
              </button>
              <button
                type="button"
                onClick={() => setHeatmapMetric('frequencia')}
                className={`min-h-[38px] sm:min-h-0 px-2.5 py-1.5 sm:py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  heatmapMetric === 'frequencia'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Frequência
              </button>
            </div>
          </div>

          {/* Quick Selection Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onSetPool(rankedStats.slice(0, 10).map((s) => s.dezena))}
                className="min-h-[40px] sm:min-h-0 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg sm:rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                Selecionar Top 10
              </button>
              <button
                type="button"
                onClick={() => onSetPool(rankedStats.slice(0, 12).map((s) => s.dezena))}
                className="min-h-[40px] sm:min-h-0 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg sm:rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                Selecionar Top 12
              </button>
              <button
                type="button"
                onClick={() => onSetPool(rankedStats.slice(0, 15).map((s) => s.dezena))}
                className="min-h-[40px] sm:min-h-0 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg sm:rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                Selecionar Top 15
              </button>
              <button
                type="button"
                onClick={() => onSetPool([])}
                className="min-h-[40px] sm:min-h-0 px-2.5 py-1.5 text-slate-600 hover:text-slate-900 bg-slate-50 sm:bg-transparent hover:bg-slate-100 rounded-lg sm:rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                Limpar Seleção
              </button>
            </div>

            <div className="text-slate-500 font-mono tabular-nums text-[11px] sm:text-xs">
              Letra C âmbar indica dezena faltante no Ciclo
            </div>
          </div>

          {/* 6x10 Grid on Desktop, 6-Column Ergonomic Touch Grid on Mobile (>=48px tap targets) */}
          <div
            className="grid grid-cols-6 sm:grid-cols-10 gap-1.5"
            role="grid"
            aria-label="Volante de 60 dezenas da Mega-Sena"
          >
            {stats.map((s) => {
              const isSelected = poolSet.has(s.dezena);
              const isFocused = focusedDezena === s.dezena;
              const numStr = String(s.dezena).padStart(2, '0');
              const subMetric =
                heatmapMetric === 'score'
                  ? `${s.scoreSemanal.toFixed(0)}p`
                  : heatmapMetric === 'zscore'
                  ? `${s.zScoreAtraso >= 0 ? '+' : ''}${s.zScoreAtraso.toFixed(1)}σ`
                  : `${s.frequenciaTotal}x`;

              return (
                <button
                  key={s.dezena}
                  type="button"
                  onClick={() => {
                    setFocusedDezena(s.dezena);
                    onTogglePoolNumber(s.dezena);
                  }}
                  aria-label={`Dezena ${numStr}, Índice ${s.scoreSemanal}, ${
                    isSelected ? 'Selecionada no pool' : 'Não selecionada'
                  }`}
                  className={`relative min-h-[48px] flex flex-col items-center justify-center py-2 px-1 rounded-lg border transition-all select-none font-mono tabular-nums ${getCellColorClasses(
                    s,
                    isSelected
                  )} ${
                    isFocused ? 'ring-2 ring-slate-900 ring-offset-1' : ''
                  } ${
                    s.coluna === 5 ? 'sm:mr-1' : ''
                  } ${
                    s.linha === 3 ? 'sm:mb-1' : ''
                  }`}
                >
                  {s.faltaNoCicloAtual && (
                    <span
                      title="Falta sair para fechar o Ciclo Atual"
                      className={`absolute top-1 right-1 text-[9px] font-bold leading-none ${
                        isSelected ? 'text-amber-200' : 'text-amber-700'
                      }`}
                    >
                      C
                    </span>
                  )}
                  <span className="text-sm font-bold leading-tight">{numStr}</span>
                  <span
                    className={`text-[10px] leading-tight mt-0.5 ${
                      isSelected ? 'text-emerald-100' : 'text-slate-500'
                    }`}
                  >
                    {subMetric}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Legend & Quadrant Summary */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-emerald-700 inline-block" />
                No Pool ({selectedPool.length})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-emerald-100 border border-emerald-300 inline-block" />
                Alta Prob. (&ge;78p)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-amber-700">C</span>
                Falta no Ciclo ({cycleInfo.dezenasFaltantesNoCiclo.length})
              </span>
            </div>
            <div className="font-mono text-slate-500 tabular-nums text-[11px] sm:text-xs">
              Quadrantes no Pool: Q1(
              {selectedPool.filter((d) => stats[d - 1]?.quadrante === 1).length}) · Q2(
              {selectedPool.filter((d) => stats[d - 1]?.quadrante === 2).length}) · Q3(
              {selectedPool.filter((d) => stats[d - 1]?.quadrante === 3).length}) · Q4(
              {selectedPool.filter((d) => stats[d - 1]?.quadrante === 4).length})
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Mathematical Inspector + Weight Calibration */}
        <div className="lg:col-span-5 space-y-6">
          {/* Focused Dezena Inspector */}
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-xl p-4 sm:p-6 space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <div className="text-xs font-medium text-slate-500">
                  Raio-X Estatístico Individual
                </div>
                <h3 className="text-xl sm:text-2xl font-bold font-mono text-slate-900 mt-0.5 tabular-nums">
                  Dezena {String(focusedStat.dezena).padStart(2, '0')}
                </h3>
                <div className="text-xs text-slate-500 mt-1">
                  {focusedStat.statusEstrategico} · Q{focusedStat.quadrante} · L
                  {focusedStat.linha} · C{focusedStat.coluna}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onTogglePoolNumber(focusedStat.dezena)}
                className={`min-h-[42px] px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  poolSet.has(focusedStat.dezena)
                    ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                {poolSet.has(focusedStat.dezena) ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> No Pool
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" /> + Pool
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4 font-mono tabular-nums">
              <div>
                <div className="text-xs font-sans text-slate-500">Score Semanal</div>
                <div className="text-lg sm:text-xl font-bold text-emerald-700 mt-0.5">
                  {focusedStat.scoreSemanal.toFixed(1)}{' '}
                  <span className="text-xs font-normal text-slate-400">/ 100</span>
                </div>
              </div>
              <div>
                <div className="text-xs font-sans text-slate-500">Taxa de Poisson</div>
                <div className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                  {focusedStat.probPoissonSemanal.toFixed(2)}%
                </div>
              </div>
              <div>
                <div className="text-xs font-sans text-slate-500">Z-Score de Atraso</div>
                <div
                  className={`text-lg sm:text-xl font-bold mt-0.5 ${
                    focusedStat.zScoreAtraso >= 0.5 ? 'text-amber-700' : 'text-slate-900'
                  }`}
                >
                  {focusedStat.zScoreAtraso >= 0 ? '+' : ''}
                  {focusedStat.zScoreAtraso.toFixed(2)}σ
                </div>
              </div>
              <div>
                <div className="text-xs font-sans text-slate-500">Freq. Histórica</div>
                <div className="text-sm sm:text-base font-semibold text-slate-900 mt-0.5">
                  {focusedStat.frequenciaTotal}x{' '}
                  <span className="text-xs text-slate-500">
                    ({focusedStat.desvioFrequenciaPct >= 0 ? '+' : ''}
                    {focusedStat.desvioFrequenciaPct}%)
                  </span>
                </div>
              </div>
              <div>
                <div className="text-xs font-sans text-slate-500">Atraso Atual</div>
                <div className="text-sm sm:text-base font-semibold text-slate-900 mt-0.5">
                  {focusedStat.atrasoAtual} conc.{' '}
                  <span className="text-xs text-slate-500">
                    (μ={focusedStat.intervaloMedio})
                  </span>
                </div>
              </div>
              <div>
                <div className="text-xs font-sans text-slate-500">Ciclo Atual</div>
                <div
                  className={`text-xs sm:text-sm font-semibold mt-1 font-sans ${
                    focusedStat.faltaNoCicloAtual ? 'text-amber-700' : 'text-slate-600'
                  }`}
                >
                  {focusedStat.faltaNoCicloAtual ? 'Falta Sair no Ciclo' : 'Já Sorteada'}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 text-xs text-slate-600 flex flex-wrap items-center gap-2">
              <span>Propriedades:</span>
              <span className="font-medium text-slate-900">
                {focusedStat.par ? 'Dezena Par' : 'Dezena Ímpar'}
              </span>
              <span>·</span>
              <span className="font-medium text-slate-900">
                {focusedStat.primo ? 'Número Primo' : 'Composto'}
              </span>
              <span>·</span>
              <span className="font-medium text-slate-900">
                {focusedStat.fibonacci ? 'Fibonacci' : 'Não-Fibonacci'}
              </span>
            </div>
          </div>

          {/* Calibrador de Pesos da Equação Semanal */}
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-xl p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-700 shrink-0" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Calibração da Equação de Probabilidade
                </h3>
              </div>
              <button
                type="button"
                onClick={() => applyPreset('equilibrado')}
                className="min-h-[36px] px-2 text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 shrink-0"
              >
                <RotateCcw className="w-3 h-3" /> Padrão
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Ajuste os pesos estatísticos do índice composto <span className="font-mono text-slate-700">I = w₁·F + w₂·Z + w₃·C + w₄·R</span> para priorizar retorno à média (Z-Score) ou dominância histórica.
            </p>

            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => applyPreset('equilibrado')}
                className={`min-h-[38px] py-1.5 px-1.5 text-[11px] sm:text-xs font-medium rounded-md transition-colors whitespace-nowrap truncate ${
                  weights.frequencia === 35 && weights.atrasoZ === 35
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Bayesiano + Ciclo
              </button>
              <button
                type="button"
                onClick={() => applyPreset('atraso_ciclo')}
                className={`min-h-[38px] py-1.5 px-1.5 text-[11px] sm:text-xs font-medium rounded-md transition-colors whitespace-nowrap truncate ${
                  weights.atrasoZ === 45 && weights.cicloAtual === 35
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pressão Atraso
              </button>
              <button
                type="button"
                onClick={() => applyPreset('frequencia_pura')}
                className={`min-h-[38px] py-1.5 px-1.5 text-[11px] sm:text-xs font-medium rounded-md transition-colors whitespace-nowrap truncate ${
                  weights.frequencia === 65
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Freq. Dominante
              </button>
            </div>

            <div className="space-y-3.5 pt-1">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <label htmlFor="slider-freq" className="font-medium text-slate-700">
                    Frequência Histórica Acumulada (Fᵢ)
                  </label>
                  <span className="font-mono font-semibold text-slate-900 tabular-nums">
                    {weights.frequencia}%
                  </span>
                </div>
                <input
                  id="slider-freq"
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={weights.frequencia}
                  onChange={(e) =>
                    onChangeWeights({ ...weights, frequencia: Number(e.target.value) })
                  }
                  className="w-full h-2 accent-emerald-700 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <label htmlFor="slider-zscore" className="font-medium text-slate-700">
                    Atraso Padronizado Z-Score (Z = (A − μ) / σ)
                  </label>
                  <span className="font-mono font-semibold text-slate-900 tabular-nums">
                    {weights.atrasoZ}%
                  </span>
                </div>
                <input
                  id="slider-zscore"
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={weights.atrasoZ}
                  onChange={(e) =>
                    onChangeWeights({ ...weights, atrasoZ: Number(e.target.value) })
                  }
                  className="w-full h-2 accent-emerald-700 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <label htmlFor="slider-ciclo" className="font-medium text-slate-700">
                    Força de Fechamento do Ciclo das 60 Dezenas (Cᵢ)
                  </label>
                  <span className="font-mono font-semibold text-slate-900 tabular-nums">
                    {weights.cicloAtual}%
                  </span>
                </div>
                <input
                  id="slider-ciclo"
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={weights.cicloAtual}
                  onChange={(e) =>
                    onChangeWeights({ ...weights, cicloAtual: Number(e.target.value) })
                  }
                  className="w-full h-2 accent-emerald-700 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <label htmlFor="slider-recente" className="font-medium text-slate-700">
                    Tração Recente nos Últimos 15 Sorteios (Rᵢ)
                  </label>
                  <span className="font-mono font-semibold text-slate-900 tabular-nums">
                    {weights.tendenciaRecente}%
                  </span>
                </div>
                <input
                  id="slider-recente"
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={weights.tendenciaRecente}
                  onChange={(e) =>
                    onChangeWeights({ ...weights, tendenciaRecente: Number(e.target.value) })
                  }
                  className="w-full h-2 accent-emerald-700 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Ranking Section: Mobile Tap Cards + Desktop Table */}
      <section className="bg-white border border-slate-200 rounded-2xl sm:rounded-xl p-4 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Ranking Quantitativo das Dezenas para a Semana
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ordenação matemática combinando Taxa de Renovação de Poisson, Desvio Padrão de Atraso e Ciclo das Dezenas.
            </p>
          </div>

          {/* Interactive Filter Controls */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(
              [
                { id: 'todas', label: 'Todas (60)' },
                { id: 'top15', label: 'Top 15' },
                { id: 'ciclo', label: `Ciclo (${cycleInfo.dezenasFaltantesNoCiclo.length})` },
                { id: 'atraso', label: 'Atraso' },
                { id: 'pares', label: 'Pares' },
                { id: 'impares', label: 'Ímpares' },
                { id: 'primos', label: 'Primos' },
              ] as { id: FilterMode; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterMode(tab.id)}
                className={`min-h-[36px] sm:min-h-0 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  filterMode === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Interactive Tap Rows (<768px) */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredTableStats.slice(0, 20).map((s, idx) => {
            const inPool = poolSet.has(s.dezena);
            return (
              <div
                key={s.dezena}
                className={`py-3 flex items-center justify-between gap-3 ${
                  inPool ? 'bg-emerald-50/40 -mx-2 px-2 rounded-lg' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-mono font-bold text-sm flex items-center justify-center shrink-0 tabular-nums">
                    {String(s.dezena).padStart(2, '0')}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-mono tabular-nums">
                      <span className="text-slate-400">#{idx + 1}</span>
                      <span>·</span>
                      <span className="font-bold text-emerald-700">
                        Score {s.scoreSemanal.toFixed(1)}
                      </span>
                      <span>·</span>
                      <span className="text-slate-700">
                        Poisson {s.probPoissonSemanal.toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono tabular-nums truncate mt-0.5">
                      Freq {s.frequenciaTotal}x · Atraso {s.atrasoAtual}c (
                      {s.zScoreAtraso >= 0 ? '+' : ''}
                      {s.zScoreAtraso.toFixed(1)}σ)
                      {s.faltaNoCicloAtual ? ' · Falta no Ciclo' : ''}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onTogglePoolNumber(s.dezena)}
                  className={`min-h-[42px] px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    inPool
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                  }`}
                >
                  {inPool ? 'No Pool' : '+ Pool'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Desktop High-Density Table (>=768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                <th className="py-3 px-3">Rank</th>
                <th className="py-3 px-3">
                  <button
                    type="button"
                    onClick={() => handleSort('dezena')}
                    className="flex items-center gap-1 hover:text-slate-900"
                  >
                    Dezena <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('scoreSemanal')}
                    className="flex items-center justify-end gap-1 ml-auto hover:text-slate-900"
                  >
                    Score Semanal <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('probPoissonSemanal')}
                    className="flex items-center justify-end gap-1 ml-auto hover:text-slate-900"
                  >
                    Prob. Poisson <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('frequenciaTotal')}
                    className="flex items-center justify-end gap-1 ml-auto hover:text-slate-900"
                  >
                    Frequência (Desvio) <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('atrasoAtual')}
                    className="flex items-center justify-end gap-1 ml-auto hover:text-slate-900"
                  >
                    Atraso Atual <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('zScoreAtraso')}
                    className="flex items-center justify-end gap-1 ml-auto hover:text-slate-900"
                  >
                    Z-Score (σ) <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-3">Diagnóstico Matemático</th>
                <th className="py-3 px-3 text-right">Ação no Pool</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-mono tabular-nums">
              {filteredTableStats.slice(0, 20).map((s, idx) => {
                const inPool = poolSet.has(s.dezena);
                return (
                  <tr
                    key={s.dezena}
                    className={`hover:bg-slate-50 transition-colors ${
                      inPool ? 'bg-emerald-50/40' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 text-xs text-slate-400">#{idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      Dezena {String(s.dezena).padStart(2, '0')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                      {s.scoreSemanal.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-800">
                      {s.probPoissonSemanal.toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-800">
                      {s.frequenciaTotal}x{' '}
                      <span className="text-xs text-slate-500">
                        ({s.desvioFrequenciaPct >= 0 ? '+' : ''}
                        {s.desvioFrequenciaPct}%)
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-800">
                      {s.atrasoAtual} conc.
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-semibold ${
                        s.zScoreAtraso >= 0.5 ? 'text-amber-700' : 'text-slate-700'
                      }`}
                    >
                      {s.zScoreAtraso >= 0 ? '+' : ''}
                      {s.zScoreAtraso.toFixed(2)}σ
                    </td>
                    <td className="py-2.5 px-3 font-sans text-xs text-slate-600">
                      {s.statusEstrategico} · Q{s.quadrante} · {s.par ? 'Par' : 'Ímpar'}
                      {s.faltaNoCicloAtual ? ' · Falta no Ciclo' : ''}
                    </td>
                    <td className="py-2.5 px-3 text-right font-sans">
                      <button
                        type="button"
                        onClick={() => onTogglePoolNumber(s.dezena)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                          inPool
                            ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {inPool ? 'No Pool' : '+ Incluir'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredTableStats.length > 20 && (
          <div className="text-xs text-slate-500 text-center pt-2">
            Exibindo as 20 primeiras dezenas do filtro ativo ({filteredTableStats.length} encontradas). Todas as 60 estão interativas no Volante acima.
          </div>
        )}
      </section>
    </div>
  );
};

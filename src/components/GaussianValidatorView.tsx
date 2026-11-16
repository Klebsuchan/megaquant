import React, { useMemo, useState } from 'react';
import {
  DezenaStats,
  analyzeTicketMath,
  backtestGames,
  ContestResult,
  calculateHypergeometricProbability,
} from '../math/megasena';
import {
  BookmarkPlus,
  Wand2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface GaussianValidatorViewProps {
  stats: DezenaStats[];
  contests: ContestResult[];
  ticketDezenas: number[];
  onChangeTicketDezenas: (dezenas: number[]) => void;
  onSaveTicket: (dezenas: number[], label?: string) => void;
}

export const GaussianValidatorView: React.FC<GaussianValidatorViewProps> = ({
  stats,
  contests,
  ticketDezenas,
  onChangeTicketDezenas,
  onSaveTicket,
}) => {
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const statsMap = useMemo(() => {
    const m = new Map<number, DezenaStats>();
    for (const s of stats) m.set(s.dezena, s);
    return m;
  }, [stats]);

  const rankedStats = useMemo(
    () => [...stats].sort((a, b) => b.scoreSemanal - a.scoreSemanal),
    [stats]
  );

  const diagnostics = useMemo(
    () => analyzeTicketMath(ticketDezenas, statsMap),
    [ticketDezenas, statsMap]
  );

  const backtest = useMemo(
    () => backtestGames([ticketDezenas], contests),
    [ticketDezenas, contests]
  );

  const toggleNumberInTicket = (d: number) => {
    if (ticketDezenas.includes(d)) {
      if (ticketDezenas.length > 1) {
        onChangeTicketDezenas(ticketDezenas.filter((x) => x !== d));
      }
    } else {
      if (ticketDezenas.length < 15) {
        onChangeTicketDezenas([...ticketDezenas, d].sort((a, b) => a - b));
      }
    }
  };

  const handleAutoOptimize = () => {
    const evens = rankedStats.filter((s) => s.par).map((s) => s.dezena);
    const odds = rankedStats.filter((s) => !s.par).map((s) => s.dezena);

    let bestCombo = [5, 14, 27, 34, 43, 58];
    let bestScore = -Infinity;

    for (let i = 0; i < Math.min(12, evens.length); i++) {
      for (let j = i + 1; j < Math.min(14, evens.length); j++) {
        for (let k = j + 1; k < Math.min(16, evens.length); k++) {
          for (let a = 0; a < Math.min(12, odds.length); a++) {
            for (let b = a + 1; b < Math.min(14, odds.length); b++) {
              for (let c = b + 1; c < Math.min(16, odds.length); c++) {
                const candidate = [
                  evens[i],
                  evens[j],
                  evens[k],
                  odds[a],
                  odds[b],
                  odds[c],
                ].sort((x, y) => x - y);
                const soma = candidate.reduce((s, n) => s + n, 0);
                if (soma < 168 || soma > 198) continue;

                let hasConsec = false;
                for (let idx = 1; idx < 6; idx++) {
                  if (candidate[idx] === candidate[idx - 1] + 1) {
                    hasConsec = true;
                    break;
                  }
                }
                if (hasConsec) continue;

                const diag = analyzeTicketMath(candidate, statsMap);
                const composite =
                  diag.scoreQualidadeCombinatoria * 1.2 +
                  diag.scoreProbabilidadeSemanal +
                  diag.quadrantesAtivos * 8 -
                  Math.abs(183 - diag.soma) * 0.5;

                if (composite > bestScore) {
                  bestScore = composite;
                  bestCombo = candidate;
                }
              }
            }
          }
        }
      }
    }

    onChangeTicketDezenas(bestCombo);
  };

  const bellCurvePoints = useMemo(() => {
    const minSum = 21;
    const maxSum = 345;
    const mu = diagnostics.mediaSomaTeorica;
    const sigma = diagnostics.desvioPadraoSoma || 42.33;
    const width = 600;
    const height = 160;
    const padX = 24;
    const padY = 20;
    const plotW = width - padX * 2;
    const plotH = height - padY * 2;

    const pts: string[] = [];
    for (let s = minSum; s <= maxSum; s += 3) {
      const x = padX + ((s - minSum) / (maxSum - minSum)) * plotW;
      const z = (s - mu) / sigma;
      const yNorm = Math.exp(-0.5 * z * z);
      const y = padY + plotH - yNorm * plotH;
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }

    const currentClamped = Math.max(minSum, Math.min(maxSum, diagnostics.soma));
    const markerX = padX + ((currentClamped - minSum) / (maxSum - minSum)) * plotW;
    const markerZ = (currentClamped - mu) / sigma;
    const markerY = padY + plotH - Math.exp(-0.5 * markerZ * markerZ) * plotH;

    const goldLeftX =
      padX + ((Math.max(minSum, mu - sigma) - minSum) / (maxSum - minSum)) * plotW;
    const goldRightX =
      padX + ((Math.min(maxSum, mu + sigma) - minSum) / (maxSum - minSum)) * plotW;

    return {
      polyline: pts.join(' '),
      markerX,
      markerY,
      goldLeftX,
      goldRightX,
      baseY: padY + plotH,
      muX: padX + ((mu - minSum) / (maxSum - minSum)) * plotW,
    };
  }, [diagnostics]);

  const kSize = Math.max(6, Math.min(20, ticketDezenas.length));
  const probSena = calculateHypergeometricProbability(kSize, 6);
  const probQuina = calculateHypergeometricProbability(kSize, 5);
  const probQuadra = calculateHypergeometricProbability(kSize, 4);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left 6 Columns: Interactive Ticket Selector & Bell Curve */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl sm:rounded-xl p-4 sm:p-6 space-y-5 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Auditor Gaussiano e Hipergeométrico de Volante
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Teste qualquer combinação de 6 a 15 dezenas contra a Curva Normal de 50.063.860 resultados.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAutoOptimize}
              className="w-full sm:w-auto min-h-[42px] px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl sm:rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Wand2 className="w-3.5 h-3.5" /> Calibrar Jogo Ideal Semanal
            </button>
          </div>

          {/* Preset Test Games */}
          <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() =>
                onChangeTicketDezenas(
                  rankedStats
                    .slice(0, 6)
                    .map((s) => s.dezena)
                    .sort((a, b) => a - b)
                )
              }
              className="min-h-[38px] sm:min-h-0 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg sm:rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              Carregar Top 6 da Semana
            </button>
            <button
              type="button"
              onClick={() => onChangeTicketDezenas([5, 10, 23, 34, 42, 53])}
              className="min-h-[38px] sm:min-h-0 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg sm:rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              Clássico Campeão Histórico
            </button>
            <button
              type="button"
              onClick={() => onChangeTicketDezenas([1, 2, 3, 4, 5, 6])}
              className="min-h-[38px] sm:min-h-0 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-medium rounded-lg sm:rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              Exemplo de Jogo Extremo (01 a 06)
            </button>
          </div>

          {/* Active Ticket Numbers Bar */}
          <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            <div className="flex items-center gap-2 flex-wrap font-mono tabular-nums">
              {ticketDezenas.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleNumberInTicket(d)}
                  title="Toque para remover dezena"
                  className="w-10 h-10 rounded-lg bg-slate-900 text-white font-bold text-sm flex items-center justify-center hover:bg-rose-700 transition-colors"
                >
                  {String(d).padStart(2, '0')}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                onSaveTicket(ticketDezenas, 'Jogo Auditado');
                setSavedNotice('Jogo salvo no Caderno de Volantes!');
                setTimeout(() => setSavedNotice(null), 3500);
              }}
              disabled={ticketDezenas.length < 6}
              className="w-full sm:w-auto min-h-[42px] px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <BookmarkPlus className="w-3.5 h-3.5" /> Salvar no Caderno
            </button>
          </div>

          {savedNotice && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-900">
              {savedNotice}
            </div>
          )}

          {/* SVG Gaussian Bell Curve Visualization */}
          <div className="border border-slate-200 rounded-xl p-3.5 sm:p-4 bg-slate-50/50 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
              <span className="font-semibold text-slate-800">
                Posição na Curva Normal de Gauss (Soma = {diagnostics.soma})
              </span>
              <span className="font-mono text-slate-500 tabular-nums">
                Média μ = {diagnostics.mediaSomaTeorica} · σ = ±{diagnostics.desvioPadraoSoma}
              </span>
            </div>

            <svg
              viewBox="0 0 600 175"
              className="w-full h-36 sm:h-40 overflow-visible"
              role="img"
              aria-label={`Gráfico da Curva de Gauss mostrando soma atual ${diagnostics.soma} em relação à média ${diagnostics.mediaSomaTeorica}`}
            >
              <rect
                x={bellCurvePoints.goldLeftX}
                y={20}
                width={bellCurvePoints.goldRightX - bellCurvePoints.goldLeftX}
                height={bellCurvePoints.baseY - 20}
                className="fill-emerald-500/12"
              />
              <line
                x1={bellCurvePoints.muX}
                y1={16}
                x2={bellCurvePoints.muX}
                y2={bellCurvePoints.baseY}
                stroke="#94a3b8"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <line
                x1={24}
                y1={bellCurvePoints.baseY}
                x2={576}
                y2={bellCurvePoints.baseY}
                stroke="#cbd5e1"
                strokeWidth="1.5"
              />
              <polyline
                fill="none"
                stroke="#047857"
                strokeWidth="2.5"
                points={bellCurvePoints.polyline}
              />
              <line
                x1={bellCurvePoints.markerX}
                y1={15}
                x2={bellCurvePoints.markerX}
                y2={bellCurvePoints.baseY}
                stroke="#0f172a"
                strokeWidth="1.5"
              />
              <circle
                cx={bellCurvePoints.markerX}
                cy={bellCurvePoints.markerY}
                r="5.5"
                className="fill-emerald-600 stroke-white stroke-2"
              />
              <text
                x={24}
                y={166}
                className="fill-slate-400 text-[10px] font-mono"
              >
                Mín (21)
              </text>
              <text
                x={bellCurvePoints.goldLeftX}
                y={166}
                textAnchor="middle"
                className="fill-emerald-700 text-[10px] font-mono font-semibold"
              >
                140 (-1σ)
              </text>
              <text
                x={bellCurvePoints.muX}
                y={166}
                textAnchor="middle"
                className="fill-slate-700 text-[10px] font-mono font-bold"
              >
                μ = 183
              </text>
              <text
                x={bellCurvePoints.goldRightX}
                y={166}
                textAnchor="middle"
                className="fill-emerald-700 text-[10px] font-mono font-semibold"
              >
                225 (+1σ)
              </text>
              <text
                x={576}
                y={166}
                textAnchor="end"
                className="fill-slate-400 text-[10px] font-mono"
              >
                Máx (345)
              </text>
            </svg>
          </div>

          {/* 60-number selector (6 columns on mobile with >=42px touch targets, 10 columns on sm+) */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-700">
              Toque nas dezenas abaixo para editar o jogo em análise ({ticketDezenas.length} selecionadas):
            </div>
            <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5 font-mono tabular-nums">
              {stats.map((s) => {
                const active = ticketDezenas.includes(s.dezena);
                return (
                  <button
                    key={s.dezena}
                    type="button"
                    onClick={() => toggleNumberInTicket(s.dezena)}
                    className={`min-h-[42px] sm:min-h-[34px] py-1.5 text-xs font-semibold rounded-lg sm:rounded-md border transition-colors ${
                      active
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {String(s.dezena).padStart(2, '0')}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 6 Columns: 7-Dimension Structural Report + Hypergeometric Table + Backtest */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-xl p-4 sm:p-6 space-y-5">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <div className="text-xs font-medium text-slate-500">
                  Laudo Combinatório de 7 Dimensões
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                  Qualidade Estrutural:{' '}
                  <span className="font-mono text-emerald-700 tabular-nums">
                    {diagnostics.scoreQualidadeCombinatoria}%
                  </span>
                </h3>
              </div>
              <div className="text-right font-mono tabular-nums">
                <div className="text-xs font-sans text-slate-500">Score Semanal</div>
                <div className="text-base sm:text-lg font-bold text-slate-900">
                  {diagnostics.scoreProbabilidadeSemanal} pts
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 font-mono tabular-nums">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="text-xs font-sans text-slate-500">1. Soma & Gauss</div>
                <div className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                  {diagnostics.soma}{' '}
                  <span className="text-xs font-normal text-emerald-700">
                    ({diagnostics.percentilGaussiano}%)
                  </span>
                </div>
                <div className="text-[11px] font-sans text-slate-500 mt-0.5">
                  {diagnostics.faixaSomaStatus}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="text-xs font-sans text-slate-500">2. Paridade (Par/Ímp)</div>
                <div className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                  {diagnostics.pares}P / {diagnostics.impares}I
                </div>
                <div className="text-[11px] font-sans text-slate-500 mt-0.5">
                  Ocorre em {diagnostics.probabilidadeParidadeHistorica}% dos sorteios
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="text-xs font-sans text-slate-500">3. Quadrantes Ativos</div>
                <div className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                  {diagnostics.quadrantesAtivos} de 4
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Q1:{diagnostics.distribuicaoQuadrantes[0]} · Q2:
                  {diagnostics.distribuicaoQuadrantes[1]} · Q3:
                  {diagnostics.distribuicaoQuadrantes[2]} · Q4:
                  {diagnostics.distribuicaoQuadrantes[3]}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="text-xs font-sans text-slate-500">4. Linhas & Colunas</div>
                <div className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                  {diagnostics.linhasAtivas}L × {diagnostics.colunasAtivas}C
                </div>
                <div className="text-[11px] font-sans text-slate-500 mt-0.5">
                  Ideal: &ge;4 linhas e &ge;5 colunas
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="text-xs font-sans text-slate-500">5. Primos & Fibonacci</div>
                <div className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                  {diagnostics.primos} Primos · {diagnostics.fibonacci} Fib
                </div>
                <div className="text-[11px] font-sans text-slate-500 mt-0.5">
                  Média histórica: 1 a 3 primos
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="text-xs font-sans text-slate-500">6. Consecutivos</div>
                <div className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                  Máx {diagnostics.consecutivosMax} seguidos
                </div>
                <div className="text-[11px] font-sans text-slate-500 mt-0.5">
                  {diagnostics.paresConsecutivos} duques vizinhos
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="text-xs font-semibold text-slate-700">
                Diagnóstico do Motor Combinatório:
              </div>
              {diagnostics.recomendacoes.map((rec, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200"
                >
                  {diagnostics.scoreQualidadeCombinatoria >= 85 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-xl p-4 sm:p-6 space-y-4">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 border-b border-slate-200 pb-3">
              Probabilidade Hipergeométrica Exata ({kSize} Dezenas) & Backtest
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 font-mono tabular-nums">
              <div className="p-2.5 sm:p-0 bg-slate-50 sm:bg-transparent rounded-lg">
                <div className="text-xs font-sans text-slate-500">Chance de Sena (6)</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  1 em {Math.round(1 / (probSena || 1)).toLocaleString('pt-BR')}
                </div>
              </div>
              <div className="p-2.5 sm:p-0 bg-slate-50 sm:bg-transparent rounded-lg">
                <div className="text-xs font-sans text-slate-500">Chance de Quina (5)</div>
                <div className="text-sm font-bold text-emerald-700 mt-0.5">
                  1 em {Math.round(1 / (probQuina || 1)).toLocaleString('pt-BR')}
                </div>
              </div>
              <div className="p-2.5 sm:p-0 bg-slate-50 sm:bg-transparent rounded-lg">
                <div className="text-xs font-sans text-slate-500">Chance de Quadra (4)</div>
                <div className="text-sm font-bold text-emerald-700 mt-0.5">
                  1 em {Math.round(1 / (probQuadra || 1)).toLocaleString('pt-BR')}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 text-xs text-slate-600 space-y-2">
              <div className="font-semibold text-slate-800">
                Simulação Retroativa nos Concursos Recentes ({backtest.totalConcursosTestados} sorteios):
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 font-mono tabular-nums">
                <span>Senas: {backtest.acertosSena}</span>
                <span>·</span>
                <span>Quinas: {backtest.acertosQuina}</span>
                <span>·</span>
                <span>Quadras: {backtest.acertosQuadra}</span>
                <span>·</span>
                <span>Ternos: {backtest.acertosTerno}</span>
              </div>
              {backtest.melhorResultadoConcurso && (
                <div className="text-slate-500">
                  Maior convergência recente: Concurso #{backtest.melhorResultadoConcurso.concurso} (
                  {backtest.melhorResultadoConcurso.maxAcertos} dezenas coincidentes).
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

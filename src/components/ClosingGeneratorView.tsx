import React, { useState, useMemo } from 'react';
import {
  DezenaStats,
  generateCombinatorialClosing,
  ClosingResult,
  analyzeCurrentCycle,
  ContestResult,
} from '../math/megasena';
import {
  Calculator,
  BookmarkPlus,
} from 'lucide-react';

interface ClosingGeneratorViewProps {
  stats: DezenaStats[];
  contests: ContestResult[];
  selectedPool: number[];
  onSetPool: (dezenas: number[]) => void;
  onTogglePoolNumber: (dezena: number) => void;
  onSaveTicket: (dezenas: number[], label?: string) => void;
  onSaveMultipleTickets: (games: number[][], prefix?: string) => void;
  onInspectTicketInValidator: (dezenas: number[]) => void;
}

export const ClosingGeneratorView: React.FC<ClosingGeneratorViewProps> = ({
  stats,
  contests,
  selectedPool,
  onSetPool,
  onTogglePoolNumber,
  onSaveTicket,
  onSaveMultipleTickets,
  onInspectTicketInValidator,
}) => {
  const [quantidadeJogos, setQuantidadeJogos] = useState<number>(12);
  const [filtrarSomaGaussiana, setFiltrarSomaGaussiana] = useState<boolean>(true);
  const [filtrarParidadeEquilibrada, setFiltrarParidadeEquilibrada] = useState<boolean>(true);
  const [evitarSequenciasLongas, setEvitarSequenciasLongas] = useState<boolean>(true);
  const [seedCounter, setSeedCounter] = useState<number>(20261116);
  const [simulatedDraw, setSimulatedDraw] = useState<number[] | null>(null);
  const [savedBanner, setSavedBanner] = useState<string | null>(null);

  const rankedStats = useMemo(
    () => [...stats].sort((a, b) => b.scoreSemanal - a.scoreSemanal),
    [stats]
  );

  const cycleInfo = useMemo(() => analyzeCurrentCycle(contests), [contests]);

  const effectivePool = useMemo(() => {
    if (selectedPool.length >= 6) return selectedPool;
    return rankedStats.slice(0, 12).map((s) => s.dezena).sort((a, b) => a - b);
  }, [selectedPool, rankedStats]);

  const closingResult: ClosingResult = useMemo(() => {
    return generateCombinatorialClosing(
      {
        poolDezenas: effectivePool,
        quantidadeJogos,
        filtrarSomaGaussiana,
        filtrarParidadeEquilibrada,
        evitarSequenciasLongas,
        semente: seedCounter,
      },
      stats
    );
  }, [
    effectivePool,
    quantidadeJogos,
    filtrarSomaGaussiana,
    filtrarParidadeEquilibrada,
    evitarSequenciasLongas,
    seedCounter,
    stats,
  ]);

  const handleSimulatePoolDraw = (hitsInPool: 4 | 5 | 6) => {
    const shuffledPool = [...effectivePool].sort(() => Math.random() - 0.5);
    const fromPool = shuffledPool.slice(0, hitsInPool);
    const outsidePool: number[] = [];
    const poolSet = new Set(effectivePool);
    for (let d = 1; d <= 60 && outsidePool.length < 6 - hitsInPool; d++) {
      if (!poolSet.has(d)) outsidePool.push(d);
    }
    const draw = [...fromPool, ...outsidePool].sort((a, b) => a - b);
    setSimulatedDraw(draw);
  };

  const simulationEvaluation = useMemo(() => {
    if (!simulatedDraw) return null;
    const drawSet = new Set(simulatedDraw);
    let ternos = 0;
    let quadras = 0;
    let quinas = 0;
    let senas = 0;

    const hitsPerGame = closingResult.jogos.map((j) => {
      const hits = j.dezenas.filter((d) => drawSet.has(d)).length;
      if (hits === 3) ternos++;
      else if (hits === 4) quadras++;
      else if (hits === 5) quinas++;
      else if (hits === 6) senas++;
      return hits;
    });

    const poolHits = effectivePool.filter((d) => drawSet.has(d)).length;
    return { ternos, quadras, quinas, senas, hitsPerGame, poolHits };
  }, [simulatedDraw, closingResult, effectivePool]);

  const formatBRL = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Combinatorial Economics & Hypergeometric Summary */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-xl p-4 sm:p-5">
          <div className="text-xs font-medium text-slate-500">
            Custo do Fechamento vs Aposta Múltipla
          </div>
          <div className="mt-1.5 sm:mt-2 flex items-baseline gap-2 font-mono tabular-nums">
            <span className="text-xl sm:text-2xl font-bold text-emerald-700">
              {formatBRL(closingResult.custoFechamentoBRL)}
            </span>
            <span className="text-xs text-slate-400 line-through">
              {formatBRL(closingResult.custoApostaMultiplaDiretaBRL)}
            </span>
          </div>
          <div className="mt-1.5 sm:mt-2 text-xs text-slate-500 font-mono tabular-nums">
            Economia real de{' '}
            <span className="font-semibold text-emerald-700">
              {closingResult.economiaPct}%
            </span>{' '}
            · {closingResult.jogos.length} cartelas de 6
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-xl p-4 sm:p-5">
          <div className="text-xs font-medium text-slate-500">
            Cobertura Combinatória do Pool ({closingResult.poolSize} dez.)
          </div>
          <div className="mt-1.5 sm:mt-2 flex items-baseline gap-3 font-mono tabular-nums">
            <div>
              <span className="text-xl sm:text-2xl font-bold text-slate-900">
                {closingResult.coberturaParesPct}%
              </span>
              <span className="text-xs text-slate-500 ml-1">Duques</span>
            </div>
            <span className="text-slate-300">·</span>
            <div>
              <span className="text-lg sm:text-xl font-bold text-slate-800">
                {closingResult.coberturaTernasPct}%
              </span>
              <span className="text-xs text-slate-500 ml-1">Ternos</span>
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 text-xs text-slate-500 font-mono tabular-nums">
            Cobertura de Quadras C({closingResult.poolSize},4):{' '}
            <span className="font-semibold text-slate-800">
              {closingResult.coberturaQuadrasPct}%
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-xl p-4 sm:p-5">
          <div className="text-xs font-medium text-slate-500">
            Probabilidade Condicional de Premiação
          </div>
          <div className="mt-1.5 sm:mt-2 font-mono text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
            {closingResult.probQuadraCondicionalSe4NoPoolPct}%{' '}
            <span className="text-xs font-sans font-normal text-slate-500">
              p/ Quadra (se 4 no Pool)
            </span>
          </div>
          <div className="mt-1.5 sm:mt-2 text-xs text-slate-500 font-mono tabular-nums">
            Quina (se 5 no Pool):{' '}
            <span className="font-semibold text-slate-800">
              {closingResult.probQuinaCondicionalSe5NoPoolPct}%
            </span>{' '}
            · Total C({closingResult.poolSize},6) = {closingResult.totalCombinacoesPool}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-xl p-4 sm:p-5">
          <div className="text-xs font-medium text-slate-500">
            Probabilidade Geral (Chances de Sena)
          </div>
          <div className="mt-1.5 sm:mt-2 font-mono text-lg sm:text-xl font-bold text-slate-900 tabular-nums">
            1 em {closingResult.oddsSenaTotalJogos.toLocaleString('pt-BR')}
          </div>
          <div className="mt-1.5 sm:mt-2 text-xs text-slate-500 font-mono tabular-nums">
            Aposta simples (1 jogo): 1 em 50.063.860 ({closingResult.jogos.length}x mais chances)
          </div>
        </div>
      </section>

      {/* Configuration & Pool Management */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left 5 Columns: Pool Selector & Mathematical Filters */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl sm:rounded-xl p-4 sm:p-6 space-y-5 sm:space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Configuração da Matriz de Fechamento
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Escolha o conjunto de dezenas-base (Pool) e aplique restrições da Curva de Gauss para eliminar combinações estéreis.
            </p>
          </div>

          {/* Preset Strategies for Pool */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">
              Estratégias Prontas de Seleção do Pool
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  onSetPool(
                    rankedStats
                      .slice(0, 10)
                      .map((s) => s.dezena)
                      .sort((a, b) => a - b)
                  )
                }
                className="min-h-[42px] px-3 py-2 text-xs font-medium text-left bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors"
              >
                Top 10 Maior Probabilidade Semanal
              </button>
              <button
                type="button"
                onClick={() =>
                  onSetPool(
                    rankedStats
                      .slice(0, 12)
                      .map((s) => s.dezena)
                      .sort((a, b) => a - b)
                  )
                }
                className="min-h-[42px] px-3 py-2 text-xs font-medium text-left bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors"
              >
                Top 12 Equilíbrio Bayesiano
              </button>
              <button
                type="button"
                onClick={() => {
                  const faltantes = cycleInfo.dezenasFaltantesNoCiclo;
                  const topFreq = [...stats]
                    .sort((a, b) => b.frequenciaTotal - a.frequenciaTotal)
                    .map((s) => s.dezena);
                  const combined = Array.from(new Set([...faltantes, ...topFreq])).slice(0, 12);
                  onSetPool(combined.sort((a, b) => a - b));
                }}
                className="min-h-[42px] px-3 py-2 text-xs font-medium text-left bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors"
              >
                Ciclo Atual + Mais Sorteadas (12 dez.)
              </button>
              <button
                type="button"
                onClick={() =>
                  onSetPool(
                    rankedStats
                      .slice(0, 15)
                      .map((s) => s.dezena)
                      .sort((a, b) => a - b)
                  )
                }
                className="min-h-[42px] px-3 py-2 text-xs font-medium text-left bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors"
              >
                Cobertura Ampla Top 15 Semanal
              </button>
            </div>
          </div>

          {/* Active Pool Display & Mini Grid Toggle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">
                Dezenas no Pool Ativo ({effectivePool.length})
              </span>
              <span className="text-slate-500 font-mono tabular-nums">
                Mín: 6 · Ideal: 9 a 15
              </span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap gap-1.5 font-mono tabular-nums">
              {effectivePool.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onTogglePoolNumber(d)}
                  title="Toque para remover do pool"
                  className="min-h-[38px] px-2.5 py-1.5 text-xs font-bold bg-emerald-700 text-white rounded-lg hover:bg-rose-700 transition-colors"
                >
                  {String(d).padStart(2, '0')} ×
                </button>
              ))}
            </div>
          </div>

          {/* Number of Tickets to Generate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-700">
                Quantidade de Cartelas de 6 Dezenas
              </label>
              <span className="font-mono font-bold text-emerald-700 tabular-nums">
                {quantidadeJogos} jogos ({formatBRL(quantidadeJogos * 5)})
              </span>
            </div>
            <div className="grid grid-cols-6 gap-1.5 font-mono tabular-nums">
              {[6, 10, 12, 15, 20, 30].map((qtd) => (
                <button
                  key={qtd}
                  type="button"
                  onClick={() => setQuantidadeJogos(qtd)}
                  className={`min-h-[42px] py-2 text-xs font-semibold rounded-lg border transition-colors ${
                    quantidadeJogos === qtd
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {qtd}
                </button>
              ))}
            </div>
          </div>

          {/* Mathematical Filters Checkboxes */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="text-xs font-semibold text-slate-700">
              Filtros Combinatórios de Alta Densidade
            </div>

            <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-700 py-1">
              <input
                type="checkbox"
                checked={filtrarSomaGaussiana}
                onChange={(e) => setFiltrarSomaGaussiana(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-emerald-700 rounded-xs shrink-0"
              />
              <div>
                <span className="font-semibold text-slate-900 block">
                  Filtro da Curva de Gauss (Soma entre 135 e 231)
                </span>
                <span className="text-slate-500">
                  Elimina cartelas nas caudas improváveis da distribuição normal (concentra 72,4% dos sorteios reais).
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-700 py-1">
              <input
                type="checkbox"
                checked={filtrarParidadeEquilibrada}
                onChange={(e) => setFiltrarParidadeEquilibrada(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-emerald-700 rounded-xs shrink-0"
              />
              <div>
                <span className="font-semibold text-slate-900 block">
                  Equilíbrio Hipergeométrico Par / Ímpar (2P/4I, 3P/3I, 4P/2I)
                </span>
                <span className="text-slate-500">
                  Descarta jogos com 0, 1, 5 ou 6 pares (foca nos 81,4% de maior ocorrência).
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-700 py-1">
              <input
                type="checkbox"
                checked={evitarSequenciasLongas}
                onChange={(e) => setEvitarSequenciasLongas(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-emerald-700 rounded-xs shrink-0"
              />
              <div>
                <span className="font-semibold text-slate-900 block">
                  Bloquear Ternas Consecutivas (ex: 21-22-23)
                </span>
                <span className="text-slate-500">
                  Maximiza a dispersão espacial nas 6 linhas e 4 quadrantes do volante.
                </span>
              </div>
            </label>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSeedCounter((prev) => prev + 7)}
              className="w-full min-h-[46px] py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl sm:rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
            >
              <Calculator className="w-4 h-4" /> Recalcular Matriz Otimizada
            </button>
          </div>
        </div>

        {/* Right 7 Columns: Generated Games & Live Conditional Guarantee Tester */}
        <div className="lg:col-span-7 space-y-6">
          {/* Interactive Conditional Guarantee Simulator */}
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-xl p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Testador de Garantia Condicional do Fechamento
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Simule o que acontece com suas {closingResult.jogos.length} cartelas caso 4, 5 ou 6 dezenas sorteadas estejam no seu Pool de {closingResult.poolSize} dezenas:
                </p>
              </div>
              <div className="grid grid-cols-3 sm:flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSimulatePoolDraw(4)}
                  className="min-h-[40px] px-2.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  4 no Pool
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulatePoolDraw(5)}
                  className="min-h-[40px] px-2.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  5 no Pool
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulatePoolDraw(6)}
                  className="min-h-[40px] px-2.5 py-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  6 no Pool
                </button>
              </div>
            </div>

            {simulatedDraw && simulationEvaluation && (
              <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono tabular-nums">
                <div>
                  <div className="text-xs font-sans text-slate-500">
                    Sorteio Simulado ({simulationEvaluation.poolHits} dezenas acertadas no Pool):
                  </div>
                  <div className="text-sm sm:text-base font-bold text-slate-900 mt-1">
                    {simulatedDraw.map((d) => String(d).padStart(2, '0')).join(' - ')}
                  </div>
                </div>
                <div className="grid grid-cols-4 sm:flex items-center gap-3 sm:gap-4 text-xs border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-200">
                  <div>
                    <span className="text-slate-500 block font-sans">Senas</span>
                    <span className="text-base sm:text-lg font-bold text-emerald-700">
                      {simulationEvaluation.senas}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-sans">Quinas</span>
                    <span className="text-base sm:text-lg font-bold text-emerald-700">
                      {simulationEvaluation.quinas}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-sans">Quadras</span>
                    <span className="text-base sm:text-lg font-bold text-amber-700">
                      {simulationEvaluation.quadras}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-sans">Ternos</span>
                    <span className="text-base sm:text-lg font-bold text-slate-700">
                      {simulationEvaluation.ternos}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Generated Tickets List */}
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-xl p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Cartelas Desdobradas e Calibradas ({closingResult.jogos.length} Jogos)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cada jogo foi validado por soma gaussiana, paridade e máxima dispersão de ternos.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  onSaveMultipleTickets(
                    closingResult.jogos.map((j) => j.dezenas),
                    `Fechamento ${closingResult.poolSize}D`
                  );
                  setSavedBanner(
                    `${closingResult.jogos.length} jogos salvos no seu Caderno de Volantes!`
                  );
                  setTimeout(() => setSavedBanner(null), 4000);
                }}
                className="w-full sm:w-auto min-h-[42px] px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl sm:rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <BookmarkPlus className="w-3.5 h-3.5" /> Salvar Todos os {closingResult.jogos.length} Jogos
              </button>
            </div>

            {savedBanner && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-900">
                {savedBanner}
              </div>
            )}

            {/* Mobile Card List (<768px) */}
            <div className="md:hidden divide-y divide-slate-100">
              {closingResult.jogos.map((jogo, idx) => {
                const simHits = simulationEvaluation?.hitsPerGame[idx] ?? null;
                const drawSet = new Set(simulatedDraw || []);
                return (
                  <div key={jogo.id} className="py-3.5 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                      <span className="font-bold text-slate-800">
                        {jogo.id} · Score {jogo.diagnostico.scoreProbabilidadeSemanal}
                      </span>
                      <span className="text-slate-500">
                        Soma {jogo.diagnostico.soma} ({jogo.diagnostico.percentilGaussiano}%) ·{' '}
                        {jogo.diagnostico.pares}P/{jogo.diagnostico.impares}I
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-mono tabular-nums">
                        {jogo.dezenas.map((d) => {
                          const hit = drawSet.has(d);
                          return (
                            <span
                              key={d}
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold border ${
                                hit
                                  ? 'bg-emerald-700 text-white border-emerald-800'
                                  : 'bg-slate-100 text-slate-900 border-slate-200'
                              }`}
                            >
                              {String(d).padStart(2, '0')}
                            </span>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => onInspectTicketInValidator(jogo.dezenas)}
                          className="min-h-[38px] px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          Auditar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onSaveTicket(jogo.dezenas, jogo.id);
                            setSavedBanner(`Cartela ${jogo.id} adicionada ao Caderno!`);
                            setTimeout(() => setSavedBanner(null), 3000);
                          }}
                          className="min-h-[38px] px-2.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                        >
                          + Salvar
                        </button>
                      </div>
                    </div>

                    {simHits !== null && simHits >= 3 && (
                      <div className="text-xs font-semibold text-emerald-700">
                        Premiado na simulação: {simHits} acertos
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop Table (>=768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                    <th className="py-2.5 px-2">ID</th>
                    <th className="py-2.5 px-2">6 Dezenas da Cartela</th>
                    <th className="py-2.5 px-2 text-right">Soma (Gauss)</th>
                    <th className="py-2.5 px-2 text-center">Par/Ímp</th>
                    <th className="py-2.5 px-2 text-center">Score Sem.</th>
                    <th className="py-2.5 px-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-mono tabular-nums">
                  {closingResult.jogos.map((jogo, idx) => {
                    const simHits = simulationEvaluation?.hitsPerGame[idx] ?? null;
                    const drawSet = new Set(simulatedDraw || []);
                    return (
                      <tr key={jogo.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-2 text-xs text-slate-400 whitespace-nowrap">
                          {jogo.id}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {jogo.dezenas.map((d) => {
                              const hit = drawSet.has(d);
                              return (
                                <span
                                  key={d}
                                  className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold border ${
                                    hit
                                      ? 'bg-emerald-700 text-white border-emerald-800'
                                      : 'bg-slate-100 text-slate-900 border-slate-200'
                                  }`}
                                >
                                  {String(d).padStart(2, '0')}
                                </span>
                              );
                            })}
                            {simHits !== null && simHits >= 3 && (
                              <span className="ml-1 text-xs font-sans font-semibold text-emerald-700 whitespace-nowrap">
                                ({simHits} acertos)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right whitespace-nowrap">
                          <span className="font-semibold text-slate-900">
                            {jogo.diagnostico.soma}
                          </span>
                          <span className="text-xs text-slate-400 ml-1">
                            ({jogo.diagnostico.percentilGaussiano}%)
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center text-xs text-slate-700 whitespace-nowrap">
                          {jogo.diagnostico.pares}P / {jogo.diagnostico.impares}I
                        </td>
                        <td className="py-3 px-2 text-center font-bold text-emerald-700 whitespace-nowrap">
                          {jogo.diagnostico.scoreProbabilidadeSemanal}
                        </td>
                        <td className="py-3 px-2 text-right font-sans">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => onInspectTicketInValidator(jogo.dezenas)}
                              className="px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0"
                            >
                              Auditar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onSaveTicket(jogo.dezenas, jogo.id);
                                setSavedBanner(`Cartela ${jogo.id} adicionada ao Caderno!`);
                                setTimeout(() => setSavedBanner(null), 3000);
                              }}
                              className="px-2 py-1 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors whitespace-nowrap shrink-0"
                            >
                              + Salvar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  INITIAL_RECENT_CONTESTS,
  ContestResult,
  ModelWeights,
  calculateAllDezenasStats,
  analyzeCurrentCycle,
} from './math/megasena';
import { VolanteMatrixView } from './components/VolanteMatrixView';
import { ClosingGeneratorView } from './components/ClosingGeneratorView';
import { GaussianValidatorView } from './components/GaussianValidatorView';
import { CycleAndHistoryView } from './components/CycleAndHistoryView';
import { SavedTicketsModal, SavedTicketItem } from './components/SavedTicketsModal';
import { ContentDownloadSection } from './components/ContentDownloadSection';
import { Grid, Layers, Activity, RefreshCw } from 'lucide-react';

type ActiveTab = 'matriz' | 'fechamentos' | 'gauss' | 'ciclo';

const STORAGE_KEY_TICKETS = 'megaquant_saved_tickets_v1';
const STORAGE_KEY_CONTESTS = 'megaquant_contests_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('matriz');

  const [contests, setContests] = useState<ContestResult[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CONTESTS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return INITIAL_RECENT_CONTESTS;
  });

  const [weights, setWeights] = useState<ModelWeights>({
    frequencia: 35,
    atrasoZ: 35,
    cicloAtual: 20,
    tendenciaRecente: 10,
  });

  // Pre-seed with the 12 highest-probability numbers for immediate utility
  const [selectedPool, setSelectedPool] = useState<number[]>([
    4, 5, 10, 17, 23, 27, 33, 34, 37, 42, 53, 54,
  ]);

  const [validatorTicket, setValidatorTicket] = useState<number[]>([
    5, 10, 23, 34, 42, 53,
  ]);

  const [savedTickets, setSavedTickets] = useState<SavedTicketItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_TICKETS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [
      {
        id: 'seed-1',
        label: 'Top Semanal Equilibrado',
        dezenas: [5, 10, 23, 34, 42, 53],
        createdAt: '2026-11-16',
      },
      {
        id: 'seed-2',
        label: 'Pressão de Ciclo & Gauss',
        dezenas: [4, 17, 27, 33, 37, 54],
        createdAt: '2026-11-16',
      },
    ];
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TICKETS, JSON.stringify(savedTickets));
    } catch {
      // ignore
    }
  }, [savedTickets]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONTESTS, JSON.stringify(contests));
    } catch {
      // ignore
    }
  }, [contests]);

  useEffect(() => {
    const origin = window.location.origin;
    const canonicalUrl = `${origin}${window.location.pathname}`;
    const ogImageUrl = `${origin}/og-image.jpg`;

    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute('href', canonicalUrl);
    }

    const ogUrlMeta = document.querySelector('meta[property="og:url"]');
    if (ogUrlMeta) {
      ogUrlMeta.setAttribute('content', canonicalUrl);
    }

    const ogImgMeta = document.querySelector('meta[property="og:image"]');
    if (ogImgMeta) {
      ogImgMeta.setAttribute('content', ogImageUrl);
    }

    const twitterImgMeta = document.querySelector('meta[name="twitter:image"]');
    if (twitterImgMeta) {
      twitterImgMeta.setAttribute('content', ogImageUrl);
    }
  }, []);

  const allStats = useMemo(
    () => calculateAllDezenasStats(contests, weights),
    [contests, weights]
  );

  const cycleInfo = useMemo(() => analyzeCurrentCycle(contests), [contests]);

  const latestConcurso = useMemo(
    () =>
      contests.length > 0
        ? Math.max(...contests.map((c) => c.concurso))
        : 2826,
    [contests]
  );

  const handleTogglePoolNumber = (dezena: number) => {
    setSelectedPool((prev) =>
      prev.includes(dezena)
        ? prev.filter((d) => d !== dezena)
        : [...prev, dezena].sort((a, b) => a - b)
    );
  };

  const handleSaveTicket = (dezenas: number[], label = 'Volante Calibrado') => {
    const sorted = [...dezenas].sort((a, b) => a - b);
    const newItem: SavedTicketItem = {
      id: `vol-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      label,
      dezenas: sorted,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setSavedTickets((prev) => [newItem, ...prev]);
  };

  const handleSaveMultipleTickets = (games: number[][], prefix = 'Fechamento') => {
    const newItems: SavedTicketItem[] = games.map((g, i) => ({
      id: `vol-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      label: `${prefix} #${String(i + 1).padStart(2, '0')}`,
      dezenas: [...g].sort((a, b) => a - b),
      createdAt: new Date().toISOString().slice(0, 10),
    }));
    setSavedTickets((prev) => [...newItems, ...prev]);
  };

  const handleInspectTicketInValidator = (dezenas: number[]) => {
    setValidatorTicket([...dezenas].sort((a, b) => a - b));
    setActiveTab('gauss');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddContest = (newContest: ContestResult) => {
    setContests((prev) => {
      const filtered = prev.filter((c) => c.concurso !== newContest.concurso);
      return [...filtered, newContest].sort((a, b) => a.concurso - b.concurso);
    });
  };

  const handleResetContests = () => {
    setContests(INITIAL_RECENT_CONTESTS);
  };

  const handleTabSelect = (tab: ActiveTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 pb-20 md:pb-0">
      {/* Strict 3-Zone Top Bar Contract (non-sticky on mobile to keep sticky budget <8% with bottom bar, sticky on md+) */}
      <header className="relative md:sticky md:top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            handleTabSelect('matriz');
          }}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          MegaQuant
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav
          aria-label="Navegação Principal"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
        >
          <button
            type="button"
            onClick={() => handleTabSelect('matriz')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === 'matriz'
                ? 'border-emerald-700 text-slate-900 font-semibold'
                : 'border-transparent'
            }`}
          >
            Probabilidades
          </button>
          <button
            type="button"
            onClick={() => handleTabSelect('fechamentos')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === 'fechamentos'
                ? 'border-emerald-700 text-slate-900 font-semibold'
                : 'border-transparent'
            }`}
          >
            Fechamentos
          </button>
          <button
            type="button"
            onClick={() => handleTabSelect('gauss')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === 'gauss'
                ? 'border-emerald-700 text-slate-900 font-semibold'
                : 'border-transparent'
            }`}
          >
            Curva de Gauss
          </button>
          <button
            type="button"
            onClick={() => handleTabSelect('ciclo')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === 'ciclo'
                ? 'border-emerald-700 text-slate-900 font-semibold'
                : 'border-transparent'
            }`}
          >
            Ciclo & Sorteios
          </button>
        </nav>

        {/* Zone 3: 1 primary action (min-h-[44px] on mobile for ergonomic tap target) */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="min-h-[42px] px-3.5 sm:px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 font-mono tabular-nums"
          >
            Meus Volantes ({savedTickets.length})
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-3.5 sm:px-6 py-5 sm:py-8 space-y-6 sm:space-y-8">
        {/* Contextual Workspace Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 pb-4 sm:pb-6">
          <div className="space-y-1">
            <div className="text-[11px] sm:text-xs text-slate-500 font-mono tabular-nums">
              Concurso #{latestConcurso} · Ciclo: {cycleInfo.dezenasSorteadasNoCiclo.length}/60 (Faltam{' '}
              {cycleInfo.dezenasFaltantesNoCiclo.length}) · C(60,6) = 50.063.860
            </div>
            <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance leading-tight">
              Engenharia Combinatória e Probabilidade Semanal para Mega-Sena
            </h1>
          </div>

          {/* Segmented Module Switcher on Tablet/Desktop (Mobile uses the thumb-zone Bottom Tab Bar) */}
          <div className="hidden md:flex items-center gap-1 p-1 bg-slate-200/80 rounded-lg self-start lg:self-auto shrink-0">
            <button
              type="button"
              onClick={() => handleTabSelect('matriz')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'matriz'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              01. Matriz 01–60
            </button>
            <button
              type="button"
              onClick={() => handleTabSelect('fechamentos')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'fechamentos'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              02. Fechamentos ({selectedPool.length}D)
            </button>
            <button
              type="button"
              onClick={() => handleTabSelect('gauss')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'gauss'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              03. Curva de Gauss
            </button>
            <button
              type="button"
              onClick={() => handleTabSelect('ciclo')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'ciclo'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              04. Ciclo & Sorteios
            </button>
          </div>
        </div>

        {/* Active View Content */}
        {activeTab === 'matriz' && (
          <div className="space-y-6 sm:space-y-8">
            <ContentDownloadSection />
            <VolanteMatrixView
              stats={allStats}
              contests={contests}
              weights={weights}
              onChangeWeights={setWeights}
              selectedPool={selectedPool}
              onTogglePoolNumber={handleTogglePoolNumber}
              onSetPool={setSelectedPool}
              onNavigateToClosing={() => handleTabSelect('fechamentos')}
            />
          </div>
        )}

        {activeTab === 'fechamentos' && (
          <ClosingGeneratorView
            stats={allStats}
            contests={contests}
            selectedPool={selectedPool}
            onSetPool={setSelectedPool}
            onTogglePoolNumber={handleTogglePoolNumber}
            onSaveTicket={handleSaveTicket}
            onSaveMultipleTickets={handleSaveMultipleTickets}
            onInspectTicketInValidator={handleInspectTicketInValidator}
          />
        )}

        {activeTab === 'gauss' && (
          <GaussianValidatorView
            stats={allStats}
            contests={contests}
            ticketDezenas={validatorTicket}
            onChangeTicketDezenas={setValidatorTicket}
            onSaveTicket={handleSaveTicket}
          />
        )}

        {activeTab === 'ciclo' && (
          <CycleAndHistoryView
            contests={contests}
            stats={allStats}
            selectedPool={selectedPool}
            onSetPool={setSelectedPool}
            onAddContest={handleAddContest}
            onResetContests={handleResetContests}
          />
        )}
      </main>

      {/* Clean Quiet Footer */}
      <footer className="bg-white border-t border-slate-200 px-4 sm:px-6 py-5 mt-8">
        <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 text-center sm:text-left">
          <div>
            MegaQuant — Acesso Completo Liberado · Estatística Hipergeométrica, Renovação de Poisson e Fechamentos Combinatórios.
          </div>
          <div className="font-mono tabular-nums">
            Nota Matemática: Cada sorteio é um evento independente; fechamentos e filtros gaussianos otimizam a cobertura relação custo/combinações.
          </div>
        </div>
      </footer>

      {/* Mobile Fixed Bottom Navigation Bar (56px height = 6.6% of 844px mobile viewport, well within 15% cap) */}
      <nav
        aria-label="Navegação Mobile"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 grid grid-cols-4 items-center h-14 px-1"
      >
        <button
          type="button"
          onClick={() => handleTabSelect('matriz')}
          className={`flex flex-col items-center justify-center min-h-[48px] rounded-lg transition-colors ${
            activeTab === 'matriz'
              ? 'text-emerald-700 font-semibold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Grid className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
            Matriz 01–60
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabSelect('fechamentos')}
          className={`flex flex-col items-center justify-center min-h-[48px] rounded-lg transition-colors ${
            activeTab === 'fechamentos'
              ? 'text-emerald-700 font-semibold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
            Fechamentos ({selectedPool.length})
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabSelect('gauss')}
          className={`flex flex-col items-center justify-center min-h-[48px] rounded-lg transition-colors ${
            activeTab === 'gauss'
              ? 'text-emerald-700 font-semibold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Activity className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
            Curva Gauss
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabSelect('ciclo')}
          className={`flex flex-col items-center justify-center min-h-[48px] rounded-lg transition-colors ${
            activeTab === 'ciclo'
              ? 'text-emerald-700 font-semibold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <RefreshCw className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
            Ciclo ({cycleInfo.dezenasFaltantesNoCiclo.length})
          </span>
        </button>
      </nav>

      {/* Saved Volantes Modal / Bottom Sheet */}
      <SavedTicketsModal
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        savedTickets={savedTickets}
        onRemoveTicket={(id) =>
          setSavedTickets((prev) => prev.filter((item) => item.id !== id))
        }
        onClearAll={() => setSavedTickets([])}
      />
    </div>
  );
}

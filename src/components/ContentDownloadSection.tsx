import React, { useState } from 'react';
import { FileDown, CheckCircle2 } from 'lucide-react';

interface PdfTopicItem {
  numero: string;
  titulo: string;
  subtitulo: string;
  descricao: string;
  arquivoNome: string;
  arquivoUrl: string;
  destaqueTopico: string;
}

const PDF_TOPICS: PdfTopicItem[] = [
  {
    numero: '01',
    titulo: 'A Questão da Probabilidade',
    subtitulo: 'Fundamentos do Espaço Amostral e Curva de Gauss',
    descricao:
      'Por que 72,4% dos sorteios da Mega-Sena concentram-se no centro da distribuição normal (soma entre 135 e 231) e como usar o Z-Score a seu favor.',
    arquivoNome: 'mega-sena-analise.pdf',
    arquivoUrl: '/src/mega-sena-analise.pdf',
    destaqueTopico: 'Análise Probabilística · Curva Normal',
  },
  {
    numero: '02',
    titulo: 'Questão de Jogos',
    subtitulo: 'Estratégias de Fechamento e Desdobramento',
    descricao:
      'Como substituir apostas múltiplas caras por matrizes de fechamento combinatório que preservam a cobertura de quadras e quinas com até 98% de economia.',
    arquivoNome: 'mega-sena-matematica-e-estrategias.pdf',
    arquivoUrl: '/src/mega-sena-matematica-e-estrategias.pdf',
    destaqueTopico: 'Engenharia de Cartelas · Matrizes',
  },
  {
    numero: '03',
    titulo: 'Consciência',
    subtitulo: 'Gestão de Banca e Mentalidade Matemática',
    descricao:
      'Disciplina estratégica, controle de orçamento semanal e compreensão realista da independência estatística entre sorteios consecutivos.',
    arquivoNome: 'mega-sena-analise.pdf',
    arquivoUrl: '/src/mega-sena-analise.pdf',
    destaqueTopico: 'Educação Financeira · Longo Prazo',
  },
  {
    numero: '04',
    titulo: 'Como Jogar',
    subtitulo: 'Passo a Passo Prático no Aplicativo e na Lotérica',
    descricao:
      'Roteiro direto para selecionar o Pool da semana, calibrar a equação de Poisson + Ciclo, auditar seus volantes e montar seus jogos.',
    arquivoNome: 'mega-sena-matematica-e-estrategias.pdf',
    arquivoUrl: '/src/mega-sena-matematica-e-estrategias.pdf',
    destaqueTopico: 'Guia Prático · Passo a Passo',
  },
];

export const ContentDownloadSection: React.FC = () => {
  const [downloadedFile, setDownloadedFile] = useState<string | null>(null);

  const handleDownloadNotification = (label: string) => {
    setDownloadedFile(label);
    setTimeout(() => setDownloadedFile(null), 3500);
  };

  return (
    <section
      aria-label="Download de Conteúdo"
      className="bg-white border border-slate-200 rounded-2xl sm:rounded-xl p-5 sm:p-6 space-y-5"
    >
      {/* Top Header of Download de Conteúdo */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-800 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Acesso Completo Liberado</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-500 font-normal">
              Todos os PDFs e ferramentas matemáticas disponíveis para quem possui o link
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            Download de Conteúdo
          </h2>
          <p className="text-xs text-slate-500">
            Baixe o material oficial em PDF com os 4 pilares fundamentais da metodologia matemática antes de montar seus jogos da semana.
          </p>
        </div>

        {/* Direct Main PDF Files Bar */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
          <a
            href="/src/mega-sena-analise.pdf"
            download="mega-sena-analise.pdf"
            onClick={() => handleDownloadNotification('mega-sena-analise.pdf')}
            className="min-h-[40px] px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <FileDown className="w-3.5 h-3.5" /> Baixar mega-sena-analise.pdf
          </a>
          <a
            href="/src/mega-sena-matematica-e-estrategias.pdf"
            download="mega-sena-matematica-e-estrategias.pdf"
            onClick={() =>
              handleDownloadNotification('mega-sena-matematica-e-estrategias.pdf')
            }
            className="min-h-[40px] px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <FileDown className="w-3.5 h-3.5" /> Baixar mega-sena-matematica-e-estrategias.pdf
          </a>
        </div>
      </div>

      {downloadedFile && (
        <div
          role="status"
          className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-900 flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            Download iniciado: <strong className="font-mono">{downloadedFile}</strong>
          </span>
        </div>
      )}

      {/* 4 Core Topics Grid: A questão da probabilidade | Questão de jogos | Consciência | Como jogar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PDF_TOPICS.map((item) => (
          <div
            key={item.numero}
            className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl flex flex-col justify-between gap-4 hover:bg-slate-50 transition-colors"
          >
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono text-slate-500">
                Módulo {item.numero} · {item.destaqueTopico}
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                {item.titulo}
              </h3>
              <div className="text-xs font-medium text-slate-700">
                {item.subtitulo}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed pt-1">
                {item.descricao}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200/80 space-y-2">
              <div className="text-[11px] font-mono text-slate-500 truncate">
                Documento: {item.arquivoNome}
              </div>
              <a
                href={item.arquivoUrl}
                download={item.arquivoNome}
                onClick={() =>
                  handleDownloadNotification(`${item.titulo} (${item.arquivoNome})`)
                }
                className="w-full min-h-[38px] px-3 py-2 bg-white border border-slate-300 hover:bg-slate-900 hover:text-white hover:border-slate-900 text-slate-800 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <FileDown className="w-3.5 h-3.5 shrink-0" /> Baixar Conteúdo PDF
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

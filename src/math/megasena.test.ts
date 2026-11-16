import test from 'node:test';
import assert from 'node:assert/strict';
import {
  combination,
  calculateHypergeometricProbability,
  calculateAllDezenasStats,
  analyzeTicketMath,
  generateCombinatorialClosing,
  analyzeCurrentCycle,
  backtestGames,
  TOTAL_COMBINACOES_MEGASENA,
} from './megasena';

test('combination C(60, 6) equals exact Mega-Sena universe 50,063,860', () => {
  assert.equal(combination(60, 6), TOTAL_COMBINACOES_MEGASENA);
  assert.equal(combination(10, 6), 210);
  assert.equal(combination(6, 6), 1);
});

test('hypergeometric probabilities sum to 1 across 0..6 hits', () => {
  let totalProb = 0;
  for (let hits = 0; hits <= 6; hits++) {
    totalProb += calculateHypergeometricProbability(6, hits);
  }
  assert.ok(Math.abs(totalProb - 1) < 1e-12);

  // Single 6-number bet Sena probability is 1 / 50,063,860
  const senaProb = calculateHypergeometricProbability(6, 6);
  assert.ok(Math.abs(senaProb - 1 / 50063860) < 1e-15);
});

test('calculateAllDezenasStats returns all 60 numbers with valid scores and cycle tracking', () => {
  const stats = calculateAllDezenasStats();
  assert.equal(stats.length, 60);

  const cycle = analyzeCurrentCycle(undefined as any);
  assert.ok(cycle.dezenasFaltantesNoCiclo.length > 0);

  // Verify dezena 10 is recognized as missing in current open cycle and has high score
  const dez10 = stats.find((s) => s.dezena === 10);
  assert.ok(dez10);
  assert.equal(dez10.faltaNoCicloAtual, true);
  assert.ok(dez10.scoreSemanal > 70);
});

test('analyzeTicketMath accurately evaluates Gaussian sum, parity, and quadrants', () => {
  // Balanced ticket: sum = 5 + 14 + 27 + 34 + 43 + 58 = 181 (very close to mean 183)
  // Parity: 14, 34, 58 (3 even), 5, 27, 43 (3 odd)
  const diag = analyzeTicketMath([5, 14, 27, 34, 43, 58]);
  assert.equal(diag.soma, 181);
  assert.equal(diag.pares, 3);
  assert.equal(diag.impares, 3);
  assert.equal(diag.faixaSomaStatus, 'Ideal (Centro de Gauss)');
  assert.ok(diag.percentilGaussiano > 95);
  assert.ok(diag.scoreQualidadeCombinatoria >= 90);

  // Extreme bad ticket: [1, 2, 3, 4, 5, 6] -> sum = 21, 6 consecutive, 1 quadrant
  const badDiag = analyzeTicketMath([1, 2, 3, 4, 5, 6]);
  assert.equal(badDiag.soma, 21);
  assert.equal(badDiag.consecutivosMax, 6);
  assert.equal(badDiag.faixaSomaStatus, 'Extremo Improvável (>1.5σ)');
  assert.ok(badDiag.scoreQualidadeCombinatoria < 50);
});

test('generateCombinatorialClosing creates valid filtered 6-number games and calculates savings', () => {
  const pool = [4, 5, 10, 17, 23, 27, 33, 34, 37, 42, 53, 54]; // 12 numbers -> C(12,6) = 924
  const closing = generateCombinatorialClosing({
    poolDezenas: pool,
    quantidadeJogos: 15,
    filtrarSomaGaussiana: true,
    filtrarParidadeEquilibrada: true,
    evitarSequenciasLongas: true,
  });

  assert.equal(closing.jogos.length, 15);
  assert.equal(closing.totalCombinacoesPool, 924);
  assert.equal(closing.custoFechamentoBRL, 75);
  assert.equal(closing.custoApostaMultiplaDiretaBRL, 924 * 5);
  assert.ok(closing.economiaPct > 95);
  assert.ok(closing.coberturaParesPct > 80);

  for (const j of closing.jogos) {
    assert.equal(j.dezenas.length, 6);
    assert.ok(j.diagnostico.soma >= 135 && j.diagnostico.soma <= 231);
    assert.ok(j.diagnostico.pares >= 2 && j.diagnostico.pares <= 4);
  }
});

test('backtestGames evaluates games against contest history accurately', () => {
  const sampleGames = [
    [5, 13, 23, 32, 43, 59], // Matches contest 2826 (6 hits)
    [4, 11, 23, 33, 40, 50], // Matches 4 numbers in contest 2801
  ];
  const result = backtestGames(sampleGames);
  assert.ok(result.acertosSena >= 1);
  assert.ok(result.acertosQuadra >= 1);
  assert.equal(result.melhorResultadoConcurso?.maxAcertos, 6);
});

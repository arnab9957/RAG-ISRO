/**
 * Standalone Test Script to verify Graph-Guided Late-Interaction Reranker (G-ColBERT)
 * Run with: npx tsx scripts/test_graph_colbert.ts
 */

import { computeGraphGuidedMaxSim, rerankWithGraphColbert, computeGraphEntityCentralities } from '../src/lib/graphColbertEngine';

console.log(`\n==================================================================`);
console.log(`🕸️ TESTING GRAPH-GUIDED LATE-INTERACTION RERANKER (G-ColBERT)`);
console.log(`==================================================================\n`);

const centralities = computeGraphEntityCentralities();
console.log(`Loaded Graph Node Degree Centralities (Top Hub Entities):`, 
  Object.entries(centralities).slice(0, 8).map(([k, v]) => `${k}: ${v}`).join(', ')
);

// --- Test Case 1: Aerospace Technical Reranking ---
console.log(`\n--- TEST CASE 1: Aerospace Cryogenic Engine Reranking ---`);
const query1 = "Cryogenic Engine CE-20 vacuum thrust specification";

const candidateDocs1 = [
  {
    id: "DOC_CHUNK_001",
    content: "The CE-20 is a cryogenic rocket engine delivering a nominal vacuum thrust of 180 kN and specific impulse of 443 seconds."
  },
  {
    id: "DOC_CHUNK_002",
    content: "General telemetry and ground communications manual for satellite tracking stations."
  },
  {
    id: "DOC_CHUNK_003",
    content: "Cryogenic stage propellant tank insulation specifications under thermal vacuum stress."
  }
];

const reranked1 = rerankWithGraphColbert(query1, candidateDocs1);
console.log(`Query: "${query1}"`);
console.log(`Reranked Results:`);
reranked1.forEach((res, i) => {
  console.log(`  [Rank ${i + 1}] ${res.docId}: Standard MaxSim = ${res.standardMaxSimScore} | G-ColBERT MaxSim = ${res.graphGuidedMaxSimScore} (+${res.graphCentralityBoost} boost)`);
  console.log(`            Hub Entities: [${res.hubEntities.join(', ')}]`);
});

if (reranked1[0].docId === 'DOC_CHUNK_001' && reranked1[0].graphGuidedMaxSimScore > reranked1[0].standardMaxSimScore) {
  console.log(`✅ TEST CASE 1 PASSED: G-ColBERT correctly identified top candidate chunk and applied graph topology boost!\n`);
} else {
  console.error(`❌ TEST CASE 1 FAILED!\n`);
}

// --- Test Case 2: Government Procurement GFR Reranking ---
console.log(`------------------------------------------------------------------`);
console.log(`--- TEST CASE 2: Government Procurement GFR Reranking ---`);
const query2 = "GFR Rule 149 GeM portal procurement limits";

const candidateDocs2 = [
  {
    id: "GFR_CHUNK_101",
    content: "According to GFR Rule 149, direct purchase on GeM portal is permitted up to Rs. 50,000 without mandatory comparison."
  },
  {
    id: "GFR_CHUNK_102",
    content: "Administrative procedures for internal office file management and record keeping."
  }
];

const reranked2 = rerankWithGraphColbert(query2, candidateDocs2);
console.log(`Query: "${query2}"`);
console.log(`Reranked Results:`);
reranked2.forEach((res, i) => {
  console.log(`  [Rank ${i + 1}] ${res.docId}: Standard MaxSim = ${res.standardMaxSimScore} | G-ColBERT MaxSim = ${res.graphGuidedMaxSimScore} (+${res.graphCentralityBoost} boost)`);
  console.log(`            Hub Entities: [${res.hubEntities.join(', ')}]`);
});

if (reranked2[0].docId === 'GFR_CHUNK_101' && reranked2[0].graphGuidedMaxSimScore > reranked2[0].standardMaxSimScore) {
  console.log(`✅ TEST CASE 2 PASSED: G-ColBERT correctly boosted GFR procurement hub entities!\n`);
} else {
  console.error(`❌ TEST CASE 2 FAILED!\n`);
}

console.log(`==================================================================`);
console.log(`🎉 ALL GRAPH-GUIDED LATE-INTERACTION RERANKER TESTS COMPLETED!`);
console.log(`==================================================================\n`);

/**
 * Standalone Test Script to verify Adaptive Entropy-Driven Self-Correction (Self-RAG)
 * Run with: npx tsx scripts/test_entropy_self_rag.ts
 */

import { calculateTokenEntropy, evaluateSelfRagDecision, executeAdaptiveSelfRag } from '../src/lib/entropySelfRagEngine';

console.log(`\n====================================================================`);
console.log(`🧠 TESTING ADAPTIVE ENTROPY-DRIVEN SELF-CORRECTION (Self-RAG)`);
console.log(`====================================================================\n`);

// --- Test Case 1: Low Entropy (High Certainty) ---
console.log(`--- TEST CASE 1: Low Entropy Scenario (H < 0.35) ---`);
const query1 = "CE-20 cryogenic engine nominal vacuum thrust";
const answer1 = "The CE-20 cryogenic engine delivers a nominal vacuum thrust of 180 kN.";
const result1 = executeAdaptiveSelfRag(query1, answer1, 3);

console.log(`Evaluation Output:`, result1.evaluation);
console.log(`Reflection Trace:`);
result1.reflectionTrace.forEach(t => console.log(`  ${t}`));

if (result1.evaluation.policy === 'DIRECT_GENERATE' && result1.evaluation.entropy < 0.35) {
  console.log(`✅ TEST CASE 1 PASSED: Direct Generation policy assigned for low entropy!\n`);
} else {
  console.error(`❌ TEST CASE 1 FAILED!\n`);
}

// --- Test Case 2: Medium Entropy (Active Re-Retrieval) ---
console.log(`--------------------------------------------------------------------`);
console.log(`--- TEST CASE 2: Medium Entropy Scenario (0.35 <= H <= 0.70) ---`);
const query2 = "What are the exact telemetry frequencies and GFR procurement thresholds for ISRO satellites?";
const answer2 = "The telemetry parameters specify general guidelines for procurement thresholds.";
const result2 = executeAdaptiveSelfRag(query2, answer2, 1);

console.log(`Evaluation Output:`, result2.evaluation);
console.log(`Reflection Trace:`);
result2.reflectionTrace.forEach(t => console.log(`  ${t}`));

if (result2.evaluation.policy === 'ACTIVE_RE_RETRIEVAL' && result2.evaluation.reflectionToken === '[Retrieve]') {
  console.log(`✅ TEST CASE 2 PASSED: Active Re-Retrieval triggered with [Retrieve] reflection token!\n`);
} else {
  console.error(`❌ TEST CASE 2 FAILED!\n`);
}

// --- Test Case 3: High Entropy (Self-Correction & Refusal) ---
console.log(`--------------------------------------------------------------------`);
console.log(`--- TEST CASE 3: High Entropy Scenario (H > 0.70) ---`);
const query3 = "What is the secret launch trajectory code for mission X?";
const answer3 = "Uncertain trajectory output.";
const result3 = executeAdaptiveSelfRag(query3, answer3, 0);

console.log(`Evaluation Output:`, result3.evaluation);
console.log(`Reflection Trace:`);
result3.reflectionTrace.forEach(t => console.log(`  ${t}`));

if (result3.evaluation.policy === 'SELF_CORRECTION_FALLBACK' && result3.evaluation.reflectionToken === '[IsSupported]') {
  console.log(`✅ TEST CASE 3 PASSED: High entropy self-correction fallback triggered!\n`);
} else {
  console.error(`❌ TEST CASE 3 FAILED!\n`);
}

console.log(`====================================================================`);
console.log(`🎉 ALL ADAPTIVE ENTROPY-DRIVEN SELF-RAG ENGINE TESTS COMPLETED!`);
console.log(`====================================================================\n`);

/**
 * Standalone Test Script to verify Real Z3 SMT WASM Constraint Verification
 * Run with: npx tsx scripts/test_z3_smt.ts
 */

import { extractSMTConstraints, solveSMTConstraints } from '../src/lib/z3SolverEngine';

console.log(`\n======================================================`);
console.log(`🚀 TESTING REAL Z3 SMT WASM CONSTRAINTS SOLVER ENGINE`);
console.log(`======================================================\n`);

// --- Test Case 1: Satisfiable Aerospace Specification ---
console.log(`--- TEST CASE 1: Valid Aerospace Technical Parameters ---`);
const doc1 = `The CE-20 cryogenic engine operates with a nominal vacuum thrust of 186.18 kN and a specific impulse of 443 seconds.`;
const answer1 = `The CE-20 engine delivers a vacuum thrust of 186.18 kN and a specific impulse of 443.0 seconds.`;

const constraints1 = extractSMTConstraints(doc1);
console.log(`Extracted Constraints from Doc:`, constraints1);

const result1 = solveSMTConstraints(answer1, constraints1);
console.log(`\nSolver Output:`, {
  isSatisfiable: result1.isSatisfiable,
  smtStatus: result1.smtStatus,
  evaluatedCount: result1.constraintsEvaluated.length,
  satisfiedCount: result1.satisfiedCount,
  violatedCount: result1.violatedCount,
  latencyMs: `${result1.latencyMs}ms`,
  conflicts: result1.conflicts
});
console.log(`SMT-LIB2 Trace:\n${result1.proofTrace}`);

if (result1.isSatisfiable && result1.smtStatus === 'SAT') {
  console.log(`✅ TEST CASE 1 PASSED: Correctly evaluated as SAT!\n`);
} else {
  console.error(`❌ TEST CASE 1 FAILED!\n`);
}

// --- Test Case 2: Unsatisfiable (Conflicting / Hallucinated Parameter) ---
console.log(`------------------------------------------------------`);
console.log(`--- TEST CASE 2: Conflicting / Hallucinated Parameter ---`);
const doc2 = `The CE-20 cryogenic engine operates with a minimum vacuum thrust of 180.0 kN.`;
const answer2 = `The CE-20 engine operates at a low thrust of 120.0 kN.`;

const constraints2 = extractSMTConstraints(doc2);
console.log(`Extracted Constraints from Doc:`, constraints2);

const result2 = solveSMTConstraints(answer2, constraints2);
console.log(`\nSolver Output:`, {
  isSatisfiable: result2.isSatisfiable,
  smtStatus: result2.smtStatus,
  evaluatedCount: result2.constraintsEvaluated.length,
  satisfiedCount: result2.satisfiedCount,
  violatedCount: result2.violatedCount,
  latencyMs: `${result2.latencyMs}ms`,
  conflicts: result2.conflicts
});
console.log(`SMT-LIB2 Trace:\n${result2.proofTrace}`);

if (!result2.isSatisfiable && result2.smtStatus === 'UNSAT' && result2.conflicts.length > 0) {
  console.log(`✅ TEST CASE 2 PASSED: Correctly caught numerical conflict and marked UNSAT!\n`);
} else {
  console.error(`❌ TEST CASE 2 FAILED!\n`);
}

// --- Test Case 3: GFR Procurement Rule Threshold ---
console.log(`------------------------------------------------------`);
console.log(`--- TEST CASE 3: Government Procurement GFR Threshold ---`);
const doc3 = `General Financial Rules (GFR 2017) require Advertised Tender Enquiry for procurements with value above Rs 5,00,000.`;
const answer3 = `Procurement value is Rs 750,000 requiring Advertised Tender Enquiry.`;

const constraints3 = extractSMTConstraints(doc3);
console.log(`Extracted Constraints from Doc:`, constraints3);

const result3 = solveSMTConstraints(answer3, constraints3);
console.log(`\nSolver Output:`, {
  isSatisfiable: result3.isSatisfiable,
  smtStatus: result3.smtStatus,
  evaluatedCount: result3.constraintsEvaluated.length,
  satisfiedCount: result3.satisfiedCount,
  violatedCount: result3.violatedCount,
  latencyMs: `${result3.latencyMs}ms`,
  conflicts: result3.conflicts
});

if (result3.isSatisfiable && result3.smtStatus === 'SAT') {
  console.log(`✅ TEST CASE 3 PASSED: Procurement GFR threshold correctly verified!\n`);
} else {
  console.error(`❌ TEST CASE 3 FAILED!\n`);
}

console.log(`======================================================`);
console.log(`🎉 ALL Z3 WASM SMT SOLVER VERIFICATION TESTS COMPLETED!`);
console.log(`======================================================\n`);

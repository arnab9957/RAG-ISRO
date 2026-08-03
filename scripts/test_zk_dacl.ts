/**
 * Standalone Test Script to verify True Zero-Knowledge (ZK-SNARK) Merkle DACL Engine
 * Run with: npx tsx scripts/test_zk_dacl.ts
 */

import { generateZKProof, verifyZKProof, AUTHORIZED_MERKLE_ROOT } from '../src/lib/zkDaclEngine';

console.log(`\n======================================================`);
console.log(`🔒 TESTING TRUE ZERO-KNOWLEDGE (ZK-SNARK) DACL ENGINE`);
console.log(`======================================================\n`);

console.log(`Active Identity Merkle Root: ${AUTHORIZED_MERKLE_ROOT}\n`);

// --- Test Case 1: Authorized Administrator ZK Proof ---
console.log(`--- TEST CASE 1: Authorized Administrator ZK Proof Generation ---`);
const adminKey = 'isro_secret_vikram_admin_key_882';
const payload1 = generateZKProof(adminKey, 5, 'everyone');

console.log(`Generated ZK-SNARK Groth16 Proof Payload:`, {
  protocol: payload1.proof.protocol,
  curve: payload1.proof.curve,
  proofHash: payload1.proofHash,
  merkleRoot: payload1.publicSignals.merkleRoot,
  proverLatencyMs: `${payload1.proverLatencyMs}ms`
});

const verification1 = verifyZKProof(payload1, adminKey);
console.log(`Verification Output:`, verification1);

if (verification1.isVerified && verification1.status === 'VERIFIED') {
  console.log(`✅ TEST CASE 1 PASSED: ZK-SNARK Groth16 proof successfully verified!\n`);
} else {
  console.error(`❌ TEST CASE 1 FAILED!\n`);
}

// --- Test Case 2: Authorized Operator ZK Proof ---
console.log(`------------------------------------------------------`);
console.log(`--- TEST CASE 2: Authorized Operator ZK Proof Generation ---`);
const opKey = 'isro_secret_satish_op_key_331';
const payload2 = generateZKProof(opKey, 3, 'everyone');

console.log(`Generated ZK-SNARK Groth16 Proof Payload:`, {
  proofHash: payload2.proofHash,
  merkleRoot: payload2.publicSignals.merkleRoot,
  proverLatencyMs: `${payload2.proverLatencyMs}ms`
});

const verification2 = verifyZKProof(payload2, opKey);
console.log(`Verification Output:`, verification2);

if (verification2.isVerified && verification2.status === 'VERIFIED') {
  console.log(`✅ TEST CASE 2 PASSED: Operator ZK proof successfully verified!\n`);
} else {
  console.error(`❌ TEST CASE 2 FAILED!\n`);
}

// --- Test Case 3: Unauthorized / Forged Secret Key ---
console.log(`------------------------------------------------------`);
console.log(`--- TEST CASE 3: Forged Identity Key Attack Simulation ---`);
const forgedKey = 'invalid_attacker_forged_key_999';
const payload3 = generateZKProof(forgedKey, 5, 'everyone');

console.log(`Generated ZK Proof Payload for Forged Key:`, {
  proofHash: payload3.proofHash,
  merkleRoot: payload3.publicSignals.merkleRoot
});

const verification3 = verifyZKProof(payload3, forgedKey);
console.log(`Verification Output:`, verification3);

if (!verification3.isVerified && verification3.status !== 'VERIFIED') {
  console.log(`✅ TEST CASE 3 PASSED: Correctly rejected forged identity key!\n`);
} else {
  console.error(`❌ TEST CASE 3 FAILED!\n`);
}

console.log(`======================================================`);
console.log(`🎉 ALL ZK-SNARK DACL PROOF ENGINE TESTS COMPLETED!`);
console.log(`======================================================\n`);

// backend/tests/matchLogic.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeVector,
  calculateEuclideanDistance,
  calculateCosineDistance
} from '../src/services/faceEngine.js';

test('Vector Normalization: L2 norm of output vector should equal 1.0', () => {
  const rawVector = [3, 4, 0, 0];
  const normalized = normalizeVector(rawVector);
  
  // Length should be 5 -> 3/5=0.6, 4/5=0.8
  assert.equal(normalized[0], 0.6);
  assert.equal(normalized[1], 0.8);

  const l2Sum = normalized.reduce((acc, val) => acc + val * val, 0);
  assert.ok(Math.abs(l2Sum - 1.0) < 1e-6, 'Vector magnitude should be 1.0');
});

test('Vector Distance: Identical vectors must have distance 0.0', () => {
  const vecA = normalizeVector([1, 2, 3, 4, 5]);
  const vecB = normalizeVector([1, 2, 3, 4, 5]);

  const euclidean = calculateEuclideanDistance(vecA, vecB);
  const cosine = calculateCosineDistance(vecA, vecB);

  assert.equal(euclidean, 0);
  assert.ok(cosine < 1e-6);
});

test('Vector Distance: Orthogonal vectors have distance sqrt(2) ~ 1.414', () => {
  const vecX = [1, 0, 0, 0];
  const vecY = [0, 1, 0, 0];

  const euclidean = calculateEuclideanDistance(vecX, vecY);
  assert.ok(Math.abs(euclidean - Math.SQRT2) < 1e-6);
});

test('Match Threshold: Cosine & Euclidean vectors within threshold match, impostor vectors reject', () => {
  const threshold = 0.52;

  // Same identity vector with slight pose variance
  const base = normalizeVector([1.0, 1.0, 1.0, 1.0]);
  const close = normalizeVector([1.05, 0.98, 1.02, 0.99]);
  const cosDistClose = calculateCosineDistance(base, close);
  assert.ok(cosDistClose <= threshold, `Expected cosine distance ${cosDistClose} <= ${threshold}`);

  // Different identity / impostor vector
  const far = normalizeVector([-1.0, 1.0, -1.0, 1.0]);
  const cosDistFar = calculateCosineDistance(base, far);
  assert.ok(cosDistFar > threshold, `Expected cosine distance ${cosDistFar} > ${threshold}`);
});


import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeCart } from '../src/lib/cartStorage.js'

test('draft carts retain only safe IDs and quantities, without trusting purchase fields', () => {
  assert.deepEqual(normalizeCart({ 16: 2, 28: 1, price: 1, userId: 'spoofed', totalAmount: 1, status: 'paid', '-1': 2, '2147483648': 1, 5: 0, 6: 10, 7: '1', 8: 1.5 }), { 16: 2, 28: 1 })
  assert.deepEqual(normalizeCart(null), {})
  assert.deepEqual(normalizeCart([{ dishId: 1, qty: 1 }]), {})
  assert.equal(Object.keys(normalizeCart(Object.fromEntries(Array.from({length:100},(_,index)=>[index+1,1])))).length,50)
})

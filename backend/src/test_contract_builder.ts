import { usIndicesBuilder } from './utils/cbs/us_indices_cb.js';

console.log('Testing US Indices Contract Builder\n');
console.log('Today:', new Date().toISOString().split('T')[0]);
console.log('\n=== Second Bars (A) ===');

const secondRequest = usIndicesBuilder.buildQuarterlyRequest('A', 1);
console.log('Event Type:', secondRequest.ev);
console.log('Total Symbols:', secondRequest.symbols.length);
console.log('Symbols:', secondRequest.symbols.join(', '));

// console.log('\n=== Minute Bars (AM) ===');
// const minuteRequest = usIndicesBuilder.buildQuarterlyRequest('AM', 1);
// console.log('Event Type:', minuteRequest.ev);
// console.log('Total Symbols:', minuteRequest.symbols.length);

console.log('\n=== Sample Contracts ===');
const sample = secondRequest.symbols.filter(s => s.startsWith('ES'));
console.log('ES contracts:', sample.join(', '));


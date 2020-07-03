/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Tests for PriorityQueue.
 * @author cpcallen@google.com (Christopher Allen)
 */
'use strict';

const util = require('util');

const PriorityQueue = require('../priorityqueue').PriorityQueue;
const {T} = require('./testing');

// Unpack test-only functions.
const {parent, children} = require('../priorityqueue').testOnly;

/**
 * Test the inernal parent() function.
 * @param {!T} t The test runner object.
 */
exports.testParent = function(t) {
  const cases = [
    [0, -1],
    [1, 0],
    [2, 0],
    [3, 1],
    [4, 1],
    [5, 2],
    [6, 2],
  ];
  for (const [i, expected] of cases) {
    t.expect(util.format('parent(%d)', i), parent(i), expected);
  };
};

/**
 * Test the internal children() function.
 * @param {!T} t The test runner object.
 */
exports.testChildren = function(t) {
  const cases = [
    [0, [1, 2]],
    [1, [3, 4]],
    [2, [5, 6]],
  ];
  for (const [i, [left, right]] of cases) {
    const result = children(i);
    t.expect(util.format('parent(%d)[0]', i), result[0], left);
    t.expect(util.format('parent(%d)[0]', i), result[1], right);
  };
};

/**
 * Check pq.heap_ and pq.indices_ obey their invariants.
 * @param {T} t The test runner object.
 * @param {!PriorityQueue} pq The PriorityQueue object to test the
 * invariants of.
 * @param {string=} note A textual description of the test situation.
 * @suppress {accessControls}
 */
function checkInvariants(t, pq, note) {
  if (note) note = ' // ' + note;
  for (let i = 0; i < pq.heap_.length; i++) {
    // Check heap ordering invariant.
    const p = parent(i);
    if (p >= 0) {
      t.assert('PriorityQueue heap ordering invariant' + note,
               pq.compareFn_(pq.heap_[i].priority, pq.heap_[p].priority) >= 0,
               util.format(
                   '.heap_[%d].priority === %d, .heap_[%d].priority === %d',
                   i, pq.heap_[i].priority, p, pq.heap_[p].priority) +
                       util.format('\n%o\n', pq.heap_));
    }
    // Check index is correct for .heap_[i].item
    t.expect(util.format('PriorityQueue: .indices_.get(.heap_[%d].item)%s',
                         i, note),
             pq.indices_.get(pq.heap_[i].item), i);
  }
  for (const [item, index] of pq.indices_) {
    // Check item is correct for .indices_.get(v).
    t.expect(util.format('PriorityQueue: .heap_[.indices_.get(%o)].item%s',
                         item, note),
             pq.heap_[index].item, item);
  }
  t.expect('PriorityQueue: .heap_.length (vs. .indices_.size)' + note,
           pq.heap_.length, pq.indices_.size);
};

/**
 * Run some basic tests of PriorityQueue.
 * @param {!T} t The test runner object.
 */
exports.testPriorityQueue = function(t) {
  const name = 'PriorityQueue';
  const pq = new PriorityQueue();

  // Insert some items in a particular order, using item as priority.
  for (const v of [2, 4, 6, 8, 10, 12, 14, 15, 13, 11, 9, 7, 5, 3, 1]) {
    pq.set(v, v);
    checkInvariants(t, pq, util.format('after .insert(%d, %d)', v, v));
  }

  // Remove three items.
  for (let i = 1; i <= 3; i++) {
    t.expect(name + ' .deleteMin()  // ' + i, pq.deleteMin(), i);
    t.expect(name + ' .length  // ' + i, pq.length, 15 - i);
    checkInvariants(t, pq, 'after .deleteMin #' + i);
  }

  // Reduce priority of 6 to 4.5.
  pq.reducePriority(6, 4.5);
  checkInvariants(t, pq, 'after .reducePriority(6, 4.5)');

  // Remove next three items; verify order per changed priorities.
  t.expect(name + ' .deleteMin()  // 4', pq.deleteMin(), 4);
  checkInvariants(t, pq, 'after .deleteMin #4');
  t.expect(name + ' .deleteMin()  // 5', pq.deleteMin(), 6);
  checkInvariants(t, pq, 'after .deleteMin #5');
  t.expect(name + ' .deleteMin()  // 6', pq.deleteMin(), 5);
  checkInvariants(t, pq, 'after .deleteMin #6');

  // Remove remaining items.
  for (let i = 7; i <= 15; i++) {
    t.expect(name + ' .deleteMin()  // ' + i, pq.deleteMin(), i);
    t.expect(name + ' .length  // ' + i, pq.length, 15 - i);
    checkInvariants(t, pq, 'after .deleteMin #' + i);
  }
};

/**
 * Test PriorityQueue with a custom compareFn.
 * @param {!T} t The test runner object.
 */
exports.testPriorityQueueCustomCompareFn = function(t) {
  const name = 'PriorityQueue(/*compareFn*/)';
  // Custom comparison reverses usual sort order.
  const pq = new PriorityQueue((a,b) => b - a);

  // Insert 1-7 in order.
  for (let i = 1; i <= 7; i++) {
    pq.set(i, i);
    checkInvariants(t, pq, util.format('after .insert(%d, %d)', i, i));
  }

  // Remove three items (7, 6, 5).
  for (let i = 1; i <= 3; i++) {
    t.expect(name + ' .deleteMin()  // ' + i, pq.deleteMin(), 8 - i);
    t.expect(name + ' .length  // ' + i, pq.length, 7 - i);
    checkInvariants(t, pq, 'after .deleteMin #' + i);
  }

  // "Reduce" priority of 1 to Infinity.
  pq.set(1, Infinity);
  checkInvariants(t, pq, 'after .set(1, Infinity)');

  // Remove next item; verify order per changed priorities.
  t.expect(name + ' .deleteMin()  // 4', pq.deleteMin(), 1);
  t.expect(name + ' .length  // 4', pq.length, 3);
  checkInvariants(t, pq, 'after .deleteMin #4');

  // Remove remaining items (4, 3, 2).
  for (let i = 5; i <= 7; i++) {
    t.expect(name + ' .deleteMin()  // ' + i, pq.deleteMin(), 9 - i);
    t.expect(name + ' .length  // ' + i, pq.length, 7 - i);
    checkInvariants(t, pq, 'after .deleteMin #' + i);
  }
};

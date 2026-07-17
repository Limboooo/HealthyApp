import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getChanges,
  getNavItems,
  getPreviousVersion,
  getScreenModel,
  getVersion,
  versions,
} from '../src/versions.mjs';

test('versions are ordered newest first and have unique ids', () => {
  assert.deepEqual(versions.map((version) => version.id), ['v7', 'v6', 'v5']);
  assert.equal(new Set(versions.map((version) => version.id)).size, versions.length);
});

test('getVersion falls back to the latest version', () => {
  assert.equal(getVersion('v6').id, 'v6');
  assert.equal(getVersion('unknown').id, 'v7');
});

test('getPreviousVersion follows chronological releases', () => {
  assert.equal(getPreviousVersion('v7').id, 'v6');
  assert.equal(getPreviousVersion('v6').id, 'v5');
  assert.equal(getPreviousVersion('v5'), null);
});

test('getChanges can filter to additions only', () => {
  const allChanges = getChanges('v7');
  const additions = getChanges('v7', 'added');

  assert.ok(allChanges.length > additions.length);
  assert.ok(additions.length > 0);
  assert.ok(additions.every((change) => change.type === 'added'));
});

test('navigation reflects each release information architecture', () => {
  assert.deepEqual(getNavItems('v5').map((item) => item.label), ['今日', '训练', '打卡', '数据']);
  assert.deepEqual(getNavItems('v7').map((item) => item.label), ['今日', '教练', '打卡', '数据']);
});

test('screen model exposes version-specific coach and food analysis states', () => {
  const v7Coach = getScreenModel('v7', 'coach');
  const v6Food = getScreenModel('v6', 'food');
  const v5CoachFallback = getScreenModel('v5', 'coach');

  assert.equal(v7Coach.kind, 'coach');
  assert.match(v7Coach.title, /私人教练/);
  assert.equal(v6Food.usageLabel, '本月 18 / 200 次');
  assert.equal(v5CoachFallback.kind, 'today');
});

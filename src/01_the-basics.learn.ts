import {Values} from '@cotera/nasty';
import { test, expect } from 'vitest';
import {db} from './helpers';


// Values

test('Basic Values Examples', async () => {
  const res = await Values([{ n: 1 }, { n: 2 }]).execute(db());
  expect(res).toEqual([]);
})

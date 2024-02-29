import { Values } from "@cotera/nasty";
import { test, expect } from "vitest";
import { db } from "./helpers";

// Values

test("Basic Values Examples", async () => {
  // Values clauses are a way to manually input data that you can later manipulate in nasty.
  const res = await Values([{ n: 1 }, { n: 2 }]).execute(db());
  expect(res).toEqual([{ n: 1 }, { n: 2 }]);
});

test("select attributes", async () => {
  // In nasty you can select all attributes of a table using the `star` method, similar to SQL.
  const data = Values([
    { a: 1, b: "Foo" },
    { a: 2, b: "Bar" },
    { a: 3, b: "Baz" },
  ]);

  // These three queries are equivalent
  const query1 = data.select((t) => t.star());
  const query2 = data.select((t) => ({ ...t.star() }));

  // Both queries will return the same result
  const res = [
    { a: 1, b: "Foo" },
    { a: 2, b: "Bar" },
    { a: 3, b: "Baz" },
  ];

  expect(await query1.execute(db())).toEqual(res);
  expect(await query2.execute(db())).toEqual(res);

  // You can also pick attributes by name, similar to SQL.

  // Similar to query1 and query2, you can use ... to expand the t.pick or use it stand alone
  const query3 = data.select((t) => t.pick("a", "b"));
  const query4 = data.select((t) => ({ ...t.pick("a", "b") }));

  expect(await query3.execute(db())).toEqual(res);
  expect(await query4.execute(db())).toEqual(res);

  // Alternatively, you can use the `attr` method to select a single attribute.
  // This query is another equivalent way to select all attributes.
  const query5 = data.select((t) => ({ a: t.attr("a"), b: t.attr("b") }));

  expect(await query5.execute(db())).toEqual(res);
});

// renaming attributes
// creating new attributes from constant
// show errors when trying to select non-existing attributes
// where clause
// logical operators and/or/not
// distinct
// order by
// limit
// UnionAll
//
//
// generating different types of SQL
//
// New learn.ts: math operations
// New learn.ts:  aggregates (group by, count by, other agg functions)
// New learn.ts: windows

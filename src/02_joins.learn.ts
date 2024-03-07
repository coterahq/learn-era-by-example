import { Asc, Eq, Ty, Values } from "@cotera/nasty";
import { expect, test } from "vitest";
import { db } from "./helpers";

// Before proceeding, make sure you're comforatble with SQL joins
// https://www.w3schools.com/sql/sql_join.asp

test("Joining two tables", async () => {
  const L = Values([1, 2, 3].map((foo) => ({ foo })));
  const R = Values([1, 2, 3].map((bar) => ({ bar })));

  // Create an "inner join" between L and R
  //
  // The callback takes two arguments, one for the left and one for the right
  // side
  const JoinRes = L.innerJoin(R, (l, r) => ({
    // The `l` and `r` variables refer to the tables being joined
    on: Eq(l.attr("foo"), r.attr("bar")),
    // We can also specify the attributes we want to select from each side
    select: {
      ...l.star(),
      ...r.star(),
      // We can create new attributes the same way as in a `.select
      SUM: l.attr("foo").add(r.attr("bar")),
    },
  })).orderBy((t) => Asc(t.attr("SUM")));

  expect(JoinRes.attributes).toEqual({
    foo: Ty.nn("int"),
    bar: Ty.nn("int"),
    SUM: Ty.nn("int"),
  });

  expect(await JoinRes.execute(db())).toEqual([
    { SUM: 2, bar: 1, foo: 1 },
    { SUM: 4, bar: 2, foo: 2 },
    { SUM: 6, bar: 3, foo: 3 },
  ]);
});

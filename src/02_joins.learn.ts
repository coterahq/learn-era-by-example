import { Asc, Eq, Ty, Values } from "@cotera/era";
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

test("left and right joins", async () => {
  const L = Values([1, 2, 3].map((l) => ({ l })));
  const R = Values([1, 2, 3].map((r) => ({ r })));

  // Left join where R.r is strictly greater than L.l
  const LeftJoin = L.leftJoin(R, (l, r) => ({
    on: r.attr("r").gt(l.attr("l")),
    select: { ...l.star(), ...r.star() },
  }));

  expect(await LeftJoin.execute(db())).toEqual([
    // l == 1 has two rows on the right that match with it, so there are two
    // resulting rows
    { l: 1, r: 2 },
    { l: 1, r: 3 },
    // l == 2 has one row where r > 2
    { l: 2, r: 3 },
    // There are no rows where r > 3, but l == 3 still appears because this is
    // a left join
    { l: 3, r: null },
  ]);

  // Right join where R.r is strictly greater than L.l
  const RightJoin = L.rightJoin(R, (l, r) => ({
    on: r.attr("r").gt(l.attr("l")),
    select: { ...l.star(), ...r.star() },
  })).orderBy((t) => Asc(t.attr("l")));

  expect(await RightJoin.execute(db())).toEqual([
    // l == 1 has two rows on the right that match with it, so there are two
    // resulting rows
    { l: 1, r: 2 },
    { l: 1, r: 3 },
    // l == 2 has one row where r > 2
    { l: 2, r: 3 },
    // There are no rows where r == 1 is > than any L but it still appears in
    // the output set
    { l: null, r: 1 },
  ]);
});

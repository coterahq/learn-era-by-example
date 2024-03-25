import { test, expect } from "vitest";
import { From, Random } from "@cotera/era";
import {db} from "./helpers";

test(".maxPossibleRows", () => {
  // One API that ships with the ERA compiler is the ability to try to
  // provide an upper bound to the number of returned rows

  const SomeTable = From({
    name: "foo",
    schema: "public",
    attributes: { n: "int" },
  });

  // A table by itself doesn't have an upperbound of `.maxPossibleRows`, represented by null
  expect(SomeTable.maxPossibleRows()).toEqual(null);

  // Adding a limit will set the max possible rows
  const SomeLimitedTable = SomeTable.limit(50);
  expect(SomeLimitedTable.maxPossibleRows()).toEqual(50);

  // Filtering doesnt affect the limit
  expect(
    SomeLimitedTable.where((t) => t.a`n`.gt(5)).maxPossibleRows(),
  ).toEqual(50);

  // Joining two tables results in the product of the two limits
  const SomeJoined = SomeLimitedTable.innerJoin(SomeLimitedTable, (l, r) => ({ on: Random().gt(0.5), select: { ...l.star(), ...r.star() } }))
  expect(SomeJoined.maxPossibleRows()).toEqual(50 * 50)

  // GenerateSeries and Values clauses work as expected
  expect(From({ start: 1, stop: 10 }).maxPossibleRows()).toEqual(9)
  expect(From([{ n: 1 }, { n: 2 }, { n: 3 }]).maxPossibleRows()).toEqual(3)

  // Assert limit will use `.invariants` to blow up if the relation is above a number of rows
  const AssertLimited = From({ start: 1, stop: 15 }).assertLimit(3);
  expect(AssertLimited.maxPossibleRows()).toEqual(3);
  expect(() => AssertLimited.execute(db())).toThrow()
});

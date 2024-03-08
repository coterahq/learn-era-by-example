import { Values } from "@cotera/nasty";
import { db, CHANGE_ME } from "./helpers";
import { test, expect } from "vitest";

const data = [
  { a: 1, b: "Foo" },
  { a: 2, b: "Bar" },
  { a: 3, b: "Baz" },
];

test.skip("strings", async () => {
  const query = Values(data).select((t) => {
    const b = t.attr("b");

    return {
      b,
      starts_with_b: CHANGE_ME(),
      upper_case_b: CHANGE_ME(),
      lower_case_b: CHANGE_ME(),
      b_with_suffix: CHANGE_ME(),
    };
  });

  expect(await query.execute(db())).toEqual([
    {
      b: "Foo",
      b_with_suffix: "Foo_suffix",
      lower_case_b: "foo",
      starts_with_b: false,
      upper_case_b: "FOO",
    },
    {
      b: "Bar",
      b_with_suffix: "Bar_suffix",
      lower_case_b: "bar",
      starts_with_b: true,
      upper_case_b: "BAR",
    },
    {
      b: "Baz",
      b_with_suffix: "Baz_suffix",
      lower_case_b: "baz",
      starts_with_b: true,
      upper_case_b: "BAZ",
    },
  ]);
});

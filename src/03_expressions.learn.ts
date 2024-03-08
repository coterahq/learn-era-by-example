import { test, expect } from "vitest";
import {
  Constant,
  Expression,
  LogBase10,
  LogBase2,
  Ln,
  Ty,
  Eq,
  Neq,
  Gt,
  Gte,
  Lt,
  Lte,
  And,
  Or,
  Not,
  f,
} from "@cotera/nasty";

// Explore NASTY's expression langauge

test("Constant", () => {
  // The `Constant` wrapper takes a Javascript primative and wraps it into a
  // NASTY expression. The `.evaluate` method runs an expression in the JS
  // interpreter
  expect(Constant(4).evaluate()).toEqual(4);
  expect(Constant("foo").evaluate()).toEqual("foo");
  expect(Constant(true).evaluate()).toEqual(true);
  // Pro tip! End your date constants with `Z` to make sure they're in UTC
  expect(Constant(new Date("2021-1-1Z")).evaluate()).toEqual(
    new Date("2021-1-1Z"),
  );

  // Constants infer their type
  expect(Constant(4).ty).toEqual(Ty.nn("int"));
  expect(Constant(4.3).ty).toEqual(Ty.nn("float"));

  // You can change the infered type of an expression with the second arg to
  // Constant
  expect(Constant(3, { ty: "float" }).ty).toEqual(Ty.nn("float"));
  // Including the `nullability`
  expect(Constant(3, { nullable: true }).ty).toEqual(Ty.ty("int"));
  // You can use this method to make a `null` value of a type
  expect(() => Constant(null)).toThrowError(
    "Unable to infer type of value null",
  );
  expect(Constant(null, { ty: "string" }).ty).toEqual(Ty.ty("string"));

  // *Advanced* You can turn off const evaluation via the `.impure()` method
  expect(() => Constant(3).impure().evaluate()).toThrowError();
});

test("logic", () => {
  const cases: [expr: Expression, expected: Ty.Literal | null][] = [
    [And(true, true), true],
    [And(true, false), false],
    [And(true, true, false), false],
    [Or(true, false), true],
    [Or(Neq(1, 1), Eq(1, 1)), true],
    [Not(true), false],
    // method notation
    [Constant(true).and(false), false],
    [Constant(true).or(false), true],
    [Constant(true).not(), false],
  ];

  for (const [expr, expected] of cases) {
    expect(expr.evaluate()).toEqual(expected);
  }
});

test("math", () => {
  const cases: [expr: Expression, expected: Ty.Literal | null][] = [
    // +, -, *, /,
    [Constant(1).add(1), 2],
    [Constant(1).sub(2), -1],
    [Constant(10).mul(10), 100],
    [Constant(17.5).div(7), 2.5],

    // Absolute Value
    [Constant(-100).abs(), 100],

    // Floor and Ceiling
    [Constant(4.5).floor(), 4],
    [Constant(4.5).ceil(), 5],

    // Clamp
    [Constant(3).clamp(1, 2), 2],
    [Constant(-3).clamp(1, 2), 1],
    [Constant(1.5).clamp(1, 2), 1.5],

    // Logs
    [LogBase2(16), 4],
    [LogBase10(100), 2],
    [Ln(Math.E), 1],

    // Exponents
    [Constant(4).toThePowerOf(2), 16],

    // Math on nulls are null
    [Constant(null, { ty: "int" }).add(4), null],
  ];

  for (const [expr, expected] of cases) {
    expect(expr.evaluate()).toEqual(expected);
  }
});

test("comparisons", () => {
  const cases: [expr: Expression, expected: Ty.Literal | null][] = [
    // >
    [Constant(4).gt(10), false],
    [Gt(4, 10), false],
    [Constant(4).gt(4), false],
    [Constant(4).gt(3.9), true],
    [Gt("b", "a"), true],
    [Gt(new Date("2024-1-1Z"), new Date("2022-1-1Z")), true],
    // >=
    [Constant(4).gte(4), true],
    [Gte(3, 3), true],
    // <, <=
    [Constant(4).lt(10), true],
    [Lt(4, 10), true],
    [Constant(4).lte(4), true],
    [Lte(3, 2), false],
    // ==
    [Constant(4).eq(4), true],
    [Eq(4, 4), true],
    [Constant(4).oneOf([4, 5, 6]), true],
    [Constant(4).oneOf([7, 8, 9]), false],
    // !=
    [Constant(4).neq(4), false],
    [Neq(4, 4), false],
    // Between
    [Constant(4).between(3, 10), true],
    [Constant(50).between(3, 10), false],
    [
      Constant(new Date("2023-1-1Z")).between(
        new Date("2022-1-1Z"),
        new Date("2024-1-1Z"),
      ),
      true,
    ],
    [Constant("b").between("a", "c"), true],
  ];

  for (const [expr, expected] of cases) {
    expect(expr.evaluate()).toEqual(expected);
  }
});

test("strings", () => {
  const cases: [expr: Expression, expected: Ty.Literal | null][] = [
    [Constant("foo").upper(), "FOO"],
    [Constant("FOO").lower(), "foo"],
    // concat
    [Constant("foo").concat("bar"), "foobar"],
    // length
    [Constant("foo").length(), 3],
    [Constant("foobar").length(), 6],
    // `f` strings are similar to python f strings but for NASTY
    [f`some string ${4}`, "some string 4"],
    [f`Result => ${Eq(4, 4)}`, "Result => true"],
    [f`outer -> ${f`inner -> ${10}`}`, "outer -> inner -> 10"],

    // // Like
    // [Constant('foo').like('foo'), true],
    // // Use '%' as a wildcard match
    // [Constant('foo').like('f'), false],
    // [Constant('foo').like('f%'), true],
  ];

  for (const [expr, expected] of cases) {
    expect(expr.evaluate()).toEqual(expected);
  }
});

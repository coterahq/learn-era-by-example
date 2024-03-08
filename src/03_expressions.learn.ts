import { test, expect, describe } from "vitest";
import { db } from "./helpers";
import { Constant, Expression, Ty } from "@cotera/nasty";

// Explore NASTY's expression langauge

test('Constant', () => {
  // The `Constant` wrapper takes a Javascript primative and wraps it into a
  // NASTY expression. The `.evaluate` method runs an expression in the JS
  // interpreter
  expect(Constant(4).evaluate()).toEqual(4);
  expect(Constant('foo').evaluate()).toEqual('foo');
  expect(Constant(true).evaluate()).toEqual(true);
  // Pro tip! End your date constants with `Z` to make sure they're in UTC
  expect(Constant(new Date("2021-1-1Z")).evaluate()).toEqual(
    new Date("2021-1-1Z"),
  );

  // Constants infer their type
  expect(Constant(4).ty).toEqual(Ty.nn('int'));
  expect(Constant(4.3).ty).toEqual(Ty.nn('float'));

  // You can change the infered type of an expression with the second arg to
  // Constant
  expect(Constant(3, { ty: 'float' }).ty).toEqual(Ty.nn('float'));
  // Inclusing the `nullability`
  expect(Constant(3, { nullable: true }).ty).toEqual(Ty.ty('int'));

});

test("math", () => {});

import { Eq, From, Ty, Values } from "@cotera/nasty";
import { test, expect } from "vitest";
import { db } from "./helpers";

// Welcome to Nasty, the "post-modern" data stack!
//
// Q. Why does Nasty exist?
//
// A. Nasty was built to maintain testable/composable data pipelines. Our team
// was ripping our hair out trying to maintain dbt/SQL scripts across different
// data warehouses (Redshift, BigQuery, Postgres, Snowflake) on top of ever
// shifting data foundations maintained by our customer's internal data teams.
// Nasty is the result of our learnings from field experience.
//
// Q. Is Nasty an ORM? A SQL builder?
//
// A. Neither! Nasty is kinda it's own thing. Nasty is more like a minimal
// relational algebra programming language shipped as a Typescript library. It
// borrows a bunch of learnings from other programming languages and applies
// them to OLAP programming / data engineering.
//
// Q. Why is it called Nasty?
//
// A. Nasty stands for (Nasty Abstract Syntax Tree Thing-y). Nasty is named
// after the fact it defines an "abstract syntax tree (AST)" as its main
// interface, as opposed to SQL which exposes a text format

test("Using nasty to generate SQL", () => {
  // Nasty can be used to generate data{base, warehouse} specific SQL. Nasty
  // ships with a SQL generator that supports many different dialects.

  const Tab = From({
    schema: "some_schema",
    name: "some_table_name",
    attributes: {
      foo: "string",
      bar: "int",
    },
  }).filter((t) => t.attr("bar").gt(2));

  expect(Tab.postgresSql.sql).toEqual(
    'select "bar" as "bar", "foo" as "foo" from "some_schema"."some_table_name" where ("bar" > 2)',
  );

  expect(Tab.bigQuerySql.sql).toEqual(
    "select `bar` as `bar`, `foo` as `foo` from `some_schema`.`some_table_name` where (`bar` > 2)",
  );

  expect(Tab.snowflakeSql.sql).toEqual(
    'select "bar" as "bar", "foo" as "foo" from "some_schema"."some_table_name" where ("bar" > 2)',
  );

  expect(Tab.redshiftSql.sql).toEqual(
    'select "bar" as "bar", "foo" as "foo" from "some_schema"."some_table_name" where ("bar" > 2)',
  );
});

test("See the type checker", () => {
  // A really powerful part of nasty is that it ships with a _full_ relational
  // algebra type checker. Nasty's goal is to be able to tell if a query is
  // valid _before_ running it. This allows for fast feedback on how a
  // potential change will affect your entire pipeline.

  const Orders = From({
    schema: "public",
    name: "orders",
    attributes: {
      // Nasty keeps track of nullability
      customer_id: { ty: "int", nullable: false },
      // The `Ty` library has helpful type manipulation helpers
      quantity: Ty.nn("int"),
    },
  });

  const Customers = From({
    schema: "public",
    name: "customers",
    attributes: { id: Ty.nn("int"), state: "string" },
  });

  // Nasty will keep track of the attributes a relation has and calculates the
  // resulting types of each operation. Nasty models the full expression
  // language, joins, windows, and aggregates.
  //
  // All of this information is available to tooling, unit testing, and meta
  // programming. Making changes on your data sources will show the type errors
  // all the way up to your visualization layer ands reverse ETL processes! Never
  // again wonder what will break when you change a foundational model.
  const CustomerOrderStats = Customers.leftJoin(Orders, (customer, orders) => ({
    on: Eq(customer.attr("id"), orders.attr("customer_id")),
    select: {
      ...customer.star(),
      ...orders.pick("quantity"),
    },
  }));

  // Nasty analyzed the join and figures out the types of the output relation
  // (including nullability!)
  expect(CustomerOrderStats.attributes).toEqual({
    id: Ty.nn("int"),
    state: Ty.ty("string"),
    quantity: Ty.nn("int"),
  });

  // The Nasty typechecker will analyze your relations and give you instant
  // feedback if something you're doing is invalid. Nasty calls into JS's
  // runtime to show you the exact line number of the error (this is hard to
  // show in docs but very powerful when actually writing Nasty)
  expect(() =>
    CustomerOrderStats.select((t) => ({
      ...t.pick("id", "state", "oops_invalid_attribute!"),
    })),
  ).toThrowError(
    // Error messages include helpful tips! A missing attribute lists out all the attributes that do exist and their types
    `NoSuchAttribute - "oops_invalid_attribute!" does not exist in 
(
  "id" int NOT NULL,
  "state" string,
  "quantity" int NOT NULL
)

TraceBack:
 -> attr - "from"
`,
  );
});

// Values
test("Basic Values Examples", async () => {
  // Values clauses are a way to manually input data that you can later manipulate in Nasty.
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

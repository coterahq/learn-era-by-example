<img align="center" src="https://github.com/coterahq/nasty-assets/blob/main/logo.svg?raw=true" alt="Get Nasty Docs" style="width:100%;height:100px"/></a>
<p align="center">NASTY is a practical framework for building composable data applications that are easy to maintain. Think type safety, beautiful abstractions, unit tests... everything an engineer expects in 2024.</p>

<sub>Inspired by [Ruby Koans](https://www.rubykoans.com/)</sub>

## 👋 Learn Nasty By Example

This is a repository to get you started with understanding the Nasty Analytics Toolkit.

## 💡 Who is this for? 

This is for people who have a little understanding of SQL but maybe not
familiarity with Typescript, unit tests, or advanced SQL constructs (windows,
aggregates, ...etc). After teaching the basics, the examples get progressively
more advanced and show of more powerful analytics tools.

Each example is run via unit tests, as a way to demonstrate the power you can leverage when you bring tests to your analytics code.

## ⚡️ Quickstart
Make sure you have nodejs installed ([Download](https://nodejs.org/en/downloaddownload)).

:warning: **Installation make take a few minutes, due to downloading the duckdb binary**

```bash
$ git clone https://github.com/coterahq/learn-nasty-by-example.git

$ cd learn-nasty-by-example

$ npm i

$ npm run test
```
If this is all setup correctly, you should see an output similar to this:
<img align="center" alt="Nasty test example" src="https://github.com/coterahq/nasty-assets/blob/main/learn-nasty-test_01.png?raw=true"/>

## How is this structured

### The `.learn.ts` files

each `.learn.ts` file contains examples of how to use the concept in nasty. Start in these files to see examples on how to use a concept

### The `.test.ts` files

These let you apply the skills you've learned in examples by fixing unit tests

```typescript
test.skip("I'm a description of the example", () => {
  // Example code here
});
```

In order to attempt an example remove the `.skip` like so

```typescript
test("I'm a description of the example", () => {
  // Example code here
});
```

## Developing new examples

Run the `.learn.ts` files via `TEST_LEARN=true npx vitest`

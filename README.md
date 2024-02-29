# Learn Nasty By Example

Inspired by [Ruby Koans](https://www.rubykoans.com/)

## What is this?

This is a repository to get you started with understanding the Nasty Analytics Toolkit.

## Who is this for?

This is for people who has a little understanding of SQL but maybe not
familiarity with Typescript, unit tests, or advanced SQL constructs (windows,
aggregates, ...etc). After teaching the basics, the examples get progressively
more advanced and show of more powerful analytics tools.

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

## Getting Started

### Try in Github Codespaces (TODO)

### Try Locally

#### Install NodeJS

#### `npm i`

#### `npx vitest`

## Developing new examples

Run the `.learn.ts` files via `TEST_LEARN=true npx vitest`


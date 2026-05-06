# Boolean Practice Product Specification

## Overview
Boolean Practice is an educational web application designed to help computer science students (specifically AP Computer Science A) master boolean expression evaluation. It uses two primary visual representations: Truth Tables and Venn Diagrams, both emphasizing a stepwise reasoning process.

## Target Audience
- AP Computer Science A students.
- Introductory programming students learning boolean logic.
- Teachers looking for a classroom-ready tool for boolean practice.

## Learning Goals
- **Operator Precedence**: Understand that `!` (NOT) is evaluated before `&&` (AND), which is evaluated before `||` (OR).
- **Subexpression Decomposition**: Learn to break down complex expressions into manageable sub-steps.
- **Multiple Representations**: Connect abstract boolean expressions to concrete tabular (Truth Table) and spatial (Venn Diagram) models.
- **Reasoning Over Guessing**: Use feedback to identify the next reasoning step instead of trial-and-error guessing.
- **Shared Semantics**: Truth table and Venn views should always agree because they represent the same boolean expression.

## Core Workflows (MVP)

### 1. Problem Selection
- Students choose a difficulty level (Easy, Medium, Hard).
- Students choose a practice mode (Truth Table or Venn Diagram).
- The app provides a sequenced problem from a curated catalog.
- The same problem data drives both practice modes, and unsupported mode/problem combinations are excluded before the student begins work.

### 2. Truth Table Practice
- **Stepwise Reveal**: The table columns for variables are shown initially. Subexpression columns are revealed one by one as the student correctly completes them.
- **Input**: Students click cells in the current subexpression column to cycle through `T`, `F`, and `(empty)`.
- **Validation**: Students click "Check Step" to verify their answers for the current column.
- **Feedback**: Inline feedback identifies the current row or subexpression that needs reconsideration and avoids modal alerts.

### 3. Venn Diagram Practice
- **Stepwise Reveal**: Similar to Truth Tables, students reason through subexpressions.
- **Operand Context**: To assist with the current operation, the app displays the diagrams of the operands (e.g., for `A && B`, it shows the diagram for `A` and the diagram for `B`).
- **Input**: Students click on regions in a 1, 2, or 3-variable Venn diagram to toggle between True (Shaded), False (White), and Neutral (Gray).
- **Validation**: "Check" button compares the student's shaded regions to the expected truth values.
- **Feedback**: Inline feedback identifies missed or extra regions by label so students can correct a specific reasoning step.

## Supported Boolean Syntax
- **Operators**: `!` (NOT), `&&` (AND), `||` (OR).
- **Precedence**: `!` > `&&` > `||`. Parentheses `()` override precedence.
- **Literals**: `true`, `false`.
- **Variables**: lowercase identifiers used by the curated catalog.
- **Inputs**: Supports 1, 2, and 3 variables.
- **Whitespace**: Ignored between tokens.

## Non-Goals (MVP)
- User accounts or persistent server-side storage.
- Complex numeric comparison predicates beyond the supported authored subset - keep the MVP centered on pure boolean variables initially.
- Dynamic problem generation beyond the curated catalog.
- Competitive leaderboards.
- A separate short-circuiting lesson or evaluator mode.

## Visual Design Principles
- **Clarity**: Use distinct, accessible colors for True/False states.
- **Focus**: Highlight the current step being worked on.
- **Consistency**: Use the same notation and symbols throughout the app.
- **Cleanliness**: Avoid decorative clutter; every visual element should serve a pedagogical purpose.

## Deferred Enhancements And Open Questions
- Whether to expand the supported numeric comparison subset after the boolean core is stable.
- Whether to add explicit compare-modes activities or end-of-problem review summaries.
- Whether to surface short-circuiting as an optional lesson after the MVP is proven.
- Whether to add more difficulty bands or keep the initial easy/medium/hard structure.

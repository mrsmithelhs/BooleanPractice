# Adaptive Assignment Feature Vectors

Plan 22 uses normalized feature vectors instead of raw string distance.

## Field Definition

| Field | Meaning |
| --- | --- |
| `id` | Stable challenge id. |
| `kind` | `problem`, `equivalence`, or `simplification`. |
| `title` | Display label for teacher debugging or progress logs. |
| `sequence` | Stable ordering hint from the source record. |
| `difficulty` | `easy`, `medium`, or `hard`. |
| `conceptTags` | Ordered list of pedagogical tags used for similarity and coverage. |
| `variables` | Sorted variable names in the challenge. |
| `variableCount` | Number of distinct variables. |
| `anchorExpression` | The expression used to compute structural metrics. |
| `pairedExpressionCount` | `1` for single expressions, `2` for equivalence pairs. |
| `lawFamily` | Canonical law family such as `identity`, `absorption`, or `de-morgan`. |
| `estimatedComplexity` | Teacher-authored complexity estimate from the source data. |
| `misconceptionTarget` | The likely error pattern the exercise is meant to surface. |
| `modeSuitability` | Booleans describing whether the item fits assignment, equivalence, simplification, truth-table, or Venn usage. |
| `operatorCounts` | Counts for `!`, `&&`, and `||`. |
| `astDepth` | Maximum AST depth. |
| `binaryNodeCount` | Total number of binary AST nodes. |
| `unaryNodeCount` | Total number of unary AST nodes. |
| `identifierCount` | Number of variable references in the AST. |
| `literalCount` | Number of boolean literals in the AST. |
| `groupingDepth` | A compact proxy for precedence and parentheses reliance. |
| `truthDensity` | Ratio of true rows across the full truth table. |

## Scoring Rules

- Shared concept tags should dominate similarity scoring.
- Comparable complexity should matter more than string shape.
- Operator counts, AST depth, truth density, and variable count should act as tie-breakers.
- Mode suitability should keep items in the right classroom lane.


/**
 * Web app: Boolean Practice Web App
 * File: Code.gs
 * By Orion Smith, East Lansing HS
 * orion.smith@elps.us
 * 
 * Handles serving the web app UI and processing client-side requests
 * via google.script.run.
 * 
 * Changelog
 * 0.5  2024-12-20  MVP testing version
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile("Index").setTitle("Boolean Expression Practice");
}

class BooleanParser {
    constructor(expression) {
        this.expression = expression.replace(/\s+/g, ''); // Remove spaces
        this.tokens = [];
        this.current = 0;
        this.steps = []; // Tracks intermediate subexpressions
    }

    // 1. Tokenize input expression
    tokenize() {
        const regex = /[a-z]+|true|false|&&|\|\||!|\(|\)/g;
        this.tokens = this.expression.match(regex);
    }

    // 2. Parse the expression into an AST
    parse() {
        this.current = 0;
        this.steps = []; // Reset steps
        return this.parseExpression();
    }

    parseExpression() {
        let node = this.parseTerm();
        while (this.match("||")) {
            const operator = this.previous();
            const right = this.parseTerm();
            node = this.addStep({ type: "Binary", operator: operator, left: node, right: right });
        }
        return node;
    }

    parseTerm() {
        let node = this.parseFactor();
        while (this.match("&&")) {
            const operator = this.previous();
            const right = this.parseFactor();
            node = this.addStep({ type: "Binary", operator: operator, left: node, right: right });
        }
        return node;
    }

    parseFactor() {
        if (this.match("!")) {
            const operator = this.previous();
            const right = this.parseFactor();
            return this.addStep({ type: "Unary", operator: operator, right: right });
        } else if (this.match("(")) {
            const expression = this.parseExpression();
            this.consume(")");
            return expression;
        } else if (this.match(/^[a-z]+|true|false$/)) {
            return { type: "Literal", value: this.previous() };
        }
        throw new Error("Unexpected token: " + this.peek());
    }

    addStep(node) {
        this.steps.push(node);
        return node;
    }

    match(expected) {
        if (this.isAtEnd()) return false;
        if (typeof expected === "string" && this.peek() === expected) {
            this.advance();
            return true;
        } else if (expected instanceof RegExp && expected.test(this.peek())) {
            this.advance();
            return true;
        }
        return false;
    }

    consume(expected) {
        if (this.match(expected)) return;
        throw new Error("Expected '" + expected + "' but found '" + this.peek() + "'");
    }

    advance() {
        this.current++;
        return this.previous();
    }

    peek() {
        return this.tokens[this.current];
    }

    previous() {
        return this.tokens[this.current - 1];
    }

    isAtEnd() {
        return this.current >= this.tokens.length;
    }

    // 3. Evaluate AST for Truth Table Generation
    evaluateAST(node, variables) {
        if (node.type === "Literal") {
            return variables[node.value];
        } else if (node.type === "Unary") {
            return !this.evaluateAST(node.right, variables);
        } else if (node.type === "Binary") {
            const left = this.evaluateAST(node.left, variables);
            const right = this.evaluateAST(node.right, variables);
            switch (node.operator) {
                case "&&": return left && right;
                case "||": return left || right;
            }
        }
        throw new Error("Invalid AST Node");
    }

    // 4. Generate Truth Table
    generateTruthTable() {
        const variables = this.extractVariables();
        const rows = 1 << variables.length;
        const truthTable = [];

        for (let i = 0; i < rows; i++) {
            const row = {};
            variables.forEach((v, index) => {
                row[v] = !!(i & (1 << (variables.length - index - 1)));
            });

            this.steps.forEach((step, idx) => {
                row[`Step ${idx + 1}`] = this.evaluateAST(step, row);
            });

            truthTable.push(row);
        }

        return truthTable;
    }

    extractVariables() {
        const vars = new Set();
        const traverse = (node) => {
            if (node.type === "Literal" && /^[a-z]+$/.test(node.value)) {
                vars.add(node.value);
            } else if (node.type === "Unary") {
                traverse(node.right);
            } else if (node.type === "Binary") {
                traverse(node.left);
                traverse(node.right);
            }
        };
        traverse(this.steps[this.steps.length - 1]);
        return Array.from(vars).sort();
    }

    // 5. Evaluate Regions for Venn Diagrams
    evaluateRegions(node, variables) {
        const regions = this.getRegionCombinations(variables.length);
        const results = {};
        for (const region of regions) {
            const varValues = region.values;
            results[region.name] = this.evaluateAST(node, varValues);
        }
        return results;
    }

    getRegionCombinations(numVars) {
        const combinations = [];
        const varNames = ["a", "b", "c"].slice(0, numVars);
        const totalRegions = 1 << numVars;

        for (let i = 0; i < totalRegions; i++) {
            const values = {};
            let name = "";
            varNames.forEach((v, index) => {
                const isTrue = !!(i & (1 << (numVars - index - 1)));
                values[v] = isTrue;
                name += `${isTrue ? v : "!" + v} `;
            });
            combinations.push({ name: name.trim(), values: values });
        }
        return combinations;
    }

    // 6. Verify Venn Diagram Regions
    verifyVennInput(node, studentRegions, variables) {
        const correctRegions = this.evaluateRegions(node, variables);
        const expected = Object.keys(correctRegions).filter((key) => correctRegions[key]);
        const incorrect = studentRegions.filter((region) => !expected.includes(region));

        return {
            isCorrect: incorrect.length === 0 && expected.length === studentRegions.length,
            expected: expected,
            incorrect: incorrect
        };
    }
}

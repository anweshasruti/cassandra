import { tokenize } from "./tokenizer";
import { Parser } from "./parser";
import { toLatex } from "./latex";
import { simplify } from "./simplify";
import { differentiate } from "./differentiate";

declare var katex: any;

function getAST(): any {
  const input = (document.getElementById("expression") as HTMLInputElement).value;
  const tokens = tokenize(input);
  const parser = new Parser(tokens);
  return parser.parse();
}

function renderResult(resultAST: any, originalAST: any) {
  const latexInput = toLatex(originalAST);
  const latexOutput = toLatex(simplify(resultAST));

  katex.render(latexInput, document.getElementById("inputLatex"));
  katex.render(latexOutput, document.getElementById("outputLatex"));
}

document.getElementById("simplifyBtn")!
  .addEventListener("click", () => {
    try {
      const ast = getAST();
      renderResult(ast, ast);
    } catch {
      document.getElementById("outputLatex")!.textContent = "Error";
    }
  });

document.getElementById("diffBtn")!
  .addEventListener("click", () => {
    try {
      const ast = getAST();
      const derivative = differentiate(ast, "x");
      renderResult(derivative, ast);
    } catch {
      document.getElementById("outputLatex")!.textContent = "Error";
    }
  });

document.getElementById("intBtn")!
  .addEventListener("click", () => {
    document.getElementById("outputLatex")!.textContent = "Integration not yet implemented";
  });

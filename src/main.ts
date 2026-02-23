import { tokenize } from "./tokenizer";
import { Parser } from "./parser";
import { toLatex } from "./latex";
import { simplify } from "./simplify";

declare var katex: any;

function renderSimplified() {
  const input = (document.getElementById("expression") as HTMLInputElement).value;

  try {
    const tokens = tokenize(input);
    const parser = new Parser(tokens);
    const ast = parser.parse();

    const simplified = simplify(ast);

    const latexInput = toLatex(ast);
    const latexOutput = toLatex(simplified);

    katex.render(latexInput, document.getElementById("inputLatex"));
    katex.render(latexOutput, document.getElementById("outputLatex"));
  } catch {
    document.getElementById("outputLatex")!.textContent = "Error";
  }
}

document.getElementById("simplifyBtn")!
  .addEventListener("click", renderSimplified);

document.getElementById("diffBtn")!
  .addEventListener("click", renderSimplified);

document.getElementById("intBtn")!
  .addEventListener("click", renderSimplified);

import contextlib
import json
import sys
import traceback


class Console:
    def __init__(self, limit=3000):
        self.limit = limit
        self.text = ""
        self.truncated = False

    def write(self, text):
        remaining = self.limit - len(self.text)
        self.text += text[:remaining]
        self.truncated |= len(text) > remaining
        return len(text)

    def flush(self):
        pass

    def output(self):
        return self.text + ("\n… saída truncada" if self.truncated else "")


def snapshot(value):
    if type(value) is str:
        return repr(value[:70]) + ("…" if len(value) > 70 else "")
    if value is None or type(value) in (bool, float):
        return repr(value)
    if type(value) is int:
        return repr(value) if value.bit_length() < 300 else "<inteiro grande>"
    if type(value) in (list, tuple, dict, set):
        return f"{type(value).__name__} ({len(value)} itens)"
    return f"<{type(value).__name__}>"


def run_case(source, input_json):
    filename = "solucao.py"
    stdout, stderr = Console(), Console()
    steps = []
    previous_trace = sys.gettrace()
    result = {"actual": None, "error": None}

    def trace(frame, event, _argument):
        if frame.f_code.co_filename != filename:
            return None
        if event == "line" and len(steps) < 24:
            locals_preview = {
                name: snapshot(value)
                for name, value in list(frame.f_locals.items())[:6]
                if not name.startswith("__")
            }
            steps.append({"line": frame.f_lineno, "variables": locals_preview})
        return trace

    try:
        program = compile(source, filename, "exec")
        with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
            namespace = {"__name__": "__main__"}
            sys.settrace(trace)
            try:
                exec(program, namespace)
                solve = namespace.get("solve")
                if not callable(solve):
                    raise ValueError(
                        "Defina a função solve(data) para receber a entrada de teste."
                    )
                value = solve(json.loads(input_json))
            finally:
                sys.settrace(previous_trace)
        encoded = json.dumps(value, ensure_ascii=False, allow_nan=False)
        if len(encoded) > 4000:
            raise ValueError("A resposta excedeu o limite de 4.000 caracteres.")
        result["actual"] = json.loads(encoded)
    except BaseException as error:
        line = (
            error.lineno
            if isinstance(error, SyntaxError)
            else next(
                (
                    frame.lineno
                    for frame in reversed(traceback.extract_tb(error.__traceback__))
                    if frame.filename == filename
                ),
                None,
            )
        )
        location = f"Linha {line} · " if line is not None else ""
        result["error"] = f"{location}{type(error).__name__}: {error}"[:600]

    result.update(stdout=stdout.output(), stderr=stderr.output(), steps=steps)
    return json.dumps(result, ensure_ascii=False)

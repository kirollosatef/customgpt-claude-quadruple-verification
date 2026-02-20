"""
Sandboxed data-transform runner for a data-science notebook environment.

Parses the snippet into an AST, validates against a strict whitelist,
and interprets it directly — arbitrary code strings are never passed to
any dynamic-execution primitive.
"""

from __future__ import annotations

import ast
import copy
import math
import operator
from typing import Any


# ---------------------------------------------------------------------------
# Whitelisted builtins — pure, side-effect-free data helpers only
# ---------------------------------------------------------------------------
_SAFE_BUILTINS: dict[str, Any] = {
    "abs": abs,
    "all": all,
    "any": any,
    "bool": bool,
    "dict": dict,
    "enumerate": enumerate,
    "filter": filter,
    "float": float,
    "frozenset": frozenset,
    "int": int,
    "len": len,
    "list": list,
    "map": map,
    "max": max,
    "min": min,
    "pow": pow,
    "range": range,
    "reversed": reversed,
    "round": round,
    "set": set,
    "sorted": sorted,
    "str": str,
    "sum": sum,
    "tuple": tuple,
    "zip": zip,
}

# Safe math constants/functions exposed under the "math" namespace
_SAFE_MATH: dict[str, Any] = {
    "ceil": math.ceil,
    "floor": math.floor,
    "sqrt": math.sqrt,
    "log": math.log,
    "log10": math.log10,
    "exp": math.exp,
    "pi": math.pi,
    "e": math.e,
}

# Binary / comparison / unary operators
_BIN_OPS: dict[type, Any] = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
    ast.BitAnd: operator.and_,
    ast.BitOr: operator.or_,
    ast.BitXor: operator.xor,
    ast.LShift: operator.lshift,
    ast.RShift: operator.rshift,
}

_UNARY_OPS: dict[type, Any] = {
    ast.UAdd: operator.pos,
    ast.USub: operator.neg,
    ast.Not: operator.not_,
    ast.Invert: operator.invert,
}

_CMP_OPS: dict[type, Any] = {
    ast.Eq: operator.eq,
    ast.NotEq: operator.ne,
    ast.Lt: operator.lt,
    ast.LtE: operator.le,
    ast.Gt: operator.gt,
    ast.GtE: operator.ge,
    ast.In: lambda a, b: a in b,
    ast.NotIn: lambda a, b: a not in b,
    ast.Is: operator.is_,
    ast.IsNot: operator.is_not,
}

_BOOL_OPS = {ast.And, ast.Or}


# ---------------------------------------------------------------------------
# Validation pass — reject any AST node that is not whitelisted
# ---------------------------------------------------------------------------
_ALLOWED_NODES = frozenset(
    {
        # Literals / atoms
        ast.Constant,
        ast.Name,
        ast.Starred,
        # Data structures
        ast.List,
        ast.Tuple,
        ast.Set,
        ast.Dict,
        # Comprehensions
        ast.ListComp,
        ast.SetComp,
        ast.DictComp,
        ast.GeneratorExp,
        ast.comprehension,
        # Expression wrappers
        ast.Expr,
        ast.UnaryOp,
        ast.BinOp,
        ast.BoolOp,
        ast.Compare,
        ast.IfExp,
        ast.Call,
        ast.keyword,
        ast.Subscript,
        ast.Slice,
        ast.Index,
        ast.Attribute,
        # Binary operators
        ast.Add,
        ast.Sub,
        ast.Mult,
        ast.Div,
        ast.FloorDiv,
        ast.Mod,
        ast.Pow,
        ast.BitAnd,
        ast.BitOr,
        ast.BitXor,
        ast.LShift,
        ast.RShift,
        # Unary operators
        ast.UAdd,
        ast.USub,
        ast.Not,
        ast.Invert,
        # Boolean operators
        ast.And,
        ast.Or,
        # Comparison operators
        ast.Eq,
        ast.NotEq,
        ast.Lt,
        ast.LtE,
        ast.Gt,
        ast.GtE,
        ast.In,
        ast.NotIn,
        ast.Is,
        ast.IsNot,
        # Statements
        ast.Assign,
        ast.AugAssign,
        ast.Return,
        ast.If,
        ast.For,
        ast.While,
        ast.Break,
        ast.Continue,
        ast.Pass,
        # Targets / contexts
        ast.Store,
        ast.Load,
        ast.Del,
        # Function definitions
        ast.FunctionDef,
        ast.arguments,
        ast.arg,
        # Top-level wrappers
        ast.Module,
    }
)

# Names that must never appear as identifiers in user code
_FORBIDDEN_NAMES = frozenset(
    {
        "__import__",
        "globals",
        "locals",
        "vars",
        "dir",
        "getattr",
        "setattr",
        "delattr",
        "type",
        "__builtins__",
        "__subclasses__",
        "open",
        "input",
        "print",
        "breakpoint",
        "quit",
        "help",
    }
)

# Attributes that must never be accessed on any object
_FORBIDDEN_ATTRS = frozenset(
    {
        "__class__",
        "__bases__",
        "__subclasses__",
        "__globals__",
        "__code__",
        "__closure__",
        "__dict__",
        "__module__",
        "__import__",
        "__builtins__",
        "__getattr__",
        "__setattr__",
        "__delattr__",
    }
)


class TransformSecurityError(Exception):
    """Raised when a code snippet contains disallowed operations."""


def _validate_ast(tree: ast.AST) -> None:
    """Walk every node and reject anything outside the whitelist."""
    for node in ast.walk(tree):
        node_type = type(node)

        if node_type not in _ALLOWED_NODES:
            raise TransformSecurityError(
                f"Disallowed syntax: {node_type.__name__} "
                f"(line {getattr(node, 'lineno', '?')})"
            )

        if node_type is ast.Name and node.id in _FORBIDDEN_NAMES:
            raise TransformSecurityError(
                f"Disallowed name: '{node.id}' (line {node.lineno})"
            )

        if node_type is ast.Attribute and node.attr in _FORBIDDEN_ATTRS:
            raise TransformSecurityError(
                f"Disallowed attribute: '.{node.attr}' (line {node.lineno})"
            )

        if node_type is ast.FunctionDef and node.decorator_list:
            raise TransformSecurityError(
                f"Decorators are not allowed (line {node.lineno})"
            )


# ---------------------------------------------------------------------------
# Sandboxed evaluator — interprets the AST directly
# ---------------------------------------------------------------------------
class _SandboxedInterpreter:
    """Interpret a validated AST within a controlled namespace."""

    MAX_ITERATIONS = 10_000
    MAX_COLLECTION_SIZE = 100_000

    def __init__(self, namespace: dict[str, Any]) -> None:
        self._ns = namespace
        self._iterations = 0
        self._functions: dict[str, ast.FunctionDef] = {}

    def run(self, tree: ast.Module) -> Any:
        result = None
        for stmt in tree.body:
            result = self._run_stmt(stmt)
            if isinstance(result, _ReturnSignal):
                return result.value
        return result

    # -- statements ----------------------------------------------------------

    def _run_stmt(self, node: ast.stmt) -> Any:
        if isinstance(node, ast.Expr):
            return self._interpret(node.value)

        if isinstance(node, ast.Assign):
            value = self._interpret(node.value)
            for target in node.targets:
                self._assign(target, value)
            return None

        if isinstance(node, ast.AugAssign):
            current = self._interpret(node.target)
            value = self._interpret(node.value)
            op = _BIN_OPS.get(type(node.op))
            if op is None:
                raise TransformSecurityError(
                    f"Unsupported operator: {type(node.op).__name__}"
                )
            result = op(current, value)
            self._assign(node.target, result)
            return None

        if isinstance(node, ast.If):
            branch = node.body if self._interpret(node.test) else node.orelse
            return self._run_body(branch)

        if isinstance(node, ast.For):
            return self._run_for(node)

        if isinstance(node, ast.While):
            return self._run_while(node)

        if isinstance(node, ast.Return):
            value = self._interpret(node.value) if node.value else None
            return _ReturnSignal(value)

        if isinstance(node, ast.FunctionDef):
            self._functions[node.name] = node
            self._ns[node.name] = _UserDefinedFunc(node.name)
            return None

        if isinstance(node, (ast.Break, ast.Continue, ast.Pass)):
            return node

        raise TransformSecurityError(
            f"Unsupported statement: {type(node).__name__}"
        )

    def _run_body(self, body: list[ast.stmt]) -> Any:
        for stmt in body:
            result = self._run_stmt(stmt)
            if isinstance(result, (_ReturnSignal, ast.Break, ast.Continue)):
                return result
        return None

    def _run_for(self, node: ast.For) -> Any:
        iterable = self._interpret(node.iter)
        for item in iterable:
            self._tick()
            self._assign(node.target, item)
            result = self._run_body(node.body)
            if isinstance(result, ast.Break):
                break
            if isinstance(result, _ReturnSignal):
                return result
        else:
            self._run_body(node.orelse)
        return None

    def _run_while(self, node: ast.While) -> Any:
        while self._interpret(node.test):
            self._tick()
            result = self._run_body(node.body)
            if isinstance(result, ast.Break):
                break
            if isinstance(result, _ReturnSignal):
                return result
        else:
            self._run_body(node.orelse)
        return None

    def _tick(self) -> None:
        self._iterations += 1
        if self._iterations > self.MAX_ITERATIONS:
            raise TransformSecurityError(
                f"Iteration limit exceeded ({self.MAX_ITERATIONS})"
            )

    # -- expressions ---------------------------------------------------------

    def _interpret(self, node: ast.expr) -> Any:
        if isinstance(node, ast.Constant):
            return node.value

        if isinstance(node, ast.Name):
            if node.id in self._ns:
                return self._ns[node.id]
            raise NameError(f"Undefined name: '{node.id}'")

        if isinstance(node, ast.List):
            result = [self._interpret(e) for e in node.elts]
            self._check_size(result)
            return result

        if isinstance(node, ast.Tuple):
            return tuple(self._interpret(e) for e in node.elts)

        if isinstance(node, ast.Set):
            return {self._interpret(e) for e in node.elts}

        if isinstance(node, ast.Dict):
            return {
                self._interpret(k): self._interpret(v)
                for k, v in zip(node.keys, node.values)
            }

        if isinstance(node, ast.BinOp):
            left = self._interpret(node.left)
            right = self._interpret(node.right)
            op = _BIN_OPS.get(type(node.op))
            if op is None:
                raise TransformSecurityError(
                    f"Unsupported operator: {type(node.op).__name__}"
                )
            result = op(left, right)
            if isinstance(result, (list, str)) and len(result) > self.MAX_COLLECTION_SIZE:
                raise TransformSecurityError("Result too large")
            return result

        if isinstance(node, ast.UnaryOp):
            operand = self._interpret(node.operand)
            op = _UNARY_OPS.get(type(node.op))
            if op is None:
                raise TransformSecurityError(
                    f"Unsupported unary operator: {type(node.op).__name__}"
                )
            return op(operand)

        if isinstance(node, ast.BoolOp):
            if isinstance(node.op, ast.And):
                result = True
                for v in node.values:
                    result = self._interpret(v)
                    if not result:
                        return result
                return result
            else:
                result = False
                for v in node.values:
                    result = self._interpret(v)
                    if result:
                        return result
                return result

        if isinstance(node, ast.Compare):
            left = self._interpret(node.left)
            for op_node, comparator in zip(node.ops, node.comparators):
                right = self._interpret(comparator)
                cmp_fn = _CMP_OPS.get(type(op_node))
                if cmp_fn is None:
                    raise TransformSecurityError(
                        f"Unsupported comparator: {type(op_node).__name__}"
                    )
                if not cmp_fn(left, right):
                    return False
                left = right
            return True

        if isinstance(node, ast.IfExp):
            if self._interpret(node.test):
                return self._interpret(node.body)
            return self._interpret(node.orelse)

        if isinstance(node, ast.Subscript):
            value = self._interpret(node.value)
            slc = self._interpret_slice(node.slice)
            return value[slc]

        if isinstance(node, ast.Attribute):
            return self._interpret_attribute(node)

        if isinstance(node, ast.Call):
            return self._interpret_call(node)

        if isinstance(node, ast.ListComp):
            return self._interpret_comprehension(node, list)

        if isinstance(node, ast.SetComp):
            return self._interpret_comprehension(node, set)

        if isinstance(node, ast.DictComp):
            return self._interpret_dict_comprehension(node)

        if isinstance(node, ast.GeneratorExp):
            return self._interpret_comprehension(node, list)

        raise TransformSecurityError(
            f"Unsupported expression: {type(node).__name__}"
        )

    def _interpret_slice(self, node: ast.expr) -> Any:
        if isinstance(node, ast.Slice):
            return slice(
                self._interpret(node.lower) if node.lower else None,
                self._interpret(node.upper) if node.upper else None,
                self._interpret(node.step) if node.step else None,
            )
        return self._interpret(node)

    def _interpret_attribute(self, node: ast.Attribute) -> Any:
        value = self._interpret(node.value)
        attr = node.attr

        if isinstance(value, dict) and attr in (
            "keys", "values", "items", "get", "copy", "update",
            "pop", "setdefault",
        ):
            return getattr(value, attr)

        if isinstance(value, (list, tuple)) and attr in (
            "append", "extend", "insert", "pop", "remove",
            "sort", "reverse", "copy", "count", "index",
        ):
            return getattr(value, attr)

        if isinstance(value, str) and attr in (
            "upper", "lower", "strip", "lstrip", "rstrip", "split",
            "join", "replace", "startswith", "endswith", "find",
            "count", "isdigit", "isalpha", "title", "capitalize",
        ):
            return getattr(value, attr)

        if isinstance(value, set) and attr in (
            "add", "discard", "remove", "union", "intersection",
            "difference", "copy",
        ):
            return getattr(value, attr)

        if isinstance(value, _MathNamespace):
            if attr in _SAFE_MATH:
                return _SAFE_MATH[attr]
            raise TransformSecurityError(
                f"Disallowed math attribute: '{attr}'"
            )

        raise TransformSecurityError(
            f"Attribute access '.{attr}' not allowed on {type(value).__name__}"
        )

    def _interpret_call(self, node: ast.Call) -> Any:
        func = self._interpret(node.func)
        args = [self._interpret(a) for a in node.args]
        kwargs = {kw.arg: self._interpret(kw.value) for kw in node.keywords}

        if isinstance(func, _UserDefinedFunc):
            return self._call_user_func(func.name, args, kwargs)

        if callable(func):
            result = func(*args, **kwargs)
            if isinstance(result, (list, dict, set)):
                self._check_size(result)
            return result

        raise TransformSecurityError(
            f"Object is not callable: {type(func).__name__}"
        )

    def _call_user_func(
        self, name: str, args: list[Any], kwargs: dict[str, Any]
    ) -> Any:
        func_def = self._functions[name]
        local_ns = dict(self._ns)
        params = func_def.args
        for i, arg_node in enumerate(params.args):
            if i < len(args):
                local_ns[arg_node.arg] = args[i]
            elif arg_node.arg in kwargs:
                local_ns[arg_node.arg] = kwargs[arg_node.arg]
            else:
                default_idx = i - (len(params.args) - len(params.defaults))
                if default_idx >= 0:
                    local_ns[arg_node.arg] = self._interpret(
                        params.defaults[default_idx]
                    )

        child = _SandboxedInterpreter(local_ns)
        child._functions = self._functions
        child._iterations = self._iterations
        result = child.run(ast.Module(body=func_def.body, type_ignores=[]))
        self._iterations = child._iterations
        if isinstance(result, _ReturnSignal):
            return result.value
        return result

    def _interpret_comprehension(self, node: ast.expr, factory: type) -> Any:
        results: list[Any] = []
        self._interpret_comp_generators(node, node.generators, 0, results)
        self._check_size(results)
        if factory is set:
            return set(results)
        return results

    def _interpret_dict_comprehension(self, node: ast.DictComp) -> dict:
        results: list[tuple[Any, Any]] = []
        self._interpret_comp_generators(node, node.generators, 0, results)
        self._check_size(results)
        return dict(results)

    def _interpret_comp_generators(
        self,
        node: ast.expr,
        generators: list[ast.comprehension],
        idx: int,
        results: list,
    ) -> None:
        if idx >= len(generators):
            if isinstance(node, ast.DictComp):
                results.append(
                    (self._interpret(node.key), self._interpret(node.value))
                )
            else:
                results.append(self._interpret(node.elt))
            return

        gen = generators[idx]
        iterable = self._interpret(gen.iter)
        for item in iterable:
            self._tick()
            self._assign(gen.target, item)
            if all(self._interpret(clause) for clause in gen.ifs):
                self._interpret_comp_generators(
                    node, generators, idx + 1, results
                )

    def _assign(self, target: ast.expr, value: Any) -> None:
        if isinstance(target, ast.Name):
            if target.id in _FORBIDDEN_NAMES:
                raise TransformSecurityError(
                    f"Cannot assign to '{target.id}'"
                )
            self._ns[target.id] = value
        elif isinstance(target, (ast.Tuple, ast.List)):
            values = list(value)
            for t, v in zip(target.elts, values):
                self._assign(t, v)
        elif isinstance(target, ast.Subscript):
            obj = self._interpret(target.value)
            slc = self._interpret_slice(target.slice)
            obj[slc] = value
        else:
            raise TransformSecurityError(
                f"Unsupported assignment target: {type(target).__name__}"
            )

    def _check_size(self, collection: Any) -> None:
        if hasattr(collection, "__len__") and len(collection) > self.MAX_COLLECTION_SIZE:
            raise TransformSecurityError(
                f"Collection exceeds size limit ({self.MAX_COLLECTION_SIZE})"
            )


class _ReturnSignal:
    """Internal signal for propagating return values up the call stack."""

    def __init__(self, value: Any) -> None:
        self.value = value


class _UserDefinedFunc:
    """Represents a user-defined function inside the sandbox."""

    def __init__(self, name: str) -> None:
        self.name = name


class _MathNamespace:
    """Marker object for the 'math' namespace inside the sandbox."""


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def run_transform(code_snippet: str, dataset: dict) -> Any:
    """Run a data-transformation snippet against *dataset* in a sandbox.

    The snippet is parsed into an AST, validated against a strict whitelist,
    and then interpreted directly. The variable ``data`` is pre-bound to a
    deep copy of *dataset* so the caller's original is never mutated.

    Parameters
    ----------
    code_snippet : str
        A Python snippet that operates on a variable called ``data``.
    dataset : dict
        The input dataset, accessible as ``data`` inside the snippet.

    Returns
    -------
    Any
        The value of ``data`` after the snippet runs, or the last
        expression value if ``data`` was not reassigned.

    Raises
    ------
    TransformSecurityError
        If the snippet contains disallowed syntax or operations.
    SyntaxError
        If the snippet is not valid Python.
    """
    if not isinstance(code_snippet, str):
        raise TypeError("code_snippet must be a string")
    if not isinstance(dataset, dict):
        raise TypeError("dataset must be a dict")

    # 1. Parse into AST
    tree = ast.parse(code_snippet, mode="exec")

    # 2. Validate against whitelist
    _validate_ast(tree)

    # 3. Build sandboxed namespace
    namespace: dict[str, Any] = {
        **_SAFE_BUILTINS,
        "math": _MathNamespace(),
        "data": copy.deepcopy(dataset),
    }

    # 4. Interpret the AST directly
    interpreter = _SandboxedInterpreter(namespace)
    last_value = interpreter.run(tree)

    # 5. Return the transformed data
    return namespace.get("data", last_value)

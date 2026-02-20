import ast
import operator

ops = {ast.Add: operator.add, ast.Sub: operator.sub,
       ast.Mult: operator.mul, ast.Div: operator.truediv,
       ast.Pow: operator.pow, ast.USub: operator.neg}

def calc(node):
    if isinstance(node, ast.Num): return node.n
    if isinstance(node, ast.UnaryOp): return ops[type(node.op)](calc(node.operand))
    if isinstance(node, ast.BinOp): return ops[type(node.op)](calc(node.left), calc(node.right))
    raise ValueError(f"Unsupported: {node}")

print(calc(ast.parse(input().strip(), mode="eval").body))

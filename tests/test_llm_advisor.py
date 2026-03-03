"""
LLM Advisor — Optional advisory analysis tests.
Python equivalent of test-llm-advisor.mjs
Run: python3 -m unittest tests/test_llm_advisor.py -v
"""

import os
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "python"))
from quadruple_verification import _parse_advisory_findings, _run_llm_advisory


# ─── _parse_advisory_findings ─────────────────────────────────────────────────

class TestParseAdvisoryFindings(unittest.TestCase):
    def test_parses_valid_json_array(self):
        text = '[{"severity":"high","category":"security","description":"SQL injection","line_hint":"15"}]'
        result = _parse_advisory_findings(text)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["severity"], "high")
        self.assertEqual(result[0]["category"], "security")

    def test_parses_empty_array(self):
        self.assertEqual(_parse_advisory_findings("[]"), [])

    def test_parses_json_in_code_block(self):
        text = '```json\n[{"severity":"low","category":"quality","description":"test","line_hint":"1"}]\n```'
        result = _parse_advisory_findings(text)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["severity"], "low")

    def test_extracts_array_from_surrounding_text(self):
        text = (
            "Here are the findings:\n"
            '[{"severity":"medium","category":"performance","description":"slow loop","line_hint":"42"}]\n'
            "End of analysis."
        )
        result = _parse_advisory_findings(text)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["category"], "performance")

    def test_returns_empty_for_none(self):
        self.assertEqual(_parse_advisory_findings(None), [])
        self.assertEqual(_parse_advisory_findings(""), [])

    def test_returns_empty_for_invalid_json(self):
        self.assertEqual(_parse_advisory_findings("not json at all"), [])
        self.assertEqual(_parse_advisory_findings("{invalid}"), [])

    def test_handles_multiple_findings(self):
        import json
        findings = [
            {"severity": "high", "category": "security", "description": "XSS", "line_hint": "10"},
            {"severity": "medium", "category": "quality", "description": "Missing null check", "line_hint": "25"},
            {"severity": "low", "category": "performance", "description": "Unnecessary loop", "line_hint": "40"},
        ]
        result = _parse_advisory_findings(json.dumps(findings))
        self.assertEqual(len(result), 3)


# ─── _run_llm_advisory guard conditions ───────────────────────────────────────

class TestRunLlmAdvisoryGuards(unittest.TestCase):
    def test_returns_empty_when_disabled(self):
        result = _run_llm_advisory("some content", {"llm": {"enabled": False}})
        self.assertEqual(result, [])

    def test_returns_empty_when_no_llm_key(self):
        result = _run_llm_advisory("some content", {})
        self.assertEqual(result, [])

    def test_returns_empty_when_content_too_short(self):
        result = _run_llm_advisory("short", {"llm": {"enabled": True}})
        self.assertEqual(result, [])

    def test_returns_empty_when_content_empty(self):
        result = _run_llm_advisory("", {"llm": {"enabled": True}})
        self.assertEqual(result, [])

    def test_returns_empty_when_api_key_not_set(self):
        original = os.environ.pop("ANTHROPIC_API_KEY", None)
        try:
            result = _run_llm_advisory("a" * 100, {"llm": {"enabled": True}})
            self.assertEqual(result, [])
        finally:
            if original is not None:
                os.environ["ANTHROPIC_API_KEY"] = original


if __name__ == "__main__":
    unittest.main(verbosity=2)

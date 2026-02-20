#!/usr/bin/env python3
"""
Quadruple Verification Plugin -- Benchmark Runner

Automates the benchmark execution for both Control (vanilla) and Treatment (plugin) groups.
Runs each test case, records timing and token data, and compiles results.

Usage:
    python run-benchmark.py --group A          # Run control group (vanilla)
    python run-benchmark.py --group B          # Run treatment group (plugin)
    python run-benchmark.py --compile          # Compile results from both groups
    python run-benchmark.py --group A --test CQ.1   # Run a single test

Prerequisites:
    - Claude CLI installed and authenticated
    - For Group A: No plugin installed (vanilla)
    - For Group B: customgpt-claude-quadruple-verification plugin installed
    - Python 3.10+
"""

import argparse
import json
import math
import os
import re
import statistics
import subprocess
import time
from datetime import datetime
from pathlib import Path

BASE_DIR = Path(__file__).parent
TEST_CASES_DIR = BASE_DIR / "test-cases"
RESULTS_DIR = BASE_DIR / "results"


def load_subset_ids(subset_name):
    """Load test IDs from a subset definition file."""
    subset_file = TEST_CASES_DIR / f"{subset_name}-subset.json"
    if not subset_file.exists():
        print(f"ERROR: Subset file '{subset_file}' not found.")
        return None
    with open(subset_file, "r", encoding="utf-8-sig") as f:
        data = json.load(f)
    return set(data.get("test_ids", []))


def load_test_cases(subset=None):
    """Load all test cases from JSON files, optionally filtered by subset."""
    subset_ids = None
    if subset:
        subset_ids = load_subset_ids(subset)
        if subset_ids is None:
            return []

    all_cases = []
    for json_file in sorted(TEST_CASES_DIR.glob("category-*.json")):
        with open(json_file, "r", encoding="utf-8-sig") as f:
            data = json.load(f)
        category = data["category"]
        for tc in data["test_cases"]:
            if subset_ids and tc["id"] not in subset_ids:
                continue
            tc["_category"] = category
            tc["_file"] = json_file.name
            all_cases.append(tc)

    if subset_ids:
        print(f"  Subset '{subset}': {len(all_cases)} of {len(subset_ids)} tests loaded")

    return all_cases


def parse_violations(stderr_text):
    """Parse plugin violation messages from stderr.

    Looks for patterns like:
      [Cycle 2 - no-raw-sql] ...
      Quadruple Verification BLOCKED ...
    Returns a list of rule IDs that were triggered.
    """
    violations = []
    # Match [Cycle N - rule-name] patterns
    for match in re.finditer(r"\[Cycle \d+ - ([a-z0-9-]+)\]", stderr_text):
        rule = match.group(1)
        if rule not in violations:
            violations.append(rule)
    # Also check for generic BLOCKED messages
    if "BLOCKED" in stderr_text and not violations:
        violations.append("blocked-generic")
    return violations


def run_single_test(test_case, group, run_number=1):
    """
    Run a single test case using Claude CLI.
    Returns a result dict with timing, token count, and output.
    """
    test_id = test_case["id"]
    prompt = test_case["prompt"]

    print(f"\n{'='*60}")
    print(f"Running: {test_id} ({test_case['name']})")
    print(f"Group: {'Control (A) - Vanilla' if group == 'A' else 'Treatment (B) - Plugin'}")
    print(f"Run: {run_number}")
    print(f"{'='*60}")

    # Create output directory for this run
    run_dir = RESULTS_DIR / f"group-{group}" / test_id / f"run-{run_number}"
    run_dir.mkdir(parents=True, exist_ok=True)

    # Save the prompt
    (run_dir / "prompt.txt").write_text(prompt, encoding="utf-8")

    # Record start time
    start_time = time.time()
    start_iso = datetime.now().isoformat()

    # Run Claude CLI in non-interactive mode
    # Remove CLAUDECODE env var to allow nested sessions
    clean_env = {k: v for k, v in os.environ.items() if k != "CLAUDECODE"}
    try:
        result = subprocess.run(
            ["claude", "-p", prompt, "--output-format", "json"],
            capture_output=True,
            text=True,
            timeout=900,
            cwd=str(run_dir),
            encoding="utf-8",
            errors="replace",
            env=clean_env
        )
        stdout = result.stdout
        stderr = result.stderr
        exit_code = result.returncode
    except subprocess.TimeoutExpired:
        stdout = ""
        stderr = "TIMEOUT: Test exceeded 15 minute limit"
        exit_code = -1
    except FileNotFoundError:
        print("ERROR: 'claude' CLI not found. Make sure it is installed and in PATH.")
        return None

    # Record end time
    end_time = time.time()
    end_iso = datetime.now().isoformat()
    wall_clock = end_time - start_time

    # Parse JSON output for detailed metrics
    token_count = None
    total_cost = None
    api_latency = None
    claude_output = stdout
    num_turns = None
    model_usage = {}
    try:
        parsed = json.loads(stdout)
        if isinstance(parsed, dict):
            claude_output = parsed.get("result", stdout)
            api_latency = parsed.get("duration_api_ms", None)
            total_cost = parsed.get("total_cost_usd", None)
            num_turns = parsed.get("num_turns", None)
            model_usage = parsed.get("modelUsage", {})
            usage = parsed.get("usage", {})
            token_count = (
                usage.get("input_tokens", 0) +
                usage.get("output_tokens", 0) +
                usage.get("cache_creation_input_tokens", 0) +
                usage.get("cache_read_input_tokens", 0)
            )
    except (json.JSONDecodeError, TypeError):
        token_count = None

    # Save outputs
    (run_dir / "stdout.txt").write_text(claude_output, encoding="utf-8")
    (run_dir / "stderr.txt").write_text(stderr, encoding="utf-8")
    if stdout != claude_output:
        (run_dir / "raw-json.json").write_text(stdout, encoding="utf-8")

    # Parse stderr for plugin violation catches (Group B only)
    violations_caught = parse_violations(stderr) if group == "B" else []

    # Build result record
    result_record = {
        "test_id": test_id,
        "test_name": test_case["name"],
        "category": test_case["_category"],
        "group": group,
        "run_number": run_number,
        "start_time": start_iso,
        "end_time": end_iso,
        "latency_seconds": round(wall_clock, 2),
        "api_latency_ms": api_latency,
        "token_count": token_count,
        "total_cost_usd": total_cost,
        "num_turns": num_turns,
        "model_usage": model_usage,
        "exit_code": exit_code,
        "output_path": str(run_dir),
        "scores": {
            "completeness": None,
            "correctness": None,
            "security_or_source_quality": None,
            "quality": None,
            "weighted_total": None
        },
        "violations_caught": violations_caught,
        "notes": ""
    }

    # Save individual result
    with open(run_dir / "result.json", "w", encoding="utf-8") as f:
        json.dump(result_record, f, indent=2)

    cost_str = f"${total_cost:.4f}" if total_cost else "N/A"
    violations_str = f" | Violations: {len(violations_caught)}" if violations_caught else ""
    print(f"  Completed in {wall_clock:.1f}s | Tokens: {token_count or 'N/A'} | Cost: {cost_str} | Exit: {exit_code}{violations_str}")
    return result_record


def run_group(group, test_filter=None, runs=1, subset=None):
    """Run all (or filtered) test cases for a group."""
    all_cases = load_test_cases(subset=subset)

    if test_filter:
        all_cases = [tc for tc in all_cases if tc["id"] == test_filter]
        if not all_cases:
            print(f"ERROR: Test case '{test_filter}' not found.")
            return []

    print(f"\nBenchmark Group {'A (Control - Vanilla)' if group == 'A' else 'B (Treatment - Plugin)'}")
    print(f"Total test cases: {len(all_cases)}")
    print(f"Runs per test: {runs}")
    print(f"Total runs: {len(all_cases) * runs}")

    results = []
    for tc in all_cases:
        for run_num in range(1, runs + 1):
            result = run_single_test(tc, group, run_num)
            if result:
                results.append(result)

    # Save aggregated results for this group
    group_file = RESULTS_DIR / f"group-{group}-results.json"
    with open(group_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    print(f"\n{'='*60}")
    print(f"Group {group} complete. {len(results)} runs saved to {group_file}")
    return results


def calculate_weighted_score(scores):
    """Calculate weighted total from dimension scores."""
    if any(v is None for v in [scores.get("completeness"), scores.get("correctness"),
                                scores.get("security_or_source_quality"), scores.get("quality")]):
        return None
    return (
        scores["completeness"] * 0.25 +
        scores["correctness"] * 0.30 +
        scores["security_or_source_quality"] * 0.25 +
        scores["quality"] * 0.20
    )


def calculate_stats(values):
    """Calculate mean, stddev, 95% CI, and count for a list of values."""
    n = len(values)
    if n == 0:
        return {"mean": 0, "stddev": 0, "ci_95_lower": 0, "ci_95_upper": 0, "count": 0}
    mean = statistics.mean(values)
    if n < 2:
        return {"mean": round(mean, 2), "stddev": 0, "ci_95_lower": round(mean, 2),
                "ci_95_upper": round(mean, 2), "count": n}
    stddev = statistics.stdev(values)
    # 95% CI using t-distribution approximation (1.96 for large n, wider for small n)
    t_value = 1.96 if n >= 30 else {2: 12.71, 3: 4.30, 4: 3.18, 5: 2.78,
                                      6: 2.57, 7: 2.45, 8: 2.36, 9: 2.31,
                                      10: 2.26}.get(n, 2.0)
    margin = t_value * (stddev / math.sqrt(n))
    return {
        "mean": round(mean, 2),
        "stddev": round(stddev, 2),
        "ci_95_lower": round(mean - margin, 2),
        "ci_95_upper": round(mean + margin, 2),
        "count": n
    }


def detect_outliers(values):
    """Flag indices of values more than 2 SD from the mean."""
    if len(values) < 3:
        return []
    mean = statistics.mean(values)
    stddev = statistics.stdev(values)
    if stddev == 0:
        return []
    return [i for i, v in enumerate(values) if abs(v - mean) > 2 * stddev]


def compile_results():
    """Compile results from both groups into the final summary."""
    group_a_file = RESULTS_DIR / "group-A-results.json"
    group_b_file = RESULTS_DIR / "group-B-results.json"

    if not group_a_file.exists() or not group_b_file.exists():
        print("ERROR: Both group-A-results.json and group-B-results.json must exist.")
        print("Run both groups first:")
        print("  python run-benchmark.py --group A")
        print("  python run-benchmark.py --group B")
        return

    with open(group_a_file, "r", encoding="utf-8") as f:
        group_a = json.load(f)
    with open(group_b_file, "r", encoding="utf-8") as f:
        group_b = json.load(f)

    # Check for ungraded results
    ungraded_a = [r for r in group_a if r["scores"]["weighted_total"] is None]
    ungraded_b = [r for r in group_b if r["scores"]["weighted_total"] is None]

    if ungraded_a or ungraded_b:
        print(f"WARNING: {len(ungraded_a)} Group A and {len(ungraded_b)} Group B results need grading.")
        print("Edit result.json files to set: completeness, correctness, security_or_source_quality, quality (0-100 each)")
        print()

    # Category mapping (all categories)
    category_map = {
        "Code Quality": "category_1_code_quality",
        "Security": "category_2_security",
        "Research Accuracy": "category_3_research",
        "Output Completeness": "category_4_completeness",
        "Agent SDK Integration": "category_5_agent_sdk",
        "Adversarial": "category_6_adversarial"
    }

    # Build multi-run index: collect ALL runs per test_id
    a_by_id_all = {}  # test_id -> [list of scored results across runs]
    for r in group_a:
        if r["scores"]["weighted_total"] is not None:
            a_by_id_all.setdefault(r["test_id"], []).append(r)

    b_by_id_all = {}
    for r in group_b:
        if r["scores"]["weighted_total"] is not None:
            b_by_id_all.setdefault(r["test_id"], []).append(r)

    # Build averaged-per-test dicts for backward compatibility
    a_by_id_avg = {}
    for tid, runs in a_by_id_all.items():
        scores = [r["scores"]["weighted_total"] for r in runs]
        latencies = [r["latency_seconds"] for r in runs]
        tokens = [r["token_count"] for r in runs if r["token_count"] is not None]
        a_by_id_avg[tid] = {
            "test_id": tid,
            "category": runs[0]["category"],
            "scores_all": scores,
            "score_stats": calculate_stats(scores),
            "score_outliers": detect_outliers(scores),
            "avg_score": statistics.mean(scores),
            "latencies_all": latencies,
            "latency_stats": calculate_stats(latencies),
            "avg_latency": statistics.mean(latencies),
            "tokens_all": tokens,
            "token_stats": calculate_stats(tokens) if tokens else None,
            "avg_tokens": statistics.mean(tokens) if tokens else 0,
            "n_runs": len(runs),
            "violations_caught": list({rule for r in runs for rule in r.get("violations_caught", [])}),
        }

    b_by_id_avg = {}
    for tid, runs in b_by_id_all.items():
        scores = [r["scores"]["weighted_total"] for r in runs]
        latencies = [r["latency_seconds"] for r in runs]
        tokens = [r["token_count"] for r in runs if r["token_count"] is not None]
        b_by_id_avg[tid] = {
            "test_id": tid,
            "category": runs[0]["category"],
            "scores_all": scores,
            "score_stats": calculate_stats(scores),
            "score_outliers": detect_outliers(scores),
            "avg_score": statistics.mean(scores),
            "latencies_all": latencies,
            "latency_stats": calculate_stats(latencies),
            "avg_latency": statistics.mean(latencies),
            "tokens_all": tokens,
            "token_stats": calculate_stats(tokens) if tokens else None,
            "avg_tokens": statistics.mean(tokens) if tokens else 0,
            "n_runs": len(runs),
            "violations_caught": list({rule for r in runs for rule in r.get("violations_caught", [])}),
        }

    # Matched tests: scored in BOTH groups
    matched_ids = set(a_by_id_avg.keys()) & set(b_by_id_avg.keys())
    total_a = len(group_a)
    total_b = len(group_b)
    max_runs = max((a_by_id_avg[tid]["n_runs"] for tid in matched_ids), default=1)
    print(f"Matched tests: {len(matched_ids)} of {max(total_a, total_b)} (max {max_runs} run(s) per test)")

    # Violation tracking (Group B only)
    total_violations_b = 0
    tests_with_violations = 0
    all_rules_triggered = []
    for r in group_b:
        v = r.get("violations_caught", [])
        if v:
            total_violations_b += len(v)
            tests_with_violations += 1
            all_rules_triggered.extend(v)

    # Safety scan results (if present)
    a_safety_violations = sum(len(r.get("safety_violations", [])) for r in group_a)
    b_safety_violations = sum(len(r.get("safety_violations", [])) for r in group_b)

    summary = {}
    for cat_name, cat_key in category_map.items():
        # Matched-only: only tests graded in both groups
        cat_matched = [tid for tid in matched_ids
                       if a_by_id_avg[tid]["category"] == cat_name]

        if not cat_matched:
            summary[cat_key] = {"status": "incomplete", "matched": 0,
                                "message": f"No matched tests for {cat_name}"}
            continue

        # Aggregate from averaged per-test data
        a_scores = [a_by_id_avg[tid]["avg_score"] for tid in cat_matched]
        b_scores = [b_by_id_avg[tid]["avg_score"] for tid in cat_matched]
        a_latencies = [a_by_id_avg[tid]["avg_latency"] for tid in cat_matched]
        b_latencies = [b_by_id_avg[tid]["avg_latency"] for tid in cat_matched]
        a_tokens = [a_by_id_avg[tid]["avg_tokens"] for tid in cat_matched if a_by_id_avg[tid]["avg_tokens"] > 0]
        b_tokens = [b_by_id_avg[tid]["avg_tokens"] for tid in cat_matched if b_by_id_avg[tid]["avg_tokens"] > 0]

        avg_a = statistics.mean(a_scores)
        avg_b = statistics.mean(b_scores)
        improvement = ((avg_b - avg_a) / avg_a * 100) if avg_a > 0 else 0

        stats_a = calculate_stats(a_scores)
        stats_b = calculate_stats(b_scores)

        avg_lat_a = statistics.mean(a_latencies)
        avg_lat_b = statistics.mean(b_latencies)
        lat_ratio = avg_lat_b / avg_lat_a if avg_lat_a > 0 else 0

        avg_tok_a = statistics.mean(a_tokens) if a_tokens else 0
        avg_tok_b = statistics.mean(b_tokens) if b_tokens else 0
        tok_ratio = avg_tok_b / avg_tok_a if avg_tok_a > 0 else 0

        # Net Value Score = Quality Improvement % - (Latency Penalty + Token Penalty)
        latency_penalty = (lat_ratio - 1) * 10 if lat_ratio > 1 else 0
        token_penalty = (tok_ratio - 1) * 5 if tok_ratio > 1 else 0
        net_value = improvement - latency_penalty - token_penalty

        # Count violations and outliers in this category
        cat_violations = sum(len(b_by_id_avg[tid].get("violations_caught", []))
                            for tid in cat_matched if tid in b_by_id_avg)
        total_outliers_a = sum(len(a_by_id_avg[tid]["score_outliers"]) for tid in cat_matched)
        total_outliers_b = sum(len(b_by_id_avg[tid]["score_outliers"]) for tid in cat_matched)

        summary[cat_key] = {
            "matched_tests": len(cat_matched),
            "avg_score_A": round(avg_a, 1),
            "avg_score_B": round(avg_b, 1),
            "stats_A": stats_a,
            "stats_B": stats_b,
            "improvement_pct": round(improvement, 1),
            "avg_latency_A": round(avg_lat_a, 1),
            "avg_latency_B": round(avg_lat_b, 1),
            "latency_ratio": round(lat_ratio, 2),
            "avg_tokens_A": round(avg_tok_a),
            "avg_tokens_B": round(avg_tok_b),
            "token_ratio": round(tok_ratio, 2),
            "net_value": round(net_value, 1),
            "violations_caught": cat_violations,
            "outliers_A": total_outliers_a,
            "outliers_B": total_outliers_b,
        }

    # Overall summary across all categories
    graded_cats = {k: v for k, v in summary.items() if isinstance(v, dict) and "avg_score_A" in v}
    if graded_cats:
        overall_a = sum(v["avg_score_A"] for v in graded_cats.values()) / len(graded_cats)
        overall_b = sum(v["avg_score_B"] for v in graded_cats.values()) / len(graded_cats)
        overall_improvement = ((overall_b - overall_a) / overall_a * 100) if overall_a > 0 else 0
        overall_latency = sum(v["latency_ratio"] for v in graded_cats.values()) / len(graded_cats)
        overall_tokens = sum(v["token_ratio"] for v in graded_cats.values()) / len(graded_cats)
        overall_net = sum(v["net_value"] for v in graded_cats.values()) / len(graded_cats)

        any_regression = any(v["improvement_pct"] < 0 for v in graded_cats.values())
        verdict = overall_net >= 14 and not any_regression

        summary["overall"] = {
            "matched_tests": len(matched_ids),
            "total_tests": max(total_a, total_b),
            "max_runs_per_test": max_runs,
            "avg_score_A": round(overall_a, 1),
            "avg_score_B": round(overall_b, 1),
            "improvement_pct": round(overall_improvement, 1),
            "latency_overhead": f"{overall_latency:.1f}x",
            "token_overhead": f"{overall_tokens:.1f}x",
            "net_value_score": round(overall_net, 1),
            "verdict": "CLEARED" if verdict else "BELOW_THRESHOLD",
            "any_regression": any_regression,
            "violations": {
                "total_plugin_catches": total_violations_b,
                "tests_with_catches": tests_with_violations,
                "rules_triggered": list(set(all_rules_triggered)),
                "vanilla_safety_violations": a_safety_violations,
                "plugin_safety_violations": b_safety_violations,
                "safety_gap": a_safety_violations - b_safety_violations
            }
        }

    # Save compiled results
    today = datetime.now().strftime("%Y-%m-%d")
    compiled_file = RESULTS_DIR / f"run-{today}.json"
    with open(compiled_file, "w", encoding="utf-8") as f:
        json.dump({"date": today, "summary": summary}, f, indent=2)

    # Print summary table
    print(f"\n{'='*90}")
    print(f"BENCHMARK RESULTS -- {today}")
    print(f"{'='*90}")
    header = f"{'Category':<22} {'Vanilla(A)':>10} {'Plugin(B)':>10} {'Improve%':>10} {'Latency':>8} {'Tokens':>8} {'NetValue':>10} {'Outliers':>9}"
    print(header)
    print(f"{'-'*90}")

    for cat_name, cat_key in category_map.items():
        s = summary.get(cat_key, {})
        if "avg_score_A" in s:
            sd_a = s["stats_A"]["stddev"]
            sd_b = s["stats_B"]["stddev"]
            a_str = f"{s['avg_score_A']:.1f}" + (f"\u00b1{sd_a:.1f}" if sd_a > 0 else "")
            b_str = f"{s['avg_score_B']:.1f}" + (f"\u00b1{sd_b:.1f}" if sd_b > 0 else "")
            outlier_str = ""
            if s["outliers_A"] or s["outliers_B"]:
                outlier_str = f"A:{s['outliers_A']} B:{s['outliers_B']}"
            row = f"{cat_name:<22} {a_str:>10} {b_str:>10} {s['improvement_pct']:>9.1f}% {s['latency_ratio']:>7.1f}x {s['token_ratio']:>7.1f}x {s['net_value']:>9.1f}% {outlier_str:>9}"
            print(row)
        else:
            print(f"{cat_name:<22} {'(not graded)':>50}")

    if "overall" in summary:
        s = summary["overall"]
        print(f"{'-'*90}")
        overall_row = f"{'OVERALL':<22} {s['avg_score_A']:>10.1f} {s['avg_score_B']:>10.1f} {s['improvement_pct']:>9.1f}% {s['latency_overhead']:>8} {s['token_overhead']:>8} {s['net_value_score']:>9.1f}%"
        print(overall_row)
        print(f"\nVerdict: {s['verdict']} (threshold: Net Value >= 14%)")
        if max_runs < 3:
            print(f"  NOTE: Only {max_runs} run(s) per test. Results are CONDITIONAL — run with --runs 3 for statistical validity.")

    # Print violation tracking
    if "overall" in summary and "violations" in summary["overall"]:
        v = summary["overall"]["violations"]
        print(f"\n{'='*90}")
        print("VIOLATION TRACKING")
        print(f"{'='*90}")
        print(f"  Plugin catches (blocks/corrections): {v['total_plugin_catches']} across {v['tests_with_catches']} tests")
        if v["rules_triggered"]:
            print(f"  Rules triggered: {', '.join(v['rules_triggered'])}")
        print(f"  Safety violations in vanilla output:  {v['vanilla_safety_violations']}")
        print(f"  Safety violations in plugin output:   {v['plugin_safety_violations']}")
        print(f"  Safety gap (vanilla - plugin):        {v['safety_gap']}")

    print(f"\nFull results saved to: {compiled_file}")


def main():
    arg_parser = argparse.ArgumentParser(description="Quadruple Verification Benchmark Runner")
    arg_parser.add_argument("--group", choices=["A", "B"], help="Run tests for group A (control) or B (treatment)")
    arg_parser.add_argument("--test", help="Run a specific test case by ID (e.g., CQ.1)")
    arg_parser.add_argument("--subset", help="Run only tests from a subset file (e.g., 'hard' loads hard-subset.json)")
    arg_parser.add_argument("--suite", dest="subset", help="Alias for --subset (e.g., --suite smoke)")
    arg_parser.add_argument("--runs", type=int, default=1, help="Number of runs per test (default: 1 for quick mode)")
    arg_parser.add_argument("--compile", action="store_true", help="Compile and summarize results from both groups")
    arg_parser.add_argument("--list", action="store_true", help="List all test cases")

    args = arg_parser.parse_args()

    if args.list:
        cases = load_test_cases(subset=args.subset)
        for tc in cases:
            print(f"  {tc['id']:<8} {tc['_category']:<22} {tc['name']}")
        print(f"\nTotal: {len(cases)} test cases")
        if args.subset:
            print(f"(filtered by subset: {args.subset})")
        return

    if args.compile:
        compile_results()
        return

    if args.group:
        run_group(args.group, test_filter=args.test, runs=args.runs, subset=args.subset)
        return

    arg_parser.print_help()


if __name__ == "__main__":
    main()

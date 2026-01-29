#!/usr/bin/env python3
"""
Compodoc Analysis Tool

Provides comprehensive analysis of Angular documentation coverage, circular dependencies,
and module configuration issues in the generic-prime frontend application.

Usage:
    python3 compodoc-analyzer.py -doc         # Documentation coverage analysis
    python3 compodoc-analyzer.py -circular    # Circular dependency detection
    python3 compodoc-analyzer.py -module      # Module import/export analysis
    python3 compodoc-analyzer.py -all         # All analysis types
    python3 compodoc-analyzer.py -help        # Show help message
"""

import re
import json
import sys
import os
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Tuple, Set

# Project paths
PROJECT_ROOT = Path(__file__).parent.parent
FRONTEND_SRC = PROJECT_ROOT / 'frontend' / 'src'
COVERAGE_FILE = PROJECT_ROOT / 'frontend' / 'documents' / 'coverage.html'


def analyze_documentation_coverage():
    """Analyze documentation coverage from coverage.html file."""
    if not COVERAGE_FILE.exists():
        print("❌ Error: coverage.html not found. Run 'compodoc -p tsconfig.json' first.")
        return

    with open(COVERAGE_FILE, 'r') as f:
        content = f.read()

    # Extract table rows
    rows = re.findall(r'<tr[^>]*>(.*?)</tr>', content, re.DOTALL)

    data = []
    for row in rows[1:]:  # Skip header
        cells = re.findall(r'<td[^>]*>(.*?)</td>', row, re.DOTALL)
        if len(cells) >= 4:
            file_cell = re.sub(r'<[^>]+>', '', cells[0]).strip()
            type_cell = re.sub(r'<[^>]+>', '', cells[1]).strip()
            id_cell = re.sub(r'<[^>]+>', '', cells[2]).strip()
            cov_cell = re.sub(r'<[^>]+>', '', cells[3]).strip()

            pct_match = re.search(r'(\d+)', cov_cell)
            percentage = int(pct_match.group(1)) if pct_match else 0

            data.append({
                'file': file_cell,
                'type': type_cell,
                'identifier': id_cell,
                'coverage': percentage
            })

    # Calculate statistics
    total_items = len(data)
    fully_documented = sum(1 for d in data if d['coverage'] == 100)
    zero_documented = sum(1 for d in data if d['coverage'] == 0)
    partial_documented = total_items - fully_documented - zero_documented
    avg_coverage = sum(d['coverage'] for d in data) / total_items if total_items > 0 else 0

    # Print header
    print("\n" + "=" * 90)
    print("DOCUMENTATION COVERAGE ANALYSIS")
    print("=" * 90)

    # Overall statistics
    print("\n📊 OVERALL STATISTICS")
    print(f"  Total items: {total_items}")
    print(f"  Fully documented (100%): {fully_documented} ({100*fully_documented/total_items:.1f}%)")
    print(f"  Zero documented (0%): {zero_documented} ({100*zero_documented/total_items:.1f}%)")
    print(f"  Partially documented (1-99%): {partial_documented} ({100*partial_documented/total_items:.1f}%)")
    print(f"  Average coverage: {avg_coverage:.1f}%")

    # By type
    print(f"\n📋 BY COMPONENT TYPE")
    by_type = {}
    for d in data:
        t = d['type']
        if t not in by_type:
            by_type[t] = {'count': 0, 'documented': 0, 'total_coverage': 0}
        by_type[t]['count'] += 1
        by_type[t]['total_coverage'] += d['coverage']
        if d['coverage'] == 100:
            by_type[t]['documented'] += 1

    for t in sorted(by_type.keys()):
        stats = by_type[t]
        avg = stats['total_coverage'] / stats['count']
        pct_done = 100 * stats['documented'] / stats['count']
        print(f"  {t:20} {stats['count']:3} items | {stats['documented']:3} fully documented ({pct_done:5.1f}%) | avg: {avg:5.1f}%")

    # By layer
    print(f"\n🏗️  BY LAYER")
    framework = [d for d in data if '/framework/' in d['file']]
    domain = [d for d in data if '/domain-config/' in d['file']]
    features = [d for d in data if '/features/' in d['file']]

    if framework:
        print(f"  Framework items: {len(framework):3} | avg coverage: {sum(d['coverage'] for d in framework)/len(framework):5.1f}%")
    if domain:
        print(f"  Domain config:   {len(domain):3} | avg coverage: {sum(d['coverage'] for d in domain)/len(domain):5.1f}%")
    if features:
        print(f"  Features/Pages:  {len(features):3} | avg coverage: {sum(d['coverage'] for d in features)/len(features):5.1f}%")

    # Undocumented items
    if zero_documented > 0:
        print(f"\n❌ UNDOCUMENTED ITEMS ({zero_documented} total)")
        zero_items = sorted([d for d in data if d['coverage'] == 0], key=lambda x: x['file'])
        for d in zero_items[:15]:
            print(f"  • {d['identifier']:<35} ({d['type']:<15}) - {d['file'].split('/')[-1]}")
        if len(zero_items) > 15:
            print(f"  ... and {len(zero_items) - 15} more")

    # Partially documented items
    if partial_documented > 0:
        print(f"\n⚠️  PARTIALLY DOCUMENTED ITEMS ({partial_documented} total)")
        partial_items = sorted([d for d in data if 0 < d['coverage'] < 100], key=lambda x: x['coverage'])
        for d in partial_items[:10]:
            print(f"  • {d['coverage']:3}% {d['identifier']:<35} ({d['type']:<15})")
        if len(partial_items) > 10:
            print(f"  ... and {len(partial_items) - 10} more")

    print("\n" + "=" * 90)


def analyze_circular_dependencies():
    """Detect circular dependencies in TypeScript files."""
    print("\n" + "=" * 90)
    print("CIRCULAR DEPENDENCY DETECTION")
    print("=" * 90)

    if not FRONTEND_SRC.exists():
        print("❌ Error: frontend/src directory not found")
        return

    # Find all TypeScript files
    ts_files = list(FRONTEND_SRC.glob('**/*.ts'))

    # Build import map
    import_map = defaultdict(set)

    for ts_file in ts_files:
        try:
            with open(ts_file, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            # Find imports
            import_patterns = [
                r"import\s+[^}]*\s+from\s+['\"]([^'\"]+)['\"]",
                r"import\s+['\"]([^'\"]+)['\"]"
            ]

            file_key = str(ts_file.relative_to(PROJECT_ROOT))

            for pattern in import_patterns:
                for match in re.finditer(pattern, content):
                    imported = match.group(1)
                    if not imported.startswith('http') and not imported.startswith('@'):
                        import_map[file_key].add(imported)
        except Exception as e:
            pass

    # Simple cycle detection (basic DFS)
    cycles = []
    visited = set()
    rec_stack = set()

    def has_cycle(node, path):
        visited.add(node)
        rec_stack.add(node)
        path.append(node)

        if node in import_map:
            for neighbor in import_map[node]:
                # Resolve relative imports
                resolved = resolve_import(node, neighbor)
                if resolved in visited and resolved in rec_stack:
                    cycle = path[path.index(resolved):] + [resolved]
                    cycles.append(cycle)
                elif resolved not in visited:
                    has_cycle(resolved, path.copy())

        path.pop()
        rec_stack.remove(node)

    def resolve_import(source_file, import_path):
        # Very basic import resolution
        if import_path.startswith('./') or import_path.startswith('../'):
            base_dir = os.path.dirname(source_file)
            resolved = os.path.join(base_dir, import_path)
            resolved = os.path.normpath(resolved)
            if resolved.endswith('.ts'):
                return resolved
            return resolved + '.ts'
        return import_path

    # Detect cycles
    for file in import_map:
        if file not in visited:
            has_cycle(file, [])

    if cycles:
        print(f"\n⚠️  CIRCULAR DEPENDENCIES FOUND: {len(set(tuple(c) for c in cycles))}")
        for i, cycle in enumerate(set(tuple(c) for c in cycles)[:5], 1):
            print(f"\n  Cycle {i}:")
            for node in cycle[:-1]:
                print(f"    {node}")
            print(f"    ↻ {cycle[0]}")
        if len(set(tuple(c) for c in cycles)) > 5:
            print(f"\n  ... and {len(set(tuple(c) for c in cycles)) - 5} more cycles")
    else:
        print("\n✅ No circular dependencies detected!")

    print("\n" + "=" * 90)


def analyze_module_issues():
    """Analyze module imports/exports for configuration issues."""
    print("\n" + "=" * 90)
    print("MODULE IMPORT/EXPORT ANALYSIS")
    print("=" * 90)

    if not FRONTEND_SRC.exists():
        print("❌ Error: frontend/src directory not found")
        return

    # Find all module files
    module_files = list(FRONTEND_SRC.glob('**/*.module.ts'))

    issues = []

    for module_file in module_files:
        try:
            with open(module_file, 'r', encoding='utf-8') as f:
                content = f.read()

            # Extract @NgModule decorator
            decorator_match = re.search(r'@NgModule\s*\(\s*\{(.*?)\}\s*\)', content, re.DOTALL)
            if not decorator_match:
                continue

            decorator_content = decorator_match.group(1)

            # Extract imports array
            imports_match = re.search(r'imports\s*:\s*\[(.*?)\]', decorator_content, re.DOTALL)
            imports = re.findall(r'(\w+)', imports_match.group(1)) if imports_match else []

            # Extract exports array
            exports_match = re.search(r'exports\s*:\s*\[(.*?)\]', decorator_content, re.DOTALL)
            exports = re.findall(r'(\w+)', exports_match.group(1)) if exports_match else []

            # Check for modules in both imports and exports
            both = set(imports) & set(exports)

            if both:
                file_rel = str(module_file.relative_to(PROJECT_ROOT))
                for item in both:
                    issues.append({
                        'file': file_rel,
                        'item': item,
                        'issue': 'Module in both imports and exports'
                    })
        except Exception as e:
            pass

    if issues:
        print(f"\n⚠️  MODULE CONFIGURATION ISSUES FOUND: {len(issues)}")
        for issue in issues[:10]:
            print(f"\n  File: {issue['file']}")
            print(f"    Issue: {issue['item']} - {issue['issue']}")
            print(f"    Fix: Remove '{issue['item']}' from exports array (keep only in imports)")
        if len(issues) > 10:
            print(f"\n  ... and {len(issues) - 10} more issues")
    else:
        print("\n✅ No module configuration issues detected!")

    print("\n" + "=" * 90)


def regenerate_compodoc():
    """Regenerate Compodoc documentation inside the container."""
    import subprocess

    print("\n" + "=" * 90)
    print("COMPODOC REGENERATION (Container Operation)")
    print("=" * 90)

    try:
        # Step 1: Clean old documents
        print("\n📦 Step 1: Cleaning old documentation...")
        result = subprocess.run(
            ['podman', 'exec', '-it', 'generic-prime-dev', 'bash', '-c',
             'cd /app/frontend && rm -fr documents/'],
            capture_output=True,
            text=True,
            timeout=10
        )
        if result.returncode != 0:
            print(f"❌ Failed to clean documents: {result.stderr}")
            return
        print("   ✅ Old documents cleaned")

        # Step 2: Build documentation source
        print("\n📚 Step 2: Building documentation source (npm run build:doc)...")
        result = subprocess.run(
            ['podman', 'exec', '-it', 'generic-prime-dev', 'npm', 'run', 'build:doc'],
            capture_output=True,
            text=True,
            timeout=120
        )
        if result.returncode != 0:
            print(f"❌ Failed to build documentation: {result.stderr}")
            return
        print("   ✅ Documentation source built")

        # Step 3: Generate Compodoc
        print("\n🔍 Step 3: Generating Compodoc (npm run compodoc)...")
        result = subprocess.run(
            ['podman', 'exec', '-it', 'generic-prime-dev', 'npm', 'run', 'compodoc'],
            capture_output=True,
            text=True,
            timeout=120
        )
        if result.returncode != 0:
            print(f"❌ Failed to generate Compodoc: {result.stderr}")
            return
        print("   ✅ Compodoc generated")

        # Step 4: Verify completion
        print("\n✨ Step 4: Verifying documentation update...")
        if COVERAGE_FILE.exists():
            import datetime
            mtime = datetime.datetime.fromtimestamp(COVERAGE_FILE.stat().st_mtime)
            print(f"   ✅ Documentation updated successfully at {mtime}")
        else:
            print("   ⚠️  Coverage file not yet visible on host (may need brief delay)")

        print("\n" + "=" * 90)
        print("✅ COMPODOC REGENERATION COMPLETE")
        print("=" * 90)
        print("\nNext steps:")
        print("  • Run '/compodoc -doc' to analyze updated coverage metrics")
        print("  • Run '/compodoc -all' for complete diagnostic report")

    except subprocess.TimeoutExpired:
        print("❌ Compodoc regeneration timed out (took too long)")
    except FileNotFoundError:
        print("❌ Error: podman command not found. Make sure podman is installed and in PATH")
    except Exception as e:
        print(f"❌ Error during Compodoc regeneration: {e}")


def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        flag = '-doc'
    else:
        flag = sys.argv[1]

    if flag == '-doc':
        analyze_documentation_coverage()
    elif flag == '-circular':
        analyze_circular_dependencies()
    elif flag == '-module':
        analyze_module_issues()
    elif flag == '-all':
        analyze_documentation_coverage()
        analyze_circular_dependencies()
        analyze_module_issues()
    elif flag == '-gen':
        regenerate_compodoc()
    elif flag == '-help':
        print(__doc__)
    else:
        print(f"Unknown flag: {flag}")
        print("Use -help for usage information")


if __name__ == '__main__':
    main()

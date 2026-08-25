#!/usr/bin/env bash
# Quick manual run against the sample dataset.
npx tsx mock_run/v2/run.ts examples/v1/sma_crossover.pine \
  --data mock_data/common/AAPL_mock.csv \
  --show-transpiled

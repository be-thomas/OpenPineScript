#!/usr/bin/env bash
# Quick manual run against the sample dataset.
npx tsx mock_run/v2/run.ts examples/sma_crossover.pine \
  --data mock_data/AAPL_mock.csv \
  --show-transpiled

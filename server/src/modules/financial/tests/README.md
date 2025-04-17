# Tests for Financial Module

## Overview
This directory contains the unit tests for the Financial Module components. The tests are organized to run in small, manageable groups to prevent system resource constraints.

## Test Structure
- `index.spec.ts`: Tests for module structure and compilation
- `unit/`: Directory containing feature-specific tests
  - `financial-overview.spec.ts`: Tests for financial overview functionality
  - `property-distribution.spec.ts`: Tests for property distribution functionality
  - `transactions.spec.ts`: Tests for financial transactions
  - `dashboard-summary.spec.ts`: Tests for dashboard summary

## Running Tests

### Windows
Use the PowerShell script to run tests in sequence:

```powershell
cd server
./src/modules/financial/tests/run-tests.ps1
```

Or run individual test groups:

```powershell
cd server
npx jest src/modules/financial/tests/unit/financial-overview.spec.ts
```

### Linux/MacOS
Use the Bash script to run tests in sequence:

```bash
cd server
bash ./src/modules/financial/tests/run-tests.sh
```

Or run individual test groups:

```bash
cd server
npx jest src/modules/financial/tests/unit/financial-overview.spec.ts
```

## Notes
- These tests use mocks for database and currency services
- Run tests individually if experiencing performance issues
- The original large test file has been split into smaller modules to improve performance 
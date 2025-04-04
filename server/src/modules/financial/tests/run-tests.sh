#!/bin/bash

# Script để chạy các bài kiểm tra theo nhóm

echo "Running Financial Module Tests..."

echo "1. Testing Module Structure"
npx jest src/modules/financial/tests/index.spec.ts

echo "2. Testing Financial Overview"
npx jest src/modules/financial/tests/unit/financial-overview.spec.ts

echo "3. Testing Property Distribution"
npx jest src/modules/financial/tests/unit/property-distribution.spec.ts

echo "4. Testing Transactions"
npx jest src/modules/financial/tests/unit/transactions.spec.ts

echo "5. Testing Dashboard Summary"
npx jest src/modules/financial/tests/unit/dashboard-summary.spec.ts

echo "All tests completed!" 
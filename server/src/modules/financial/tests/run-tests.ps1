# Script để chạy các bài kiểm tra theo nhóm trên Windows PowerShell

Write-Host "Running Financial Module Tests..." -ForegroundColor Green

Write-Host "1. Testing Module Structure" -ForegroundColor Cyan
npx jest src/modules/financial/tests/index.spec.ts

Write-Host "2. Testing Financial Overview" -ForegroundColor Cyan
npx jest src/modules/financial/tests/unit/financial-overview.spec.ts

Write-Host "3. Testing Property Distribution" -ForegroundColor Cyan
npx jest src/modules/financial/tests/unit/property-distribution.spec.ts

Write-Host "4. Testing Transactions" -ForegroundColor Cyan
npx jest src/modules/financial/tests/unit/transactions.spec.ts

Write-Host "5. Testing Dashboard Summary" -ForegroundColor Cyan
npx jest src/modules/financial/tests/unit/dashboard-summary.spec.ts

Write-Host "All tests completed!" -ForegroundColor Green 
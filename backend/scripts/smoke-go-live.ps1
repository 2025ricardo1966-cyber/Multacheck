# Go-live smoke test — MultaCheck API + frontend
# Uso: .\scripts\smoke-go-live.ps1 -ApiBase "https://TU-API.onrender.com/api" -FrontendUrl "https://tu-app.vercel.app"
param(
  [string]$ApiBase = "http://localhost:3000/api",
  [string]$FrontendUrl = "https://multacheck.vercel.app"
)

$ErrorActionPreference = "Stop"
$ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$pass = 0
$fail = 0
$warn = 0
$token = $null
$slug = $null
$email = "smoke-test-$ts@example.com"

function Show-Json($raw) {
  try { ($raw | ConvertFrom-Json) | ConvertTo-Json -Depth 12 } catch { $raw }
}

function Invoke-CurlJson {
  param(
    [string]$Method = "GET",
    [string]$Url,
    [hashtable]$Body = $null,
    [string]$Token = $null
  )
  $writeOut = "`n__CURL_HTTP__:" + '%{http_code}'
  $curlArgs = @("-s", "-w", $writeOut, "-X", $Method, $Url, "-H", "Content-Type: application/json")
  if ($Token) { $curlArgs += @("-H", "Authorization: Bearer $Token") }
  if ($Body) {
    $tmp = [System.IO.Path]::GetTempFileName()
    ($Body | ConvertTo-Json -Compress) | Set-Content -Path $tmp -NoNewline -Encoding utf8
    $curlArgs += @("--data-binary", "@$tmp")
  }
  $raw = ((& curl.exe @curlArgs) -join "`n").Trim()
  if ($Body) { Remove-Item $tmp -Force -ErrorAction SilentlyContinue }
  $idx = $raw.LastIndexOf("__CURL_HTTP__:")
  if ($idx -lt 0) { throw "No HTTP code from curl" }
  $responseBody = $raw.Substring(0, $idx).Trim()
  $httpCode = $raw.Substring($idx + 14).Trim()
  return @{ Body = $responseBody; Code = $httpCode }
}

function Step($name, [scriptblock]$Action) {
  Write-Host "`n=== $name ===" -ForegroundColor Cyan
  try {
    & $Action
    $script:pass++
  } catch {
    Write-Host "FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $script:fail++
  }
}

Write-Host "API: $ApiBase"
Write-Host "Frontend: $FrontendUrl"

Step "1. Health Check" {
  $r = Invoke-CurlJson -Url "$ApiBase/health"
  Show-Json $r.Body
  if ($r.Code -notin @("200", "503")) { throw "HTTP $($r.Code)" }
  $j = $r.Body | ConvertFrom-Json
  if ($j.checks.database -ne "ok") { throw "DB: $($j.checks.database)" }
  Write-Host "OK HTTP $($r.Code), DB ok, stripe=$($j.checks.stripe)" -ForegroundColor Green
}

Step "2. Register" {
  $r = Invoke-CurlJson -Method POST -Url "$ApiBase/auth/register" -Body @{
    email = $email
    password = "SmokeTest123!"
    companyName = "Smoke Test Inc"
    companySlug = "smoke-test-$ts"
  }
  Show-Json $r.Body
  if ($r.Code -notin @("200", "201")) { throw "HTTP $($r.Code)" }
  $j = $r.Body | ConvertFrom-Json
  if (-not $j.token) { throw "No token" }
  $script:token = $j.token
  $script:slug = $j.user.tenantSlug
  Write-Host "OK token, slug=$slug" -ForegroundColor Green
}

Step "3. Login" {
  $r = Invoke-CurlJson -Method POST -Url "$ApiBase/auth/login" -Body @{
    email = $email
    password = "SmokeTest123!"
    tenantSlug = $slug
  }
  Show-Json $r.Body
  if ($r.Code -ne "200") { throw "HTTP $($r.Code)" }
  Write-Host "OK login" -ForegroundColor Green
}

Step "4. Plans" {
  $r = Invoke-CurlJson -Url "$ApiBase/plans"
  Show-Json $r.Body
  if ($r.Code -ne "200") { throw "HTTP $($r.Code)" }
  $j = $r.Body | ConvertFrom-Json
  $plans = @($j.data)
  if ($plans.Count -lt 1) { throw "Empty plans" }
  Write-Host "OK $($plans.Count) plans" -ForegroundColor Green
}

Step "5. Analyze (Anónimo)" {
  $r = Invoke-CurlJson -Method POST -Url "$ApiBase/multa/analyze" -Body @{
    country = "AR"
    type = "estacionamiento"
    description = "Test multa estacionamiento"
  }
  Show-Json $r.Body
  if ($r.Code -ne "200") { throw "HTTP $($r.Code)" }
  $j = $r.Body | ConvertFrom-Json
  if (-not $j.data.trafficLight) { throw "No trafficLight" }
  Write-Host "OK semáforo=$($j.data.trafficLight)" -ForegroundColor Green
}

Step "6. Analyze (Auth)" {
  $r = Invoke-CurlJson -Method POST -Url "$ApiBase/multa/analyze" -Token $token -Body @{
    country = "AR"
    type = "estacionamiento"
    description = "Estacioné mal en la 9 de julio $ts"
    amount = 50000
  }
  Show-Json $r.Body
  if ($r.Code -ne "200") { throw "HTTP $($r.Code)" }
  $j = $r.Body | ConvertFrom-Json
  if (-not $j.data.multaId) { throw "No multaId" }
  if ($j.data.checkoutUrl) {
    Write-Host "OK multaId + checkoutUrl" -ForegroundColor Green
  } else {
    Write-Host "WARN: multaId OK; checkout via POST /multa/:id/discharge-checkout (no checkoutUrl en analyze)" -ForegroundColor Yellow
    $script:warn++
  }
}

Step "7. Quota Check (6 requests)" {
  $got429 = $false
  for ($i = 1; $i -le 6; $i++) {
    $r = Invoke-CurlJson -Method POST -Url "$ApiBase/multa/analyze" -Token $token -Body @{
      country = "AR"
      type = "transito"
      description = "quota smoke $ts #$i"
    }
    Write-Host "Request ${i}: HTTP $($r.Code)"
    if ($r.Code -eq "429") {
      Write-Host "OK Quota enforced at request $i" -ForegroundColor Green
      $got429 = $true
      break
    }
    if ($r.Code -ne "200") { throw "Unexpected HTTP $($r.Code) on request $i" }
  }
  if (-not $got429) { throw "Never got 429" }
}

Step "8. Frontend Load" {
  $headers = curl.exe -s -I $FrontendUrl
  $status = ($headers | Select-String -Pattern "^HTTP/" | Select-Object -First 1).Line
  Write-Host $status
  if ($status -notmatch "\s200\s") { throw "Frontend not 200: $status" }
  Write-Host "OK frontend loads" -ForegroundColor Green
}

Write-Host "`n========== SUMMARY ==========" -ForegroundColor Cyan
Write-Host "Pass: $pass | Fail: $fail | Warnings: $warn"
if ($fail -gt 0) { exit 1 }

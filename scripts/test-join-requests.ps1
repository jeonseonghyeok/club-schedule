param(
    [string]$BaseUrl = "http://localhost:8081"
)

function Get-AuthToken {
    param([string]$BaseUrl, [long]$KakaoApiId)
    $body = '{"kakaoApiId":' + $KakaoApiId + '}'
    try {
        $res = Invoke-WebRequest -Uri "$BaseUrl/login/test" `
                    -Method Post `
                    -ContentType "application/json" `
                    -Body $body `
                    -UseBasicParsing `
                    -ErrorAction Stop
        $setCookie = $res.Headers["Set-Cookie"]
        if ($setCookie -is [array]) { $setCookie = $setCookie -join "; " }
        $m = [regex]::Match($setCookie, "AUTH_TOKEN=([^;]+)")
        if ($m.Success) { return $m.Groups[1].Value }
    } catch {}
    return $null
}

function New-CookieSession {
    param([string]$BaseUrl, [string]$Token)
    $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    $uri = [System.Uri]$BaseUrl
    $cookie = New-Object System.Net.Cookie("AUTH_TOKEN", $Token, "/", $uri.Host)
    $session.Cookies.Add($cookie)
    return $session
}

$successCount = 0
$skipCount    = 0
$failCount    = 0

Write-Host "[INFO] Starting group-requests test for test01~test20" -ForegroundColor Cyan
Write-Host ""

for ($i = 1; $i -le 20; $i++) {
    $username = "test{0:D2}" -f $i
    $kakaoApiId = 9900000000000 + $i

    $token = Get-AuthToken -BaseUrl $BaseUrl -KakaoApiId $kakaoApiId
    if (-not $token) {
        Write-Host "[$username] Login failed -> skip" -ForegroundColor Yellow
        $failCount++
        continue
    }

    $session  = New-CookieSession -BaseUrl $BaseUrl -Token $token
    $bodyJson = '{"groupName":"' + $username + ' group","description":"' + $username + ' test request"}'

    try {
        $res  = Invoke-WebRequest -Uri "$BaseUrl/group-requests" `
                    -Method Post `
                    -ContentType "application/json" `
                    -Body $bodyJson `
                    -WebSession $session `
                    -UseBasicParsing `
                    -ErrorAction Stop

        $data = $res.Content | ConvertFrom-Json
        Write-Host "[$username] Success (requestId=$($data.requestId))" -ForegroundColor Green
        $successCount++
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 409) {
            Write-Host "[$username] Already has a pending request -> skip" -ForegroundColor Yellow
            $skipCount++
        } else {
            Write-Host "[$username] Failed (HTTP $statusCode): $_" -ForegroundColor Red
            $failCount++
        }
    }
}

Write-Host ""
Write-Host "====== Summary ======" -ForegroundColor Cyan
Write-Host "Success : $successCount" -ForegroundColor Green
Write-Host "Skipped : $skipCount (duplicate)" -ForegroundColor Yellow
Write-Host "Failed  : $failCount" -ForegroundColor Red

param(
    [string]$VersionName = "1.0",
    [int]$VersionCode = 1
)
$ErrorActionPreference = "Continue"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21.0.11"
$sdk = "$env:LOCALAPPDATA\Android\Sdk"
$bt = "$sdk\build-tools\35.0.0"
$jar = "$sdk\platforms\android-35\android.jar"
$out = Join-Path $here "build"

foreach ($f in "hub.js", "typedex.json", "maps.json") {
    Copy-Item (Join-Path $here "..\PokeBonk\$f") (Join-Path $here "assets\$f") -Force
}

if (Test-Path $out) { Remove-Item $out -Recurse -Force }
New-Item -ItemType Directory -Force "$out\classes", "$out\dex" | Out-Null

Write-Host "1/6 resources"
& "$bt\aapt2.exe" compile --dir (Join-Path $here "res") -o "$out\res.zip"
if ($LASTEXITCODE) { throw "aapt2 compile failed" }
& "$bt\aapt2.exe" link -o "$out\base.apk" -I $jar --manifest (Join-Path $here "AndroidManifest.xml") `
    -A (Join-Path $here "assets") --min-sdk-version 24 --target-sdk-version 35 `
    --version-code $VersionCode --version-name $VersionName "$out\res.zip"
if ($LASTEXITCODE) { throw "aapt2 link failed" }

Write-Host "2/6 java"
Get-ChildItem (Join-Path $here "src") -Recurse -Filter *.java |
    ForEach-Object { '"' + $_.FullName.Replace('\', '/') + '"' } | Set-Content "$out\sources.txt" -Encoding ascii
& "$env:JAVA_HOME\bin\javac.exe" -nowarn -encoding UTF-8 -source 11 -target 11 -classpath "$jar" -d "$out\classes" "@$out\sources.txt"
if ($LASTEXITCODE) { throw "javac failed" }

Write-Host "3/6 dex"
& "$env:JAVA_HOME\bin\jar.exe" cf "$out\classes.jar" -C "$out\classes" .
if ($LASTEXITCODE) { throw "jar failed" }
& "$bt\d8.bat" --release --min-api 24 --lib "$jar" --output "$out\dex" "$out\classes.jar"
if ($LASTEXITCODE) { throw "d8 failed" }

Write-Host "4/6 package"
Copy-Item "$out\base.apk" "$out\unsigned.apk"
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::Open("$out\unsigned.apk", "Update")
[System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, "$out\dex\classes.dex", "classes.dex") | Out-Null
$zip.Dispose()
& "$bt\zipalign.exe" -p -f 4 "$out\unsigned.apk" "$out\aligned.apk"
if ($LASTEXITCODE) { throw "zipalign failed" }

Write-Host "5/6 signing key"
$ks = Join-Path $here "pokebonk.keystore"
$props = Join-Path $here "keystore.properties"
if (-not (Test-Path $ks)) {
    $pw = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 24 | ForEach-Object { [char]$_ })
    & "$env:JAVA_HOME\bin\keytool.exe" -genkeypair -keystore $ks -alias pokebonk -keyalg RSA -keysize 2048 `
        -validity 10000 -storepass $pw -keypass $pw -dname "CN=Deepexe, O=PokeBonk Toolkit, C=FR"
    if ($LASTEXITCODE) { throw "keytool failed" }
    Set-Content -Path $props -Value "storePassword=$pw" -Encoding ascii
}
$pw = ((Get-Content $props) -split "=", 2)[1]

Write-Host "6/6 sign"
$apk = Join-Path $here "PokeBonk.apk"
& "$bt\apksigner.bat" sign --ks $ks --ks-key-alias pokebonk --ks-pass "pass:$pw" --key-pass "pass:$pw" --out $apk "$out\aligned.apk"
if ($LASTEXITCODE) { throw "apksigner failed" }
& "$bt\apksigner.bat" verify $apk
if ($LASTEXITCODE) { throw "apk verification failed" }
Write-Host ("done: {0} ({1:N1} MB)" -f $apk, ((Get-Item $apk).Length / 1MB))

# push-update.ps1
# Zet je bijgewerkte bestanden (bijv. src/App.jsx) eerst handmatig in de projectmap,
# en draai dan dit script om alles naar GitHub te sturen.

$projectMap = "C:\Users\Wouter\OneDrive - Activaa Accountants en Adviseurs\Projecten\offertetool-project"

Set-Location $projectMap

Write-Host ""
Write-Host "== Offertetool: update pushen ==" -ForegroundColor Cyan
Write-Host "Projectmap: $projectMap"
Write-Host ""

# Laat zien wat er gewijzigd is, zodat je het even kunt checken
git status

Write-Host ""
$omschrijving = Read-Host "Korte omschrijving van de wijziging (bijv. 'logo kleiner gemaakt')"

if ([string]::IsNullOrWhiteSpace($omschrijving)) {
    $omschrijving = "Update offertetool"
}

git add -A
git commit -m "$omschrijving"
git push

Write-Host ""
Write-Host "Klaar. Check GitHub Actions voor de build-status." -ForegroundColor Green
Write-Host ""
Read-Host "Druk op Enter om dit venster te sluiten"

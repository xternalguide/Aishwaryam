@echo off
echo Updating Database with new Scheme and Referral Tables...
dotnet ef migrations add AddSchemeFeatures --project Aishwaryam.Infrastructure --startup-project Aishwaryam.Api
dotnet ef database update --project Aishwaryam.Infrastructure --startup-project Aishwaryam.Api
echo.
echo Database Update Complete. You can now restart the API server.
pause

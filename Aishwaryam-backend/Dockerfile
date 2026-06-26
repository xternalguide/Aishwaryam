# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy solution and project files first for layer caching
COPY Aishwaryam.slnx ./
COPY Aishwaryam.Api/Aishwaryam.Api.csproj             Aishwaryam.Api/
COPY Aishwaryam.Application/Aishwaryam.Application.csproj   Aishwaryam.Application/
COPY Aishwaryam.Domain/Aishwaryam.Domain.csproj             Aishwaryam.Domain/
COPY Aishwaryam.Infrastructure/Aishwaryam.Infrastructure.csproj Aishwaryam.Infrastructure/

# Restore NuGet packages
RUN dotnet restore Aishwaryam.Api/Aishwaryam.Api.csproj

# Copy all source files
COPY . .

# Build & publish in Release mode
RUN dotnet publish Aishwaryam.Api/Aishwaryam.Api.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Copy published output from build stage
COPY --from=build /app/publish .

# Railway/Render inject $PORT at runtime — ASP.NET Core reads this automatically
ENV ASPNETCORE_URLS=http://+:${PORT:-8080}

EXPOSE 8080

ENTRYPOINT ["dotnet", "Aishwaryam.Api.dll"]

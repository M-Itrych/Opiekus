# --- Konfiguracja PostgreSQL dla Docker Compose ---
POSTGRES_USER=postgres
POSTGRES_PASSWORD=tajnehaslo123
POSTGRES_DB=opiekus

# --- URL do bazy danych ---
# Uwaga: Docker Compose automatycznie złoży ten URL wewnątrz kontenera,
# ale lokalnie Prisma potrzebuje go w tej formie:
DATABASE_URL="postgresql://postgres:tajnehaslo123@localhost:5432/opiekus?schema=public"

# --- Bezpieczeństwo ---
# Wygeneruj tutaj długi, losowy ciąg znaków (np. poleceniem: openssl rand -base64 32)
SESSION_SECRET=zmien_mnie_na_produkcji_bardzo_dlugi_klucz
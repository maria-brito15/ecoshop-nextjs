---
paths: ["services/**"]
---
- Services hold business rules and Prisma access; they know nothing about `Request`/`Response`.
- Select fields explicitly on user data (`PUBLIC_USER_FIELDS`); never return `password`.
- A mutation that affects listings invalidates the cache (`lib/cache`, ADR-0009).

# IoT LabMate

Equipment lending and lab management for an IoT lab. Students browse the catalog,
request bookings, build kits with the AI Kit Builder, track loans and pay late-return
fines. Lab assistants approve/issue/return equipment, record condition, raise and
collect fines, and handle complaints.

Built with [Next.js](https://nextjs.org) (App Router), [Prisma](https://www.prisma.io)
and SQLite.

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Create your local env file and fill in the required values
cp .env.example .env

# 3. Create the SQLite schema and load demo data
npm run db:push
npm run db:seed

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo accounts (created by `npm run db:seed`)

| Role          | Email                    | Password        |
| ------------- | ------------------------ | --------------- |
| Student       | `student@labmate.edu`    | `student123`    |
| Lab assistant | `assistant@labmate.edu`  | `assistant123`  |

The seed creates a student with late-return fine (`LM-DEMO3`, unpaid) so the online
payment flow can be exercised immediately.

## Environment variables

Copy `.env.example` to `.env`. The key values:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLite file, e.g. `file:./dev.db` |
| `AUTH_SECRET` | Session signing secret. Generate with `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `FINE_RATE_PER_DAY`, `LOAN_PERIOD_DAYS`, `CURRENCY` | Defaults for fines/loans and display currency |
| `ASSISTANT_SIGNUP_CODE` | Invite code required to register a lab assistant |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Razorpay keys that enable online fine payment |
| `RAZORPAY_CURRENCY` | Currency sent to Razorpay (test mode settles `INR`) |

## Online fine payments (Razorpay, TEST MODE)

The **Pay Now** button on a student's unpaid fine opens the Razorpay checkout. A
fine is only marked **Paid** after the server verifies the Razorpay signature — it
is never flipped to paid from the client. The transaction id is stored and shown
on both the student and lab-assistant dashboards.

Online payment is optional. When `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` are
empty, the button stays disabled with the message *"Online payment is not
configured"* and lab assistants can still **Collect** / **Waive** fines manually.

### Enabling test-mode payments

1. Create a free Razorpay account and open **Account & Settings → API Keys**
   (`https://dashboard.razorpay.com/app/keys`). Keep the dashboard in **Test Mode**
   (toggle at the top-left).
2. Click **Generate Test Key** to get a **Key ID** (`rzp_test_...`) and a
   **Key Secret**. The secret is shown only once — copy it immediately.
3. Put them in your local `.env` (never commit this file):

   ```dotenv
   RAZORPAY_KEY_ID="rzp_test_XXXXXXXXXXXXXX"
   RAZORPAY_KEY_SECRET="your_test_key_secret"
   RAZORPAY_CURRENCY="INR"
   ```

4. Restart `npm run dev` so the new environment is picked up.
5. Sign in as the student, open **My Fines**, click **Pay Now** and pay with a
   [Razorpay test card](https://razorpay.com/docs/payments/payments/test-card-details/)
   (e.g. card `4111 1111 1111 1111`, any future expiry, any CVV; use the test OTP
   shown in the checkout). On success the fine turns **Paid** and the transaction
   id appears on both dashboards.

Only **test keys** (`rzp_test_...`) are required for this demo. Live keys
(`rzp_live_...`) perform real charges and should only be set in a production
deployment.

### How it works

- `POST /api/payments/order` (student only) creates a Razorpay order via the
  Orders API, stores a `Payment` row with status `CREATED`, and returns the order
  id + publishable key id to the browser.
- The browser opens Razorpay Checkout and, on success, posts
  `order_id` + `payment_id` + `signature` to `POST /api/payments/verify`.
- The server recomputes the `order_id|payment_id` HMAC-SHA256 with the **secret**
  key and compares it in constant time. Only a match (plus a `captured`/
  `authorized` gateway status) flips the payment to `PAID` and the fine to `PAID`
  inside a single transaction. A failed signature is recorded as `FAILED` and the
  fine stays `UNPAID`.

Razorpay is called over HTTPS with Basic auth from `src/lib/razorpay.ts`; no extra
SDK dependency is required.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Generate the Prisma client and build for production |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript type check |
| `npm run test` | Vitest unit tests |
| `npm run db:push` | Sync the Prisma schema to SQLite |
| `npm run db:migrate` | Create/apply a Prisma migration |
| `npm run db:seed` | Load demo categories, equipment and accounts |
| `npm run db:studio` | Open Prisma Studio |

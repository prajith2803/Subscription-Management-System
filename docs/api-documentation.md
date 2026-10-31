# REST API Reference
## Brightloop Software – Subscription Management System

Base URL: `/api/v1`

### Authentication (`/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/auth/register` | Register customer account | Public |
| `POST` | `/auth/login` | Log in and receive HTTP-only JWT cookie | Public |
| `POST` | `/auth/logout` | Clear auth cookie | Authenticated |
| `GET` | `/auth/me` | Fetch active user profile | Authenticated |
| `POST` | `/auth/forgot-password` | Request password reset token | Public |
| `POST` | `/auth/reset-password/:token` | Reset password using email token | Public |

### Products & Plans (`/products`, `/plans`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/products` | List products and variants | Staff, Admin |
| `POST` | `/products` | Create product | Admin |
| `POST` | `/products/:id/variants` | Add variant to product | Admin |
| `GET` | `/plans` | List subscription plans | Staff, Admin |
| `POST` | `/plans` | Create subscription plan | Admin |

### Quotations & Subscriptions (`/quotations`, `/subscriptions`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/quotations` | List quotations | Staff, Admin |
| `POST` | `/quotations` | Draft quotation | Staff, Admin |
| `POST` | `/quotations/:id/confirm` | Confirm quotation and generate subscription | Staff, Admin |
| `GET` | `/subscriptions` | List subscriptions | Staff, Admin |
| `POST` | `/subscriptions/:id/pause` | Pause active subscription | Staff, Admin |
| `POST` | `/subscriptions/:id/resume` | Resume paused subscription | Staff, Admin |
| `POST` | `/subscriptions/:id/close` | Terminate subscription early | Staff, Admin |

### Invoices & Payments (`/invoices`, `/payments`, `/billing`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/invoices` | List invoices | Authenticated |
| `GET` | `/invoices/:id/pdf` | Stream generated PDF invoice | Owner, Staff, Admin |
| `POST` | `/payments` | Record settlement payment against invoice | Staff, Admin |
| `POST` | `/billing/run` | Trigger manual billing cycle | Admin |
| `GET` | `/billing/logs` | View background billing execution logs | Staff, Admin |

### Customer Portal (`/portal`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/portal/dashboard` | Customer KPI metrics and next billing | Customer |
| `GET` | `/portal/subscriptions` | Customer's active subscriptions | Customer |
| `GET` | `/portal/invoices` | Customer's invoice history | Customer |
| `GET` | `/portal/payments` | Customer's payment history | Customer |
| `PATCH` | `/portal/profile` | Update contact & tax invoicing info | Customer |


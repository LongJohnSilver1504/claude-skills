
---

## 2. `~/.cursor/skills/create-feature/examples/payments.md`

# Example: Payments Feature

Complete implementation of a payments feature following the architecture.

## Domain Layer

### `domain/payment.model.ts`

import { z } from 'zod'

export const paymentStatusSchema = z.enum(['succeeded', 'processing', 'failed', 'requires_action'])

export const paymentSchema = z.object({
  id: z.number(),
  amount: z.number(),
  currency: z.string().default('usd'),
  status: paymentStatusSchema,
  customer: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string().email(),
  }),
  description: z.string().nullable(),
  createdAt: z.coerce.date(),
})

export const paginatedPaymentsSchema = z.object({
  results: z.array(paymentSchema),
  count: z.number(),
  page: z.number(),
  limit: z.number(),
  hasMore: z.boolean(),
})

export type PaymentStatus = z.infer<typeof paymentStatusSchema>
export type Payment = z.infer<typeof paymentSchema>
export type PaginatedPayments = z.infer<typeof paginatedPaymentsSchema>
```

### `domain/payment.service.ts`

import type { Payment, PaymentStatus } from './payment.model'

export const formatAmount = (cents: number, currency = 'USD'): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100)

export const canRefund = (payment: Payment): boolean =>
  payment.status === 'succeeded' &&
  Date.now() - payment.createdAt.getTime() < 30 * 24 * 60 * 60 * 1000 // 30 days

export const getStatusLabel = (status: PaymentStatus): string => ({
  succeeded: 'Succeeded',
  processing: 'Processing',
  failed: 'Failed',
  requires_action: 'Action Required',
})[status]

export const getStatusColor = (status: PaymentStatus): string => ({
  succeeded: 'text-green-600 bg-green-50',
  processing: 'text-yellow-600 bg-yellow-50',
  failed: 'text-red-600 bg-red-50',
  requires_action: 'text-orange-600 bg-orange-50',
})[status]

export const calculateTotal = (payments: Payment[]): number =>
  payments.reduce((sum, p) => sum + p.amount, 0)

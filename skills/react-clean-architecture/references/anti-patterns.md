# Anti-Patterns

Detailed examples of architecture anti-patterns and their corrections.

## Component Knows Too Much

```tsx
// Bad: Component with all responsibilities
function Dashboard() {
  // State management
  const [data, setData] = useState()
  const [filters, setFilters] = useState()

  // Data fetching
  useEffect(() => { fetch()... }, [])

  // Data transformation
  const formatted = data?.map(transform)

  // Business logic
  const canEdit = user.role === 'admin' && data?.status === 'draft'

  // Render everything
  return <div>...</div>
}
```

Fix: Extract data fetching to a custom hook, business logic to a domain service, transformation to a mapper.

## Shallow Abstraction

```tsx
// Bad: Wrapper that adds nothing
function usePaymentQuery(id) {
  return useQuery({
    queryKey: ['payment', id],
    queryFn: () => fetchPayment(id)
  })
}

// Just use useQuery directly, or make it deeper:

// Good: Deep abstraction with value
function usePayment(id) {
  const query = useQuery({
    queryKey: paymentKeys.detail(id),
    queryFn: () => paymentApi.getById(id),
  })

  return {
    payment: query.data,
    isPending: query.isPending,
    canRefund: query.data ? canRefund(query.data) : false,
    canEdit: query.data ? canEdit(query.data) : false,
  }
}
```

## Validation in Wrong Place

```tsx
// Bad: Scattered validation
function Card({ data }) {
  if (!data?.id) return null  // Validation here
}

function List({ items }) {
  if (!Array.isArray(items)) return null  // And here
}

function Page() {
  const { data } = useQuery(...)
  if (!data?.valid) return null  // And here
}

// Good: Validate once at boundary
function getItems() {
  const response = await client.get('/items')
  return itemsSchema.parse(response.data)  // Only here
}
```

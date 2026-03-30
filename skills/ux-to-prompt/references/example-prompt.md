# Example: UX Spec → Build-Order Prompt

## From UX Spec:

```
#### Node Card (Sidebar)
- Dimensions: ~200px width, ~48px height
- Content: Icon (left), Name (center/left), Preview badge (right, if applicable)
- States: Default, Hover (subtle highlight), Dragging (ghost follows cursor)
```

## To Prompt:

```markdown
## Sidebar Node Card Component

### Context
A draggable card in the workflow builder sidebar representing a node type
users can add to the canvas. Part of a node palette with "Triggers" and
"Actions" sections.

### Requirements
- Width: 200px, Height: 48px
- Layout: Icon on left, node name center-left, optional "Preview" badge on right
- Background: Neutral/card background color
- Border-radius: 8px (standard card radius)

### shadcn/ui Components
- Primary: Card (base structure)
- Supporting: Badge (for "Preview" indicator)
- Icons: lucide-react icons

### Tailwind Styling
- Layout: `flex items-center gap-3 px-3`
- Size: `w-[200px] h-12`
- Colors: `bg-card hover:bg-accent text-card-foreground`
- Border: `rounded-lg border border-border`
- Transition: `transition-colors`
- Drag state: `opacity-50 cursor-grabbing`

### States
- Default: Standard card appearance with `bg-card`
- Hover: `hover:bg-accent` subtle background highlight, `cursor-grab`
- Dragging: `opacity-50` semi-transparent, `cursor-grabbing`
- Preview: Badge with `variant="secondary"` and muted text

### Interactions
- Click: Could select or auto-place on canvas
- Drag: Initiates drag-drop to canvas (use @dnd-kit/core)
- Drag end on canvas: Creates node at drop position
- Drag end outside canvas: Cancels, no node created
- Keyboard: Focus ring visible with `focus-visible:ring-2 focus-visible:ring-ring`

### Constraints
- Component only - not the full sidebar
- Do not implement actual drag-drop logic, just visual states
- Placeholder nodes show muted styling + "Preview" badge
- Use CSS variables from shadcn/ui theme (--card, --accent, etc.)
```

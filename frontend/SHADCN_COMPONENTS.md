# Shadcn UI Component Versions

## Avatar Component

### Base Component
**Command**: `npx shadcn@latest add avatar`

**Components Available**:
- `Avatar` - Main wrapper component
- `AvatarImage` - Image display component
- `AvatarFallback` - Fallback text/icon when image fails

### Usage Examples:

#### 1. **Basic Avatar** (avatar-demo)
```tsx
<Avatar>
  <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
  <AvatarFallback>CN</AvatarFallback>
</Avatar>
```

#### 2. **Rounded Square Avatar**
```tsx
<Avatar className="rounded-lg">
  <AvatarImage src="https://github.com/user.png" alt="@user" />
  <AvatarFallback>ER</AvatarFallback>
</Avatar>
```

#### 3. **Avatar Group (Overlapping)** - Perfect for Partner Logos
```tsx
<div className="flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background">
  <Avatar>
    <AvatarImage src="https://github.com/partner1.png" alt="Partner 1" />
    <AvatarFallback>P1</AvatarFallback>
  </Avatar>
  <Avatar>
    <AvatarImage src="https://github.com/partner2.png" alt="Partner 2" />
    <AvatarFallback>P2</AvatarFallback>
  </Avatar>
  <Avatar>
    <AvatarImage src="https://github.com/partner3.png" alt="Partner 3" />
    <AvatarFallback>P3</AvatarFallback>
  </Avatar>
</div>
```

#### 4. **Avatar Group with Grayscale Effect**
```tsx
<div className="flex -space-x-2 *:data-[slot=avatar]:ring-background *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale">
  <Avatar>
    <AvatarImage src="..." alt="..." />
    <AvatarFallback>CN</AvatarFallback>
  </Avatar>
  {/* More avatars... */}
</div>
```

**Available Example Components**:
- `avatar-demo` - Basic avatar examples
- `item-avatar` - Avatar in item layout
- `empty-avatar` - Avatar in empty state
- `empty-avatar-group` - Group avatars in empty state

---

## Button Component

### Base Component
**Command**: `npx shadcn@latest add button`

**Variants Available**:
- `default` - Primary button (default)
- `destructive` - Red/danger button
- `outline` - Outlined button
- `secondary` - Secondary button
- `ghost` - Transparent button
- `link` - Link-style button

**Sizes Available**:
- `sm` - Small (h-8)
- `default` - Default (h-9)
- `lg` - Large (h-10)
- `icon` - Icon only (size-9)
- `icon-sm` - Small icon (size-8)
- `icon-lg` - Large icon (size-10)

### Usage Examples:

#### 1. **Basic Button** (button-demo)
```tsx
<Button variant="outline">Button</Button>
```

#### 2. **Button with Icon** (button-with-icon)
```tsx
<Button variant="outline" size="sm">
  <IconGitBranch /> New Branch
</Button>
```

#### 3. **Rounded Button** (button-rounded)
```tsx
<Button variant="outline" size="icon" className="rounded-full">
  <ArrowUpIcon />
</Button>
```

#### 4. **Button Sizes** (button-size)
```tsx
<Button size="sm">Small</Button>
<Button>Default</Button>
<Button size="lg">Large</Button>
```

#### 5. **Primary Red Button** (for CTA)
```tsx
<Button 
  variant="default" 
  size="lg"
  className="bg-red-600 hover:bg-red-700 text-white"
>
  Get Started
  <ArrowRight className="ml-2" />
</Button>
```

#### 6. **Custom Sized Button** (for Hero CTA)
```tsx
<Button 
  size="lg"
  className="px-12 py-10 text-xl font-semibold bg-red-600 hover:bg-red-700"
>
  Boshlash
  <ArrowRight className="ml-2 h-6 w-6" />
</Button>
```

**Available Example Components**:
- `button-demo` - Basic button examples
- `button-default` - Default variant
- `button-secondary` - Secondary variant
- `button-destructive` - Destructive/red variant
- `button-outline` - Outline variant
- `button-ghost` - Ghost variant
- `button-link` - Link variant
- `button-with-icon` - Button with icon
- `button-loading` - Loading state
- `button-icon` - Icon-only button
- `button-as-child` - Render as child component
- `button-rounded` - Rounded button
- `button-size` - Size variations
- `button-group-demo` - Button groups

---

## Recommended for Your Use Case:

### Hero Partner Logos (Avatar Group):
Use the **Avatar Group** pattern with overlapping avatars:
```tsx
<div className="flex items-center justify-center -space-x-3">
  <Avatar className="w-12 h-12 border-2 border-white">
    <AvatarImage src="/partner1.png" alt="Partner 1" />
    <AvatarFallback>P1</AvatarFallback>
  </Avatar>
  <Avatar className="w-12 h-12 border-2 border-white">
    <AvatarImage src="/partner2.png" alt="Partner 2" />
    <AvatarFallback>P2</AvatarFallback>
  </Avatar>
  {/* More partners... */}
</div>
```

### Hero CTA Button:
Use a **large button** with custom sizing:
```tsx
<Button 
  size="lg"
  className="px-12 py-10 text-xl font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white"
  onClick={() => {
    document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth' });
  }}
>
  {t.hero.cta}
  <ArrowRight className="ml-2 h-6 w-6" />
</Button>
```


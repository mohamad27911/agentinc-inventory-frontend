import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-gold/15 text-gold border border-gold/30',
        in_stock: 'bg-success/15 text-success border border-success/30',
        low_stock: 'bg-warning/15 text-warning border border-warning/30',
        ordered: 'bg-info/15 text-info border border-info/30',
        discontinued: 'bg-danger/15 text-danger border border-danger/30',
        admin: 'bg-danger/15 text-danger border border-danger/30',
        manager: 'bg-gold/15 text-gold border border-gold/30',
        viewer: 'bg-info/15 text-info border border-info/30',
        neutral: 'bg-background-tertiary text-foreground-muted border border-border',
        success: 'bg-success/15 text-success border border-success/30',
        warning: 'bg-warning/15 text-warning border border-warning/30',
        info: 'bg-info/15 text-info border border-info/30',
        danger: 'bg-danger/15 text-danger border border-danger/30',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  color?: string;
}

function Badge({ className, variant, color, style, ...props }: BadgeProps) {
  const colorStyle = color
    ? {
        backgroundColor: `${color}20`,
        color: color,
        borderColor: `${color}50`,
        ...style,
      }
    : style;

  return (
    <span
      className={cn(
        badgeVariants({ variant: color ? undefined : variant }),
        color && 'border',
        className
      )}
      style={colorStyle}
      {...props}
    />
  );
}

export { Badge, badgeVariants };

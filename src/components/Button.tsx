import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "confirm" | "secondary" | "danger";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand text-white hover:bg-brand-hover active:bg-brand-strong focus-visible:ring-brand/40",
  confirm:
    "bg-confirm text-confirm-ink hover:brightness-95 active:brightness-90 focus-visible:ring-confirm/50",
  secondary:
    "bg-surface text-brand border border-border hover:border-brand-soft hover:bg-brand-tint active:bg-brand-tint focus-visible:ring-brand/30",
  danger:
    "bg-surface text-danger border border-danger/30 hover:bg-danger/5 active:bg-danger/10 focus-visible:ring-danger/30",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      fullWidth = false,
      loading = false,
      leftIcon,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex min-h-14 items-center justify-center gap-2.5 rounded-pill px-7 text-lg font-bold tracking-tight",
          "transition-[background-color,border-color,filter,transform] duration-150 ease-out",
          "outline-none focus-visible:ring-4 active:scale-[0.99]",
          "disabled:pointer-events-none disabled:opacity-45",
          fullWidth && "w-full",
          variants[variant],
          className,
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="size-5 animate-spin" aria-hidden />
        ) : (
          leftIcon
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

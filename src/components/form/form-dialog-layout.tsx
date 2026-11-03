"use client";

import type { FormEventHandler, ReactNode } from "react";
import XIcon from "lucide-react/dist/esm/icons/x";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FormDialogLayoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer: ReactNode;
  onSubmit: FormEventHandler<HTMLFormElement>;
  className?: string;
  bodyClassName?: string;
  closeLabel?: string;
}

/**
 * Shared Create/Update dialog layout.
 * Header and footer remain fixed while the form body scrolls independently.
 */
export function FormDialogLayout({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  onSubmit,
  className,
  bodyClassName,
  closeLabel = "Close",
}: FormDialogLayoutProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn("gap-0 overflow-hidden p-0", className)}
      >
        <form
          onSubmit={onSubmit}
          className="flex max-h-[min(85vh,760px)] flex-col"
        >
          <DialogHeader className="relative shrink-0 border-b border-border bg-card px-6 py-4 pe-14 text-start">
            <DialogTitle>{title}</DialogTitle>
            {description ? (
              <DialogDescription>{description}</DialogDescription>
            ) : null}
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={closeLabel}
                className="absolute end-4 top-3"
              >
                <XIcon className="size-4" />
              </Button>
            </DialogClose>
          </DialogHeader>

          <div
            className={cn(
              "min-h-0 flex-1 overflow-y-auto bg-muted/40 px-6 py-5",
              bodyClassName
            )}
          >
            {children}
          </div>

          <DialogFooter className="shrink-0 flex-col-reverse border-t border-border bg-card px-6 py-4 sm:flex-row">
            {footer}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

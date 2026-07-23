/**
 * Author: Yzrel Jade B. Eborde
 */

import { Toaster as Sonner, type ToasterProps } from "sonner";

/** App-wide toast host (Vite SPA — fixed light theme). */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };

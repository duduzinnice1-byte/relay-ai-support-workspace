import type { Metadata } from "next";
import { Users } from "lucide-react";

import { getActiveOrganization } from "@/lib/data/organizations";
import { getCustomers } from "@/lib/data/tickets";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/app/empty-state";
import { NewCustomerDialog } from "@/components/customers/new-customer-dialog";

export const metadata: Metadata = { title: "Customers" };

export default async function CustomersPage() {
  const org = await getActiveOrganization();
  if (!org) return null;

  const customers = await getCustomers(org.organization.id);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Customers
          </h1>
          <p className="text-sm text-muted-foreground">
            {customers.length} customer{customers.length === 1 ? "" : "s"}
          </p>
        </div>
        <NewCustomerDialog />
      </header>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {customers.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={Users}
              title="No customers yet"
              description="Add the people you support, then attach them to tickets so context follows the conversation."
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {customers.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={c.name} className="size-8" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.email ?? "No email"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

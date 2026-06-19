"use client";

import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createInvoiceSchema, type CreateInvoiceInput } from "@/lib/validations/invoice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ItemNameInput } from "@/components/forms/item-name-input";
import Link from "next/link";
import { useState } from "react";
import { Plus, X, ChevronDown, ChevronRight } from "lucide-react";
import { AddClientDialog } from "@/components/forms/add-client-dialog";
import { formatCurrency } from "@/lib/utils";

type Client = { id: string; name: string };
type Product = {
  id: string;
  name: string;
  defaultPrice: number;
  gstPercent: number;
  unit: string;
};

function lineAmount(qty: number, rate: number): number {
  return Math.round(qty * rate * 100) / 100;
}
function gstOnAmount(amount: number, gstPercent: number): number {
  return Math.round((amount * gstPercent) / 100 * 100) / 100;
}

/** When value is 0, select all on focus so typing replaces it instead of appending */
function selectAllIfZero(e: React.FocusEvent<HTMLInputElement>) {
  const el = e.target;
  const n = parseFloat(el.value);
  if (Number.isNaN(n) || n === 0) el.select();
}

/** Same as above but also when value is 1 (e.g. default quantity) so typing replaces it */
function selectAllIfZeroOrOne(e: React.FocusEvent<HTMLInputElement>) {
  const el = e.target;
  const n = parseFloat(el.value);
  if (Number.isNaN(n) || n === 0 || n === 1) el.select();
}

export function NewInvoiceForm({
  clients: initialClients,
  products,
  preselectedClientId,
}: {
  clients: Client[];
  products: Product[];
  preselectedClientId?: string;
}) {
  const router = useRouter();
  const [clients, setClients] = useState(initialClients);
  const [showDelivery, setShowDelivery] = useState(false);
  const [showAdvance, setShowAdvance] = useState(false);
  const [showNotesAndTerms, setShowNotesAndTerms] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateInvoiceInput>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      clientId: preselectedClientId ?? "",
      invoiceDate: new Date().toISOString().slice(0, 10),
      deliveryCharges: undefined,
      advancePayment: undefined,
      items: [{ name: "", quantity: 1, unit: "pcs", rate: 0, gstPercent: 0 }],
    },
  });

  const watchedItems = watch("items");
  const watchedDelivery = watch("deliveryCharges");
  const watchedAdvance = watch("advancePayment");

  const subtotal = (watchedItems ?? []).reduce(
    (sum, item) => sum + lineAmount(item.quantity || 0, item.rate || 0),
    0
  );
  const totalGst = (watchedItems ?? []).reduce(
    (sum, item) => sum + gstOnAmount(lineAmount(item.quantity || 0, item.rate || 0), item.gstPercent || 0),
    0
  );
  const delivery = Number(watchedDelivery) || 0;
  const advance = Number(watchedAdvance) || 0;
  const grandTotal = Math.max(0, subtotal + totalGst + delivery - advance);

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  function addProduct(productId: string, index: number) {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    setValue(`items.${index}.name`, p.name);
    setValue(`items.${index}.rate`, p.defaultPrice);
    setValue(`items.${index}.gstPercent`, p.gstPercent);
    setValue(`items.${index}.unit`, p.unit);
  }

  function appendNewLine() {
    append({
      name: "",
      quantity: 1,
      unit: "pcs",
      rate: 0,
      gstPercent: 0,
    });
    // Focus the new item's name input after a tick
    setTimeout(() => {
      const inputs = document.querySelectorAll<HTMLInputElement>('[data-item-name-input]');
      const last = inputs[inputs.length - 1];
      last?.focus();
    }, 50);
  }

  async function onSubmit(data: CreateInvoiceInput) {
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const j = await res.json();
      alert(j.error ?? "Failed to create invoice");
      return;
    }
    const inv = await res.json();
    router.push(`/dashboard/invoices/${inv.id}`);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/invoices">← Invoices</Link>
        </Button>
        <h1 className="text-2xl font-bold mt-2">New invoice</h1>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Client *</Label>
              <div className="flex gap-2 mt-1">
                <select
                  className="flex h-10 flex-1 min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...register("clientId")}
                >
                  <option value="">Select client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <AddClientDialog
                  triggerLabel="+ Add client"
                  onClientAdded={(client) => {
                    setClients((prev) => [...prev, client]);
                    setValue("clientId", client.id);
                  }}
                />
              </div>
              {errors.clientId && (
                <p className="text-xs text-destructive mt-1">
                  {errors.clientId.message}
                </p>
              )}
            </div>
            <div>
              <Label>Invoice date</Label>
              <Input type="date" {...register("invoiceDate")} className="mt-1 max-w-[200px]" />
            </div>
            <button
              type="button"
              onClick={() => setShowNotesAndTerms((v) => !v)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {showNotesAndTerms ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              Notes & terms (optional)
            </button>
            {showNotesAndTerms && (
              <div className="space-y-4 rounded-md border border-border bg-muted/30 dark:bg-muted/10 p-4">
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <textarea
                    {...register("notes")}
                    className="mt-1 flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground">Terms</Label>
                  <textarea
                    {...register("terms")}
                    className="mt-1 flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Items</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={appendNewLine}
            >
              Add row
            </Button>
          </CardHeader>
          <CardContent>
            {/* Mobile: stacked card layout */}
            <div className="space-y-4 sm:hidden">
              {fields.map((field, index) => {
                const item = watchedItems?.[index];
                const qty = item?.quantity ?? 0;
                const rate = item?.rate ?? 0;
                const gstPct = item?.gstPercent ?? 0;
                const taxable = lineAmount(qty, rate);
                const gst = gstOnAmount(taxable, gstPct);
                const amount = taxable + gst;
                return (
                  <div key={field.id} className="rounded-lg border bg-card p-3 space-y-3 relative">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 h-7 w-7 p-0 text-destructive"
                      onClick={() => remove(index)}
                    >
                      ×
                    </Button>
                    {products.length > 0 && (
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        onChange={(e) => addProduct(e.target.value, index)}
                      >
                        <option value="">— Select product</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    )}
                    <ItemNameInput
                      value={item?.name ?? ""}
                      onChange={(val) => setValue(`items.${index}.name`, val)}
                      onSelectSuggestion={(suggestion) => {
                        setValue(`items.${index}.name`, suggestion.name);
                        setValue(`items.${index}.rate`, suggestion.rate);
                        setValue(`items.${index}.gstPercent`, suggestion.gstPercent);
                        setValue(`items.${index}.unit`, suggestion.unit);
                      }}
                      onEnterKey={appendNewLine}
                      className="h-10"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Qty</Label>
                        <Input
                          type="number"
                          step="0.01"
                          className="h-10 text-right mt-1"
                          onFocus={selectAllIfZeroOrOne}
                          {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Rate (₹)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          className="h-10 text-right mt-1"
                          onFocus={selectAllIfZero}
                          {...register(`items.${index}.rate`, { valueAsNumber: true })}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">GST %</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          className="h-10 text-right mt-1"
                          onFocus={selectAllIfZero}
                          {...register(`items.${index}.gstPercent`, { valueAsNumber: true })}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t">
                      <Input
                        className="h-8 w-16 text-xs"
                        placeholder="pcs"
                        {...register(`items.${index}.unit`)}
                      />
                      <span className="font-medium tabular-nums">{formatCurrency(amount)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop: table layout */}
            <div className="rounded-md border overflow-x-auto hidden sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-primary text-primary-foreground">
                    <th className="text-left p-3 font-medium">Item</th>
                    <th className="text-right p-3 w-20">Quantity</th>
                    <th className="text-left p-3 w-16">Unit</th>
                    <th className="text-right p-3 w-28">Rate</th>
                    <th className="text-right p-3 w-16">GST %</th>
                    <th className="text-right p-3 w-28">Amount</th>
                    <th className="w-12 p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => {
                    const item = watchedItems?.[index];
                    const qty = item?.quantity ?? 0;
                    const rate = item?.rate ?? 0;
                    const gstPct = item?.gstPercent ?? 0;
                    const taxable = lineAmount(qty, rate);
                    const gst = gstOnAmount(taxable, gstPct);
                    const amount = taxable + gst;
                    return (
                      <tr key={field.id} className="border-b border-border">
                        <td className="p-2 align-top">
                          {products.length > 0 && (
                            <select
                              className="mb-1.5 flex h-9 w-full max-w-[160px] rounded-md border border-input bg-background px-2 text-sm"
                              onChange={(e) => addProduct(e.target.value, index)}
                            >
                              <option value="">— Select product</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          )}
                          <ItemNameInput
                            value={item?.name ?? ""}
                            onChange={(val) => setValue(`items.${index}.name`, val)}
                            onSelectSuggestion={(suggestion) => {
                              setValue(`items.${index}.name`, suggestion.name);
                              setValue(`items.${index}.rate`, suggestion.rate);
                              setValue(`items.${index}.gstPercent`, suggestion.gstPercent);
                              setValue(`items.${index}.unit`, suggestion.unit);
                            }}
                            onEnterKey={appendNewLine}
                            className="h-9 min-w-[120px]"
                          />
                        </td>
                        <td className="p-2 text-right align-top">
                          <Input
                            type="number"
                            step="0.01"
                            className="h-9 w-20 text-right inline-block"
                            onFocus={selectAllIfZeroOrOne}
                            {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                          />
                        </td>
                        <td className="p-2 align-top">
                          <Input
                            className="h-9 w-16"
                            {...register(`items.${index}.unit`)}
                          />
                        </td>
                        <td className="p-2 text-right align-top">
                          <Input
                            type="number"
                            step="0.01"
                            className="h-9 w-24 text-right inline-block"
                            onFocus={selectAllIfZero}
                            {...register(`items.${index}.rate`, { valueAsNumber: true })}
                          />
                        </td>
                        <td className="p-2 text-right align-top">
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            className="h-9 w-14 text-right inline-block"
                            onFocus={selectAllIfZero}
                            {...register(`items.${index}.gstPercent`, { valueAsNumber: true })}
                          />
                        </td>
                        <td className="p-2 text-right align-top font-medium tabular-nums">
                          {formatCurrency(amount)}
                        </td>
                        <td className="p-2 align-top">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0 text-destructive hover:text-destructive"
                            onClick={() => remove(index)}
                          >
                            ×
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex justify-start">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full sm:w-auto text-primary border-primary/20 hover:bg-primary/5 hover:text-primary"
                onClick={appendNewLine}
              >
                + Add new line
              </Button>
            </div>

            {/* Summary — Refrens-style: Total, optional "+ Add" for delivery/advance */}
            <div className="mt-6 rounded-lg border bg-muted/40 dark:bg-muted/20 p-4 space-y-2.5 max-w-sm ml-auto">
              <div className="flex justify-between text-sm">
                <span>Total</span>
                <span className="tabular-nums">{formatCurrency(subtotal)}</span>
              </div>
              {totalGst > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Total GST</span>
                  <span className="tabular-nums">{formatCurrency(totalGst)}</span>
                </div>
              )}
              {!showDelivery ? (
                <button
                  type="button"
                  onClick={() => setShowDelivery(true)}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add delivery charges
                </button>
              ) : (
                <div className="flex justify-between text-sm items-center gap-2">
                  <span>Delivery charges</span>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="0"
                      className="h-8 w-24 text-right tabular-nums"
                      onFocus={selectAllIfZero}
                      {...register("deliveryCharges", { valueAsNumber: true })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        setShowDelivery(false);
                        setValue("deliveryCharges", undefined as unknown as number);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              {!showAdvance ? (
                <button
                  type="button"
                  onClick={() => setShowAdvance(true)}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add advance payment
                </button>
              ) : (
                <div className="flex justify-between text-sm items-center gap-2">
                  <span>Advance paid</span>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="0"
                      className="h-8 w-24 text-right tabular-nums"
                      onFocus={selectAllIfZero}
                      {...register("advancePayment", { valueAsNumber: true })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        setShowAdvance(false);
                        setValue("advancePayment", undefined as unknown as number);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              <div className="flex justify-between font-semibold pt-3 border-t border-border">
                <span>Total (INR)</span>
                <span className="tabular-nums">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
            {errors.items && (
              <p className="text-xs text-destructive mt-2">{errors.items.message}</p>
            )}
            <div className="flex gap-2 mt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating…" : "Create invoice"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/invoices">Cancel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

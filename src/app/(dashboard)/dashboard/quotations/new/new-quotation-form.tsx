"use client";

import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createInvoiceSchema, type CreateInvoiceInput, parseRateInput } from "@/lib/validations/invoice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ItemNameInput } from "@/components/forms/item-name-input";
import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
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

/** Format the amount for a line, supporting rate ranges like "200-300" */
function formatLineAmount(qty: number, rateText: string | undefined, rate: number, gstPct: number): string {
  if (rateText) {
    const parsed = parseRateInput(rateText);
    if (parsed.rateMax != null) {
      const lowTaxable = lineAmount(qty, parsed.rate);
      const lowGst = gstOnAmount(lowTaxable, gstPct);
      const lowTotal = lowTaxable + lowGst;
      const highTaxable = lineAmount(qty, parsed.rateMax);
      const highGst = gstOnAmount(highTaxable, gstPct);
      const highTotal = highTaxable + highGst;
      return `${formatCurrency(lowTotal)} – ${formatCurrency(highTotal)}`;
    }
  }
  const taxable = lineAmount(qty, rate);
  const gst = gstOnAmount(taxable, gstPct);
  return formatCurrency(taxable + gst);
}

/** When value is 0, select all on focus so typing replaces it instead of appending */
function selectAllIfZero(e: React.FocusEvent<HTMLInputElement>) {
  const el = e.target;
  const n = parseFloat(el.value);
  if (Number.isNaN(n) || n === 0) el.select();
}

/** Same for quantity: select when 0 or 1 (default) so typing replaces it */
function selectAllIfZeroOrOne(e: React.FocusEvent<HTMLInputElement>) {
  const el = e.target;
  const n = parseFloat(el.value);
  if (Number.isNaN(n) || n === 0 || n === 1) el.select();
}

export function NewQuotationForm({
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
      documentType: "quotation",
      clientId: preselectedClientId ?? "",
      invoiceDate: new Date().toISOString().slice(0, 10),
      deliveryCharges: undefined,
      advancePayment: undefined,
      items: [{ name: "", quantity: 1, unit: "pcs", rate: 0, gstPercent: 0, rateText: "" }],
    },
  });

  const watchedItems = watch("items");
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  function addProduct(productId: string, index: number) {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    setValue(`items.${index}.name`, p.name);
    setValue(`items.${index}.rate`, p.defaultPrice);
    setValue(`items.${index}.rateText`, String(p.defaultPrice));
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
      rateText: "",
    });
    // Focus the new item's name input after a tick
    setTimeout(() => {
      const inputs = document.querySelectorAll<HTMLInputElement>('[data-item-name-input]');
      const last = inputs[inputs.length - 1];
      last?.focus();
    }, 50);
  }

  async function onSubmit(data: CreateInvoiceInput) {
    // Preprocess items to parse rate range text before sending
    const processedItems = data.items.map((item) => {
      if (item.rateText) {
        const parsed = parseRateInput(item.rateText);
        return { ...item, rate: parsed.rate, rateMax: parsed.rateMax, rateText: parsed.rateText };
      }
      return item;
    });
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, items: processedItems, documentType: "quotation" }),
    });
    if (!res.ok) {
      const j = await res.json();
      alert(j.error ?? "Failed to create quotation");
      return;
    }
    const quotation = await res.json();
    router.push(`/dashboard/quotations/${quotation.id}`);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/quotations">← Quotations</Link>
        </Button>
        <h1 className="text-2xl font-bold mt-2">New quotation</h1>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Client (optional)</Label>
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
              <Label>Date</Label>
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
              Add new line
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
                const rateText = item?.rateText;
                const amountDisplay = formatLineAmount(qty, rateText, rate, gstPct);
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
                        setValue(`items.${index}.rateText`, String(suggestion.rate));
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
                          type="text"
                          placeholder="e.g. 200 or 200-300"
                          className="h-10 text-right mt-1"
                          onFocus={selectAllIfZero}
                          {...register(`items.${index}.rateText`, {
                            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                              const val = e.target.value;
                              const parsed = parseRateInput(val);
                              setValue(`items.${index}.rate`, parsed.rate);
                            },
                          })}
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
                      <span className="font-medium tabular-nums">{amountDisplay}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop: table layout */}
            <div className="rounded-md border overflow-x-auto hidden sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3">Item</th>
                    <th className="text-right p-3 w-20">Qty</th>
                    <th className="text-left p-3 w-16">Unit</th>
                    <th className="text-right p-3 w-24">Rate (₹)</th>
                    <th className="text-right p-3 w-20">GST %</th>
                    <th className="text-right p-3">Amount</th>
                    <th className="w-10 p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => {
                    const item = watchedItems?.[index];
                    const qty = item?.quantity ?? 0;
                    const rate = item?.rate ?? 0;
                    const gstPct = item?.gstPercent ?? 0;
                    const rateText = item?.rateText;
                    const amountDisplay = formatLineAmount(qty, rateText, rate, gstPct);
                    return (
                      <tr key={field.id} className="border-b">
                        <td className="p-2">
                          {products.length > 0 && (
                            <select
                              className="mb-1 flex h-9 w-full max-w-[140px] rounded-md border border-input bg-background px-2 text-sm"
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
                              setValue(`items.${index}.rateText`, String(suggestion.rate));
                              setValue(`items.${index}.gstPercent`, suggestion.gstPercent);
                              setValue(`items.${index}.unit`, suggestion.unit);
                            }}
                            onEnterKey={appendNewLine}
                            className="h-9"
                          />
                        </td>
                        <td className="p-2 text-right w-20">
                          <Input
                            type="number"
                            step="0.01"
                            className="h-9 w-full min-w-0 text-right"
                            onFocus={selectAllIfZeroOrOne}
                            {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                          />
                        </td>
                        <td className="p-2 w-16">
                          <Input
                            className="h-9 w-full min-w-0"
                            {...register(`items.${index}.unit`)}
                          />
                        </td>
                        <td className="p-2 text-right w-28">
                          <Input
                            type="text"
                            placeholder="e.g. 200 or 200-300"
                            className="h-9 w-full min-w-0 text-right"
                            onFocus={selectAllIfZero}
                            {...register(`items.${index}.rateText`, {
                              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                                const val = e.target.value;
                                const parsed = parseRateInput(val);
                                setValue(`items.${index}.rate`, parsed.rate);
                              },
                            })}
                          />
                        </td>
                        <td className="p-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Input
                              type="number"
                              step="0.01"
                              min={0}
                              className="h-9 w-14 text-right"
                              onFocus={selectAllIfZero}
                              {...register(`items.${index}.gstPercent`, { valueAsNumber: true })}
                            />
                            <span className="shrink-0 text-muted-foreground w-4">%</span>
                          </div>
                        </td>
                        <td className="p-2 text-right font-medium tabular-nums whitespace-nowrap">
                          {amountDisplay}
                        </td>
                        <td className="p-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0 text-destructive"
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
            {errors.items && (
              <p className="text-xs text-destructive mt-2">{errors.items.message}</p>
            )}
            <div className="flex gap-2 mt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating…" : "Create quotation"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/quotations">Cancel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

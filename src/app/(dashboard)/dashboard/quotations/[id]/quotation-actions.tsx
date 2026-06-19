"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PdfPreviewDrawer } from "@/components/invoice/pdf-preview-drawer";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FileDown, Eye, Pencil, Trash2 } from "lucide-react";

export default function QuotationActions({
  quotationId,
  docNumber,
}: {
  quotationId: string;
  docNumber: string;
}) {
  const router = useRouter();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const pdfUrl = `/api/invoices/${quotationId}/pdf`;

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/invoices/${quotationId}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json();
        alert(j.error ?? "Failed to delete quotation");
        return;
      }
      setDeleteConfirmOpen(false);
      router.push("/dashboard/quotations");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" asChild>
        <Link href={`/dashboard/quotations/${quotationId}/edit`}>
          <Pencil className="h-4 w-4 mr-1.5" />
          Edit
        </Link>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <a href={pdfUrl} download={`Quotation-${docNumber}.pdf`}>
          <FileDown className="h-4 w-4 mr-1.5" />
          Download PDF
        </a>
      </Button>
      <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
        <Eye className="h-4 w-4 mr-1.5" />
        Preview
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={() => setDeleteConfirmOpen(true)}
      >
        <Trash2 className="h-4 w-4 mr-1.5" />
        Delete
      </Button>
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete this quotation?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
      <PdfPreviewDrawer
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        pdfUrl={pdfUrl}
        title={`Quotation ${docNumber}`}
      />
    </>
  );
}

import React, { useTransition } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";

const DeleteConfirmationDialog = ({
  open,
  onClose,
  onConfirm,
  defaultToast = true,
  toastMessage = "تم الحذف بنجاح",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  defaultToast?: boolean;
  toastMessage?: string;
}) => {
  const [isPending, startTransition] = useTransition();

  const handleConfirm = async () => {
    await onConfirm();
    onClose();
    if (defaultToast) {
      toast.success(toastMessage, {
        position: "top-right",
      });
    }
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
          <AlertDialogDescription>
            لا يمكن التراجع عن هذا الإجراء. سيتم حذف هذا العنصر بشكل نهائي من النظام.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            className={isPending ? "pointer-events-none" : ""}
            onClick={() => startTransition(handleConfirm)}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? "يتم الحذف..." : "تأكيد الحذف"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteConfirmationDialog;

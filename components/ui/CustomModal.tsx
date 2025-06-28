import React, { useEffect } from "react";

interface CustomModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

const CustomModal: React.FC<CustomModalProps> = ({
  open,
  onClose,
  children,
  className,
}) => {
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed max-w-7xl mx-auto inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black bg-opacity-40 transition-opacity"
        onClick={onClose}
      />
      <div
        className={`relative bg-white rounded-lg shadow-lg max-w-full max-h-full overflow-auto p-6 ${
          className || ""
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
        <button
          className="absolute top-2 left-2 text-gray-400 hover:text-gray-600"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default CustomModal;

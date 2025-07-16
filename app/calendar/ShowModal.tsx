import React, { useState, useEffect, ChangeEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Button } from "@/components/ui/button";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface ShowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (show: Partial<ShowFormData>) => void;
  onDelete?: () => void;
  initialData?: Partial<ShowFormData>;
  isEditing?: boolean;
}

export interface ShowFormData {
  title: string;
  scheduledStart: string;
  scheduledStop: string;
}

export const ShowModal: React.FC<ShowModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData = {},
  isEditing = false,
}) => {
  const [form, setForm] = useState<Partial<ShowFormData>>(initialData);

  useEffect(() => {
    if (isOpen) setForm(initialData);
  }, [isOpen, initialData]);

  const handleChange = (field: keyof ShowFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (
    field: keyof Pick<ShowFormData, "scheduledStart" | "scheduledStop">,
    date: Date | null
  ) => {
    setForm((prev) => ({ ...prev, [field]: date?.toISOString() || "" }));
  };

  const handleSubmit = () => {
    if (!form.title || !form.scheduledStart || !form.scheduledStop) return;
    onSave(form);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Show" : "New Show"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <Input
            placeholder="Show Title"
            value={form.title || ""}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleChange("title", e.target.value)
            }
          />
          <ReactDatePicker
            selected={
              form.scheduledStart ? new Date(form.scheduledStart) : null
            }
            onChange={(date: Date | null) =>
              handleDateChange("scheduledStart", date)
            }
            showTimeSelect
            timeIntervals={15}
            dateFormat="Pp"
            placeholderText="Start Time"
            className="w-full px-3 py-2 border rounded"
          />
          <ReactDatePicker
            selected={form.scheduledStop ? new Date(form.scheduledStop) : null}
            onChange={(date: Date | null) =>
              handleDateChange("scheduledStop", date)
            }
            showTimeSelect
            timeIntervals={15}
            dateFormat="Pp"
            placeholderText="End Time"
            className="w-full px-3 py-2 border rounded"
          />
          <div className="flex justify-end gap-2">
            {isEditing && onDelete && (
              <Button variant="destructive" onClick={onDelete}>
                Delete
              </Button>
            )}
            <Button onClick={handleSubmit}>
              {isEditing ? "Save" : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShowModal;

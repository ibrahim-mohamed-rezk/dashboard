"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Phone } from "@/components/svg";
import { getData, postData } from "@/lib/axios/server";

interface UserData {
  id: number;
  full_name: string;
  image: string;
  phone: string;
  email: string;
  role: string;
  father_phone: string;
  level_id: number;
  governorate_id: number;
  area_id: number;
  school_name: string;
}

const UserInfo = () => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    father_phone: "",
    image: "",
    level_id: 0,
    governorate_id: 0,
    area_id: 0,
    school_name: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);


  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        alert("No token found. Please log in again.");
        return;
      }

      const formData = new FormData();

      // Append all form fields to the FormData
      formData.append("_method", "PUT");
      formData.append("full_name", form.full_name);
      formData.append("phone", form.phone);
      formData.append("email", form.email);
      formData.append("father_phone", form.father_phone);
      formData.append("level_id", form.level_id.toString());
      formData.append("governorate_id", form.governorate_id.toString());
      formData.append("area_id", form.area_id.toString());
      formData.append("school_name", form.school_name);
      formData.append("_method", "PUT");

      // If a new image is selected, append it as a file
      if (imageFile) {
        formData.append("avatar", imageFile);
      }

      const response = await postData("profile/update", formData, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      });

      if (response.status) {
        localStorage.setItem("user", JSON.stringify(response.data));
        setOpen(false);
      }
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };


  return (
    <>
      

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                className="w-20 h-20 rounded-full object-cover mx-auto"
              />
            )}

            <Input type="file" accept="image/*" onChange={handleImageChange} />

            <Input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Full Name"
            />
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Phone"
            />
            <Input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email"
            />
            <Input
              value={form.father_phone}
              onChange={(e) =>
                setForm({ ...form, father_phone: e.target.value })
              }
              placeholder="Father's Phone"
            />
            <Input
              value={form.level_id}
              onChange={(e) =>
                setForm({ ...form, level_id: parseInt(e.target.value) })
              }
              placeholder="Level ID"
            />
            <Input
              value={form.governorate_id}
              onChange={(e) =>
                setForm({ ...form, governorate_id: parseInt(e.target.value) })
              }
              placeholder="Governorate ID"
            />
            <Input
              value={form.area_id}
              onChange={(e) =>
                setForm({ ...form, area_id: parseInt(e.target.value) })
              }
              placeholder="Area ID"
            />
            <Input
              value={form.school_name}
              onChange={(e) =>
                setForm({ ...form, school_name: e.target.value })
              }
              placeholder="School Name"
            />

            <Button onClick={handleUpdate} className="w-full">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserInfo;

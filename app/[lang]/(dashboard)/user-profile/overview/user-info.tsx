"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Phone } from "@/components/svg";

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
  const [user, setUser] = useState<UserData | null>(null);
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

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      try {
        const response = await axios.get(
          "https://safezone-co.top/api/v1/dashboard/profile",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.status) {
          const userData = response.data.data;
          localStorage.setItem("user", JSON.stringify(userData));
          setUser(userData);
          setForm({
            full_name: userData.full_name || "",
            phone: userData.phone || "",
            email: userData.email || "",
            father_phone: userData.father_phone || "",
            image: userData.image || "",
            level_id: userData.level_id || 0,
            governorate_id: userData.governorate_id || 0,
            area_id: userData.area_id || 0,
            school_name: userData.school_name || "",
          });
          setImagePreview(userData.image);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setForm({
        full_name: parsedUser.full_name || "",
        phone: parsedUser.phone || "",
        email: parsedUser.email || "",
        father_phone: parsedUser.father_phone || "",
        image: parsedUser.image || "",
        level_id: parsedUser.level_id || 0,
        governorate_id: parsedUser.governorate_id || 0,
        area_id: parsedUser.area_id || 0,
        school_name: parsedUser.school_name || "",
      });
      setImagePreview(parsedUser.image);
    } else {
      fetchUser();
    }
  }, []);

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        alert("No token found. Please log in again.");
        return;
      }

      const formData = new FormData();

      // Append all form fields to the FormData
      formData.append("full_name", form.full_name);
      formData.append("phone", form.phone);
      formData.append("email", form.email);
      formData.append("father_phone", form.father_phone);
      formData.append("level_id", form.level_id.toString());
      formData.append("governorate_id", form.governorate_id.toString());
      formData.append("area_id", form.area_id.toString());
      formData.append("school_name", form.school_name);

      // If a new image is selected, append it as a file
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const response = await axios.put(
        "https://safezone-co.top/api/v1/dashboard/profile/update",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.status) {
        localStorage.setItem("user", JSON.stringify(response.data.data));
        setUser(response.data.data);
        setOpen(false);
        alert("Profile updated successfully!");
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("Failed to update profile.");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium text-default-800">
            User Information
          </CardTitle>
          <div className="mt-4">
            <img
              src={user.image}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover"
            />
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4 mt-4">
            <li className="flex items-center">
              <User className="w-4 h-4 text-primary mr-2" />
              <span className="font-medium text-default-800 w-32">Full Name:</span>
              <span>{user.full_name}</span>
            </li>
            <li className="flex items-center">
              <Phone className="w-4 h-4 text-primary mr-2" />
              <span className="font-medium text-default-800 w-32">Phone:</span>
              <span>{user.phone}</span>
            </li>
            <li className="flex items-center">
              <span className="font-medium text-default-800 w-32">Email:</span>
              <span>{user.email}</span>
            </li>
            <li className="flex items-center">
              <span className="font-medium text-default-800 w-32">Role:</span>
              <span>{user.role}</span>
            </li>
          </ul>

          <div className="mt-6">
            <Button onClick={() => setOpen(true)}>Edit Profile</Button>
          </div>
        </CardContent>
      </Card>

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

            <Input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />

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
              onChange={(e) => setForm({ ...form, father_phone: e.target.value })}
              placeholder="Father's Phone"
            />
            <Input
              value={form.level_id}
              onChange={(e) => setForm({ ...form, level_id: parseInt(e.target.value) })}
              placeholder="Level ID"
            />
            <Input
              value={form.governorate_id}
              onChange={(e) => setForm({ ...form, governorate_id: parseInt(e.target.value) })}
              placeholder="Governorate ID"
            />
            <Input
              value={form.area_id}
              onChange={(e) => setForm({ ...form, area_id: parseInt(e.target.value) })}
              placeholder="Area ID"
            />
            <Input
              value={form.school_name}
              onChange={(e) => setForm({ ...form, school_name: e.target.value })}
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

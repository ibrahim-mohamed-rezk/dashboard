"use client"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { postData } from "@/lib/axios/server";
const PersonalDetails = ({ token }: { token: string }) => {
  const formData = new FormData();
  formData.append("_method", "PUT");
  const [data, setData] = useState({
    full_name: "",
    phone: "",
    email: "",
    avatar: "",
    imageFile: null,
  });

  useEffect(() => {}, [token]);

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
      formData.append("full_name", data.full_name);
      formData.append("phone", data.phone);
      formData.append("email", data.email);

      // If a new image is selected, append it as a file
      if (data.imageFile) {
        formData.append("avatar", data.imageFile);
      }

      const response = await postData("profile/update", formData, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      });

      localStorage.setItem("user", JSON.stringify(response.data));
      console.log(response.data);
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  return (
    <Card className="rounded-t-none pt-6">
      <CardContent>
        <div className="grid grid-cols-12 md:gap-x-12 gap-y-5">
          <div className="col-span-12 md:col-span-6">
            <Label htmlFor="firstName" className="mb-2">
              الاسم
            </Label>
            <Input
              id="firstName"
              type="text"
              onChange={(e) => setData({ ...data, full_name: e.target.value })}
            />
          </div>
          <div className="col-span-12 md:col-span-6">
            <Label htmlFor="phoneNumber" className="mb-2">
              رقم الهاتف
            </Label>
            <Input
              onChange={(e) => {
                setData({ ...data, phone: e.target.value });
              }}
              id="phoneNumber"
              type="number"
            />
          </div>
          <div className="col-span-12 md:col-span-6">
            <Label htmlFor="email" className="mb-2">
              البريد الالكتروني
            </Label>
            <Input
              id="email"
              type="email"
              onChange={(e) => setData({ ...data, email: e.target.value })}
            />
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <Button>Save</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalDetails;
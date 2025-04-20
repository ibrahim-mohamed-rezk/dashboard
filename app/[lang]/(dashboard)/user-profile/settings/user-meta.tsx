"use client"
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { postData } from "@/lib/axios/server";
import { User } from "@/lib/type";
import avatar from "@/public/images/avatar/user.png";
import { Icon } from "@iconify/react";
import axios from "axios";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

const UserMeta = ({ token, user }: { token: string | null; user: User }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const router = useRouter();

  const handleUpdate = async (e?: React.ChangeEvent<HTMLInputElement>) => {
    if (!token) {
      toast.error("login expired. Please log in again.");
      router.push("/auth/login");
      return;
    }

    try {
      // Handle image change if event is provided
      if (e?.target.files?.[0]) {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);

        // Only proceed with API call if no event (direct update) or file is selected

        const formData = new FormData();

        // Append all form fields to the FormData
        formData.append("_method", "PUT");
        if (selectedFile) {
          formData.append("avatar", selectedFile);
        }

        const response = await postData("profile/update", formData, {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        });

        await axios.post(
          "/api/auth/setToken",
          { user: JSON.stringify(response.data) },
          {
            headers: { "Content-Type": "application/json" },
          }
        );

        toast.success("تم التعديل بنجاح");
        router.push("/user-profile");
      }
    } catch (err) {
      console.error("Update error:", err);
      toast.error("حدث خطأ أثناء التعديل");
    }
  };

  return (
    <Card>
      <CardContent className="p-6 flex flex-col items-center">
        <div className="w-[124px] h-[124px] relative rounded-full">
          <Image
            src={preview ? preview : user?.avatar ? user?.avatar : avatar}
            alt="avatar"
            className="w-full h-full object-cover rounded-full"
            priority={true}
            width={124}
            height={124}
          />
          <Button
            asChild
            size="icon"
            className="h-8 w-8 rounded-full cursor-pointer absolute bottom-0 right-0"
          >
            <Label htmlFor="avatar">
              <Icon
                className="w-5 h-5 text-primary-foreground"
                icon="heroicons:pencil-square"
              />
            </Label>
          </Button>
          <Input
            onChange={handleUpdate}
            type="file"
            className="hidden"
            id="avatar"
          />
        </div>
        <div className="mt-4 text-xl font-semibold text-default-900">
          {user?.full_name}
        </div>
        <div className="mt-1.5 text-sm font-medium text-default-500">
          {user?.role}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserMeta;
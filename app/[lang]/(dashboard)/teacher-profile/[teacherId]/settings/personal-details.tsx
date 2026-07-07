"use client"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { postData } from "@/lib/axios/server";
import { unwrapApiData } from "@/lib/api/response";
import { User } from "@/lib/type";
import axios from "axios";
import toast from "react-hot-toast";
import { handleApiFormError } from "@/lib/api/show-api-error-toast";
import {
  createFormFieldHelpers,
  FormGeneralError,
} from "@/components/form/form-field-helpers";
import { useFormApiErrors } from "@/hooks/use-form-api-errors";
import { useRouter } from "next/navigation";

const PersonalDetails = ({
  token,
  user,
}: {
  token: string | null;
  user: User;
}) => {
  const formData = new FormData();
  formData.append("_method", "PUT");
  const [data, setData] = useState({
    full_name: user.full_name || "",
    phone: user.phone || "",
    email: user.email || "",
  });
  const {
    fieldErrors,
    setFieldErrors,
    clearFieldError,
    clearAddErrors,
  } = useFormApiErrors();
  const { inputClass, FieldError } = createFormFieldHelpers(fieldErrors);
  const router = useRouter();

  const handleUpdate = async () => {
    clearAddErrors();
    try {
      if (!token) {
        toast.error("login expired. Please log in again.");
        router.push("/auth/login");
        return;
      }

      const formData = new FormData();

      formData.append("_method", "PUT");
      formData.append("full_name", data.full_name);
      formData.append("phone", data.phone);
      formData.append("email", data.email);

      const response = await postData("profile/update", formData, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      });

      await axios.post(
        "/api/auth/setToken",
        { user: JSON.stringify(unwrapApiData(response)) },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      toast.success("تم التعديل بنجاح");
      router.push("/user-profile");
    } catch (err) {
      console.error("Update error:", err);
      handleApiFormError(err, setFieldErrors, "حدث خطأ أثناء التعديل");
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
              value={data.full_name}
              className={inputClass("full_name")}
              onChange={(e) => {
                clearFieldError("full_name");
                setData({ ...data, full_name: e.target.value });
              }}
            />
            <FieldError field="full_name" />
          </div>
          <div className="col-span-12 md:col-span-6">
            <Label htmlFor="phoneNumber" className="mb-2">
              رقم الهاتف
            </Label>
            <Input
              onChange={(e) => {
                clearFieldError("phone");
                setData({ ...data, phone: e.target.value });
              }}
              value={data.phone}
              id="phoneNumber"
              type="number"
              className={inputClass("phone")}
            />
            <FieldError field="phone" />
          </div>
          <div className="col-span-12 md:col-span-6">
            <Label htmlFor="email" className="mb-2">
              البريد الالكتروني
            </Label>
            <Input
              id="email"
              value={data.email}
              type="email"
              className={inputClass("email")}
              onChange={(e) => {
                clearFieldError("email");
                setData({ ...data, email: e.target.value });
              }}
            />
            <FieldError field="email" />
          </div>
        </div>
        <FormGeneralError errors={fieldErrors} />
        <div className="flex justify-end gap-4 mt-6">
          <Button onClick={handleUpdate}>حفظ</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalDetails;

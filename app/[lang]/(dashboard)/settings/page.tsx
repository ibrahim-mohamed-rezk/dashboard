"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { getData, postData } from "@/lib/axios/server";
import axios from "axios";
import toast from "react-hot-toast";
import { Editor } from "@tinymce/tinymce-react";
import { siteConfig } from "@/config/site";
import useAuthrization from "@/hooks/useAuthrization";
import { User } from "@/lib/type";

const PrivacyPage = () => {
  const [activeTab, setActiveTab] = useState<
    "privacy" | "support" | "about_us"
  >("privacy");
  const [privacyContent, setPrivacyContent] = useState("");
  const [supportContent, setSupportContent] = useState("");
  const [aboutUsContent, setAboutUsContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [token, setToken] = useState("");
  const [user, setUser] = useState<User | null>(null);

  // Get auth token and user
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await axios.get("/api/auth/getToken");
        setToken(response.data.token);
        
        // Get user from localStorage
        const userDataString = localStorage.getItem("user");
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          setUser(userData);
        }
      } catch (error) {
        console.error("Error fetching token:", error);
      }
    };
    fetchToken();
  }, []);

  // Fetch existing settings
  useEffect(() => {
    if (!token) return;

    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const response = await getData(
          "get-settings",
          {},
          { Authorization: `Bearer ${token}` }
        );

        const data = response?.data;
        if (data) {
          // Handle Privacy
          if (data.privacy) setPrivacyContent(data.privacy);

          // Handle Support
          if (data.support) setSupportContent(data.support);

          // Handle About Us
          if (data["about_us"]) setAboutUsContent(data["about_us"]);

          // Handle Array format if applicable
          if (Array.isArray(data)) {
            const privacy = data.find((s: any) => s.key === "privacy");
            if (privacy) setPrivacyContent(privacy.value);

            const support = data.find((s: any) => s.key === "support");
            if (support) setSupportContent(support.value);

            const aboutUs = data.find((s: any) => s.key === "about_us");
            if (aboutUs) setAboutUsContent(aboutUs.value);
          }
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [token]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let key, value;

      if (activeTab === "privacy") {
        key = "privacy";
        value = privacyContent;
      } else if (activeTab === "support") {
        key = "support";
        value = supportContent;
      } else {
        key = "about_us";
        value = aboutUsContent;
      }

      await postData(
        "settings",
        { settings: { [key]: value } },
        { Authorization: `Bearer ${token}` }
      );

      const successMessages = {
        privacy: "سياسة الخصوصية",
        support: "الدعم والمساعدة",
        "about_us": "من نحن",
      };

      toast.success(`تم حفظ ${successMessages[activeTab]} بنجاح`);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("حدث خطأ أثناء الحفظ");
    } finally {
      setIsSaving(false);
    }
  };

  const isAuthrized = useAuthrization({
    user: user as User,
    module: "settings",
  });
  if (!isAuthrized) {
    return <div>ليس لديك صلاحية لعرض هذه الصفحة</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">
          {activeTab === "privacy"
            ? "سياسة الخصوصية"
            : activeTab === "support"
            ? "الدعم والمساعدة"
            : "من نحن"}
        </h2>
        <Button onClick={handleSave} disabled={isSaving || isLoading}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          حفظ التغييرات
        </Button>
      </div>

      <div className="flex space-x-2 rtl:space-x-reverse">
        <Button variant={"outline"} onClick={() => setActiveTab("privacy")}>
          سياسة الخصوصية
        </Button>
        <Button variant={"outline"} onClick={() => setActiveTab("support")}>
          الدعم والمساعدة
        </Button>
        <Button variant={"outline"} onClick={() => setActiveTab("about_us")}>
          من نحن
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>تعديل المحتوى</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="min-h-[500px]">
              <Editor
                apiKey={siteConfig.tinymceApiKey}
                value={
                  activeTab === "privacy"
                    ? privacyContent
                    : activeTab === "support"
                    ? supportContent
                    : aboutUsContent
                }
                onEditorChange={(newContent: string) => {
                  if (activeTab === "privacy") {
                    setPrivacyContent(newContent);
                  } else if (activeTab === "support") {
                    setSupportContent(newContent);
                  } else {
                    setAboutUsContent(newContent);
                  }
                }}
                init={{
                  height: 500,
                  menubar: true,
                  directionality: "rtl",
                  skin: "oxide-dark",
                  content_css: "dark",
                  plugins: [
                    "advlist",
                    "autolink",
                    "lists",
                    "link",
                    "image",
                    "charmap",
                    "preview",
                    "anchor",
                    "searchreplace",
                    "visualblocks",
                    "code",
                    "fullscreen",
                    "insertdatetime",
                    "media",
                    "table",
                    "code",
                    "help",
                    "wordcount",
                  ],
                  toolbar:
                    "undo redo | blocks | " +
                    "bold italic forecolor | alignleft aligncenter " +
                    "alignright alignjustify | bullist numlist outdent indent | " +
                    "removeformat | help",
                  content_style:
                    "body { font-family:Helvetica,Arial,sans-serif; font-size:14px; color: #fff; background-color: #1f2937; }",
                  branding: false,
                  promotion: false,
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyPage;

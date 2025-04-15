import Image from "next/image";
import { Icon } from "@iconify/react";
import background from "@/public/images/auth/line.png";
import { Button } from "@/components/ui/button";
import LogInForm from "@/components/auth/login-form";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const LoginPage = async () => {
  const cookiesData = cookies();
  const token = cookiesData.get("token")?.value;

  if (token) {
    return redirect("/dashboard");
  }

  return (
    <>
      <div className="min-h-screen bg-background  flex items-center  overflow-hidden w-full">
        <div className="min-h-screen basis-full flex flex-wrap w-full  justify-center overflow-y-auto">
          <div
            className="basis-1/2 bg-primary w-full  relative hidden xl:flex justify-center items-center bg-gradient-to-br
          from-primary-600 via-primary-400 to-primary-600
         "
          >
            <Image
              src={background}
              alt="image"
              className="absolute top-0 left-0 w-full h-full "
            />
            <div className="relative z-10 backdrop-blur bg-primary-foreground/40 py-14 px-16 2xl:py-[84px] 2xl:pl-[50px] 2xl:pr-[136px] rounded max-w-[640px]">
              <div>
                <div className="text-4xl leading-[50px] 2xl:text-6xl 2xl:leading-[72px] font-semibold mt-2.5">
                  <span className="text-default-600 dark:text-default-300 ">
                    Unlock <br />
                    Your Project <br />
                  </span>
                  <span className="text-default-900 dark:text-default-50">
                    Performance
                  </span>
                </div>
                <div className="mt-5 2xl:mt-8 text-default-900 dark:text-default-200  text-2xl font-medium">
                  You will never know everything. <br />
                  But you will know more...
                </div>
              </div>
            </div>
          </div>

          <div className=" min-h-screen basis-full md:basis-1/2 w-full px-4 py-5 flex justify-center items-center">
            <div className="lg:w-[480px] ">
              <LogInForm />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
